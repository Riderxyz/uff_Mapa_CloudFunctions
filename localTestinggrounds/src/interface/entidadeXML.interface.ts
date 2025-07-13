export interface EntidadeXMLInterface {
  serviceLocal: ServiceLocal
}

export interface ServiceLocal {
  id: string
  description: string
  active: string
  /**Codigo da conta  */
  alternativeIdentifier: string
  corporateName: string
  country: string
  state: string
  city: string
  cityNeighborhood: string
  streetType: string
  street: string
  streetComplement: string
  zipCode: string
  geoCoordinate: string
  geoCoordinatePrecision: string
  origin: string
  serviceLocalActivities: string
  isToSearchGeocoder: string
  isToSearchGeocorder: string
  customFields: CustomFields
  processGeocoordinate: string
  exportStatus: string
  pendingExport: string
  insertDateTime: string
  lastUpdateDateTime: string
  insertModule: string
  updatedModule: string
  keepGeoCoordinate: string
  enabledNumberAlphanumeric: string
  highestGeoCoordinateAccuracy: string
}

export interface CustomFields {
  Contato: string
  CLI__FP: string
  CNPJ: string
  Prioridade: string
  Regio: string
  /** id dos instrumentos  */
  Instr__Termos__Fomento: string
    /** qtd dos instrumentos  */
  Loc__QtdTermosFomento: string
  /** qtd de vagas  */
  Loc__QtdVagasContratadas: string
  /** qtd de vagas masculinas  */
  Quant__Vagas__Contratadas__Masc: string
  /** qtd de vagas femininas  */
  Quant__Vagas__Contratadas__Fem: string
  /** qtd de vagas de mães  */
  Quant__Vagas__Contratadas__Mae__Nutriz: string
  Loc__Contrato: string
  Telefone1: string
  Telefone2: string
  Telefone3: string
  Email1: string
  Email2: string
  Email3: string
  Link__Livre: string
}
