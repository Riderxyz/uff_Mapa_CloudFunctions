/* import { onRequest } from "firebase-functions/v2/https"; */
import { initializeApp } from "firebase-admin/app";
import { onSchedule } from "firebase-functions/scheduler";
import { CloudFunctionResponse } from "./interface/cloudFunctionResponse.interface";
import { atualizandoProgramacao } from "./atualizadores/programacao";
import { atualizandoVisitas } from "./atualizadores/visitas";
import { atualizandoStatus } from "./atualizadores/status";
import { atualizandoDashboardData } from "./atualizadores/dashboardData";
import { from, concatMap, toArray, tap, switchMap } from "rxjs";
import { atualizarLog } from "./atualizadores/logDeSincronizacao";


// Inicializa o Firebase Admin SDK
initializeApp();


export const atualizarDadoFull = onSchedule("0 6-22 * * 1-5", async (event) => {

  console.log("🔄 Iniciando a atualização completa...");
  const funcoesEmOrdem: (() => Promise<CloudFunctionResponse>)[] = [
    atualizandoProgramacao,
    atualizandoVisitas,
    atualizandoStatus,
    atualizandoDashboardData,
  ];
  return from(funcoesEmOrdem)
    .pipe(
      concatMap((fn) => from(fn())),
      toArray(),
      tap((resultados: CloudFunctionResponse[]) => {
        const total = resultados.length;
        const sucesso = resultados.filter((r) => r.success).length;
        const falhas = total - sucesso;

        console.log(`✅ Sucesso: ${sucesso}, ❌ Falhas: ${falhas}`);
        if (sucesso === total) {
          console.log("🟢 Todas as funções executadas com sucesso!");
        } else if (falhas === total) {
          console.log("🔴 Todas falharam!");
        } else {
          console.log("🟡 Algumas funções falharam...");
        }

        // Dispara log final
      }),
      switchMap((resultados) => atualizarLog(resultados))
    ).toPromise();
});


