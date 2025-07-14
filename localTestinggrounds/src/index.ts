import admin from "firebase-admin";
import { atualizandoProgramacao } from "./atualizadores/programacao";
import { atualizandoVisitas } from "./atualizadores/visitas";
import { atualizandoDashboardData } from "./atualizadores/dashboardData";
import { atualizandoStatus } from "./atualizadores/status";
import { testeKobo } from "./atualizadores/testeKobo.service";
import { repopular } from "./repopular";
import { CloudFunctionResponse } from "./interface/cloudFunctionResponse.interface";
import { concatMap, from, switchMap, tap, toArray } from "rxjs";
import { atualizarLog } from "./atualizadores/log";

// Inicialize o Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require("./painelDevKeys.json")),
});

console.clear();

const formatCNPJ = (cnpj: string): string => cnpj.padStart(14, "0");

const rodar = false;

if (rodar) {
  repopular();
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
//atualizandoProgramacao();
//atualizandoVisitas()
//atualizandoStatus();
//atualizandoDashboardData();
//repopular()

const emails = [
  "samio.mendes@mds.gov.br",
  "diego.monte@mds.gov.br",
  "gilson.sousa@mds.gov.br",
  "gedalias.carvalho@mds.gov.br",
  "viviane.figueiredo@mds.gov.br",
  "osmar.torres@mds.gov.br",
  "estevao.sousa@mds.gov.br",
  "heloise.andrade@mds.gov.br",
  "janaina.mendes@mds.gov.br",
  "aldogeografi@gmail.com",
  "doutorbatalha@gmail.com",
  "luizfelipemmenezes@gmail.com",
  "marlonwulong@gmail.com",
  "jessicaraposa@id.uff.br",
  "acrm40@gmail.com",
  "cebas.suporte.ti@gmail.com",
  "joiceazeredo@id.uff.br",
  "claudiavpimentel@gmail.com",
  "elaine.batalha@projetosuff.com.br",
  "pamela.batista@projetosuff.com.br",
  "reinaldoazevedo1@yahoo.com.br",
  "rfully@kedosauditoria.com.br",
  "jasperazevedo034@gmail.com",
  "clourencosousa@gmail.com",
  "rafaelazevedo1@gmail.com",
  "carlasabrina1@yahoo.com.br",
  "nilton.jacintho@gmail.com",
];

const resetUsers = async () => {
  for (const email of emails) {
    try {
      // Tenta obter o usuário
      const user = await admin.auth().getUserByEmail(email);

      // Deleta o usuário existente
      await admin.auth().deleteUser(user.uid);
      console.log(`🗑️ Usuário deletado: ${email}`);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        console.log(`ℹ️ Usuário não existe: ${email}`);
      } else {
        console.error(`❌ Erro ao deletar ${email}:`, err.message);
        continue; // Pula para o próximo em caso de erro não esperado
      }
    }

    // Cria o usuário com a senha padrão
    try {
      await admin.auth().createUser({
        email: email,
        password: "123456",
      });
      console.log(`✅ Usuário recriado: ${email}`);
    } catch (err: any) {
      console.error(`❌ Erro ao criar ${email}:`, err.message);
    }
  }
};

//resetUsers();

//testeKobo();
/* 

setTimeout(() => {
  repopular();
}, 3000);
 */
