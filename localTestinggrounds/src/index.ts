import admin from "firebase-admin";
import { atualizandoProgramacao } from "./atualizadores/programacao";
import { atualizandoVisitas } from "./atualizadores/visitas";
import { atualizandoDashboardData } from "./atualizadores/dashboardData";
import { atualizandoStatus } from "./atualizadores/status";
import { testeKobo } from "./atualizadores/testeKobo.service";
import { repopular } from "./repopular";

// Inicialize o Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require("./importKeys.json")),
});

console.clear();

const formatCNPJ = (cnpj: string): string => cnpj.padStart(14, "0");

//atualizandoProgramacao();
//atualizandoVisitas()
//testeKobo();
repopular();
