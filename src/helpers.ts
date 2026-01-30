import { call_reducer, query_data } from "./dbconn";
import { button, div, h2, input, p, popup } from "./html";

export const addArticle = (title: string, content: string)=> call_reducer("add_article", [title, content])

export const addSchema = (title: string, content: string)=> call_reducer("add_schema", [title, content])

export const addAgent = (title: string, JScode: string)=> call_reducer("add_agent", [title, JScode])

export const addJudge = (title: string, JScode: string)=> call_reducer("add_judge", [title, JScode])

export const addOutput = (article: number, schema: number, agent: number, content: string)=>
  call_reducer("add_output", [article, schema, agent, content])



export type TableName = "article" | "schema" | "agent" | "judge" | "output"
export const table_names:TableName[] = ["article", "schema", "agent", "judge", "output"]

export const userPickTable = (title:string = "pick a table") : Promise<TableName> =>new Promise((rs, rj)=>{
  const pop = popup(
    h2(title),
    div(
      { style: { display: "flex", flexDirection: "column", gap: "0.5em" } },
      ...table_names.map((name)=>button(name, {
        onclick: ()=>{
          pop.remove()
          rs(name)
        }
      }))
    ),
    p("")
  )
})

export const userPickRow = async (table: TableName, title:string = "pick a row")=>{
  const { names, rows } = await query_data(`select * from ${table} limit 100`)
  const idIndex = names.indexOf("id")
  const items = rows.map((row)=>{
    const values = rowValues(row, names)
    const id = idIndex === -1 ? values[0] : values[idIndex]
    const label = values.map((v, i)=> i === idIndex ? `#${v}` : preview(v)).filter(Boolean).join(" • ")
    return { id, label }
  }).filter(r=>r.id !== undefined && r.id !== null)

  return new Promise<number>((rs, rj)=>{
    if (!items.length) {
      const pop = popup(h2(title), p("no rows"), button("close", { onclick: ()=>{ pop.remove(); rj("no rows") } }))
      return
    }
    const list = div({ style: { display: "flex", flexDirection: "column", gap: "0.5em" } })
    const filter = input({ placeholder: "search...", style: { width: "100%" } })
    const render = ()=>{
      const q = filter.value.toLowerCase().trim()
      const filtered = q ? items.filter(i=>i.label.toLowerCase().includes(q)) : items
      list.replaceChildren(
        ...filtered.map(i=>button(i.label || String(i.id), {
          onclick: ()=>{
            pop.remove()
            rs(Number(i.id))
          }
        }))
      )
    }
    filter.addEventListener("input", render)
    const pop = popup(h2(title), filter, list, p(""))
    render()
  })
}

const rowValues = (row: any, names: string[])=>{
  if (Array.isArray(row)) return row
  if (row && typeof row === "object") return names.map(n=>row[n])
  return [row]
}

const preview = (value: any)=>{
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value.slice(0, 40)
  if (typeof value === "object") return JSON.stringify(value).slice(0, 40)
  return String(value)
}
