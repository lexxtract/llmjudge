import { button, div, table, td, textarea, th, tr } from "../html";
import { query_data } from "../dbconn";
import { userPickTable } from "../helpers";
import { page } from "../types";

export function TableView():page{

  const results = div()
  const sql = textarea(
    {
      placeholder: "select * from article",
      style: { width: "100%", height: "6em", fontFamily: "monospace" }
    }
  )

  const run = async ()=>{
    const query = sql.value.trim()
    if (!query) {
      const table = await userPickTable("pick a table to view")
      sql.value = `select * from ${table}`
      results.replaceChildren(div("loading..."))
      const { names, rows } = await query_data(sql.value)
      results.replaceChildren(renderTable(names, rows))
      return
    }
    results.replaceChildren(div("loading..."))
    const { names, rows } = await query_data(query)
    results.replaceChildren(renderTable(names, rows))
  }

  sql.addEventListener("keydown", (e)=>{
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run()
  })

  return {
    title:"tables",
    element: div(
      div(sql, button("run", { onclick: run })),
      results
    )

  }

}

const renderTable = (names: string[], rows: any[])=>{
  const head = tr(...names.map(n=>th(n)))
  const body = rows.map((row)=>{
    const values = rowValues(row, names)
    return tr(...names.map((_, i)=>td(cellText(values[i]))))
  })
  return table(head, ...body)
}

const rowValues = (row: any, names: string[])=>{
  if (Array.isArray(row)) return row
  if (row && typeof row === "object") return names.map(n=>row[n])
  return [row]
}

const cellText = (value: any)=>{
  if (value === null || value === undefined) return ""
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
