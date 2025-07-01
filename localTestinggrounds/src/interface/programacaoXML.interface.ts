export interface ProgramacaoXMLInterface {
  result: Result
}

export interface Result {
  resourceName: string
  size: string
  entries: Entries[]
}

export interface Entries {
  entry: Entry[]
}

export interface Entry {
  _id: string
  _link: string
}
