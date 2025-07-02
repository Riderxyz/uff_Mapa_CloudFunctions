import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";
import * as admin from "firebase-admin";

export const registrarLogFinal =  (async (results: CloudFunctionResponse[]) => {
    const firestore = admin.firestore();
  const timestamp = new Date().toISOString();

  const logData = {
    timestamp,
    programacao: results[0],
    status: results[1],
    visitas: results[2],
  };

  await firestore.doc("/log_sincronizacao/logdeAtualizacao").set(logData, { merge: true });
});