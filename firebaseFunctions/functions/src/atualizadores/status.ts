import { from, of, forkJoin } from "rxjs";
import {
  catchError,
  map,
  mergeMap,
  toArray,
  bufferCount,
  tap,
} from "rxjs/operators";
import * as admin from "firebase-admin";
import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";
import { EntidadesInterface } from "../interface/entidade.interface";
import { ProgramacaoInterface } from "../interface/programacao.interface";
import {
  VisitasInterface,
  VisitasStatus,
} from "../interface/visitas.interface";
import { StatusInterface } from "../interface/status.interface";
import { CloudFunctionResponseType, StatusNameEnum } from "../interface/enums";

export const atualizandoStatus = async (): Promise<CloudFunctionResponse> => {
  const firestore = admin.firestore();
  const BATCH_SIZE = 500;
  console.clear();
  console.log("🔄 Iniciando a atualização da Status...");
  try {
    const collections$ = forkJoin({
      entidades: from(firestore.collection("entidades_v1").get()),
      programacoes: from(firestore.collection("programacao_v1").get()),
      visitas: from(firestore.collection("visitas_v1").get()),
      status: from(firestore.collection("list_status_v1").get()),
    });

    const snapshots = await collections$.toPromise();

    const entidadesArr = snapshots!.entidades.docs.map(
      (doc) => doc.data() as EntidadesInterface
    );
    const programacaoArr = snapshots!.programacoes.docs.map(
      (doc) => doc.data() as ProgramacaoInterface
    );
    const visitasArr = snapshots!.visitas.docs.map(
      (doc) => doc.data() as VisitasInterface
    );

    const rxjsPipeline = from(entidadesArr).pipe(
      map((entidade) => {
        let currrentStatus: StatusNameEnum = StatusNameEnum.Cadastrado;
        let currentResponsavel = "Servidor";

        const programacao = programacaoArr.find(
          (p) => p.cnpj === entidade.cnpj
        );
        const visita = visitasArr.find((v) => v.cnpj === entidade.cnpj);

        if (programacao) {
          currrentStatus = StatusNameEnum.Programado;
          const dataVisita: string = (programacao.data_programacao as any)
            .toDate()
            .toISOString()
            .split("T")[0];
          const hoje: string = new Date().toISOString().split("T")[0];

          if (dataVisita === hoje) {
            currrentStatus = StatusNameEnum.EmVisita;
            currentResponsavel = programacao.usuarioResponsavel;
          }
        }
        if (visita) {
          if (visita.status === VisitasStatus.EmAnalise) {
            currrentStatus = StatusNameEnum.EmAnalise;
            currentResponsavel = visita.usuarioResponsavel;
          } else if (visita.status === VisitasStatus.Approved) {
            currrentStatus = StatusNameEnum.Aprovado;
            currentResponsavel = visita.usuarioResponsavel;
          }
        }
        return {
          cnpj: entidade.cnpj,
          status: currrentStatus,
          data_atualizado: new Date(),
          id_umov: entidade.id_umov,
          fase_pesquisa: "2025-2",
          usuarioResponsavel: currentResponsavel,
        } as StatusInterface;
      }),
      toArray(),
      mergeMap((statusFormattedArr) =>
        from(statusFormattedArr).pipe(
          bufferCount(BATCH_SIZE),
          mergeMap((batchGroup, i) => {
            const listaStatusBatch = firestore.batch();
            const entidadesBatch = firestore.batch();
            batchGroup.forEach((status) => {
              const cnpjKey = status.cnpj.replace(/[^\d]/g, "");
              const listaStatusRef = firestore
                .collection("list_status_v1")
                .doc(cnpjKey);
              const entidadeRef = firestore
                .collection("entidades_v1")
                .doc(cnpjKey);

              let partialEntidade: Partial<EntidadesInterface> = {};
              if (status.status === StatusNameEnum.Aprovado) {
                partialEntidade = {
                  status_atual: status.status,
                  status_atual_data: status.data_atualizado,
                  finalizada: {
                    data: status.data_atualizado,
                    status: status.status,
                    usuario: status.usuarioResponsavel,
                  },
                };
              } else {
                partialEntidade = {
                  status_atual: status.status,
                  status_atual_data: status.data_atualizado,
                };
              }
              listaStatusBatch.set(listaStatusRef, status);
              entidadesBatch.update(entidadeRef, partialEntidade);
            });
            return forkJoin([
              from(listaStatusBatch.commit()),
              from(entidadesBatch.commit()),
            ]).pipe(
              tap(() =>
                console.log(
                  `✅ Batch ${i + 1} enviado com ${batchGroup.length} entidades`
                )
              )
            );
          })
        )
      ),
      toArray(),
      map(
        (): CloudFunctionResponse => ({
          success: true,
          type: CloudFunctionResponseType.Status,
          message: "✅ Status atualizado com sucesso. ✅",
        })
      ),
      catchError((error: any) => {
        console.error("❌ Erro ao atualizar status:", error);
        return of({
          success: false,
          type: CloudFunctionResponseType.Status,
          message: "Erro ao atualizar status.",
          error: error.message ?? String(error),
        } as CloudFunctionResponse);
      })
    );
    const result = await rxjsPipeline.toPromise();
    return (
      result ?? {
        success: false,
        type: CloudFunctionResponseType.Status,
        message: "Erro inesperado: resultado indefinido.",
        error: "O pipeline RxJS retornou undefined.",
      }
    );
  } catch (error: any) {
    console.error("❌ Erro geral:", error);
    return {
      success: false,
      type: CloudFunctionResponseType.Status,
      message: "Erro inesperado na execução da Cloud Function.",
      error: error.message ?? String(error),
    };
  }
};
