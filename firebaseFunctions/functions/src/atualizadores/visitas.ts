import * as admin from "firebase-admin";
import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";
import { FormularioInterface } from "../interface/formulario.interface";

export const atualizandoVisitas = async (): Promise<CloudFunctionResponse> => {
    
    console.log("🔄 Iniciando a atualização da Visitas...");
    
        const firestoreCtrl = admin.firestore();
  try {

getFormularios(firestoreCtrl).then(async (formularios: FormularioInterface[]) => {})

    const response: CloudFunctionResponse = {
      success: true,
      message: "✅ Visitas atualizadas com sucesso. ✅",
    };

    return Promise.resolve(response);
  } catch (error: any) {
    const response: CloudFunctionResponse = {
      success: false,
      message: "❌ Erro ao atualizar visitas. ❌",
      error: error.toString(),
    };
    return Promise.resolve(response);
  }



};

const  getFormularios = (async (firestoreCtrl:admin.firestore.Firestore): Promise<FormularioInterface[]> => {
    try {
      const formulariosRef = firestoreCtrl.collection('formularios');
      const snapshot = await formulariosRef.get();
        const formulariosArr: FormularioInterface[] = [];
      if (snapshot.empty) {
        console.log('Nenhum documento encontrado na coleção formularios');
        return [];
      }



      snapshot.forEach(doc => {
        formulariosArr.push({
          id: doc.id,
          ...doc.data() as Omit<FormularioInterface, 'id'>
        });
      });

      console.log(`Recuperados ${formulariosArr.length} formulários`);
      return formulariosArr;
    } catch (error) {
      console.error('Erro ao recuperar formulários:', error);
      throw error;
    }
  })
