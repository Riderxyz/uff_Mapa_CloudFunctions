import * as path from "path";
import * as fs from "fs";
import { readExcelFile } from "./readExcel";
import { excelReadOut } from "./interface/excelReadOut.interface";

console.clear();

const formatCNPJ = (cnpj: string): string => cnpj.padStart(14, "0");

const convertDateToISOString = (dateStr: string): string => {
  if (/^[A-Za-z]/.test(dateStr)) return "";
  const [month, day, year] = dateStr.split("/").map(Number);
  const fullYear = year < 100 ? 2000 + year : year;
  try {
    return new Date(fullYear, month - 1, day).toISOString();
  } catch (error) {
    console.error("Erro ao converter data:", error);
    return "";
  }
};

const processRegion = async (regionData: any[], regionName: string) => {
  const processedData = regionData.map((el) => {
    el.CNPJ = formatCNPJ(el.CNPJ);
    el.Período = convertDateToISOString(el.Período);
    el.Monitores = el.Monitores.split(" e ");

    if (!/^[A-Za-z]/.test(el.Período)) {
      return {
        CNPJ: el.CNPJ,
        realizada: el.Período,
        programada: {
          data: el.Período,
          monitor1: {
            nome: el.Monitores[0],
            telefones: el.Contato.split("/")[0],
          },
          monitor2: {
            nome: el.Monitores[1],
            telefones: el.Contato.split("/")[1],
          },
        },
      };
    }
    return null;
  }).filter(Boolean);

  const outputPath = path.join(__dirname, `${regionName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), "utf-8");
  console.log(`Dados salvos em ${regionName}.json`);
};

export const saveToJson = async () => {
  const excelFilePath = path.join(__dirname, "arquivo.xlsx");

  try {
    const excelData: excelReadOut = readExcelFile(excelFilePath) as any;

    await Promise.all([
      processRegion(excelData["CENTRO OESTE"], "CENTRO_OESTE"),
      processRegion(excelData.NORDESTE, "NORDESTE"),
      processRegion(excelData.NORTE, "NORTE"),
      processRegion(excelData.SUDESTE, "SUDESTE"),
      processRegion(excelData.SUL, "SUL"),
    ]);
  } catch (error) {
    console.error("Erro ao ler o arquivo:", error);
  }
};

