import { p, popup, routeLink, span } from "./html";
import { hash128 } from "../spacetimedb/src/hash";

import {Jsonable} from "../spacetimedb/src/notes";

const DBNAME = "llmjudge"

const dbPresets: Record<string, string> = {
  local: "http://localhost:3000",
  prod: "https://maincloud.spacetimedb.com",
};

const loadDbPreset = () => {
  const fromQuery = new URLSearchParams(window.location.search).get("db");
  const fromStore = localStorage.getItem("db_preset");
  if (fromQuery && dbPresets[fromQuery]) {
    localStorage.setItem("db_preset", fromQuery);
    return fromQuery;
  }
  return fromStore && dbPresets[fromStore] ? fromStore : "local";
};

const DB_PRESET = loadDbPreset();
const db_url = dbPresets[DB_PRESET];

let access_token: string | null = localStorage.getItem("access_token");

const req = (path: string, method: string, body: string | null = null) =>
  fetch(`${db_url}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}) },
    body,
  });

export const exec_sql = async (sql: string) =>
  (await req(`/v1/database/${DBNAME}/sql`, "POST", sql)).text();



export const call_reducer = async(reducer: string, data: Jsonable[]) => {
  await req(`/v1/database/${DBNAME}/call/${reducer}`, "POST", JSON.stringify(data))
}

export const query_data = async (sql: string) : Promise<{names:string[], rows:any[], schema: any}> => {
  const text = await exec_sql(sql);
  try {

    const data = JSON.parse(text);
    if (data.length > 1) console.warn("multiple rows returned, TODO: handle this");
    const { schema, rows } = data[0];
    const names = (schema?.elements || []).map((e: any) => e?.name?.some ?? e?.name ?? "");
    return { names, rows, schema };
  } catch (e: any) {

    popup(p(text));
    return { names: ["error"], rows: [e.message], schema: null };
  }
};

const FunCache = <X,Y> (fn: (x:X) => Promise<Y>) : ((x:X)=>Promise<Y>) => {
  const HotCache = new Map<string,Y>();
  const fkey = hash128(fn.toString() + ":cached:" + db_url)
  return async (x:X) => {
    const lkey = fkey + JSON.stringify(x)
    if (HotCache.has(lkey)) return HotCache.get(lkey)!
    const raw = localStorage.getItem(lkey)
    if (raw) {
      const res = JSON.parse(raw)
      HotCache.set(lkey, res)
      return res
    }
    const res = await fn(x)
    localStorage.setItem(lkey, JSON.stringify(res))
    HotCache.set(lkey, res)
    return res 
  }
}
