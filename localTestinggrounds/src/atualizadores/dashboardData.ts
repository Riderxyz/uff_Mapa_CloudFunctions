import { ProgramacaoInterface } from "./../interface/programacao.interface";
import * as admin from "firebase-admin";
import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";
import { combineLatest, from, map } from "rxjs";
import { StatusInterface } from "../interface/status.interface";
import { EntidadesInterface } from "../interface/entidade.interface";
import { VisitasInterface } from "../interface/visitas.interface";
import { RegiaoBrasilNomeEnum, StatusName } from "../interface/enums";
import { DashboardStats, PercentualPorRegiao } from "../interface/dashboard.interface";
interface StatusGroup {
  status: StatusName;
  count: number;
}


interface MonitorPerformance {
  monitor: string;
  programado: number;
  visitado: number;
  percentual: number;
}

export const atualizandoDashboardData =
  async (): Promise<CloudFunctionResponse> => {
    try {
      console.log("🔄 Iniciando a atualização do Dashboard Data...");

      const firestore = admin.firestore();
      const dashboardDataRef = firestore.collection("dashboard_data");
      const entidadesSnapshot = from(firestore.collection("entidade_v3").get());
      const programacaoSnapshot = from(
        firestore
          .collection("programacao_v3")
          .where("fase_pesquisa", "==", "2025-2")
          .get()
      );
      const visitasSnapshot = from(
        firestore
          .collection("visitas_v3")
          .where("fase_pesquisa", "==", "2025-2")
          .get()
      );
      const statusSnapshot = from(firestore.collection("list_status_v3").get());
      programacaoSnapshot.forEach((doc) => {
        const data = doc;
        console.log(data.docs[0].data());
      });

      const stats$ = combineLatest([
        entidadesSnapshot,
        programacaoSnapshot,
        visitasSnapshot,
        statusSnapshot,
      ]).pipe(
        map(
          ([
            entidadesSnapshotResponse,
            programacoesSnapshotResponse,
            visitasSnapshotResponse,
            statusListSnapshotResponse,
          ]) => {
            console.log("📊 Dados combinados:");
            console.log("Entidades:", entidadesSnapshotResponse.size);
            console.log("Programações:", programacoesSnapshotResponse.size);
            console.log("Visitas:", visitasSnapshotResponse.size);
            console.log("Status:", statusListSnapshotResponse.size);

            const entidadesArr: EntidadesInterface[] =
              entidadesSnapshotResponse.docs.map(
                (doc) => doc.data() as EntidadesInterface
              );

            const programacoesArr: ProgramacaoInterface[] =
              programacoesSnapshotResponse.docs.map(
                (doc) => doc.data() as ProgramacaoInterface // Ajuste o tipo conforme necessário
              );
            const visitasArr: VisitasInterface[] =
              visitasSnapshotResponse.docs.map(
                (doc) => doc.data() as VisitasInterface // Ajuste o tipo conforme necessário
              );

            const statusArr: StatusInterface[] =
              statusListSnapshotResponse.docs.map(
                (doc) => doc.data() as StatusInterface
              );

            const statusMap = mapearStatusPorCnpj(statusArr);

            const metrics = calculateAllMetrics(entidadesArr, visitasArr);
            const percentualPorRegiao =
              calcularPercentualPorRegiao(entidadesArr);
              const monitorPerformance = calcularPerformancePorMonitor(
                programacoesArr, visitasArr
              )

              const retorno = {
              entidadesArr,
              ...metrics,
              entidadesPorStatus: agruparEntidadesPorStatus(entidadesArr),
              percentualPorRegiao,
              monitorPerformance,
            };
            JSON.stringify(retorno, null, 2);
            JSON.stringify(retorno, null, 2);return  retorno;
          }
        )
      );
      stats$.subscribe((stats: DashboardStats) => {
        console.log(stats);
      });
      return {
        success: true,
        message: "✅ Dashboard Data atualizado com sucesso. ✅",
      };
    } catch (error: any) {
      console.error("Erro ao atualizar Dashboard Data:", error);
      return {
        success: false,
        message: "❌ Erro ao atualizar Dashboard Data. ❌",
        error: error.toString(),
      };
    }
  };

const mapearStatusPorCnpj = (
  statusList: StatusInterface[]
): Map<string, StatusInterface> => {
  const statusMap = new Map<string, StatusInterface>();

  statusList.forEach((status) => {
    const { cnpj, data_atualizado } = status;
    const dataAtual = new Date(data_atualizado);
    const statusExistente = statusMap.get(cnpj);

    if (
      !statusExistente ||
      dataAtual > new Date(statusExistente.data_atualizado)
    ) {
      statusMap.set(cnpj, status);
    }
  });

  return statusMap;
};

const calcularPercentual = (parcial: number, total: number): number => {
  return total > 0 ? Math.round((parcial / total) * 100) : 0;
};

