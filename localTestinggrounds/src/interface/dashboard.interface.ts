import { EntidadesInterface } from './entidade.interface';
import {  RegiaoBrasilNomeEnum } from './enums';

export interface DashboardStats {
  totalEntidades: number;
  entidadesArr: EntidadesInterface[];
  percentualProgramado: number;
  percentualVisitado: number;
  percentualFinalizado: number;
  totalFinalizadas: number;
  totalProgramado: number;
  totalVisitado: number;
  entidadesPorStatus: { status: string; count: number }[];
  percentualPorRegiao:PercentualPorRegiao[];
  monitorPerformance: {
    monitor: string;
    programado: number;
    visitado: number;
    percentual: number;
  }[];
}


export interface PercentualPorRegiao {
    regiao: RegiaoBrasilNomeEnum;
    totalProgramado: number;
    porcentualProgramado: number;
    total:number;
    totalVisitado: number;
    porcentualVisitado: number;
    totalFinalizado: number;
    porcentualFinalizado: number;
}
