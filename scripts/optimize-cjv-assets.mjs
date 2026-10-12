/**
 * Optimize the central-java-village theme assets.
 * Source: src/assets/images/central-java-village-theme/ (15 original PNGs).
 * Output: src/assets/images/central-java-village/ (renamed WebP + alpha, q82,
 * two widths each) + src/themes/central-java-village/assets.ts (generated manifest).
 *
 * Tools: needs `cwebp` on PATH (or CWEBP_BIN env). No npm dependency.
 * Alpha-bbox trimming is done with a tiny built-in PNG decoder (8-bit,
 * non-interlaced); files that fail to parse are converted without cropping.
 *
 * Usage: node scripts/optimize-cjv-assets.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'src/assets/images/central-java-village-theme')
const outDir = join(root, 'src/assets/images/central-java-village')
const themeDir = join(root, 'src/themes/central-java-village')
const cwebp = process.env.CWEBP_BIN ?? 'cwebp'
const QUALITY = { frame: 82, decor: 78 }

/** [original file, new kebab name, role]. Role sets output widths. */
const PLAN = [
  ['bg-village-montaine.PNG', 'bg-village-mountain', 'frame', { crop: false }],
  ['claude.PNG', 'clouds', 'frame', { crop: true }],
  ['gebyok-jasmine.PNG', 'gebyok-frame', 'frame', { crop: false }],
  ['java-hanging-lamp.PNG', 'hanging-lamp', 'decor', { crop: true }],
  ['mahkota-ornamen.PNG', 'crown-ornament', 'decor', { crop: true }],
  ['jasmine-decoration.PNG', 'jasmine-pair-top', 'decor', { crop: true }],
  ['jasmine-top-left-decoration.PNG', 'jasmine-corner-tl', 'decor', { crop: true }],
  // jasmine-top-right-decoration.PNG: RGB, no alpha (opaque white bg). Not used;
  // right-side corners mirror jasmine-corner-tl with scaleX(-1).
  ['jasmine-bottom-left-decoration.PNG', 'jasmine-corner-bl', 'decor', { crop: true }],
  ['batik-flower-bottom-left.PNG', 'batik-leaf-bl', 'decor', { crop: true }],
  ['flower ronce.PNG', 'flower-strand', 'decor', { crop: true }],
  ['ronce-jasmine.PNG', 'ronce-tassel', 'decor', { crop: true }],
  ['wedding-jasmine-monument.PNG', 'monument-pair', 'frame', { crop: true }],
  ['wedding-seat.PNG', 'pelaminan-seat', 'frame', { crop: true }],
  ['wedding-place.PNG', 'wedding-floor', 'frame', { crop: true }],
]
const WIDTHS = { frame: [1280, 768], decor: [900, 480] }

/** Opaque bbox of an 8-bit PNG. Returns null when the file cannot be parsed. */
function opaqueBbox(file) {
  let buf
  try {
    buf = readFileSync(file)
  } catch {
    return null
  }
  try {
    return decodeBbox(buf)
  } catch {
    return null
  }
}

function decodeBbox(buf) {
  let pos = 8
  let width = 0
  let height = 0
  let colorType = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      if (data[8] !== 8 || data[12] !== 0) return null // only 8-bit non-interlaced
      colorType = data[9]
    } else if (type === 'IDAT') idat.push(data)
    pos += 12 + len
  }
  if (colorType !== 6 && colorType !== 2) return null // need RGB/RGBA
  const bpp = colorType === 6 ? 4 : 3
  const stride = width * bpp
  const raw = zlib.inflateSync(Buffer.concat(idat))
  let p = 0
  let prev = Buffer.alloc(stride)
  let minR = height
  let maxR = -1
  let minC = width
  let maxC = -1
  for (let r = 0; r < height; r++) {
    const filter = raw[p++]
    const cur = raw.subarray(p, p + stride)
    p += stride
    const out = Buffer.alloc(stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0
      const b = prev[i]
      const cc = i >= bpp ? prev[i - bpp] : 0
      let v = cur[i]
      if (filter === 1) v = (v + a) & 255
      else if (filter === 2) v = (v + b) & 255
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255
      else if (filter === 4) {
        const pp = a + b - cc
        const pa = Math.abs(pp - a)
        const pb = Math.abs(pp - b)
        const pc = Math.abs(pp - cc)
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : cc)) & 255
      }
      out[i] = v
    }
    for (let c = 0; c < width; c++) {
      const alpha = colorType === 6 ? out[c * 4 + 3] : 255
      if (alpha > 8) {
        if (r < minR) minR = r
        if (r > maxR) maxR = r
        if (c < minC) minC = c
        if (c > maxC) maxC = c
      }
    }
    prev = out
  }
  if (maxR < 0) return null
  const pad = 2
  return {
    x: Math.max(0, minC - pad),
    y: Math.max(0, minR - pad),
    w: Math.min(width, maxC + pad + 1) - Math.max(0, minC - pad),
    h: Math.min(height, maxR + pad + 1) - Math.max(0, minR - pad),
    fullW: width,
    fullH: height,
  }
}

function kb(n) {
  return `${(n / 1024).toFixed(0)} KB`
}

