// Generates PWA icons from the brand mark: `node scripts/make-icons.mjs`
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
await initWasm(await readFile(require.resolve('@resvg/resvg-wasm/index_bg.wasm')))

const out = new URL('../public/icons/', import.meta.url)
const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url))

// Full-bleed variant (Android masks / iOS): square background, mark shrunk into the central safe zone
const art = favicon.toString()
const inner = art.slice(art.indexOf('<path'), art.lastIndexOf('</svg>')).replace(/<rect x="\.75"[^>]*\/>/, '')
const fullBleed = Buffer.from(art.slice(0, art.indexOf('<rect')) +
  '<rect width="64" height="64" fill="url(#bg)"/><rect width="64" height="64" fill="url(#gl)"/>' +
  `<g transform="translate(9.6 9.6) scale(.7)">${inner}</g></svg>`)

const png = (svg, size, name) => writeFile(new URL(name, out), new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng())

await Promise.all([
  png(favicon, 192, 'icon-192.png'),
  png(favicon, 512, 'icon-512.png'),
  png(fullBleed, 512, 'maskable-512.png'),
  png(fullBleed, 180, 'apple-touch-icon.png'), // iOS fills transparent corners with black, so use the full-bleed art
])
console.log('Icons written to public/icons/')
