import * as admin from "firebase-admin";
import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";
import { FormularioInterface } from "../interface/formulario.interface";
import axios from "axios";
import { from, forkJoin, map, catchError, of, switchMap, mergeMap, toArray, lastValueFrom } from "rxjs";
import { KoboResponseInterface } from "../interface/koboResponse.interface";
import {
  VisitasInterface,
  VisitasStatus,
} from "../interface/visitas.interface";

export const atualizandoVisitas = async (): Promise<CloudFunctionResponse> => {
  console.log("🔄 Iniciando a atualização da Visitas...");
  const firestore = admin.firestore();

  try {
    const formularios = await getFormularios(firestore);
    const token = await getToken("https://kf.kobotoolbox.org/token/?format=json");

    return await lastValueFrom(
      from(formularios).pipe(
        mergeMap((formulario) =>
          from(fetchVisitasPorFormulario(formulario, token)).pipe(
            catchError((err) => {
              console.error(`Erro no formulário ${formulario.nome}`, err);
              return of([]); // Retorna lista vazia para manter fluxo
            })
          )
        ),
        toArray(),
        map((visitasArrays) => visitasArrays.flat()),
        switchMap((visitas: VisitasInterface[]) => {
          const idsNovos = visitas.map(v => v.cnpj);
          return from(salvarVisitas(visitas, firestore)).pipe(
            switchMap(() => from(limparVisitasAntiga(firestore, idsNovos))),
            map(() => visitas.length)
          );
        }),
        map((qtde) => ({
          success: true,
          message: `✅ Visitas atualizadas com sucesso (${qtde} registros). ✅`
        }))
      )
    );

  } catch (error: any) {
    console.error("Erro geral na função:", error);
    return {
      success: false,
      message: "❌ Erro ao atualizar visitas. ❌",
      error: error.toString(),
    };
  }
};

const fetchVisitasPorFormulario = async (
  formulario: FormularioInterface,
  token: string
): Promise<VisitasInterface[]> => {
  const url = `https://kf.kobotoolbox.org/api/v2/assets/${formulario.assetid}/data.json`;

  const response = await axios.get<KoboResponseInterface>(url, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  return response.data.results.map((item) => {
    const latlong = item["start-geopoint"]?.split(" ") ?? ["0", "0"];
    const [ano, mes, dia] = item["group_identificacao/data_visita"]?.split("-")?.map(Number) ?? [2020, 1, 1];
    const data_visita = new Date(ano, mes - 1, dia).getTime();

    let status = {
      data: "",
      usuario: "",
      status: VisitasStatus.Nulo,
    };

    if (item["_validation_status"]?.label) {
      let st: VisitasStatus = VisitasStatus.EmAnalise;
      switch (item["_validation_status"]["label"]) {
        case "Approved":
          st = VisitasStatus.Approved;
          break;
        case "Rejected":
          st = VisitasStatus.Rejected;
          break;
      }

      status = {
        data: (item["_validation_status"]["timestamp"] * 1000).toString(),
        usuario: item["_validation_status"]["by_whom"],
        status: st,
      };
    }

    return {
      cnpj: item["group_dados_entidade/cnpj"],
      fase_pesquisa: "2025-2",
      data_visita: data_visita.toString(),
      formulario: formulario.assetid || "",
      usuario_status: item["_validation_status"]?.by_whom || "",
      status: status.status,
      data_status: status.data,
      monitor_1: item["group_identificacao/monitor_responsavel_1"],
      monitor_2: item["group_identificacao/monitor_responsavel_2"],
      lat: latlong[0],
      long: latlong[1],
    } as VisitasInterface;
  });
};

const getToken = async (url: string): Promise<string> => {
  const username = "uff_niteroi";
  const pass = "@0yUhv86rdgNib&5";
  const authHeader = "Basic " + Buffer.from(`${username}:${pass}`).toString("base64");

  const response = await axios.post(url, {}, {
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
  });

  return response.data.token;
};

const getFormularios = async (
  firestoreCtrl: admin.firestore.Firestore
): Promise<FormularioInterface[]> => {
  const snapshot = await firestoreCtrl.collection("formularios").get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<FormularioInterface, "id">),
  }));
};

const salvarVisitas = async (
  visitas: VisitasInterface[],
  firestore: FirebaseFirestore.Firestore
): Promise<void> => {
  const batch = firestore.batch();
  const collectionRef = firestore.collection("visitas_testesLocais");

  for (const visita of visitas) {
    const docRef = collectionRef.doc(visita.cnpj);
    batch.set(docRef, visita, { merge: true });
  }

  await batch.commit();
  console.log(`✅ Salvos ${visitas.length} registros`);
};

const limparVisitasAntiga = async (
  firestore: FirebaseFirestore.Firestore,
  novosIds: string[]
): Promise<void> => {
  const snapshot = await firestore.collection("visitas_testesLocais").get();
  const antigos = snapshot.docs.filter((doc) => !novosIds.includes(doc.id));
  const batch = firestore.batch();
  antigos.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`🧹 Removidos ${antigos.length} registros antigos`);
};
