import * as admin from "firebase-admin";
import { combineLatest, from, map } from "rxjs";
import { lastValueFrom } from "rxjs";

import { CloudFunctionResponse } from "../interface/cloudFunctionResponse.interface";
import { EntidadesInterface } from "../interface/entidade.interface";
import { ProgramacaoInterface } from "../interface/programacao.interface";
import { VisitasInterface } from "../interface/visitas.interface";
import { StatusInterface } from "../interface/status.interface";
import {
  DashboardStats,
  PercentualPorRegiao,
} from "../interface/dashboard.interface";
import { StatusNameEnum, RegiaoBrasilNomeEnum } from "../interface/enums";
import { v4 as uuidv4 } from "uuid";
interface StatusGroup {
  status: StatusNameEnum;
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

      const entidades$ = from(firestore.collection("entidades_v1").get());
      const programacoes$ = from(
        firestore
          .collection("programacao_v1")
          .where("fase_pesquisa", "==", "2025-2")
          .get()
      );
      const visitas$ = from(
        firestore
          .collection("visitas_v1")
          .where("fase_pesquisa", "==", "2025-2")
          .get()
      );
      const status$ = from(firestore.collection("list_status_v3").get());

      const stats$ = combineLatest([
        entidades$,
        programacoes$,
        visitas$,
        status$,
      ]).pipe(
        map(([entidadesSnap, programacoesSnap, visitasSnap, statusSnap]) => {
          const entidadesArr = entidadesSnap.docs.map(
            (doc) => doc.data() as EntidadesInterface
          );
          const programacoesArr = programacoesSnap.docs.map(
            (doc) => doc.data() as ProgramacaoInterface
          );
          const visitasArr = visitasSnap.docs.map(
            (doc) => doc.data() as VisitasInterface
          );
          const statusArr = statusSnap.docs.map(
            (doc) => doc.data() as StatusInterface
          );

          const statusMap = mapearStatusPorCnpj(statusArr);
          const metrics = calculateAllMetrics(entidadesArr, visitasArr);
          const percentualPorRegiao = calcularPercentualPorRegiao(entidadesArr);
          const monitorPerformance = calcularPerformancePorMonitor(
            programacoesArr,
            visitasArr
          );
          const entidadesPorStatus = agruparEntidadesPorStatus(entidadesArr);

          return {
            ...metrics,
            percentualPorRegiao,
            monitorPerformance,
            entidadesPorStatus,
          } as DashboardStats;
        })
      );

      const finalStats = await lastValueFrom(stats$);

    /*   stats$.subscribe((res) => {
        console.log(res);
      }); */
      //await salvarDashboardData(finalStats, firestore);
      //     await limparEntidadesSubcolecao(firestore, finalStats.entidadesArr.map(e => e.cnpj));

    return {
        success: true,
        message: "✅ Dashboard Data atualizado com sucesso. ✅",
      };
    } catch (error: any) {
      console.error("❌ Erro ao atualizar Dashboard Data:", error);
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
) => {
  const totalEntidades = entidades.length;
  let totalProgramado = 0;
  let totalFinalizadas = 0;
  const totalVisitado = visitas.length;

  entidades.forEach((entidade) => {
    const status = entidade.status_atual?.toLowerCase();
    if (status === StatusNameEnum.Programado.toLowerCase()) {
      totalProgramado++;
    }
    if (status === StatusNameEnum.Aprovado.toLowerCase()) {
      totalFinalizadas++;
    }
  });

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
    { programado: number; visitado: number; finalizado: number; total: number }
  >();

  for (let i = 0; i < entidades.length; i++) {
    const element = entidades[i];
    const status_atual = element.status_atual;
    const regiao = element.endereco.regiao;
    const dados = regiaoMap.get(regiao) || {
      programado: 0,
      visitado: 0,
      finalizado: 0,
      total: 0,
    };
    dados.total++;

    if (
      status_atual?.toLowerCase() === StatusNameEnum.Programado.toLowerCase()
    ) {
      dados.programado++;
    } else if (
      status_atual?.toLowerCase() === StatusNameEnum.EmVisita.toLowerCase()
    ) {
      dados.visitado++;
    } else if (
      status_atual?.toLowerCase() === StatusNameEnum.EmAnalise.toLowerCase()
    ) {
      dados.visitado++;
    } else if (
      status_atual?.toLowerCase() === StatusNameEnum.Aprovado.toLowerCase()
    ) {
      dados.finalizado++;
    }
    regiaoMap.set(regiao, dados);
    if (i === entidades.length - 1) {
      console.log("regiaoMap", regiaoMap);
    }
  }

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
    tipo: "programado" | "visitado"
  ) => {
    if (!monitor) return;
    const dados = monitorMap.get(monitor) || { programado: 0, visitado: 0 };
    dados[tipo]++;
    monitorMap.set(monitor, dados);
  };

  programacoes.forEach((p) => {
    updateMonitorCount(p.monitor_1, "programado");
    updateMonitorCount(p.monitor_2, "programado");
  });

  visitas.forEach((v) => {
    updateMonitorCount(v.monitor_1, "visitado");
    updateMonitorCount(v.monitor_2, "visitado");
  });

  return Array.from(monitorMap.entries()).map(([monitor, dados]) => ({
    monitor,
    programado: dados.programado,
    visitado: dados.visitado,
    percentual: calcularPercentual(dados.visitado, dados.programado),
  }));
};

const agruparEntidadesPorStatus = (
  entidades: EntidadesInterface[]
): StatusGroup[] => {
  const contagem = new Map<string, number>();
  entidades.forEach((entidade) => {
    const status = entidade.status_atual;
    contagem.set(status, (contagem.get(status) || 0) + 1);
  });

  return Array.from(contagem.entries()).map(([status, count]) => ({
    status: status as StatusNameEnum,
    count,
  }));
};

const salvarDashboardData = async (
  dashboardData: DashboardStats,
  firestore: FirebaseFirestore.Firestore
): Promise<void> => {
  const summaryRef = firestore
    .collection("dashboard_data")
    .doc("dashboardLatestData");
  const entidadesRef = summaryRef.collection("entidades");

  await summaryRef.set(
    {
      totalEntidades: dashboardData.totalEntidades,
      totalProgramado: dashboardData.totalProgramado,
      totalVisitado: dashboardData.totalVisitado,
      totalFinalizadas: dashboardData.totalFinalizadas,
      percentualProgramado: dashboardData.percentualProgramado,
      percentualVisitado: dashboardData.percentualVisitado,
      percentualFinalizado: dashboardData.percentualFinalizado,
      percentualPorRegiao: dashboardData.percentualPorRegiao,
      monitorPerformance: dashboardData.monitorPerformance,
      entidadesPorStatus: dashboardData.entidadesPorStatus,
    },
    { merge: true }
  );

  const batch = firestore.batch();
  await batch.commit();
};

const limparEntidadesSubcolecao = async (
  firestore: FirebaseFirestore.Firestore,
  novosIds: string[]
): Promise<void> => {};
