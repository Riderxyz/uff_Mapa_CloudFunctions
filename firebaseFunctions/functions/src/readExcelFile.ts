import * as fs from "fs";
import * as XLSX from "xlsx";
import { excelReadOut } from "./interface/excelReadOut.interface";

export const readExcelFile = (filePath: string): excelReadOut => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`O arquivo ${filePath} não foi encontrado.`);
    }
  
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    const result: any = {};
  
    sheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      result[sheetName] = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
    });
  
    return result as excelReadOut;
  };
  