import { excelReadOut } from './interface/excelReadOut.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Função para ler todas as abas de um arquivo Excel
type ExcelData = { [sheetName: string]: any[] };

export const readExcelFile = (filePath: string): ExcelData => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`O arquivo ${filePath} não foi encontrado.`);
    }

    // Lendo o arquivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    const result: ExcelData = {};

    sheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        result[sheetName] = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false,  });
    });


    
    return result;
};

