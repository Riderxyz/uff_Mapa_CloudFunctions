import { UmovResponseInterface } from './interface/umovResponse.interface';
import axios from "axios";
import { from } from "rxjs";
import { mergeMap, map, toArray } from "rxjs/operators";
import { parseStringPromise } from "xml2js";
import fs from "fs";
import { EntidadeXMLInterface, ServiceLocal } from './interface/entidadeXML.interface';
import * as xml2js from 'xml2js';
import { EntidadesInterface } from './interface/entidade.interface';

export const repopular = async () => {
  console.clear();
  console.log("🔄 Iniciando o processo de repopulação...");

      const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      attrNameProcessors: [(name) => `_${name}`],
    });
  const umovRes: UmovResponseInterface = require("./entidadesXML.json");
  const entidadesfromUmov = umovRes.result.entries.entry;



  console.log(`${entidadesfromUmov.length} entidades encontradas`);

  const entidadesURLs: string[] = entidadesfromUmov.map(
    (e) =>
      `https://api.umov.me/CenterWeb/api/43843e568c3fa407c0d69ea8677ae2a92d847b${e._link}`
  );

  const resultados$ = from(entidadesURLs).pipe(
    mergeMap(
      (url) =>
        from(
          axios.get(url, { responseType: "text" }).then((res) => res.data)
        ).pipe(
          mergeMap(async (xmlData) => await parser.parseStringPromise(xmlData)),
          map((jsonData: EntidadeXMLInterface) => {
            // AQUI pegamos somente a propriedade "serviceLocal"
            const serviceLocal = jsonData?.serviceLocal || jsonData?.serviceLocal;
            return serviceLocal;
          })
        ),
      10 // concorrência de 10 chamadas por vez
    ),
    toArray()
  );

  const resultados: ServiceLocal[] = (await resultados$.toPromise()) ?? [];

  console.log(`✅ ${resultados.length} entidades processadas.`);



  const entidadesParaSalvarArr:EntidadesInterface[] = [];
  resultados.forEach((entidadeDoUmov) => {
    let lat, long;
    if (entidadeDoUmov.geoCoordinate) {
      lat = parseFloat(entidadeDoUmov.geoCoordinate.split(",")[0]);
      long = parseFloat(entidadeDoUmov.geoCoordinate.split(",")[1]);
    }
    console.log(lat, long);
    
      entidadesParaSalvarArr.push({
          codigoEntidade: entidadeDoUmov.alternativeIdentifier.toString(),
          email: entidadeDoUmov.email,
        cnpj: entidadeDoUmov.customFields.CNPJ,
        endereco: entidadeDoUmov.address,
        id_umov: entidadeDoUmov.id,
       // data_programacao: entidade.data_programacao,
        fase_pesquisa: ['2025-2'],
        //formularios: entidade.formularios,
        lat: lat || 0,
        long: long || 0,
        cep: entidadeDoUmov.zipCode,
      })
  })



  //fs.writeFileSync("serviceLocais.json", JSON.stringify(resultados, null, 2), "utf-8");
};
