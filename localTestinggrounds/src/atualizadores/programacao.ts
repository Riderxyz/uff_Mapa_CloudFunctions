import { defer, EMPTY, expand, map, toArray } from "rxjs";
import * as xml2js from "xml2js";
import axios from "axios";
import * as admin from "firebase-admin";

import { Entry } from "../interface/umovResponse.interface";
import { EntryXMLInterface } from "../interface/entryXML.interface";
import { ProgramacaoInterface } from "../interface/programacao.interface";
import { EntidadesInterface } from "../interface/entidade.interface";
import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";


export const atualizandoProgramacao = async (): Promise<CloudFunctionResponse> => {
  try {
    const baseUrl =
      "https://api.umov.me/CenterWeb/api/43843e568c3fa407c0d69ea8677ae2a92d847b";
    const urlToGetAllEntries = `${baseUrl}/schedule.xml?scheduleType.id=127939`;

    console.log("🔄 Iniciando a atualização da programação...");

    const firestore = admin.firestore();
    const entidadesSnapshot = await firestore.collection("entidades_v1").get();

    const entidadesMap = new Map<string, EntidadesInterface>();

    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      attrNameProcessors: [(name) => `_${name}`],
    });


    entidadesSnapshot.forEach((doc) => {
    //  console.log(doc.data());
      const data = doc.data() as EntidadesInterface;
      if (data.id_umov) {
        entidadesMap.set(data.id_umov, data);
      }
    });

    const fetchAndParse = (page: number) =>
      defer(async () => {
        const xmlResponse = await axios.get(`${urlToGetAllEntries}&paging.page=${page}`, {
          responseType: "text",
        });

        const json = await parser.parseStringPromise(xmlResponse.data);
        const rawEntries = json?.result?.entries?.entry || [];
        const entries: Entry[] = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

        return {
          entries: entries.map((e: any) => ({ _id: e._id, _link: e._link })),
          nextPage: entries.length > 0 ? page + 1 : null,
        };
      });

    const allEntries = await fetchAndParse(1)
      .pipe(
        expand(({ nextPage }) => (nextPage ? fetchAndParse(nextPage) : EMPTY)),
        map(({ entries }) => entries),
        toArray(),
        map((pages) => pages.flat())
      )
      .toPromise();

    console.log(`✅ Total de registros recebidos: ${allEntries!.length}`);

    const programacaoParaOFirebase: ProgramacaoInterface[] = [];
    const concurrency = 10;
    const batches = [];
    for (let i = 0; i < allEntries!.length; i += concurrency) {
      const batch = allEntries!.slice(i, i + concurrency);
      batches.push(
        Promise.allSettled(
          batch.map((entry) =>
            processEntry(entry, parser, entidadesMap, programacaoParaOFirebase, baseUrl)
          )
        )
      );
    }

    for (let i = 0; i < batches.length; i++) {
      await batches[i];
      console.log(`🔄 Processados ${Math.min((i + 1) * concurrency, allEntries!.length)} de ${allEntries!.length}`);
    }

    console.log("💾 Salvando no Firestore...");
    await salvarProgramacao(programacaoParaOFirebase, firestore);

    console.log("🧹 Limpando dados antigos...");
    const novosIds = programacaoParaOFirebase.map((p) => p.cnpj);
    await limparProgramacaoAntiga(firestore, novosIds);

    console.log("✅ Atualização finalizada com sucesso.");
    const response: CloudFunctionResponse = {
      success: true,
      message: "✅ Programação atualizada com sucesso. ✅",
    };
    return response;
  } catch (error: any) {
    console.error("❌ Erro na atualização da programação:", error);
    const response: CloudFunctionResponse = {
      success: false,
      message: "❌ Erro ao atualizar a programação. ❌",
      error: error.toString(),
    };


    return response;
  }
};

async function processEntry(
  entry: Entry,
  parser: xml2js.Parser,
  entidadesMap: Map<string, EntidadesInterface>,
  programacaoList: ProgramacaoInterface[],
  baseUrl: string
): Promise<void> {
  try {
    const entryUrl = `${baseUrl}${entry._link}`;
    const xmlResponse = await axios.get(entryUrl, { responseType: "text" });
    const json: EntryXMLInterface = await parser.parseStringPromise(xmlResponse.data);

    const schedule = json.schedule;
    const serviceLocalId = schedule.serviceLocal.id;
    const agentName = schedule.agent.name;
    const scheduleDate = schedule.date;

    const dateParts = scheduleDate.split("-");
    const timestamp = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2])
    )

    const entidade = entidadesMap.get(serviceLocalId);
    const programacao: ProgramacaoInterface = {
      id_umov: serviceLocalId,
      cnpj: entidade?.cnpj || "",
      usuarioResponsavel: 'Servidor',
      data_programacao: timestamp,
      fase_pesquisa: "2025-2",
      formularios: [],
      id: schedule.id,
      lat: parseFloat(schedule.serviceLocal.geoCoordinate?.split(",")[0] || "0"),
      long: parseFloat(schedule.serviceLocal.geoCoordinate?.split(",")[1] || "0"),
      monitor_1: "",
      monitor_2: "",
    };

    const existingIndex = programacaoList.findIndex((p) => p.id_umov === serviceLocalId);

    if (existingIndex >= 0) {
      if (!programacaoList[existingIndex].monitor_2) {
        programacaoList[existingIndex].monitor_2 = agentName;
      }
    } else {
      programacao.monitor_1 = agentName;
      programacaoList.push(programacao);
    }

    
  } catch (error) {
    console.error(`❌ Erro ao processar entry ${entry._id}:`, error);
  }
}

async function salvarProgramacao(
  programacoes: ProgramacaoInterface[],
  firestore: FirebaseFirestore.Firestore
): Promise<void> {
  const batch = firestore.batch();
  const collectionRef = firestore.collection("programacao_v1");

  for (const item of programacoes) {
    const docRef = collectionRef.doc(item.cnpj);
    batch.set(docRef, item, { merge: true });
  }

  await batch.commit();
  console.log(`✅ Salvos ${programacoes.length} registros em 'programacao_testesLocais'`);
}

async function limparProgramacaoAntiga(
  firestore: FirebaseFirestore.Firestore,
  novosIds: string[]
): Promise<void> {
  const snapshot = await firestore.collection("programacao_v1").get();
  const antigos = snapshot.docs.filter((doc) => !novosIds.includes(doc.id));

  const batch = firestore.batch();
  antigos.forEach((doc) => batch.delete(doc.ref));

  await batch.commit();
  console.log(`🧹 Removidos ${antigos.length} registros antigos`);
}
