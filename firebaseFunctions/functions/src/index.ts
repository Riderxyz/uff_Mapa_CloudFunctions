import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";
import * as path from "path";
import { readExcelFile } from "./readExcelFile"; // Implemente esta função para ler o Excel
import { processRegion } from "./processRegion"; // Implemente esta função para processar as regiões
import * as logger from "firebase-functions/logger";
import * as os from "os";
import Busboy from "busboy";
import { onSchedule } from "firebase-functions/scheduler";

// Inicializa o Firebase Admin SDK
initializeApp();


export const atualizarDados = onSchedule('0 */2 * * 1-5', async (event) => {

})
