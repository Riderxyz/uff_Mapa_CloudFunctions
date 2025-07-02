export interface VisitasInterface {
  cnpj: string;
  data_status: string;
  data_visita: string;
  fase_pesquisa: string;
  formulario: string;
  lat: string;
  long: string;
  monitor_1: string;
  monitor_2: string;
  status: VisitasStatus;
  usuario_status: string;
}

export enum VisitasStatus {
  Approved = "Aprovado",
  Rejected = "Reprovado",
  EmAnalise = "Em analise",
  Nulo = ''
}
