
import { EstadoEnum, RegiaoBrasilNomeEnum, StatusNameEnum, TipoEntidadeEnum} from './enums';


export interface EntidadesInterface {
  id_umov: string;
  codigoEntidade:string;
  numeroContrato: string;
  tipoEntidade: TipoEntidadeInterface[]
  nome: string;
  cnpj: string;
  email: string[];
  telefone: string[];
  vagas: VagasInterface;
  endereco: EnderecoInterface;
  status_atual: StatusNameEnum;
  status_atual_data: Date;
  fase_pesquisa: string[]; // Você pode considerar um Enum se forem poucas opções fixas
  finalizada?: FinalizacaoInfo;
  googleLink?: string;

}




export interface EnderecoInterface {
  /* endereco: string; */
  bairro: string;
  rua: string;
  complemento: string;
  municipio: string;
  uf: EstadoEnum;
  cep: string;
  pais: string;
  regiao: RegiaoBrasilNomeEnum;
  lat: number;
  long: number;
}

export interface VagasInterface {
  total: number;
vagasMasculinas: number;
vagasFemininas: number;
vagasMaeNutriz: number;
}

export interface FinalizacaoInfo {
  data: Date; // formato: dd/MM/yyyy, HH:mm:ss
  status: StatusNameEnum;
  usuario: string;
}



export interface TipoEntidadeInterface {
  id: string;
  tipo: TipoEntidadeEnum;
}