export interface ProgramacaoInterface {
    id_umov: string;
  cnpj: string;
  data_programacao: Date;
  usuarioResponsavel: string;
  fase_pesquisa: string;
  formularios: string[];
  id: string;
  lat: number;
  long: number;
  monitor_1: string;
  monitor_2: string;
}
