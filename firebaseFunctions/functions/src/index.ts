import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';
import { readExcelFile } from './readExcelFile'; // Implemente esta função para ler o Excel
import { processRegion } from './processRegion'; // Implemente esta função para processar as regiões

// Inicializa o Firebase Admin SDK
initializeApp();

export const processExcelFile = onObjectFinalized(
  async (event) => {
    const filePath = event.data.name; // Caminho do arquivo no Storage
    const fileName = path.basename(filePath); // Nome do arquivo
    
    // Verifica se o arquivo é o "Plano_de_ação.xlsx" na pasta "backup"
    if (filePath && path.dirname(filePath) === 'backup' && fileName === 'Plano_de_ação.xlsx') {
      const bucket = getStorage().bucket();
      const tempFilePath = path.join('/tmp', fileName); // Caminho temporário para o arquivo

      try {
        // Baixa o arquivo para o diretório temporário
        await bucket.file(filePath).download({ destination: tempFilePath });

        // Lê o arquivo Excel
        const excelData = await readExcelFile(tempFilePath);

        // Processa as regiões
        await Promise.all([
          processRegion(excelData['CENTRO OESTE'], 'CENTRO OESTE'),
          processRegion(excelData['NORDESTE'], 'NORDESTE'),
          processRegion(excelData['NORTE'], 'NORTE'),
          processRegion(excelData['SUDESTE'], 'SUDESTE'),
          processRegion(excelData['SUL'], 'SUL'),
        ]);

        console.log('Arquivo processado e dados atualizados no Firestore.');
      } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
      } finally {
        // Remove o arquivo temporário
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    }
  }
);
