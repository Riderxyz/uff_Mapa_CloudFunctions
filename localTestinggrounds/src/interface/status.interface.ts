import { StatusName } from "./enums"

export interface StatusInterface {
  usuario: string
  id_umov: string
  fase_pesquisa: string
  cnpj: string
  data_atualizado: number
  status: StatusName
  id: string
}
