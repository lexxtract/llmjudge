import { button, div, h2, input, p, textarea } from "../html";
import { query_data } from "../dbconn";
import { addAgent, addArticle, addJudge, addOutput, addSchema, userPickTable } from "../helpers";
import { page } from "../types";

export function NewDataPage():page{
  return {
    title:"new",
    element: div()
  }
}

export const renderNewData = async (host: HTMLElement, tableName: string)=>{
  host.replaceChildren(div("loading..."))


  if (!tableName) {
    const picked = await userPickTable("pick a table to insert")
    renderNewData(host, picked)
    return
  }

  const safeTable = tableName.replace(/[^a-z0-9_]/gi, "")
  if (!safeTable) {
    host.replaceChildren(p("invalid table name"))
    return
  }

  const { names, schema } = await query_data(`select * from ${safeTable} limit 0`)
  const elements = schema?.elements || []
  const fields = names
    .filter(n=>n && n !== "id")
    .map((name)=>{
      const element = elements.find((e: any)=>elementName(e) === name)
      const typeLabel = elementType(element)
      console.log( name)

      const isLongText = name !== "title"
      const field = isLongText
        ? textarea({
            placeholder: typeLabel ? `${name} (${typeLabel})` : name,
            style: { width: "100%", minHeight: "3em", resize: "none" },
            oninput: (e: Event)=>autoResize(e.target as HTMLTextAreaElement)
          })
        : input({
            placeholder: typeLabel ? `${name} (${typeLabel})` : name,
            style: { width: "100%" },
            type: isNumberType(typeLabel) ? "number" : "text"
          })

      return { name, field }
    })
  const fieldMap = new Map(fields.map(f=>[f.name, f.field]))

  if (!fields.length) {
    host.replaceChildren(p("no columns"))
    return
  }

  const status = div()
  const submit = async ()=>{
    const data = Object.fromEntries(names.map((name)=>{
      if (name === "id" && !fieldMap.has(name)) return [name, null]
      const field = fieldMap.get(name)
      const element = elements.find((e: any)=>elementName(e) === name)
      const typeLabel = elementType(element)
      return [name, parseValue(field ? field.value : "", typeLabel)]
    }))
    try {
      await insertRow(safeTable, data)
      status.replaceChildren(p("inserted"))
    } catch (e: any) {
      status.replaceChildren(p(e?.message || "insert failed"))
    }
  }

  host.replaceChildren(
    h2(`new ${safeTable}`),
    ...fields.map(f=>div(p(f.name), f.field)),
    button("insert", { onclick: submit }),
    status
  )
}

const parseValue = (raw: string, typeLabel: string)=>{
  const value = raw.trim()
  if (!value) {
    if (isStringType(typeLabel)) return ""
    if (isNumberType(typeLabel)) return 0
    if (isBoolType(typeLabel)) return false
    return null
  }
  if (isStringType(typeLabel)) return value
  if (value.startsWith("{") || value.startsWith("[")) {
    try { return JSON.parse(value) } catch {}
  }
  try { return JSON.parse(value) } catch {}
  if (isNumberType(typeLabel)) return Number(value)
  if (isBoolType(typeLabel)) return value.toLowerCase() === "true"
  return value
}

const elementName = (e: any)=> e?.name?.some ?? e?.name ?? ""

const elementType = (e: any)=>{
  const direct = e?.algebraicType?.tag ?? e?.algebraicType?.value?.tag
  if (typeof direct === "string") return direct.toLowerCase()
  const opt = e?.algebraicType?.value?.some?.tag
  if (typeof opt === "string") return opt.toLowerCase()
  if (typeof e?.algebraicType === "string") return e.algebraicType.toLowerCase()
  return ""
}

const isNumberType = (typeLabel: string)=> /^u\d+|^i\d+|^f\d+/.test(typeLabel)
const isStringType = (typeLabel: string)=> typeLabel.includes("string")
const isBoolType = (typeLabel: string)=> typeLabel === "bool"

const insertRow = (table: string, data: Record<string, any>)=>{
  if (table === "article") return addArticle(data.title || "", data.content || "")
  if (table === "schema") return addSchema(data.title || "", data.content || "")
  if (table === "agent") return addAgent(data.title || "", data.JScode || "")
  if (table === "judge") return addJudge(data.title || "", data.JScode || "")
  if (table === "output") return addOutput(
    Number(data.article || 0),
    Number(data.schema || 0),
    Number(data.agent || 0),
    data.content || ""
  )
  throw new Error("no reducer for table")
}

const autoResize = (el: HTMLTextAreaElement)=>{
  el.style.height = "auto"
  el.style.height = `${el.scrollHeight}px`
}
