import axios from 'axios';
import { from, lastValueFrom } from 'rxjs';
import { mergeMap, map, toArray } from 'rxjs/operators';
import { Parser } from 'xml2js';
import { UmovResponseInterface } from './interface/umovResponse.interface';
import { EntidadeXMLInterface, ServiceLocal } from './interface/entidadeXML.interface';
import { EntidadesInterface, TipoEntidadeInterface } from './interface/entidade.interface';
import { EstadoEnum, RegiaoBrasilNomeEnum, StatusNameEnum, TipoEntidadeEnum } from './interface/enums';
import fs from 'fs';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

admin.initializeApp({
  credential: admin.credential.cert(require("./painelDevKeys.json")),
 // credential: admin.credential.cert(require("./painelProdKeys.json")),
});


const parser = new Parser({
  explicitArray: false,
  mergeAttrs: true,
  attrNameProcessors: [(name) => `_${name}`],
});


const firestore = admin.firestore();

const extractFieldArray = (...fields: (string | undefined)[]) => 
  fields.filter((val): val is string => !!val);

const parseGeoCoordinates = (geo: string | undefined): { lat: number; long: number } => {
  if (!geo) return { lat: 0, long: 0 };
  const [lat, long] = geo.split(',').map(parseFloat);
  return { lat: lat || 0, long: long || 0 };
};

const mapToEntidade = (entidade: ServiceLocal): EntidadesInterface => {
  const { lat, long } = parseGeoCoordinates(entidade.geoCoordinate);
  const emails = extractFieldArray(entidade.customFields.Email1, entidade.customFields.Email2, entidade.customFields.Email3);
  const telefones = extractFieldArray(entidade.customFields.Telefone1, entidade.customFields.Telefone2, entidade.customFields.Telefone3);


const tipoEntidade:TipoEntidadeInterface[] = []

if (Number(entidade.customFields.Loc__QtdTermosFomento) > 0) {
  tipoEntidade.push({ id: uuidv4(), tipo: TipoEntidadeEnum.Fomento })
}

if (Number(entidade.customFields.Loc__QtdVagasContratadas) > 0) {
  tipoEntidade.push({ id: uuidv4(), tipo: TipoEntidadeEnum.Vaga })
}

  return {
    codigoEntidade: entidade.alternativeIdentifier.toString(),
    nome: entidade.corporateName,
    numeroContrato: entidade.customFields.Loc__Contrato,
    googleLink: entidade.customFields.Link__Livre,
    tipoEntidade: tipoEntidade,
    status_atual: StatusNameEnum.Cadastrado,
    status_atual_data: new Date(),
    vagas: {
      total: Number(entidade.customFields.Loc__QtdVagasContratadas),
      vagasMasculinas: Number(entidade.customFields.Quant__Vagas__Contratadas__Masc),
      vagasFemininas: Number(entidade.customFields.Quant__Vagas__Contratadas__Fem),
      vagasMaeNutriz: Number(entidade.customFields.Quant__Vagas__Contratadas__Mae__Nutriz),
    },
    endereco: {
      regiao: entidade.customFields.Regio as RegiaoBrasilNomeEnum,
      pais: entidade.country,
      cep: entidade.zipCode,
      bairro: entidade.cityNeighborhood,
      municipio: entidade.city,
      complemento: entidade.streetComplement,
      rua: entidade.street,
      uf: entidade.state as EstadoEnum,
      lat,
      long,
    },
    telefone: telefones,
    email: emails,
    cnpj: entidade.customFields.CNPJ,
    id_umov: entidade.id,
    fase_pesquisa: ['2025-2'],
  };
};

export const repopular = async () => {
  console.clear();
  console.log('🔄 Iniciando o processo de repopulação...');

  const umovRes: UmovResponseInterface = require('./entidadesXML.json');
  const entidades = umovRes.result.entries.entry;
  console.log(`${entidades.length} entidades encontradas`);

  const urls = entidades.map(
    (e) => `https://api.umov.me/CenterWeb/api/43843e568c3fa407c0d69ea8677ae2a92d847b${e._link}`
  );

  const resultados$ = from(urls).pipe(
    mergeMap(
      (url) =>
        from(axios.get(url, { responseType: 'text' })).pipe(
          mergeMap((res) => from(parser.parseStringPromise(res.data))),
          map((data: EntidadeXMLInterface) => data.serviceLocal)
        ),
      10 // concorrência
    ),
    toArray()
  );

  const serviceLocais = await lastValueFrom(resultados$);
  console.log(`✅ ${serviceLocais.length} entidades processadas.`);

  const entidadesFormatadas = serviceLocais.map(mapToEntidade);

  console.log(`✅ ${entidadesFormatadas.length} entidades formatadas.`);
  





 const BATCH_SIZE = 500;
  let batch = firestore.batch();
  let opCount = 0;
  let batchCount = 1;

  for (const [index, entidade] of entidadesFormatadas.entries()) {
    const cnpjKey = entidade.cnpj.replace(/[^\d]/g, ''); // remove pontuações

    const ref = firestore.collection('entidades_v1').doc(cnpjKey);
    batch.set(ref, entidade);
    opCount++;

    // Envia o batch quando atingir 500 operações ou for o último item
    const isLast = index === entidades.length - 1;
    if (opCount === BATCH_SIZE || isLast) {
      await batch.commit();
      console.log(`✅ Batch ${batchCount} enviado com ${opCount} entidades`);
      batchCount++;
      batch = firestore.batch();
      opCount = 0;
    }
  }

  console.log('🏁 Todos os batches foram processados com sucesso.');


/* 

   fs.writeFileSync("entidadesFormatadas.json", JSON.stringify(entidadesFormatadas, null, 2)); */
};