mkdirSync(outDir, { recursive: true })
mkdirSync(themeDir, { recursive: true })

const manifest = []
let totalOut = 0
const before = {}
for (const f of readdirSync(srcDir)) {
  if (f.endsWith('.PNG')) before[f] = statSync(join(srcDir, f)).size
}

console.log('file | crop | outputs')
for (const [orig, name, role, opts] of PLAN) {
  const src = join(srcDir, orig)
  if (!existsSync(src)) {
    console.error(`MISSING source: ${orig}`)
    process.exitCode = 1
    continue
  }
  let cropArgs = []
  let dims = null
  let crop = null
  if (opts.crop) {
    const box = opaqueBbox(src)
    if (box && (box.w < box.fullW * 0.999 || box.h < box.fullH * 0.999)) {
      crop = box
      cropArgs = ['-crop', String(box.x), String(box.y), String(box.w), String(box.h)]
      dims = { w: box.w, h: box.h }
    }
  }
  if (!dims) {
    // uncropped: read dimensions from the PNG header directly
    const head = readFileSync(src)
    dims = { w: head.readUInt32BE(16), h: head.readUInt32BE(20) }
  }
  // Never upscale: drop planned widths above the natural (cropped) width and
  // keep the natural width itself as the large variant instead.
  let widths = WIDTHS[role].filter((w) => w <= dims.w)
  if (widths.length < WIDTHS[role].length && dims.w > 480 && !widths.includes(dims.w)) widths = [dims.w, ...widths]
  if (!widths.length) widths = [dims.w]
  const files = []
  for (const w of widths) {
    const out = join(outDir, `${name}-${w}.webp`)
    execFileSync(cwebp, ['-q', String(QUALITY[role]), ...cropArgs, '-resize', String(w), '0', src, '-o', out], { stdio: 'pipe' })
    const size = statSync(out).size
    totalOut += size
    files.push({ w, file: `${name}-${w}.webp`, size })
  }
  manifest.push({ name, role, width: dims.w, height: dims.h, files, crop })
  console.log(`${orig} -> ${name} [${dims.w}x${dims.h}] ${cropArgs.length ? '(trimmed)' : '(full canvas)'}: ${files.map((f) => `${f.w}w=${kb(f.size)}`).join(' ')}`)
}

// measured constants. The gebyok keeps its full canvas, so its opening stays in
// original-canvas fractions. Seat/floor are trimmed — their rows are remapped
// to the delivered (cropped) image fractions at generation time.
const MEASURED = {
  gebyokOpening: { x: 0.19, y: 0.245, w: 0.62, h: 0.735 },
  seatBalustradeOrigRow: 675,
  seatOrigH: 1024,
  floorTopOrigRow: 644,
  floorOrigH: 1024,
}
function croppedFraction(entry, origRow, origH) {
  if (!entry?.crop) return +(origRow / origH).toFixed(3)
  return +((origRow - entry.crop.y) / entry.height).toFixed(3)
}
const seatEntry = manifest.find((m) => m.name === 'pelaminan-seat')
const floorEntry = manifest.find((m) => m.name === 'wedding-floor')
const seatBalustradeY = croppedFraction(seatEntry, MEASURED.seatBalustradeOrigRow, MEASURED.seatOrigH)
const floorTopY = croppedFraction(floorEntry, MEASURED.floorTopOrigRow, MEASURED.floorOrigH)

const lines = [
  '/** Generated by scripts/optimize-cjv-assets.mjs — do not edit by hand. */',
  ...manifest.flatMap((m) =>
    m.files.map((f) => `import ${varName(m.name, f.w)} from '@/assets/images/central-java-village/${f.file}'`),
  ),
  '',
  'export interface CjvAsset { src: string; width: number }',
  '',
  'export const cjvAssets: Record<string, { width: number; height: number; variants: CjvAsset[] }> = {',
  ...manifest.map(
    (m) =>
      `  '${m.name}': { width: ${m.width}, height: ${m.height}, variants: [${m.files
        .map((f) => `{ src: ${varName(m.name, f.w)}, width: ${f.w} }`)
        .join(', ')}] },`,
  ),
  '};',
  '',
  '/** Walk-through opening of the gebyok gate, as fractions of the original 1312x1199 canvas. */',
  `export const GEBYOK_OPENING = ${JSON.stringify(MEASURED.gebyokOpening)} as const`,
  '/** Top of the balustrade in pelaminan-seat (fraction of delivered height) — countdown sits above it. */',
  `export const SEAT_BALUSTRADE_Y = ${seatBalustradeY} as const`,
  '/** Top of the patterned floor in wedding-floor (fraction of delivered height). */',
  `export const FLOOR_TOP_Y = ${floorTopY} as const`,
  '',
]
function varName(name, w) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + w
}
writeFileSync(join(themeDir, 'assets.ts'), `${lines.join('\n')}\n`)

const totalIn = Object.values(before).reduce((a, b) => a + b, 0)
console.log(`\nbefore: ${kb(totalIn)} (${Object.keys(before).length} PNG) -> after: ${kb(totalOut)} (${manifest.length * 2} WebP)`)
console.log(`manifest: src/themes/central-java-village/assets.ts`)
