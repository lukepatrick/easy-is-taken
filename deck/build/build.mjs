// One command: content.md + maps/*.owm + slides.src.md -> slides.md (with inline SVG maps, QR code and presenter notes).
// slides.md is generated. Edit slides.src.md, content.md or maps/*.owm instead.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import QRCode from 'qrcode'
import {
  readOwm, geometry, sceneOf, placeSequence, drawFrame, axes, svgOpen, esc, textWidth, C, FONT, STAGES,
} from './render-map.mjs'

const root = new URL('../', import.meta.url)
const REPO = 'https://github.com/lukepatrick/easy-is-taken'
const REPO_SHORT = REPO.replace(/^https:\/\//, '')
const ME = 'https://linktr.ee/lukephilips'
const ME_SHORT = ME.replace(/^https:\/\//, '')
// The strapline row on slides 5 to 12: the supposition on the left, the repo on the right,
// so someone who walks up mid-talk sees both.
const SUPPOSITION = 'Supposing writing software is a utility'
const strap = left => `<div class="step strap"><span>${left}</span><span class="strap-url">${REPO_SHORT}</span></div>`
const read = p => readFileSync(new URL(p, root), 'utf8')
const t0 = performance.now()

// Slide geometry, shared with style.css: header above the map, question bar below it.
export const LAYOUT = { headerH: 258, questionH: 128 }
const MAP_H = 1080 - LAYOUT.headerH - LAYOUT.questionH
const g = geometry(1920, MAP_H)

// ---- content.md ----------------------------------------------------------------------------------------------

const content = read('content.md')
const section = (n) => {
  const m = content.match(new RegExp(`^## ${n}\\. [^\\n]*\\n([\\s\\S]*?)(?=^## \\d+\\. |(?![\\s\\S]))`, 'm'))
  if (!m) throw new Error(`content.md: section ${n} not found`)
  return m[1]
}
const tableRows = (text, firstHeader) => {
  const start = text.indexOf(`| ${firstHeader} |`)
  if (start < 0) throw new Error(`content.md: table "${firstHeader}" not found`)
  return text.slice(start).split('\n').slice(2).filter(l => l.startsWith('|'))
    .map(l => l.split('|').slice(1, -1).map(c => c.trim()))
}

// Presenter notes: the time and the bullets from each "### N." block of section 4.
const notes = {}
for (const m of section(4).matchAll(/^### (\d+)\. ([^\n]*)\n([\s\S]*?)(?=^### |(?![\s\S]))/gm)) {
  const [, n, title, body] = m
  const bullets = body.split('\n').filter(l => l.startsWith('- '))
  notes[n] = `**${title}**\n\n${bullets.join('\n')}`
}

// What's left and one question per scenario (section 1), in the order slide 10's notes suggest.
const lines = Object.fromEntries(tableRows(section(1), 'Scenario').map(([s, left, setup, line]) => [s, { left, setup, line }]))
const order = (section(4).match(/Suggested order: ([^.]*)\./) || [])[1]?.split(', ').map(s => s.trim())
if (!order || order.length !== 6) throw new Error('content.md: slide 10 suggested order not found')
const lineFor = name => lines[name] ?? lines[name.replace(/^dissent: /, 'dissent-').replace(/ /g, '-')]

// Six tiles (slide 5).
const s5 = section(4).match(/^### 5\. [\s\S]*?(?=^### 6\.)/m)[0]
const tiles = tableRows(s5, 'Tile')

// ---- maps ------------------------------------------------------------------------------------------------------

const mapFiles = readdirSync(new URL('maps/', root)).filter(f => f.endsWith('.owm')).sort()
const frames = mapFiles.map(f => ({ id: f.replace(/\.owm$/, ''), ...readOwm(read(`maps/${f}`)) }))

// Fenton's F16 line sits in the band between frame 3's headline and its map. Every map frame has the band,
// so the map geometry, and every dot and label, is identical from frame to frame.
const QUOTE_FRAME = '03-where-weight-lands'
const q = section(3).match(/^> "([^"]+)"\n> ([^\n]+)/m)
if (!q) throw new Error('content.md: F16 quote card not found')
const quote = { text: q[1], cite: q[2].trim() }

const scenes = frames.map(f => sceneOf(f.map, g))
const { placed, total, report } = placeSequence(scenes, g)
if (total > 2000) console.warn(`label placement cost ${Math.round(total)}: check the frames for overlaps\n${report}`)

const frameSlides = {}
frames.forEach((f, i) => {
  const d = f.directives
  for (const k of ['step', 'headline', 'question', 'highlight']) if (!d[k]) throw new Error(`${f.id}: missing // @${k}`)
  const body = drawFrame(f.map, g, placed, { highlight: d.highlight })
  const band = f.id === QUOTE_FRAME
    ? `<blockquote class="band"><span class="q">“${esc(quote.text)}”</span> <span class="qcite">${esc(quote.cite)}</span></blockquote>`
    : '<div class="band"></div>'
  frameSlides[f.id] = { d, band, svg: `${svgOpen(g, d.headline)}\n${body}\n</svg>`, n: frames.length }
})

// ---- endings: one small map per scenario (slide 12) ---------------------------------------------------------------
// Each maps/endings/*.owm is drawn at tile size with the same 38px labels and no axis text. One highlight per tile.

const MINI = { w: 560, h: 300 }
const mg = geometry(MINI.w, MINI.h, { left: 6, right: 8, top: 40, bottom: 10 })
const endingFiles = readdirSync(new URL('maps/endings/', root)).filter(f => f.endsWith('.owm')).sort()
const endings = endingFiles.map(f => {
  const { map, directives: d } = readOwm(read(`maps/endings/${f}`))
  for (const k of ['scenario', 'highlight']) if (!d[k]) throw new Error(`endings/${f}: missing // @${k}`)
  if (!map.components.some(c => c.name === d.highlight)) throw new Error(`endings/${f}: no component "${d.highlight}"`)
  const scene = sceneOf(map, mg)
  const { placed: at, total: cost, report: rep } = placeSequence([scene], mg, [], { mini: true, sides: d.sides })
  if (cost > 1500) console.warn(`endings/${f}: label cost ${Math.round(cost)}\n${rep}`)
  for (const a of map.anchors) {
    const hw = textWidth(a.name, FONT.label, 700) / 2, x = mg.x(a.maturity)
    if (x - hw < 0 || x + hw > MINI.w) throw new Error(`endings/${f}: anchor "${a.name}" runs off the tile`)
  }
  const body = drawFrame(map, mg, at, { highlight: d.highlight, mini: true })
  return { name: d.scenario, svg: `${svgOpen(mg, `${d.scenario}: simplified final map`)}\n${body}\n</svg>` }
})
if (endings.length !== 6) throw new Error(`maps/endings: expected 6 maps, found ${endings.length}`)

// ---- primer: the same axes, one dot and one line, then the drift right --------------------------------------

function primerSvg() {
  const evo = frames[0].map.evolution.map(e => e.line1)
  const o = [axes(g, evo)]
  const ax = g.x(0.55), ay = g.y(0.92), bx = g.x(0.47), by = g.y(0.45), mx = g.x(0.80)
  o.push(`<line x1="${ax}" y1="${ay + 12}" x2="${bx}" y2="${by - 15}" stroke="${C.link}" stroke-width="4"/>`)
  o.push(`<text class="lbl anchor" x="${ax}" y="${ay}" text-anchor="middle" font-size="${FONT.label}">A user and their need</text>`)
  o.push(`<text class="lbl note" x="${(ax + bx) / 2 + 24}" y="${(ay + by) / 2 + 10}" font-size="${FONT.label}">depends on</text>`)
  o.push(`<circle cx="${bx}" cy="${by}" r="15" fill="${C.paper}" stroke="${C.ink}" stroke-width="5"/>`)
  o.push(`<text class="lbl" x="${bx - 30 - textWidth('Something it needs', FONT.label, 700)}" y="${by + 13}" font-size="${FONT.label}">Something it needs</text>`)
  // Stage descriptions, two short lines inside each column, just above the axis.
  const desc = [['New and', 'uncertain'], ['Made for one', 'place, by hand'], ['Bought, with rival', 'versions competing'], ['Standard and', 'metered']]
  desc.forEach((ls, i) => ls.forEach((l, j) =>
    o.push(`<text class="stage-desc" x="${g.x(STAGES[i]) + 12}" y="${g.axisY - 26 - (ls.length - 1 - j) * 46}" font-size="${FONT.label}">${esc(l)}</text>`)))
  // Click 1: things drift right as they get understood and competed over.
  o.push(`<g class="drift" :class="{ off: $clicks < 1 }">`)
  o.push(`<line x1="${bx + 26}" y1="${by}" x2="${mx - 50}" y2="${by}" stroke="${C.accent}" stroke-width="6" stroke-dasharray="16 10"/>`)
  o.push(`<polygon points="${mx - 26},${by} ${mx - 54},${by - 13} ${mx - 54},${by + 13}" fill="${C.accent}"/>`)
  o.push(`<circle cx="${mx}" cy="${by}" r="15" fill="${C.paper}" stroke="${C.accent}" stroke-width="5" stroke-dasharray="7 5"/>`)
  o.push(`<text class="lbl hi" x="${(bx + mx) / 2 - textWidth('Drifts right over time', FONT.label, 700) / 2}" y="${by - 34}" font-size="${FONT.label}">Drifts right over time</text>`)
  o.push(`</g>`)
  return `${svgOpen(g, 'Map axes: closer to the user up the side, evolution across')}\n${o.join('\n')}\n</svg>`
}

// ---- QR codes for the repo and for me, generated locally --------------------------------------------------

const qrSvg = async (url, label) => (await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: { dark: '#000000', light: '#ffffff' } }))
  .replace(/<\?xml[^>]*>\s*/, '').replace('<svg ', `<svg class="qr" role="img" aria-label="${label}" `).trim()
const qr = await qrSvg(REPO, 'QR code for the repo')
const qrMe = await qrSvg(ME, 'QR code to connect with Luke Philips')

// ---- assemble slides.md ------------------------------------------------------------------------------------------

const noteBlock = n => {
  if (!notes[n]) throw new Error(`content.md: no notes for slide ${n}`)
  return `<!--\n${notes[n].replace(/-->/g, '-- >')}\n-->`
}

let src = read('slides.src.md')
src = src.replace(/^@@frame (\S+) notes=(\d+)@@$/gm, (_, id, n) => {
  const f = frameSlides[id]
  if (!f) throw new Error(`slides.src.md: no map ${id}`)
  return `---
class: map-frame
---

${strap(`${SUPPOSITION} · scenario: climate, ${f.d.step} of ${f.n}`)}

# ${f.d.headline}

${f.band}

<div class="map">
${f.svg}
</div>

<div class="question">${esc(f.d.question)}</div>

${noteBlock(n)}`
})
src = src.replace(/^@@primer@@$/m, () => `<div class="map">\n${primerSvg()}\n</div>`)
src = src.replace(/^@@tiles@@$/m, () => tiles.map(([name, def, label]) => {
  const dissent = name.startsWith('dissent')
  const curly = t => t.replace(/"([^"]*)"/g, '“$1”')
  return `<div class="tile${dissent ? ' dissent' : ''}${name === 'climate' ? ' walked' : ''}">
<div class="tile-name">${esc(name)}${name === 'climate' ? ' <span class="tag">today</span>' : ''}</div>
<div class="tile-def">${esc(curly(def))}</div>
<div class="tile-label">${esc(curly(label))}</div>
</div>`
}).join('\n'))
// Slide 10 is split in two: @@lines A B@@ draws rows A..B-1. The first row is up on arrival, each click adds one
// and dims the rows before, and the last click brings the slide's rows back to full strength.
src = src.replace(/^@@lines (\d+) (\d+)@@$/gm, (_, a, b) => order.slice(+a, +b).map((name, i, rows) => {
  const line = lineFor(name)
  if (!line) throw new Error(`content.md: no line for ${name}`)
  return `<div class="pl" :class="{ off: $clicks < ${i}, dim: $clicks > ${i} && $clicks < ${rows.length} }">
<div class="pl-name">${esc(name)}</div>
<div class="pl-body"><div class="pl-left">${esc(line.left)}</div>
<div class="pl-setup">${esc(line.setup)}</div>
<div class="pl-line">${esc(line.line)}</div></div>
</div>`
}).join('\n'))
src = src.replace(/^@@endings@@$/m, () => endings.map(e => {
  const dissent = e.name.startsWith('dissent')
  return `<div class="tile${dissent ? ' dissent' : ''}${e.name === 'climate' ? ' walked' : ''}">
<div class="tile-name">${esc(e.name)}</div>
${e.svg}
</div>`
}).join('\n'))
src = src.replace(/^@@qr@@$/m, qr)
src = src.replace(/^@@qr-me@@$/m, qrMe)
src = src.replace(/@@repo@@/, REPO_SHORT)
src = src.replace(/@@me@@/, ME_SHORT)
src = src.replace(/^@@strap@@$/gm, () => strap(SUPPOSITION))
src = src.replace(/<!-- @notes (\d+) -->/g, (_, n) => noteBlock(n))
const left = src.match(/@@[\w-]+[^@]*@@|<!-- @notes/)
if (left) throw new Error(`slides.src.md: unreplaced placeholder ${left[0]}`)

writeFileSync(new URL('slides.md', root), src)
console.log(`slides.md built in ${Math.round(performance.now() - t0)} ms (${frames.length} map frames, label cost ${Math.round(total)})`)
