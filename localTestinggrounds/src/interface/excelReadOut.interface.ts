import { CentroOesteInterface } from "./centroOeste.interface"
import { NordesteInterface } from "./nordeste.interface"
import { NorteInterface } from "./norte.interface"
import { SudesteInterface } from "./sudeste.interface"
import { SulInterface } from "./sul.interface"

export interface excelReadOut {
    SUL: SulInterface[]
    SUDESTE: SudesteInterface[]
    NORTE: NorteInterface[]
    "CENTRO OESTE": CentroOesteInterface[]
    NORDESTE: NordesteInterface[]
  }
  

  

