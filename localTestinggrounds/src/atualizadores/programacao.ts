import { defer, EMPTY, expand, map, toArray } from "rxjs";
import { parseStringPromise } from "xml2js";
import axios from "axios";
import {
  Entry,
  ProgramacaoXMLInterface,
} from "../interface/programacaoXML.interface";

export const atualizandoProgramacao = async () => {
  const baseUrl =
    "https://api.umov.me/CenterWeb/api/43843e568c3fa407c0d69ea8677ae2a92d847b";
  const urlToGetAllEntries = `${baseUrl}/schedule.xml?scheduleType.id=127939`;

  console.log("🔄 Iniciando a atualização da programação...");

  const fetchAndParse = (page: number) =>
    defer(async () => {
      const xmlResponse = await axios.get(`${urlToGetAllEntries}&paging.page=${page}`, {
        responseType: "text",
      });

      const json = (await parseStringPromise(xmlResponse.data)) as ProgramacaoXMLInterface;

      const entries =
        Array.isArray(json.result.entries) &&
        Array.isArray(json.result.entries[0]?.entry)
          ? json.result.entries[0].entry
          : [];

      const nextPage = entries.length > 0 ? page + 1 : null;

      return { entries, nextPage };
    });

  fetchAndParse(1)
    .pipe(
      expand(({ nextPage }) => (nextPage ? fetchAndParse(nextPage) : EMPTY)),
      map(({ entries }) => entries),
      toArray(),
      map((pages) => pages.flat())
    )
    .subscribe({
      next: (allEntries: Entry[]) => {
        console.log(`✅ Total de registros recebidos: ${allEntries.length}`);

        for (let i = 0; i < allEntries.length; i++) {
            const element = allEntries[i];
            
        }
        // Do something with allEntries here
      },
      complete: () => console.log("🎉 Concluído o carregamento da programação."),
      error: (err) => console.error("❌ Erro ao buscar dados XML:", err),
    });
};
