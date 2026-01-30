import { schema, table, t, SenderError } from 'spacetimedb/server';
import Ajv from 'ajv';
import { Jsonable } from './notes';

const ajv = new Ajv();

const Article = table(
  {
    name:"article",
    public: true,
  },
  {
    id:t.u64().primaryKey().autoInc(),
    title: t.string(),
    content: t.string(),
  }
)

const Schema = table(
  {
    name:"schema",
    public:true,
  },{
    id:t.u64().primaryKey().autoInc(),
    title: t.string(),
    content: t.string(),
  }
)

const Agent = table(
  {
    name:"agent",
    public:true,
  },
  {
    id:t.u64().primaryKey().autoInc(),
    title: t.string(),
    JScode: t.string(),
  }
)

const Output = table(
   {
    name:"output",
    public:true,
  },
  {
    id:t.u64().primaryKey().autoInc(),
    article: t.u64(),
    schema: t.u64(),
    agent: t.u64(),
    content: t.string(),
  }
)

const Judge = table(
  {
    name:"judge",
    public:true,
  },
  {
    id:t.u64().primaryKey().autoInc(),
    title: t.string(),
    JScode: t.string(),
  }
)


const Judgement = table(
   {
    name:"judgement",
    public:true,
  },
  {
    id:t.u64().primaryKey().autoInc(),
    output: t.u64(),
    judge: t.u64(),
    reward_100: t.u8(),
  }
)


export const spacetimedb = schema(Article, Schema, Agent, Output, Judge, Judgement)


spacetimedb.reducer("add_article", {title: t.string(), content: t.string()}, (c, {
  title, content
})=>{
  c.db.article.insert({id: 0n, title, content})
})

spacetimedb.reducer("add_schema", {title: t.string(), content: t.string()}, (c, {
  title, content
})=>{
  try{
    let val = ajv.compile(JSON.parse(content))
  } catch (e) { throw new SenderError("schema error: " + String(e))}
  c.db.schema.insert({id: 0n, title, content})
})

spacetimedb.reducer("add_agent", {title: t.string(), JScode: t.string()}, (c, {
  title, JScode
})=>{
  c.db.agent.insert({id: 0n, title, JScode})
})

spacetimedb.reducer("add_judge", {title: t.string(), JScode: t.string()}, (c, {
  title, JScode
})=>{
  c.db.judge.insert({id: 0n, title, JScode})
})

spacetimedb.reducer("add_output", {article: t.u64(), schema: t.u64(), agent: t.u64(), content: t.string()}, (c, {
  article, schema, agent, content
})=>{
  if (!c.db.article.id.find(article)) throw new SenderError("article does not exist")
  if (!c.db.agent.id.find(agent)) throw new SenderError("agent does not exist")
  const schemaRow = c.db.schema.id.find(schema)
  if (!schemaRow) throw new SenderError("schema does not exist")
  let schemaJson: Record<string, Jsonable>
  let outputJson: unknown
  try { schemaJson = JSON.parse(schemaRow.content) } catch { throw new SenderError("schema is not valid json") }
  try { outputJson = JSON.parse(content) } catch { throw new SenderError("output is not valid json") }
  try{
    let val = ajv.compile(schemaJson)
    val(outputJson)
  
  } catch (e) { throw new SenderError("schema error: " + String(e))}




  c.db.output.insert({id: 0n, article, schema, agent, content})
})
