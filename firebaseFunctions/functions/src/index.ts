/* import { onRequest } from "firebase-functions/v2/https"; */
import { initializeApp } from "firebase-admin/app";
import { onSchedule } from "firebase-functions/scheduler";
import { atualizandoProgramacao } from "./atualizadores/programacao";

// Inicializa o Firebase Admin SDK
initializeApp();


export const atualizarDados = onSchedule('0 */1 * * 1-5', async (event) => {
 const result = await atualizandoProgramacao();
    console.log("Resultado:", result);
})
