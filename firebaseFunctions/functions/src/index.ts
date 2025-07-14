/* import { onRequest } from "firebase-functions/v2/https"; */
import { initializeApp } from "firebase-admin/app";
import { onSchedule } from "firebase-functions/scheduler";
/* import { atualizandoProgramacao } from "./atualizadores/programacao";
import { atualizandoStatus } from "./atualizadores/status";
import { atualizandoVisitas } from "./atualizadores/visitas";
import { CloudFunctionResponse } from "./interface/cloudFunctionResponse.interface"; */

// Inicializa o Firebase Admin SDK
initializeApp();


export const atualizarDadoFull = onSchedule("0 6-22 * * 1-5", async (event) => {
const funcoesEmOrdem: (() => Promise<CloudFunctionResponse>)[] = [
    atualizandoProgramacao,
    atualizandoVisitas,
    atualizandoStatus,
    atualizandoDashboardData,
  ];

  from(funcoesEmOrdem)
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
    )
    .subscribe({
      complete: () => console.log("🏁 Execução sequencial completa!"),
      error: (err) => console.error("🚨 Erro inesperado:", err),
    });
}
});


