// Generates PWA icons from the brand mark: `node scripts/make-icons.mjs`
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
await initWasm(await readFile(require.resolve('@resvg/resvg-wasm/index_bg.wasm')))

const out = new URL('../public/icons/', import.meta.url)
const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url))

// Full-bleed variant: launchers crop it to circles/squircles, so the tooth sits inside the central safe zone
const TOOTH = 'M20 14c-6 0-9 5-9 11 0 7 3 10 5 17 1 5 2 9 5 9s3-5 4-10c1-3 2-5 7-5s6 2 7 5c1 5 1 10 4 10s4-4 5-9c2-7 5-10 5-17 0-6-3-11-9-11-5 0-7 3-12 3s-7-3-12-3z'
const fullBleed = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stop-color="#2dd4bf"/><stop offset=".45" stop-color="#0d9488"/><stop offset="1" stop-color="#134e4a"/></linearGradient>
    <linearGradient id="en" x1="20" y1="16" x2="44" y2="48" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".6" stop-color="#f0fdfa"/><stop offset="1" stop-color="#99f6e4"/></linearGradient>
    <linearGradient id="au" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fef3c7"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
    <radialGradient id="gl" cx="20" cy="8" r="34" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="64" height="64" fill="url(#bg)"/><rect width="64" height="64" fill="url(#gl)"/>
  <g transform="translate(15.2 15.6) scale(.52)">
    <path d="${TOOTH}" fill="#042f2e" opacity=".28" transform="translate(1.5 3)"/>
    <path d="${TOOTH}" fill="url(#en)"/>
    <path d="M23 30c3 4.2 6.2 6 9 6s6-1.8 9-6" fill="none" stroke="#0d9488" stroke-width="3.4" stroke-linecap="round"/>
  </g>
  <path d="M44.5 15l1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2z" fill="url(#au)"/>
</svg>`)

const png = (svg, size, name) => writeFile(new URL(name, out), new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng())

await Promise.all([
  png(favicon, 192, 'icon-192.png'),
  png(favicon, 512, 'icon-512.png'),
  png(fullBleed, 512, 'maskable-512.png'),
  png(fullBleed, 180, 'apple-touch-icon.png'), // iOS fills transparent corners with black, so use the full-bleed art
])
console.log('Icons written to public/icons/')
