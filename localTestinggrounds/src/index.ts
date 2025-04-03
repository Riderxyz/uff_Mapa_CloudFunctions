import admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";
import { readExcelFile } from "./readExcel";
import { excelReadOut } from "./interface/excelReadOut.interface";
import { saveToJson } from "./saveToJson";

// Inicialize o Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require("./importKeys.json")),
});

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
  const updates = regionData.map(async (el) => {
    el.CNPJ = formatCNPJ(el.CNPJ);
    el.Período = convertDateToISOString(el.Período);
    el.Monitores = el.Monitores.split(" e ");

    if (!/^[A-Za-z]/.test(el.Período)) {
      const epochPeriodo = new Date(el.Período).getTime();
      const epochDeHoje = new Date().getTime();
      const jaPassou = epochPeriodo - epochDeHoje;

      if (jaPassou < 0) {
        await admin.firestore().collection("entidade").doc(el.CNPJ).update({
          realizada: el.Período,
        });
      }
      await admin
        .firestore()
        .collection("entidade")
        .doc(el.CNPJ)
        .update({
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
        });
    }
  });
  console.log(updates);

  await Promise.all(updates);
};

const main = async () => {
  const excelFilePath = path.join(__dirname, "arquivo.xlsx");
  const outputJsonPath = path.join(__dirname, "resultado.json");

  try {
    const excelData: excelReadOut = readExcelFile(excelFilePath) as any;

    await Promise.all([
      processRegion(excelData["CENTRO OESTE"], "CENTRO OESTE"),
      processRegion(excelData.NORDESTE, "NORDESTE"),
      processRegion(excelData.NORTE, "NORTE"),
      processRegion(excelData.SUDESTE, "SUDESTE"),
      processRegion(excelData.SUL, "SUL"),
    ]);

    fs.writeFileSync(
      outputJsonPath,
      JSON.stringify(excelData, null, 2),
      "utf-8"
    );
    console.log("Dados do Excel foram salvos em resultado.json");
  } catch (error) {
    console.error("Erro ao ler o arquivo:", error);
  }
};

const setAtivoFalse = async (): Promise<void> => {
  const cnpjArr: number[] = [
    531895000514, 816354000966, 1139179000800, 1269083000181, 1768904000124,
    2010445000188, 2457215000838, 2457215001303, 2992104000155, 3712006000180,
    3744116000123, 4309546000180, 4970973000104, 4981194000104, 5357141000180,
    5752920000694, 5818105000176, 6093260000135, 6865166000157, 7362545000278,
    7478222000163, 7568557000334, 7856329000106, 7910103000138, 7940678000101,
    10320290000295, 10837915000100, 11449215000100, 11832271000200,
    11904734000111, 12692241000128, 13507203000110, 13763481000139,
    13959203000151, 14711513000115, 14757932000198, 14789411000112,
    15025978000185, 15109182000100, 15327928000152, 16630030000707,
    17099432000102, 17515115000200, 17720987000111, 17922227000197,
    18186616000164, 18444444000181, 18872090000176, 19309807000139,
    20485436000125, 21111583000106, 21496907000163, 27717512000120,
    27817419000197, 29269723000172, 29292752000155, 29903037000101,
    30467024000388, 32011876000120, 32011876000200, 32011876001878,
    32883938000193, 35266969000193, 37993607000391, 38656558000283,
    41175449000178, 42165949000191, 48555775000150, 48555775002950,
    48555775005623, 48555775006786, 48555775007839, 48555775009378,
    50456870000300, 50456870000733, 63762553000100, 64033061001290,
    78194974000140, 78312188000281, 80507718000108, 81395253000103,
    81764532000105,
  ];
  try {
    await Promise.all(
      cnpjArr.map(async (cnpj) => {
        await admin.firestore().collection("entidade").doc(cnpj.toString()).update({ ativo: false });
        console.log(`CNPJ ${cnpj} atualizado para ativo: false`);
      })
    );
    console.log("Todas as atualizações foram concluídas.");
  } catch (error) {
    console.error("Erro ao atualizar os CNPJs:", error);
  }
};

//main();
setAtivoFalse();
//saveToJson();
