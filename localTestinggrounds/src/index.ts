import admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";
import { readExcelFile } from "./readExcel";
import { excelReadOut } from "./interface/excelReadOut.interface";
import { saveToJson } from "./saveToJson";
import { atualizandoProgramacao } from "./atualizadores/programacao";

// Inicialize o Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require("./importKeys.json")),
});

console.clear();

const formatCNPJ = (cnpj: string): string => cnpj.padStart(14, "0");

atualizandoProgramacao();
//main();
//setAtivoFalse();
//saveToJson();
