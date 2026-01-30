import Ajv from "ajv"

export type Jsonable = string | number | boolean | Jsonable[] | {[key: string]: Jsonable}
