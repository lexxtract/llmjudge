import { div, h1, routeLink, span } from "./html"
import { TableView } from "./pages/table"
import { NewDataPage, renderNewData } from "./pages/newdata"
import { ViewPage, renderView } from "./pages/view"
import { page } from "./types"

const body = document.body

const viewPage = ViewPage()

const newPage = NewDataPage()

const pages:page[] = [
  TableView(),
  viewPage,
  newPage
]

const slugify = (title: string)=> title
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")

const pagePath = (p: page, index: number)=> index === 0 ? "/" : `/${slugify(p.title)}`

const crumbs = div()
const main = div()

const renderBreadcrumbs = (activeIndex: number)=>{
  crumbs.replaceChildren(
    ...pages.flatMap((p, i)=>{
      const label = p.title
      const isActive = i === activeIndex
      const node = isActive ? span(label, { style: { fontWeight: "600" } }) : routeLink(pagePath(p, i), label)
      return i === 0 ? [node] : [span(" / "), node]
    })
  )
}

const renderRoute = ()=>{
  const path = window.location.pathname
  if (path.startsWith("/view/")) {
    const parts = path.split("/").filter(Boolean)
    const tableName = parts[1] || ""
    const id = parts[2] || ""
    const viewIndex = pages.indexOf(viewPage)
    renderBreadcrumbs(viewIndex === -1 ? 0 : viewIndex)
    main.replaceChildren(viewPage.element)
    renderView(viewPage.element, tableName, id)
    document.title = viewPage.title
    return
  }
  if (path === "/new" || path.startsWith("/new/")) {
    const parts = path.split("/").filter(Boolean)
    const tableName = parts[1] || ""
    const newIndex = pages.indexOf(newPage)
    renderBreadcrumbs(newIndex === -1 ? 0 : newIndex)
    main.replaceChildren(newPage.element)
    renderNewData(newPage.element, tableName)
    document.title = newPage.title
    return
  }
  const index = pages.findIndex((p, i)=> pagePath(p, i) === path)
  const activeIndex = index === -1 ? 0 : index
  const active = pages[activeIndex]
  renderBreadcrumbs(activeIndex)
  main.replaceChildren(active.element)
  document.title = active.title
}

window.addEventListener("popstate", renderRoute)

body.append(
  h1("LLM JUDGE"),
  crumbs,
  main
)

renderRoute()
