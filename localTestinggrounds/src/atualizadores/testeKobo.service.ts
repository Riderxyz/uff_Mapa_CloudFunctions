import * as admin from "firebase-admin";
import axios from "axios";
import { KoboResponseInterface } from "../interface/koboResponse.interface";
import { FormularioInterface } from "../interface/formulario.interface";
export const testeKobo = async (): Promise<void> => {
  console.log("🚀 Iniciando o teste do Kobo...");
  const firestore = admin.firestore();
  const formulariosArr = await getFormularios(firestore);
  const token = await getToken("https://kf.kobotoolbox.org/token/?format=json");

  try {
    for (let i = 0; i < formulariosArr.length; i++) {
      const element = formulariosArr[i];

      const url = `https://kf.kobotoolbox.org/api/v2/assets/${element.assetid}/data.json`;
      const response = await axios.get<KoboResponseInterface>(url, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      /*           response.data.results.forEach((item) => {
               console.log("Item recebido:", item);
             }); */
/*       console.warn(response.data.results[2]); */
      const termo = "Rejected"; // o termo a buscar
  const resultados = response.data.results.filter(item => contemSubstring(item, termo));

  console.log(`🔍 Resultados encontrados para "${termo}":`, resultados.length);
  
    }


    const resultado = await new Promise((resolve) => {
      setTimeout(() => {
        resolve("Teste do Kobo concluído com sucesso!");
      }, 2000);
    });

    console.log(resultado);
  } catch (error) {
    console.error("❌ Erro durante o teste do Kobo:", error);
  }
};

const getToken = async (url: string): Promise<string> => {
  const username = "uff_niteroi";
  const pass = "@0yUhv86rdgNib&5";
  const authHeader =
    "Basic " + Buffer.from(`${username}:${pass}`).toString("base64");

    console.log(authHeader);
    
  const response = await axios.post(
    url,
    {},
    {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.token;
};

const getFormularios = async (
  firestoreCtrl: admin.firestore.Firestore
): Promise<FormularioInterface[]> => {
  const snapshot = await firestoreCtrl.collection("formularios").get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<FormularioInterface, "id">),
  }));
};


const contemSubstring = ((obj: any, termo: string): boolean => {
  if (typeof obj === 'string') {
    return obj.toLowerCase().includes(termo.toLowerCase());
  }

  if (Array.isArray(obj)) {
    return obj.some(item => contemSubstring(item, termo));
  }

  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).some(valor => contemSubstring(valor, termo));
  }

  return false;
})