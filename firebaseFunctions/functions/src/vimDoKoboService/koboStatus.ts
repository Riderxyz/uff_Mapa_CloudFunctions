import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

export interface StatusItem {
  cnpj: string;
  id_umov: string;
  data_atualizado: number;
  fase_pesquisa: string;
  status: string;
  usuario: string;
}

@Injectable()
export class StatusService {
  private readonly db: FirebaseFirestore.Firestore;

  constructor(
    @Inject('FIREBASE_ADMIN') private readonly firebase: admin.app.App,
  ) {
    this.db = this.firebase.firestore();
  }


  async saveStatusToFirebase(
    cnpj: string, 
    id_umov: string, 
    fase_pesquisa: string, 
    status: string, 
    usuario: string
  ): Promise<void> {
    try {
      const statusItem: StatusItem = {
        cnpj: cnpj,
        id_umov: id_umov,
        data_atualizado: Math.floor(Date.now() / 1000), // timestamp atual
        fase_pesquisa: fase_pesquisa,
        status: status,
        usuario: usuario
      };

      // Usar o CNPJ como ID do documento
      const statusRef = this.db.collection('list_status_v3').doc(cnpj);
      await statusRef.set(statusItem);

      console.log(`Status adicionado para CNPJ ${cnpj} na collection list_status_v3`);
    } catch (error) {
      console.error(`Erro ao salvar status para CNPJ ${cnpj}:`, error);
    }
  }

  async updateEntidadeStatus(
    cnpj: string, 
    status: string, 
    timestamp: number
  ): Promise<void> {
    try {
      const entidadeRef = this.db.collection('entidade_v3').doc(cnpj);
      const entidadeDoc = await entidadeRef.get();

      if (entidadeDoc.exists) {
        const entidadeData = entidadeDoc.data();

        // Atualizar status se a data for mais recente que status_atual_data
        if (!entidadeData.status_atual_data || timestamp > entidadeData.status_atual_data) {
          await entidadeRef.update({
            status_atual: status,
            status_atual_data: timestamp
          });
          console.log(`Status da entidade ${cnpj} atualizado para ${status}`);
          return;
        }
        
        console.log(`Status da entidade ${cnpj} não foi atualizado - data não é mais recente`);
      } else {
        console.log(`Entidade ${cnpj} não encontrada para atualizar status`);
      }
    } catch (error) {
      console.error(`Erro ao atualizar status da entidade ${cnpj}:`, error);
    }
  }

  async getStatusHistory(cnpj: string): Promise<StatusItem | null> {
    try {
      const statusRef = this.db.collection('list_status_v3').doc(cnpj);
      const statusDoc = await statusRef.get();

      if (statusDoc.exists) {
        return statusDoc.data() as StatusItem;
      }
      
      return null;
    } catch (error) {
      console.error(`Erro ao buscar histórico de status para CNPJ ${cnpj}:`, error);
      return null;
    }
  }

  async getAllStatusByFase(fase_pesquisa: string): Promise<StatusItem[]> {
    try {
      const statusRef = this.db.collection('list_status_v3');
      const query = statusRef.where('fase_pesquisa', '==', fase_pesquisa);
      const snapshot = await query.get();

      const statusList: StatusItem[] = [];
      snapshot.forEach(doc => {
        statusList.push(doc.data() as StatusItem);
      });

      console.log(`Encontrados ${statusList.length} status para a fase ${fase_pesquisa}`);
      return statusList;
    } catch (error) {
      console.error(`Erro ao buscar status por fase ${fase_pesquisa}:`, error);
      return [];
    }
  }

  async updateStatusWithHistory(
    cnpj: string,
    id_umov: string,
    fase_pesquisa: string,
    status: string,
    usuario: string,
    timestamp?: number
  ): Promise<void> {
    const statusTimestamp = timestamp || Math.floor(Date.now() / 1000);
    
    // Salvar no histórico de status
    await this.saveStatusToFirebase(cnpj, id_umov, fase_pesquisa, status, usuario);
    
    // Atualizar status da entidade se necessário
    await this.updateEntidadeStatus(cnpj, status, statusTimestamp);
  }

  async getStatusSummaryByFase(fase_pesquisa: string): Promise<{ [key: string]: number }> {
    try {
      const statusList = await this.getAllStatusByFase(fase_pesquisa);
      const summary: { [key: string]: number } = {};

      statusList.forEach(item => {
        if (summary[item.status]) {
          summary[item.status]++;
        } else {
          summary[item.status] = 1;
        }
      });

      console.log(`Resumo de status para fase ${fase_pesquisa}:`, summary);
      return summary;
    } catch (error) {
      console.error(`Erro ao gerar resumo de status para fase ${fase_pesquisa}:`, error);
      return {};
    }
  }
}