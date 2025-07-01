 const fetchProgramacao =  (async (): Promise<ProgramacaoData[]> => {
    const baseUrl = 'https://api.umov.me/CenterWeb/api/43843e568c3fa407c0d69ea8677ae2a92d847b';
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
        const url = `${baseUrl}/schedule.xml?scheduleType.id=127939&paging.page=${currentPage}`;
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
          const detailUrl = `${baseUrl}${entry.$.link}`;
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
  })

interface ProgramacaoData {
    
}