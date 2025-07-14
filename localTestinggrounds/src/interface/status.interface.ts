import { StatusNameEnum } from "./enums"

export interface StatusInterface {
  usuarioResponsavel: string
  id_umov: string
  fase_pesquisa: string
  cnpj: string
  data_atualizado: Date
  status: StatusNameEnum
}
