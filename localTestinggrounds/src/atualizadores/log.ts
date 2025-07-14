import * as admin from "firebase-admin";
import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";

export const atualizarLog = async (resultados: CloudFunctionResponse[]): Promise<void> => {
  const firestore = admin.firestore();

  const { sucessos, falhas, erros } = resultados.reduce(
    (acc, res) => {
      if (res.error) {
        acc.erros.push({ type: res.type, message: res.error });
        acc.falhas++;
      } else {
        acc.sucessos++;
      }
      return acc;
    },
    { sucessos: 0, falhas: 0, erros: [] as { type?: string; message: string }[] }
  );

  const status = falhas > 3 ? "falha critica" : falhas > 0 ? "falha parcial" : "ok";

  const logFormatado = {
    atualizadoEm: new Date(),
    status,
    sucessos,
    falhas,
    message: "✅ Sucesso na sincronização dos dados ✅",
    erros,
  };

  try {
    await firestore.collection("log_sincronizacao").doc("1").set(logFormatado, { merge: false });
    console.log("📄 Log de sincronização salvo com sucesso.");
  } catch (e) {
    console.error("🚨 Falha ao salvar log de sincronização:", e);
    throw e; // opcional: para propagar erro se quiser que a Cloud Function falhe
  }
};
