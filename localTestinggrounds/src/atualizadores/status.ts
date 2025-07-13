import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";
import { from, map, toArray, mergeMap, of } from "rxjs";
import * as admin from "firebase-admin";
import { EntidadesInterface } from "../interface/entidade.interface";
import { ProgramacaoInterface } from "../interface/programacao.interface";
import { VisitasInterface } from "../interface/visitas.interface";
import { StatusInterface } from "../interface/status.interface";
import { StatusNameEnum } from "../interface/enums";

interface GroupedItem {
  entidade: EntidadesInterface;
  programacao: ProgramacaoInterface;
  visita: VisitasInterface;
  status: StatusInterface;
}

interface PartialGroupedItem {
  entidade?: EntidadesInterface;
  programacao?: ProgramacaoInterface;
  visita?: VisitasInterface;
  status?: StatusInterface;
}

export const atualizandoStatus = async (): Promise<CloudFunctionResponse> => {
  const firestore = admin.firestore();

  const [
    entidadesSnapshot,
    programacaoSnapshot,
    visitasSnapshot,
    statusSnapshot,
  ] = await Promise.all([
    firestore.collection("entidade_v3").get(),
    firestore.collection("programacao_v3").get(),
    firestore.collection("visitas_v3").get(),
    firestore.collection("list_status_v3").get(),
  ]);

  const entidadesArr = entidadesSnapshot.docs.map(
    (doc) => doc.data() as EntidadesInterface
  );
  const programacaoArr = programacaoSnapshot.docs.map(
    (doc) => doc.data() as ProgramacaoInterface
  );
  const visitasArr = visitasSnapshot.docs.map(
    (doc) => doc.data() as VisitasInterface
  );
  const statusArr = statusSnapshot.docs.map(
    (doc) => doc.data() as StatusInterface
  );

  console.log("🔄 Iniciando a atualização do Status...");
  console.log(`Total de entidades: ${entidadesArr.length}`);
  console.log(`Total de programações: ${programacaoArr.length}`);
  console.log(`Total de visitas: ${visitasArr.length}`);
  console.log(`Total de status: ${statusArr.length}`);

  // Create Maps for quick lookup
  const entidadeMap = new Map(entidadesArr.map((obj) => [obj.cnpj, obj]));
  const programacaoMap = new Map(programacaoArr.map((obj) => [obj.cnpj, obj]));
  const visitaMap = new Map(visitasArr.map((obj) => [obj.cnpj, obj]));
  const statusMap = new Map(statusArr.map((obj) => [obj.cnpj, obj]));

  // Get all unique CNPJs from all arrays
  const allCnpjs = new Set<string>([
    ...entidadeMap.keys(),
    ...programacaoMap.keys(),
    ...visitaMap.keys(),
    ...statusMap.keys(),
  ]);

  const fullMatches: GroupedItem[] = [];
  const partialMatches: PartialGroupedItem[] = [];

  allCnpjs.forEach((cnpj) => {
    const entidade = entidadeMap.get(cnpj);
    const programacao = programacaoMap.get(cnpj);
    const visita = visitaMap.get(cnpj);
    const status = statusMap.get(cnpj);

    const presenceCount = [entidade, programacao, visita, status].filter(
      Boolean
    ).length;

    const item: any = {
      entidade,
      programacao,
      visita,
      status,
    };

    if (presenceCount === 4) {
      fullMatches.push(item);
    } else if (presenceCount >= 2) {
      partialMatches.push(item);
    }
  });

  console.log("✅ CNPJs em todos os arrays:", fullMatches.length);
  console.log("⚠️ CNPJs parciais (>=2 arrays):", partialMatches.length);

  for (let i = 0; i < fullMatches.length; i++) {
    const element = fullMatches[i];

    if (element.entidade.status_atual !== StatusNameEnum.Aprovado) {
      const dataDeProgramacao = element.programacao.data_programacao;
      element.visita.data_status;
      const dataDeStatus = element.status.data_atualizado;

      const [day, month, yearAndTime] = element.visita.data_status.split("/");
      const [year, time] = yearAndTime.split(", ");
      const isoFormat = `${year.trim()}-${month}-${day}T${time}`;

      const dataDeVisita = new Date(isoFormat).getTime();
      console.log(
        "data de atualização de programacao",
        new Date(dataDeProgramacao * 1000)
      );
      console.log("-----------------------------------");

      console.log("data de atualização de visita", new Date(dataDeVisita));
      console.log("-----------------------------------");
      console.log(
        "data de atualização de status",
        new Date(dataDeStatus * 1000)
      );
      console.log(
        "//////////////////////////////////////////////////////////////////////////////////////"
      );






    }
  }
  return {
    success: true,
    message: "✅ Status atualizado com sucesso. ✅",
  };
};
