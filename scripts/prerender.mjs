// Build step: put the server-rendered page inside dist/index.html.
// `vite build --ssr src/entry-server.tsx --outDir dist-ssr` must have run first (the npm "build" script does it).
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = path.resolve('dist')
const ssr = path.resolve('dist-ssr')
const entry = path.join(ssr, 'entry-server.js')

const { render } = await import(pathToFileURL(entry).href)
const html = render()

const file = path.join(dist, 'index.html')
const page = fs.readFileSync(file, 'utf8')
const empty = '<div id="root"></div>'
if (!page.includes(empty)) throw new Error('dist/index.html has no empty #root to fill')
fs.writeFileSync(file, page.replace(empty, `<div id="root">${html}</div>`))
fs.rmSync(ssr, { recursive: true, force: true })
console.log(`prerendered dist/index.html (${(html.length / 1024).toFixed(0)} KB of HTML)`)
