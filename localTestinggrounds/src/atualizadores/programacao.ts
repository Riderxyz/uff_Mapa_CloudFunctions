import { defer, EMPTY, expand, map, toArray } from "rxjs";
import * as xml2js from "xml2js";
import axios from "axios";
import * as admin from "firebase-admin";
import {
  Entry,
  ProgramacaoXMLInterface,
} from "../interface/programacaoXML.interface";
import { log } from "console";
import { EntryXMLInterface } from "../interface/entryXML.interface";
import { ProgramacaoInterface } from "../interface/programacao.interface";
import { EntidadesInterface } from "../interface/entidade.interface";

export const atualizandoProgramacao = async () => {
  const baseUrl =
    "https://api.umov.me/CenterWeb/api/43843e568c3fa407c0d69ea8677ae2a92d847b";
  const urlToGetAllEntries = `${baseUrl}/schedule.xml?scheduleType.id=127939`;
  console.log("🔄 Iniciando a atualização da programação...");

  const firestoreCtrl = admin.firestore();
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    attrNameProcessors: [(name) => `_${name}`],
  });

  const entidadesSnapshot = await firestoreCtrl.collection("entidade_v3").get();
  const entidadesMap = new Map<string, EntidadesInterface>();
  entidadesSnapshot.forEach((doc) => {
    const data: any = doc.data();
    if (data.id_umov) {
      entidadesMap.set(data.id_umov, data);
    }
  });
  const programacaoParaOFirebase: ProgramacaoInterface[] = [];

  const fetchAndParse = (page: number) =>
    defer(async () => {
      const xmlResponse = await axios.get(
        `${urlToGetAllEntries}&paging.page=${page}`,
        {
          responseType: "text",
        }
      );

      const json = await parser.parseStringPromise(xmlResponse.data);

      // Extrair os entries no formato esperado
      const rawEntries = json?.result?.entries?.entry || [];
      const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

      // Garante que cada entry terá _id e _link diretamente
      const parsedEntries: Entry[] = entries.map((e: any) => ({
        _id: e._id,
        _link: e._link,
      }));

      const nextPage = parsedEntries.length > 0 ? page + 1 : null;
      console.log(`📄 Página ${page} processada. Próxima: ${nextPage}`);
      return { entries: parsedEntries, nextPage };
    });

  fetchAndParse(1)
    .pipe(
      expand(({ nextPage }) => (nextPage ? fetchAndParse(nextPage) : EMPTY)),
      map(({ entries }) => entries),
      toArray(),
      map((pages) => pages.flat())
    )
    .subscribe({
      next: async (allEntries: Entry[]) => {
        console.log(`✅ Total de registros recebidos: ${allEntries.length}`);

        for (let i = 0; i < allEntries.length; i++) {
          const element = allEntries[i];
          await getDetailsFromEntry(element);
          if (i % 100 === 0) {
            console.log(i);
            console.log(
              `🔄 Processados ${i + 1} de ${allEntries.length} entries`
            );
          }
          if (i === allEntries.length - 1) {
            console.log(i);
            console.log(
              `🔄 Processados ${i + 1} de ${allEntries.length} entries`
            );
            console.log(programacaoParaOFirebase[0]);
            console.log(programacaoParaOFirebase.length);
            console.log("🎉 Concluído o processamento da programação.");
          }
        }
      },
      complete: () =>
        console.log("🎉 Concluído o carregamento da programação."),
      error: (err) => console.error("❌ Erro ao buscar dados XML:", err),
    });

  const getDetailsFromEntry = async (entry: Entry) => {
    //  console.log(`🔍 Buscando detalhes para o entry: ${entry._id}`);
    const entryUrl = `${baseUrl}${entry._link}`;
    const xmlResponse = await axios.get(entryUrl, {
      responseType: "text",
    });
    const json: EntryXMLInterface = await parser.parseStringPromise(
      xmlResponse.data
    );

    const schedule = json.schedule;
    const serviceLocalId = schedule.serviceLocal.id;
    const agentName = schedule.agent.name;
    const scheduleDate = schedule.date;
    // Converter data para timestamp
    const dateParts = scheduleDate.split("-");
    const dateObj = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2])
    );
    const timestamp = Math.floor(dateObj.getTime());
    const entidade = entidadesMap.get(serviceLocalId);
    let programacao: ProgramacaoInterface = {
      id_umov: serviceLocalId,
      cnpj: entidade?.cnpj || "",
      data_programacao: timestamp,
      fase_pesquisa: "2025-2",
      formularios: [],
      id: schedule.id,
      lat: parseFloat(
        schedule.serviceLocal.geoCoordinate?.split(",")[0] || "0"
      ),
      long: parseFloat(
        schedule.serviceLocal.geoCoordinate?.split(",")[1] || "0"
      ),
      monitor_1: "",
      monitor_2: "",
    };

    const existingIndex = programacaoParaOFirebase.findIndex(
      (p) => p.id_umov === serviceLocalId
    );

    if (existingIndex >= 0) {
      // Já existe, preencher monitor_2
      if (!programacaoParaOFirebase[existingIndex].monitor_2) {
        programacaoParaOFirebase[existingIndex].monitor_2 = agentName;
      }
    } else {
      // Não existe, preencher monitor_1
      programacao.monitor_1 = agentName;
      programacaoParaOFirebase.push(programacao);
    }
  };
};
