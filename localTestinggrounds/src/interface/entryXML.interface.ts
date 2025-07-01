export interface EntryXMLInterface {
  schedule: ScheduleXMLInterface
}

export interface ScheduleXMLInterface {
  id: string
  agent: AgentXMLInterface
  scheduleType: ScheduleTypeXMLInterface
  serviceLocal: ServiceLocalXMLInterface
  alternativeIdentifier: string
  date: string
  hour: string
  recreateTaskOnPda: string
  observation: string
  situation: SituationXMLInterface
  situationHistories: SituationHistoriesXMLInterface
  origin: string
  exportSituation: string
  teamExecution: string
  active: string
  activities: ActivitiesXMLInterface
  activitiesOrigin: string
  activitiesOriginList: string
  customField1: string
  team: TeamXMLInterface
  validateDateTimeExecution: string
  accessToken: string
  ignoringCanceledOnQuery: string
  sourceFinishing: string
  customFields: CustomFieldsXMLInterface
  sendNotification: string
  insertDateTime: string
  lastUpdateDateTime: string
  agentLastUpdate: AgentLastUpdateXMLInterface
  updatedModule: string
  insertModule: string
  isAgentEdit: string
  isTeamEdit: string
  versionTimestamp: string
}

export interface AgentXMLInterface {
  id: string
  name: string
  login: string
  active: string
  currentSituation: string
  alternativeIdentifier: string
  lockLoginInChangeImei: string
  validateClient: string
  centerwebUser: string
  centerwebUserRole: string
  mobileUser: string
  executeSchedulesByPriority: string
  biUser: string
  inputWebAsAnotherUser: string
  observation: string
  country: string
  state: string
  city: string
  neighborhood: string
  streetType: string
  street: string
  streetComplement: string
  zipCode: string
  email: string
  changePassword: string
  memorizePasswordMobile: string
  lastSynchronismTime: string
  exportStatus: string
  viewServiceLocal: string
  imeiLastSynchronism: string
  blocked: string
  wrongLoginAttempts: string
  rootUser: string
  timezone: string
  geoLocation: string
  lastGeoPosition: string
  passwordSettings: string
  lastLevelBatteryMobile: string
  lastSyncPlataform: string
  geoCoordinate: string
  geoCoordinatePrecision: string
  insertModule: string
  updatedModule: string
  isToSearchGeocoder: string
  smartPush: string
  processGeocoordinate: string
  lastAccessDateTime: string
}

export interface ScheduleTypeXMLInterface {
  id: string
  description: string
  alternativeIdentifier: string
  active: string
  earlyStart: string
  earlyEnd: string
  delayedStart: string
  lateEnd: string
  skipValidateWallet: string
  allowEvaluation: string
  allowChat: string
  mobileRouting: string
  allowTaskCreationOnMobile: string
  showPrintScheduleData: string
}

export interface ServiceLocalXMLInterface {
  id: string
  description: string
  active: string
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
  isToSearchGeocoder: string
  isToSearchGeocorder: string
  processGeocoordinate: string
  exportStatus: string
  insertModule: string
  updatedModule: string
  keepGeoCoordinate: string
  enabledNumberAlphanumeric: string
  highestGeoCoordinateAccuracy: string
}

export interface SituationXMLInterface {
  id: string
  description: string
}

export interface SituationHistoriesXMLInterface {
  situationHistory: SituationHistoryXMLInterface[]
}

export interface SituationHistoryXMLInterface {
  scheduleSituation: ScheduleSituationXMLInterface
  lastUpdateDateTime: string
  agent?: Agent2XMLInterface
}

export interface ScheduleSituationXMLInterface {
  id: string
  description: string
}

export interface Agent2XMLInterface {
  id: string
  name: string
  login: string
  active: string
  currentSituation: string
  alternativeIdentifier: string
  lockLoginInChangeImei: string
  validateClient: string
  centerwebUser: string
  centerwebUserRole: string
  mobileUser: string
  executeSchedulesByPriority: string
  biUser: string
  inputWebAsAnotherUser: string
  observation: string
  country: string
  state: string
  city: string
  neighborhood: string
  streetType: string
  street: string
  streetComplement: string
  zipCode: string
  email: string
  changePassword: string
  memorizePasswordMobile: string
  lastSynchronismTime: string
  exportStatus: string
  viewServiceLocal: string
  imeiLastSynchronism: string
  blocked: string
  wrongLoginAttempts: string
  rootUser: string
  timezone: string
  geoLocation: string
  lastGeoPosition: string
  passwordSettings: string
  lastLevelBatteryMobile: string
  lastSyncPlataform: string
  geoCoordinate: string
  geoCoordinatePrecision: string
  insertModule: string
  updatedModule: string
  isToSearchGeocoder: string
  smartPush: string
  processGeocoordinate: string
  lastAccessDateTime: string
}

export interface ActivitiesXMLInterface {
  activity: ActivityXMLInterface[]
}

export interface ActivityXMLInterface {
  _id: string
  _link: string
}

export interface TeamXMLInterface {
  id: string
  description: string
  alternativeIdentifier: string
  active: string
}

export interface CustomFieldsXMLInterface {
  aceita__os: string
  Tar__CategoriaKm: string
  Tar__Adiantamento: string
  Tar__ValorAcrescimo: string
  Tar__Valor__Desconto: string
  Tar__Saldo: string
  Tar__ValorTotal: string
  Tar__Status: string
  Tar__DataAceiteRecusa: string
  Tar__IdOrigem: string
  chegada__cliente: string
  fechamento__OS: string
  last__historical__approval__user: string
  last__historical__approval__date: string
  last__historical__disapproval__text: string
}

export interface AgentLastUpdateXMLInterface {
  id: string
  name: string
  login: string
  active: string
  currentSituation: string
  alternativeIdentifier: string
  lockLoginInChangeImei: string
  validateClient: string
  centerwebUser: string
  centerwebUserRole: string
  mobileUser: string
  executeSchedulesByPriority: string
  biUser: string
  inputWebAsAnotherUser: string
  observation: string
  country: string
  state: string
  city: string
  neighborhood: string
  streetType: string
  street: string
  streetComplement: string
  zipCode: string
  email: string
  changePassword: string
  memorizePasswordMobile: string
  lastSynchronismTime: string
  exportStatus: string
  viewServiceLocal: string
  imeiLastSynchronism: string
  blocked: string
  wrongLoginAttempts: string
  rootUser: string
  timezone: string
  geoLocation: string
  lastGeoPosition: string
  passwordSettings: string
  lastLevelBatteryMobile: string
  lastSyncPlataform: string
  geoCoordinate: string
  geoCoordinatePrecision: string
  insertModule: string
  updatedModule: string
  isToSearchGeocoder: string
  smartPush: string
  processGeocoordinate: string
  lastAccessDateTime: string
}
