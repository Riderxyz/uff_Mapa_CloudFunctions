import * as admin from "firebase-admin";
import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";
import { FormularioInterface } from "../interface/formulario.interface";
import axios from "axios";
import { from, lastValueFrom } from "rxjs";
import { KoboResponseInterface } from "../interface/koboResponse.interface";
import { VisitasInterface } from "../interface/visitas.interface";

export const atualizandoVisitas = async (): Promise<CloudFunctionResponse> => {
  console.log("🔄 Iniciando a atualização da Visitas...");

  const firestoreCtrl = admin.firestore();
  try {
    const formulariosArr = await getFormularios(firestoreCtrl);
    const baseUrl: string = "https://kf.kobotoolbox.org/api/v2/assets";
    const urlForToken = "https://kf.kobotoolbox.org/token/?format=json";
    const token: string = await getToken(urlForToken);
    formulariosArr.forEach((formulario) => {
      console.log(`Atualizando visitas para o formulário: ${formulario.nome}`);
      const urlFormularios = `${baseUrl}/${formulario.assetid}/data.json`;

      const headers = {
        Authorization: `Token ${token}`,
      };

      axios
        .get(urlFormularios, {
          headers: headers,
        })
        .then((response) => {
          console.log(response.data.count);
          const koboResponse: KoboResponseInterface = response.data;
          if (koboResponse.count > 3) {
            console.log(koboResponse.results[120]);
          }
          if (koboResponse.count > 0) {
            koboResponse.results.forEach((item) => {
              var latlong = ["0", "0"];
              if (item["start-geopoint"] == undefined) {
                latlong = ["0", "0"];
              } else {
                var latlong = item["start-geopoint"].split(" ");
              }
              const [ano, mes, dia] = item["group_identificacao/data_visita"]
                .split("-")
                .map(Number);
              const data_visita = new Date(ano, mes - 1, dia).getTime();
              const status: any = {};
              /*   if (item['_validation_status'] !== undefined &&
                Object.keys(item['_validation_status']).length > 0 &&
                item['_validation_status']['label']) {
                var st = '';
                switch (item['_validation_status']['label']) {
                  case 'Approved':
                    st = 'Aprovado';
                    break;
                  case 'Rejected':
                    st = 'Reprovado';
                    break;
                  default:
                    st = 'Em analise';
                }

                status = {
                  data: this.util.timestampToDate(item['_validation_status']['timestamp']),
                  usuario: item['_validation_status']['by_whom'],
                  status: st,
                };
              } else {
                status = {
                  data: '',
                  usuario: '',
                  status: '',
                };
              } */
              /* var visita: VisitasInterface = {
                cnpj: item["group_dados_entidade/cnpj"],
                // data: item['start'],
                fase_pesquisa: "2025-2",
                data_visita: data_visita.toString(),
                formulario: formulario.assetid || "",
                
                monitor_1: item["group_identificacao/monitor_responsavel_1"],
                monitor_2: item["group_identificacao/monitor_responsavel_2"],
                lat: latlong[0],
                long: latlong[1],
              }; */
            });
          }
        })
        .catch((error) => {
          console.error(error);
        });
    });
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

const getToken = async (url: string): Promise<string> => {
  const username = "uff_niteroi";
  const pass = "@0yUhv86rdgNib&5";
  const authHeader =
    "Basic " + Buffer.from(`${username}:${pass}`).toString("base64");
  try {
    const response = await lastValueFrom(
      from(
        axios.post(
          url,
          {},
          {
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/json",
            },
          }
        )
      )
    );

    // Retorne os dados da resposta
    //this.token = response.data.token;
    return response.data.token;
  } catch (error) {
    console.error("Erro ao chamar o endpoint:", error);
    throw error;
  }
};

const getFormularios = async (
  firestoreCtrl: admin.firestore.Firestore
): Promise<FormularioInterface[]> => {
  try {
    const formulariosRef = firestoreCtrl.collection("formularios");
    const snapshot = await formulariosRef.get();
    const formulariosArr: FormularioInterface[] = [];
    if (snapshot.empty) {
      console.log("Nenhum documento encontrado na coleção formularios");
      return [];
    }

    snapshot.forEach((doc) => {
      formulariosArr.push({
        id: doc.id,
        ...(doc.data() as Omit<FormularioInterface, "id">),
      });
    });

    console.log(`Recuperados ${formulariosArr.length} formulários`);
    return formulariosArr;
  } catch (error) {
    console.error("Erro ao recuperar formulários:", error);
    throw error;
  }
};
