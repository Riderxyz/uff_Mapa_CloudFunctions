
import { Estado, RegiaoBrasilNomeEnum, StatusName, TipoEntidade} from './enums';


export interface EntidadesInterface {
  id_umov: string;
  codigoEntidade:string;
  tipoEntidade: TipoEntidadeInterface[]
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




export interface EnderecoInterface {
  /* endereco: string; */
  bairro: string;
  municipio: string;
  uf: Estado;
  cep: string;
  pais: string;
  regiao: RegiaoBrasilNomeEnum;
  lat: number;
  long: number;
}

export interface FinalizacaoInfo {
  data: string; // formato: dd/MM/yyyy, HH:mm:ss
  status: StatusName;
  usuario: string;
}



export interface TipoEntidadeInterface {
  id: string;
  tipo: TipoEntidade;
}