export enum Estado {
  AC = "AC",
  AL = "AL",
  AM = "AM",
  AP = "AP",
  BA = "BA",
  CE = "CE",
  DF = "DF",
  ES = "ES",
  GO = "GO",
  MA = "MA",
  MG = "MG",
  MS = "MS",
  MT = "MT",
  PA = "PA",
  PB = "PB",
  PE = "PE",
  PI = "PI",
  PR = "PR",
  RJ = "RJ",
  RN = "RN",
  RO = "RO",
  RR = "RR",
  RS = "RS",
  SC = "SC",
  SE = "SE",
  SP = "SP",
  TO = "TO",
  Null = "",
}

export enum RegiaoBrasilNomeEnum {
  Norte = "Norte",
  Nordeste = "Nordeste",
  CentroOeste = "Centro-Oeste",
  Sudeste = "Sudeste",
  Sul = "Sul",
  Nenhuma = "Nenhuma",
}
export enum StatusName {
  Todos = "Todos",
  Cadastrado = "Cadastrado",
  Programado = "Programado",
  EmVisita = "Visitado",
  EmAnalise = "Em analise",
  Validado = "Validado",
  Aprovado = "Aprovado",
}

export interface RegiaoBrasil {
  regiao: RegiaoBrasilNomeEnum;
  ufs: Estado[];
}
