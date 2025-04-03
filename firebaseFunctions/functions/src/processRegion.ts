// Função para processar uma região
import { getFirestore } from "firebase-admin/firestore";

const formatCNPJ = (cnpj: string): string => cnpj.padStart(14, "0");

// Função para converter data para ISOString
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

export const processRegion = async (regionData: any[], regionName: string) => {
    const updates = regionData.map(async (el) => {
      el.CNPJ = formatCNPJ(el.CNPJ);
      el.Período = convertDateToISOString(el.Período);
      el.Monitores = el.Monitores.split(" e ");
  
      if (!/^[A-Za-z]/.test(el.Período)) {
        const epochPeriodo = new Date(el.Período).getTime();
        const epochDeHoje = new Date().getTime();
        const jaPassou = epochPeriodo - epochDeHoje;
  
        if (jaPassou < 0) {
          await getFirestore().collection("entidade").doc(el.CNPJ).update({
            realizada: el.Período,
          });
        }
  
        await getFirestore().collection("entidade").doc(el.CNPJ).update({
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
  
    await Promise.all(updates);
  };
  