const calculateAllMetrics = (
  entidades: EntidadesInterface[],
  visitas: VisitasInterface[]
): {
  totalEntidades: number;
  totalProgramado: number;
  totalVisitado: number;
  totalFinalizadas: number;
  percentualProgramado: number;
  percentualVisitado: number;
  percentualFinalizado: number;
} => {
  const totalEntidades = entidades.length;
  let totalProgramado = 0;
  let totalFinalizadas = 0;
  let totalVisitado = visitas.length - 1;
  // Single pass through entities for better performance
  entidades.forEach((entidade) => {
    const status = entidade.status_atual?.toLowerCase();

    if (status === StatusName.Programado.toLowerCase()) {
      totalProgramado++;
    }

    if (status === StatusName.Aprovado.toLowerCase()) {
      totalFinalizadas++;
    }
  });

  totalProgramado = totalProgramado + totalVisitado;
  totalFinalizadas = totalFinalizadas + 1;
  return {
    totalEntidades,
    totalProgramado,
    totalVisitado,
    totalFinalizadas,
    percentualProgramado: calcularPercentual(totalProgramado, totalEntidades),
    percentualVisitado: calcularPercentual(totalVisitado, totalEntidades),
    percentualFinalizado: calcularPercentual(totalFinalizadas, totalEntidades),
  };
};

const calcularPercentualPorRegiao = (
  entidades: EntidadesInterface[]
): PercentualPorRegiao[] => {
  const regiaoMap = new Map<
    string,
    {
      programado: number;
      visitado: number;
      finalizado: number;
      total: number;
    }
  >();

  // Single pass through entities
  entidades.forEach((entidade) => {
    const { regiao, status_atual } = entidade;
    const statusLower = status_atual?.toLowerCase();

    const dadosRegiao = regiaoMap.get(regiao) || {
      programado: 0,
      visitado: 0,
      finalizado: 0,
      total: 0,
    };

    dadosRegiao.total++;

    switch (statusLower) {
      case StatusName.Programado.toLowerCase():
        dadosRegiao.programado++;
        break;
      case StatusName.EmVisita.toLowerCase():
        dadosRegiao.visitado++;
        break;
      case StatusName.Aprovado.toLowerCase():
        dadosRegiao.finalizado++;
        break;
    }

    regiaoMap.set(regiao, dadosRegiao);
  });

  return Array.from(regiaoMap.entries()).map(([regiao, dados]) => ({
    regiao: regiao as RegiaoBrasilNomeEnum,
    total: dados.total,
    totalFinalizado: dados.finalizado,
    totalProgramado: dados.programado,
    totalVisitado: dados.visitado,
    porcentualProgramado: calcularPercentual(dados.programado, dados.total),
    porcentualVisitado: calcularPercentual(dados.visitado, dados.total),
    porcentualFinalizado: calcularPercentual(dados.finalizado, dados.total),
  }));
};

const calcularPerformancePorMonitor = (
  programacoes: ProgramacaoInterface[],
  visitas: VisitasInterface[]
): MonitorPerformance[] => {
    const monitorMap = new Map<
      string,
      { programado: number; visitado: number }
    >();

    const updateMonitorCount = (
      monitor: string,
      type: 'programado' | 'visitado'
    ) => {
      if (!monitor) return;

      const dados = monitorMap.get(monitor) || { programado: 0, visitado: 0 };
      dados[type]++;
      monitorMap.set(monitor, dados);
    };

    // Process programacoes
    programacoes.forEach((p) => {
      updateMonitorCount(p.monitor_1, 'programado');
      updateMonitorCount(p.monitor_2, 'programado');
    });

    // Process visitas
    visitas.forEach((v) => {
      updateMonitorCount(v.monitor_1, 'visitado');
      updateMonitorCount(v.monitor_2, 'visitado');
    });

    return Array.from(monitorMap.entries()).map(([monitor, dados]) => ({
      monitor,
      programado: dados.programado,
      visitado: dados.visitado,
      percentual: calcularPercentual(dados.visitado, dados.programado),
    }));
}

const agruparEntidadesPorStatus = (
  entidades: EntidadesInterface[]
): StatusGroup[] => {
  const contagem = new Map<string, number>();

  entidades.forEach((entidade) => {
    const status = entidade.status_atual;
    contagem.set(status, (contagem.get(status) || 0) + 1);
  });

  return Array.from(contagem.entries()).map(([status, count]) => ({
    status: status as StatusName,
    count,
  }));
};



const salvarDashboardData = async (
  visitas: VisitasInterface[],
  firestore: FirebaseFirestore.Firestore
): Promise<void> => {
  const batch = firestore.batch();
  const collectionRef = firestore.collection("dashboard_data");

  for (const visita of visitas) {
    const docRef = collectionRef.doc(visita.cnpj);
    batch.set(docRef, visita, { merge: true });
  }

  await batch.commit();
  console.log(`✅ Salvos ${visitas.length} registros`);
};

const limparDashboardDataAntigo = async (
  firestore: FirebaseFirestore.Firestore,
  novosIds: string[]
): Promise<void> => {
  const snapshot = await firestore.collection("dashboard_data").get();
  const antigos = snapshot.docs.filter((doc) => !novosIds.includes(doc.id));
  const batch = firestore.batch();
  antigos.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`🧹 Removidos ${antigos.length} registros antigos`);
};
