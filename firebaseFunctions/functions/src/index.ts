/* import { onRequest } from "firebase-functions/v2/https"; */
import { initializeApp } from "firebase-admin/app";
import { onSchedule } from "firebase-functions/scheduler";
import { atualizandoProgramacao } from "./atualizadores/programacao";
import { atualizandoStatus } from "./atualizadores/status";
import { atualizandoVisitas } from "./atualizadores/visitas";
import { CloudFunctionResponse } from "./interface/cloudFunctionResponse.interface";

// Inicializa o Firebase Admin SDK
initializeApp();

export const atualizarDados = onSchedule("0 */1 * * 1-5", async (event) => {
  const result = await atualizandoProgramacao();
  console.log("Resultado:", result);
});

export const atualizarDadoFull = onSchedule("0 */1 * * 1-5", async (event) => {
  const resultProgramacao: CloudFunctionResponse = await atualizandoProgramacao();
  const resultStatus: CloudFunctionResponse = await atualizandoStatus();
  const resultVisitas: CloudFunctionResponse = await atualizandoVisitas();

  Promise.allSettled([resultProgramacao, resultStatus, resultVisitas]).then(
    (results) => {
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
        }
      });
    }
  );
  console.log("Resultados:", {
    resultProgramacao,
    resultStatus,
    resultVisitas,
  });
});


