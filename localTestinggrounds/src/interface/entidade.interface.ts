
import { Estado, RegiaoBrasilNomeEnum, StatusName} from './enums';


export interface EntidadesInterface {
  id_umov: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  vagas: number;
  endereco: string;
  bairro: string;
  municipio: string;
  uf: Estado;
  regiao: RegiaoBrasilNomeEnum;
  cep: string;
  lat: number;
  long: number;
  status_atual: StatusName;
  status_atual_data: number;
  fase_pesquisa: string[]; // Você pode considerar um Enum se forem poucas opções fixas
  finalizada?: FinalizacaoInfo;
}

export interface FinalizacaoInfo {
  data: string; // formato: dd/MM/yyyy, HH:mm:ss
  status: StatusName;
  usuario: string;
}


