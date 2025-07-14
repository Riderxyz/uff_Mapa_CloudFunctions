export interface VisitasInterface {
  cnpj: string;
  data_status: Date;
  data_visita: Date;
  fase_pesquisa: string;
  formulario: string;
  lat: string;
  long: string;
  monitor_1: string;
  monitor_2: string;
  status: VisitasStatus;
  usuarioResponsavel: string;
}

export enum VisitasStatus {
  Approved = "Aprovado",
  Rejected = "Reprovado",
  EmAnalise = "Em analise",
  Nulo = ''
}
