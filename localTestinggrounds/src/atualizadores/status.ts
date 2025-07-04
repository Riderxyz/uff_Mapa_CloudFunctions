import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";
import { map, toArray } from "rxjs";
import * as admin from "firebase-admin";


export const atualizandoStatus = async (): Promise<CloudFunctionResponse> => {
  const firestore = admin.firestore();
  const entidadesSnapshot = await firestore.collection("entidade_v3").get();
  const programacaoSnapshot = await firestore
    .collection("programacao_v3")
    .get();
  const visitasSnapshot = await firestore.collection("visitas_v3").get();
  const statusSnapshot = await firestore.collection("list_status_v3").get();

  const entidadesArr = entidadesSnapshot.docs.map((doc) => doc.data());
  const programacaoArr = programacaoSnapshot.docs.map((doc) => doc.data());
  const visitasArr = visitasSnapshot.docs.map((doc) => doc.data());
  const statusArr = statusSnapshot.docs.map((doc) => doc.data());

  console.log("🔄 Iniciando a atualização do Status...");
  console.log(`Total de entidades: ${entidadesArr.length}`);
  console.log(`Total de programações: ${programacaoArr.length}`);
  console.log(`Total de visitas: ${visitasArr.length}`);
  console.log(`Total de status: ${statusArr.length}`);
  console.log("🔄 Iniciando a atualização do Status...");

  return {
    success: true,
    message: "✅ Status atualizado com sucesso. ✅",
  };
};
