import { div, h2, p, pre, table, td, th, tr } from "../html";
import { query_data } from "../dbconn";
import { table_names, userPickRow, userPickTable } from "../helpers";
import { page } from "../types";

export function ViewPage():page{
  return {
    title:"view",
    element: div()
  }
}

export const renderView = async (host: HTMLElement, tableName: string, id: string)=>{
  host.replaceChildren(div("loading..."))

  if (!tableName) {
    const picked = await userPickTable("pick a table to view")
    renderView(host, picked, "")
    return
  }

  const safeTable = tableName.replace(/[^a-z0-9_]/gi, "")
  if (!safeTable) {
    host.replaceChildren(p("invalid table name"))
    return
  }
  if (!table_names.includes(safeTable as any)) {
    host.replaceChildren(p("unknown table"))
    return
  }
  if (!id) {
    const pickedId = await userPickRow(safeTable as any, "pick a row to view")
    renderView(host, safeTable, String(pickedId))
    return
  }
  if (!/^\d+$/.test(id)) {
    host.replaceChildren(p("id must be an integer"))
    return
  }

  const { names, rows } = await query_data(`select * from ${safeTable} where id = ${id}`)
  if (!rows.length) {
    host.replaceChildren(p("no rows"))
    return
  }
  const row = rows[0]
  const values = rowValues(row, names)

  host.replaceChildren(
    h2(`${safeTable} / ${id}`),
    table(
      tr(...names.map(n=>th(n))),
      tr(...values.map(v=>td(cellText(v))))
    ),
    pre(JSON.stringify(rowObject(row, names), null, 2))
  )
}

const rowValues = (row: any, names: string[])=>{
  if (Array.isArray(row)) return row
  if (row && typeof row === "object") return names.map(n=>row[n])
  return [row]
}

const rowObject = (row: any, names: string[])=>{
  if (row && typeof row === "object" && !Array.isArray(row)) return row
  const values = rowValues(row, names)
  return Object.fromEntries(names.map((n, i)=>[n, values[i]]))
}

const cellText = (value: any)=>{
  if (value === null || value === undefined) return ""
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
