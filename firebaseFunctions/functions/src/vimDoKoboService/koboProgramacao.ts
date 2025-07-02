import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { firstValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';

export interface ProgramacaoData {
  id_umov: string;
  cnpj: string;
  data_programacao: number;
  fase_pesquisa: string;
  formularios: string[];
  id: string;
  lat: number;
  long: number;
  monitor_1: string;
  monitor_2: string;
}

export interface EntidadeData {
  bairro: string;
  cep: string;
  cnpj: string;
  email: string;
  endereco: string;
  fase_pesquisa: string[];
  lat: number;
  long: number;
  municipio: string;
  nome: string;
  regiao: string;
  telefone: string;
  uf: string;
  vagas: number;
  id_umov: string;
  status_atual?: string;
  status_atual_data?: number;
}

@Injectable()
export class ProgramacaoService {
  private readonly baseUrl = 'https://api.umov.me/CenterWeb/api/43843e568c3fa407c0d69ea8677ae2a92d847b';
  private readonly db: FirebaseFirestore.Firestore;

  constructor(
    private readonly httpService: HttpService,
    @Inject('FIREBASE_ADMIN') private readonly firebase: admin.app.App,
  ) {
    this.db = this.firebase.firestore();
  }

  async fetchProgramacao(): Promise<ProgramacaoData[]> {
    const programacoes: ProgramacaoData[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    try {
      // Buscar todas as entidades para referência
      const entidadesRef = this.db.collection('entidade_v3');
      const entidadesSnapshot = await entidadesRef.get();
      const entidades = new Map<string, any>();

      entidadesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.id_umov) {
          entidades.set(data.id_umov, data);
        }
      });

      console.log(`Carregadas ${entidades.size} entidades para referência`);

      // Processar páginas até size = 0
      const parser = new xml2js.Parser({ explicitArray: false });

      while (hasMorePages) {
        const url = `${this.baseUrl}/schedule.xml?scheduleType.id=127939&paging.page=${currentPage}`;
        console.log(`Buscando página ${currentPage}...`);

        const response = await firstValueFrom(
          this.httpService.get(url)
        );

        const result = await parser.parseStringPromise(response.data);

        // Verificar se há mais páginas
        if (!result.result.entries || parseInt(result.result.size) === 0) {
          console.log(`Nenhum resultado na página ${currentPage}`);
          hasMorePages = false;
          break;
        }

        const entries = Array.isArray(result.result.entries.entry)
          ? result.result.entries.entry
          : [result.result.entries.entry];

        if (!entries || entries.length === 0) {
          console.log(`Nenhuma entrada na página ${currentPage}`);
          hasMorePages = false;
          break;
        }

        console.log(`Processando ${entries.length} programações da página ${currentPage}`);

        for (const entry of entries) {
          const detailUrl = `${this.baseUrl}${entry.$.link}`;
          const detailResponse = await firstValueFrom(
            this.httpService.get(detailUrl)
          );

          const detailResult = await parser.parseStringPromise(detailResponse.data);
          const schedule = detailResult.schedule;

          if (!schedule || !schedule.serviceLocal || !schedule.agent) {
            console.log('Programação sem dados completos, pulando');
            continue;
          }

          const serviceLocalId = schedule.serviceLocal.id;
          const agentName = schedule.agent.name;
          const scheduleDate = schedule.date;

          // Converter data para timestamp
          const dateParts = scheduleDate.split('-');
          const dateObj = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2])
          );
          const timestamp = Math.floor(dateObj.getTime() / 1000);

          // Buscar entidade correspondente
          const entidade = entidades.get(serviceLocalId);

          let programacao: ProgramacaoData = {
            id_umov: serviceLocalId,
            cnpj: entidade?.cnpj || '',
            data_programacao: timestamp,
            fase_pesquisa: '2025-2',
            formularios: [],
            id: schedule.id,
            lat: parseFloat(schedule.serviceLocal.geoCoordinate?.split(',')[0] || '0'),
            long: parseFloat(schedule.serviceLocal.geoCoordinate?.split(',')[1] || '0'),
            monitor_1: '',
            monitor_2: ''
          };

          // Verificar se já existe programação para esta entidade
          const existingIndex = programacoes.findIndex(p => p.id_umov === serviceLocalId);

          if (existingIndex >= 0) {
            // Já existe, preencher monitor_2
            if (!programacoes[existingIndex].monitor_2) {
              programacoes[existingIndex].monitor_2 = agentName;
            }
          } else {
            // Não existe, preencher monitor_1
            programacao.monitor_1 = agentName;
            programacoes.push(programacao);
          }
        }

        console.log(`Página ${currentPage}: ${entries.length} programações processadas`);
        currentPage++;
      }

      // Salvar programações no Firebase
      for (const programacao of programacoes) {
        await this.saveProgramacaoToFirebase(programacao);
      }

      console.log(`Total de programações processadas e salvas: ${programacoes.length}`);
      return programacoes;

    } catch (error) {
      console.error('Erro ao buscar programações:', error);
      throw new Error('Falha ao buscar dados de programação da API uMov.me');
    }
  }

  async fetchServiceLocals(): Promise<EntidadeData[]> {
    const entidades: EntidadeData[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    try {
      while (hasMorePages) {
        const url = `${this.baseUrl}/serviceLocal.xml?paging.page=${currentPage}`;
        console.log(`Buscando página ${currentPage}...`);

        const response = await firstValueFrom(
          this.httpService.get(url)
        );

        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);

        // Verifica se há entradas e se o tamanho é maior que zero
        if (!result.result.entries || parseInt(result.result.size) === 0) {
          console.log(`Nenhum resultado encontrado na página ${currentPage}`);
          hasMorePages = false;
          break;
        }

        const entries = Array.isArray(result.result.entries.entry)
          ? result.result.entries.entry
          : [result.result.entries.entry];

        // Se não houver entradas, encerra o loop
        if (!entries || entries.length === 0) {
          console.log(`Nenhuma entrada encontrada na página ${currentPage}`);
          hasMorePages = false;
          break;
        }

        console.log(`Processando ${entries.length} entidades da página ${currentPage}`);

        for (const entry of entries) {
          const entidade = await this.fetchServiceLocalDetail(entry.$.link);
          if (entidade) {
            entidades.push(entidade);
            await this.saveEntidadeToFirebase(entidade);
          }
        }

        console.log(`Página ${currentPage}: ${entries.length} entidades processadas`);
        currentPage++;
      }

      console.log(`Total de entidades carregadas: ${entidades.length}`);
      return entidades;
    } catch (error) {
      console.error('Erro ao buscar service locals:', error);
      throw new Error('Falha ao buscar dados da API uMov.me');
    }
  }

  private async fetchServiceLocalDetail(link: string): Promise<EntidadeData | null> {
    try {
      const url = `${this.baseUrl}${link}`;
      const response = await firstValueFrom(
        this.httpService.get(url)
      );

      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(response.data);

      const serviceLocal = result.serviceLocal;

      // Extrair coordenadas
      let lat = 0;
      let long = 0;
      if (serviceLocal.geoCoordinate) {
        const coords = serviceLocal.geoCoordinate.split(',');
        if (coords.length === 2) {
          lat = parseFloat(coords[0].trim());
          long = parseFloat(coords[1].trim());
        }
      }

      // Extrair vagas
      const vagas = serviceLocal.customFields?.Loc__QtdVagasContratadas
        ? parseInt(serviceLocal.customFields.Loc__QtdVagasContratadas, 10)
        : 0;

      // Converter lastUpdateDateTime para timestamp
      let lastUpdateTimestamp = 0;
      if (serviceLocal.lastUpdateDateTime) {
        const dateStr = serviceLocal.lastUpdateDateTime;
        const dateObj = new Date(dateStr);
        lastUpdateTimestamp = Math.floor(dateObj.getTime() / 1000);
      }

      const entidade: EntidadeData = {
        bairro: serviceLocal.cityNeighborhood || '',
        cep: serviceLocal.zipCode || '',
        cnpj: serviceLocal.customFields?.CNPJ || '',
        email: serviceLocal.customFields?.Email1 || '',
        endereco: `${serviceLocal.street || ''} ${serviceLocal.streetComplement || ''}`.trim(),
        fase_pesquisa: [],
        lat,
        long,
        municipio: serviceLocal.city || '',
        nome: serviceLocal.corporateName || '',
        regiao: serviceLocal.customFields?.Regio || '',
        telefone: serviceLocal.customFields?.Telefone1 || '',
        uf: serviceLocal.state || '',
        vagas,
        id_umov: serviceLocal.id || '',
        status_atual: 'Cadastrado',
        status_atual_data: lastUpdateTimestamp
      };

      return entidade;
    } catch (error) {
      console.error(`Erro ao buscar detalhes do service local ${link}:`, error);
      return null;
    }
  }

  private async saveProgramacaoToFirebase(programacao: ProgramacaoData): Promise<void> {
    try {
      if (!programacao.cnpj) {
        console.log('Programação sem CNPJ, não será salva:', programacao.id_umov);
        return;
      }

      const cnpj = programacao.cnpj.padStart(14, '0');

      // Salvar ou atualizar programação
      const programacaoRef = this.db.collection('programacao_v3').doc(cnpj);
      await programacaoRef.set(programacao, { merge: true });
      console.log(`Programação salva/atualizada para CNPJ: ${cnpj}`);

      // Verificar se devemos atualizar o status da entidade
      const entidadeRef = this.db.collection('entidade_v3').doc(cnpj);
      const entidadeDoc = await entidadeRef.get();

      if (entidadeDoc.exists) {
        const entidadeData = entidadeDoc.data();
        const dataProgTimestamp = programacao.data_programacao;
        let updateStatus = false;

        // Atualizar status se:
        // 1. Não existir status_atual_data na entidade
        // 2. A data da programação for mais recente que status_atual_data
        // 3. O status atual for "Cadastrado"
        if (!entidadeData.status_atual_data ||
          dataProgTimestamp > entidadeData.status_atual_data ||
          entidadeData.status_atual === "Cadastrado") {

          updateStatus = true;

          // Atualizar status_atual e status_atual_data na entidade
          await entidadeRef.update({
            status_atual: "Programado",
            status_atual_data: dataProgTimestamp
          });

          console.log(`Status da entidade ${cnpj} atualizado para Programado`);
        }
      } else {
        console.log(`Entidade ${cnpj} não encontrada para atualizar status`);
      }

    } catch (error) {
      console.error(`Erro ao salvar programação ${programacao.cnpj}:`, error);
    }
  }

  private async saveEntidadeToFirebase(entidade: EntidadeData): Promise<void> {
    try {
      if (!entidade.cnpj) {
        console.log('Entidade sem CNPJ, não será salva:', entidade.nome);
        return;
      }

      const cnpj = entidade.cnpj.padStart(14, '0');
      const entidadeRef = this.db.collection('entidade_v3').doc(cnpj);
      const doc = await entidadeRef.get();

      if (!doc.exists) {
        // Entidade não existe, criar nova com fase 2025-2
        entidade.fase_pesquisa = ['2025-2'];
        await entidadeRef.set(entidade);
        console.log(`Nova entidade criada: ${entidade.nome} (${cnpj})`);
      } else {
        // Entidade já existe, atualizar e adicionar fases
        const existingData = doc.data();
        const fases = Array.isArray(existingData.fase_pesquisa) ? existingData.fase_pesquisa : [];

        // Adicionar fases se não existirem
        if (!fases.includes('2025-1')) fases.push('2025-1');
        if (!fases.includes('2025-2')) fases.push('2025-2');

        // Verificar se o status atual deve ser atualizado
        let updateStatus = true;
        if (existingData.status_atual_data && entidade.status_atual_data) {
          // Só atualiza se a nova data for mais recente
          if (entidade.status_atual_data <= existingData.status_atual_data) {
            updateStatus = false;
            // Manter o status atual e data existentes
            entidade.status_atual = existingData.status_atual;
            entidade.status_atual_data = existingData.status_atual_data;
          }
        }

        // Atualizar entidade mantendo as fases
        await entidadeRef.update({
          ...entidade,
          fase_pesquisa: fases
        });
        console.log(`Entidade atualizada: ${entidade.nome} (${cnpj}), fases: ${fases.join(', ')}`);
      }
    } catch (error) {
      console.error(`Erro ao salvar entidade ${entidade.cnpj}:`, error);
    }
  }
}