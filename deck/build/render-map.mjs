// A small Wardley map renderer for slides. cli-owm parses the .owm; this draws the SVG.
// Everything is in slide pixels (the canvas is 1920 wide), so a 38px label is 28pt on a 1920x1080 screen.
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { realpathSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import opentype from 'opentype.js'

const require = createRequire(import.meta.url)

// cli-owm is a global install. Its CLI and its parse() live side by side in dist/.
const owmBin = realpathSync(execFileSync('which', ['cli-owm'], { encoding: 'utf8' }).trim())
const { parse } = require(join(dirname(owmBin), 'index.js'))

export const C = {
  ink: '#111111', link: '#4a4a4a', grid: '#9a9a9a', ghost: '#6b6b6b', accent: '#d62293', paper: '#ffffff',
}
export const FONT = { label: 38, small: 38 }

const fontDir = new URL('../node_modules/@fontsource/atkinson-hyperlegible-next/files/', import.meta.url)
const toAB = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
const fonts = {
  500: opentype.parse(toAB(readFileSync(new URL('atkinson-hyperlegible-next-latin-500-normal.woff', fontDir)))),
  700: opentype.parse(toAB(readFileSync(new URL('atkinson-hyperlegible-next-latin-700-normal.woff', fontDir)))),
}
export const textWidth = (s, size = FONT.label, weight = 500) => fonts[weight].getAdvanceWidth(s, size)

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function readOwm(src) {
  const map = parse(src)
  if (map.errors?.length) throw new Error(`owm parse errors: ${JSON.stringify(map.errors)}`)
  const d = {}
  for (const l of src.split('\n')) {
    const m = l.match(/^\/\/ @(\w+)\s+(.*)$/)
    if (m && m[1] === 'side') { const [name, k] = m[2].split('=').map(t => t.trim()); (d.sides ??= {})[name] = k } // @side Name = W
    else if (m) d[m[1]] = m[2].trim()
  }
  return { map, directives: d }
}

// Evolution stage boundaries, matching cli-owm and OnlineWardleyMaps (3.5, 8 and 14 twentieths).
export const STAGES = [0, 0.175, 0.4, 0.7]

// margins: override for the small maps on the endings slide, which carry no axis text.
export function geometry(width, height, m = {}) {
  const left = m.left ?? 76, right = width - (m.right ?? 40), top = m.top ?? 44, axisY = height - (m.bottom ?? 64)
  return {
    width, height, left, right, top, axisY,
    x: m => left + m * (right - left),
    y: v => top + (1 - v) * (axisY - top),
  }
}

export function axes(g, stageNames, { sideLabel = 'Closer to the user', bare = false } = {}) {
  const o = []
  const lh = FONT.small
  const y0 = bare ? 2 : g.top - 30
  for (const s of STAGES.slice(1)) {
    const x = g.x(s)
    o.push(`<line x1="${x}" y1="${y0}" x2="${x}" y2="${g.axisY}" stroke="${C.grid}" stroke-width="2" stroke-dasharray="8 8"/>`)
  }
  o.push(`<line x1="${g.left}" y1="${y0}" x2="${g.left}" y2="${g.axisY}" stroke="${C.ink}" stroke-width="3"/>`)
  o.push(`<line x1="${g.left}" y1="${g.axisY}" x2="${g.right - 18}" y2="${g.axisY}" stroke="${C.ink}" stroke-width="3"/>`)
  o.push(`<polygon points="${g.right},${g.axisY} ${g.right - 24},${g.axisY - 11} ${g.right - 24},${g.axisY + 11}" fill="${C.ink}"/>`)
  if (bare) return o.join('\n') // lines only: no stage names, no side label
  STAGES.forEach((s, i) => {
    o.push(`<text class="axis" x="${g.x(s) + 10}" y="${g.axisY + lh + 4}" font-size="${lh}">${esc(stageNames[i])}</text>`)
  })
  // Side label, rotated, reading upwards from the bottom of the plot.
  const sx = g.left - 18, sy = g.axisY - 10
  o.push(`<text class="axis" transform="translate(${sx},${sy}) rotate(-90)" x="0" y="0" font-size="${lh}">${esc(sideLabel)}</text>`)
  // Arrow drawn, not typed: the bundled font has no arrow glyph, and a fallback font would differ between machines.
  const ay = sy - textWidth(sideLabel, lh, 700) - 30, ax = sx - lh * 0.36
  o.push(`<line x1="${ax}" y1="${ay}" x2="${ax}" y2="${ay - 34}" stroke="#444" stroke-width="4"/>`)
  o.push(`<polygon points="${ax},${ay - 50} ${ax - 10},${ay - 30} ${ax + 10},${ay - 30}" fill="#444"/>`)
  return o.join('\n')
}

// ---- label placement -------------------------------------------------------------------------------------------

const boxArea = (a, b) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}
// Length of a segment inside a box (Liang-Barsky clip).
function segInBox(s, b) {
  let t0 = 0, t1 = 1
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1
  const clip = (p, q) => {
    if (p === 0) return q >= 0
    const r = q / p
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r } else { if (r < t0) return false; if (r < t1) t1 = r }
    return true
  }
  if (clip(-dx, s.x1 - b.x) && clip(dx, b.x + b.w - s.x1) && clip(-dy, s.y1 - b.y) && clip(dy, b.y + b.h - s.y1))
    return Math.max(0, t1 - t0) * Math.hypot(dx, dy)
  return 0
}

export function labelBox(text, x, y, weight = 500, size = FONT.label) {
  // x,y is the text baseline start; box covers ascender to descender with a little pad for the halo.
  const w = textWidth(text, size, weight)
  return { x: x - 4, y: y - size * 0.82, w: w + 8, h: size * 1.08 }
}

function candidates(item) {
  const { x, y, r, text, weight } = item
  const s = FONT.label, w = textWidth(text, s, weight), gap = 12, R = r + gap
  const base = s * 0.34 // baseline offset that vertically centres the cap height on y
  const out = []
  for (const [dx, dy, extra] of [[0, 0, 0], [0, -22, 1], [0, 22, 1], [16, 0, 1]]) {
    out.push(
      { k: 'E', tx: x + R + dx, ty: y + base + dy, cost: 0 + extra },
      { k: 'W', tx: x - R - w - dx, ty: y + base + dy, cost: 1 + extra },
      { k: 'S', tx: x - w / 2 + dy * 3, ty: y + R + s * 0.72 + dx, cost: 2 + extra },
      { k: 'N', tx: x - w / 2 + dy * 3, ty: y - R - dx, cost: 2 + extra },
      { k: 'SE', tx: x + r * 0.6 + dy, ty: y + R + s * 0.66 + dx, cost: 3 + extra },
      { k: 'NE', tx: x + r * 0.6 + dy, ty: y - R + 2 - dx, cost: 3 + extra },
      { k: 'SW', tx: x - r * 0.6 - w + dy, ty: y + R + s * 0.66 + dx, cost: 3 + extra },
      { k: 'NW', tx: x - r * 0.6 - w + dy, ty: y - R + 2 - dx, cost: 3 + extra },
    )
  }
  return out.map(c => ({ ...c, box: labelBox(text, c.tx, c.ty, weight) }))
}

/**
 * Greedy placement plus a few rounds of local repair.
 * items: [{id, text, x, y, r, weight}], obstacles: {segments, boxes, dots}, bounds: box.
 */
export function placeLabels(items, { segments = [], boxes = [], dots = [], bounds, clamp = false }) {
  // clamp: slide a label sideways until it is inside the bounds. For small maps, where a long name can't sit beside its dot.
  const fit = c => {
    if (!clamp) return c
    const dx = Math.max(bounds.x - c.box.x, 0) + Math.min(bounds.x + bounds.w - (c.box.x + c.box.w), 0)
    return dx ? { ...c, tx: c.tx + dx, box: { ...c.box, x: c.box.x + dx }, cost: c.cost + 1 } : c
  }
  // An item may pin its side (it.side = 'E', 'W', 'N', 'S'...), for the small maps where the layout is set by hand.
  const cands = items.map(it => candidates(it).filter(c => !it.side || c.k === it.side).map(fit))
  const cost = (i, c, chosen) => {
    let k = c.cost * 30
    const b = c.box
    if (b.x < bounds.x || b.y < bounds.y || b.x + b.w > bounds.x + bounds.w || b.y + b.h > bounds.y + bounds.h) k += 1e6
    const bm = { x: b.x - 8, y: b.y - 6, w: b.w + 16, h: b.h + 12 }
    for (const s of segments) k += segInBox(s, b) * 40 + segInBox(s, bm) * 10
    for (const o of boxes) k += boxArea(b, o) * 50
    for (const d of dots) k += boxArea(b, { x: d.x - d.r - 4, y: d.y - d.r - 4, w: 2 * d.r + 8, h: 2 * d.r + 8 }) * 200
    chosen.forEach((o, j) => { if (j !== i && o) k += boxArea(b, o.box) * 200 })
    return k
  }
  const chosen = items.map(() => null)
  const order = items.map((_, i) => i)
  for (const i of order) chosen[i] = cands[i].reduce((best, c) => (cost(i, c, chosen) < cost(i, best, chosen) ? c : best))
  for (let round = 0; round < 6; round++) {
    let changed = false
    for (const i of order) {
      const best = cands[i].reduce((b, c) => (cost(i, c, chosen) < cost(i, b, chosen) ? c : b))
      if (best !== chosen[i]) { chosen[i] = best; changed = true }
    }
    if (!changed) break
  }
  const each = items.map((it, i) => [it.id, chosen[i].k, Math.round(cost(i, chosen[i], chosen))])
  const total = each.reduce((s, e) => s + e[2], 0)
  const report = each.map(e => `  ${e[0]}: ${e[1]} ${e[2]}`).join('\n')
  return { placed: Object.fromEntries(items.map((it, i) => [it.id, chosen[i]])), total, report }
}

// ---- frames ----------------------------------------------------------------------------------------------------

const DOT_R = 15
const GHOST_R = 20 // the supposed position: bigger and bolder so it survives hall glare, still gray
export const INERTIA_NOTE = 'holds still'

/** Collect drawable geometry of one parsed map. */
export function sceneOf(map, g) {
  const nodes = {}
  for (const a of map.anchors) nodes[a.name] = { name: a.name, kind: 'anchor', x: g.x(a.maturity), y: g.y(a.visibility) }
  for (const c of map.components) nodes[c.name] = { name: c.name, kind: 'component', x: g.x(c.maturity), y: g.y(c.visibility), inertia: c.inertia }
  const supposed = map.evolved.map(e => {
    const from = nodes[e.name]
    return { from: e.name, name: e.override || e.name, x: g.x(e.maturity), y: from.y }
  })
  const links = map.links.map(l => ({ a: nodes[l.start], b: nodes[l.end] })).filter(l => l.a && l.b)
  return { nodes, supposed, links }
}

const anchorBox = n => {
  const w = textWidth(n.name, FONT.label, 700)
  return { x: n.x - w / 2 - 4, y: n.y - FONT.label * 0.82, w: w + 8, h: FONT.label * 1.08 }
}
// Links leave an anchor from the bottom of its text, and a dot from its edge.
function linkEnds(l) {
  const p = n => n.kind === 'anchor' ? { x: n.x, y: n.y + FONT.label * 0.3 } : { x: n.x, y: n.y }
  const a = p(l.a), b = p(l.b)
  const trim = (n, from, to) => {
    if (n.kind === 'anchor') return from
    const d = Math.hypot(to.x - from.x, to.y - from.y) || 1
    return { x: from.x + (to.x - from.x) / d * DOT_R, y: from.y + (to.y - from.y) / d * DOT_R }
  }
  const s = trim(l.a, a, b), e = trim(l.b, b, a)
  return { x1: s.x, y1: s.y, x2: e.x, y2: e.y }
}

const inertiaBox = n => ({ x: n.x + DOT_R + 12, y: n.y - 32, w: 14, h: 64 })
// The bar's key, written above it so the slide explains the mark without the speaker.
const inertiaNote = n => { const b = inertiaBox(n); return { tx: b.x - 6, ty: b.y - 14 } }

/**
 * Place labels once for a whole sequence of frames, so no label jumps between frames.
 * scenes: sceneOf() for every frame. reserved: boxes any frame keeps clear.
 */
export function placeSequence(scenes, g, reserved = [], { mini = false, sides = {} } = {}) {
  const nodes = {}, supposed = {}, segs = new Map(), boxes = [...reserved]
  for (const s of scenes) {
    Object.assign(nodes, s.nodes)
    for (const e of s.supposed) supposed[e.name] = e
    for (const l of s.links) { const k = `${l.a.name}->${l.b.name}`; segs.set(k, linkEnds(l)) }
  }
  for (const e of Object.values(supposed)) {
    const f = nodes[e.from]
    segs.set(`evolve:${e.name}`, { x1: f.x + DOT_R, y1: f.y, x2: e.x - GHOST_R, y2: e.y })
  }
  for (const n of Object.values(nodes)) {
    if (n.kind === 'anchor') boxes.push(anchorBox(n))
    if (n.inertia) { boxes.push(inertiaBox(n)); if (!mini) { const t = inertiaNote(n); boxes.push(labelBox(INERTIA_NOTE, t.tx, t.ty, 500)) } }
  }
  const dots = [...Object.values(nodes).filter(n => n.kind === 'component'), ...Object.values(supposed)]
    .map(n => ({ x: n.x, y: n.y, r: (n.from ? GHOST_R : DOT_R) + 8 }))
  const items = [
    ...Object.values(nodes).filter(n => n.kind === 'component').map(n => ({ id: n.name, text: n.name, x: n.x, y: n.y, r: DOT_R + 12, weight: 700 })),
    ...Object.values(supposed).filter(e => !mini || e.name !== e.from).map(e => ({ id: `~${e.name}`, text: e.name, x: e.x, y: e.y, r: GHOST_R + 12, weight: 700 })),
  ]
  const bx = mini ? g.left + 8 : 0 // a small map keeps its labels off the side axis
  const bounds = { x: bx, y: 0, w: g.width - bx, h: g.axisY - 2 }
  for (const it of items) if (sides[it.id]) it.side = sides[it.id]
  return placeLabels(items, { segments: [...segs.values()], boxes, dots, bounds, clamp: mini })
}

/** Draw one frame. highlight: component name. placed: from placeSequence. */
export function drawFrame(map, g, placed, { highlight, mini = false } = {}) {
  const scene = sceneOf(map, g)
  const o = [axes(g, map.evolution.map(e => e.line1), { bare: mini })]
  const isHi = n => n === highlight
  for (const l of scene.links) {
    const s = linkEnds(l)
    o.push(`<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${C.link}" stroke-width="4"/>`)
  }
  // Supposed moves: links stay on the origin, the new position is a dashed ghost with a dashed arrow.
  for (const e of scene.supposed) {
    const f = scene.nodes[e.from], hi = isHi(e.from), col = hi ? C.accent : C.ghost
    const x1 = f.x + DOT_R + 8, x2 = e.x - GHOST_R - 10
    o.push(`<line x1="${x1}" y1="${f.y}" x2="${x2 - 22}" y2="${e.y}" stroke="${col}" stroke-width="${hi ? 6 : 4}" stroke-dasharray="16 10"/>`)
    o.push(`<polygon points="${x2},${e.y} ${x2 - 28},${e.y - 13} ${x2 - 28},${e.y + 13}" fill="${col}"/>`)
    o.push(`<circle cx="${e.x}" cy="${e.y}" r="${GHOST_R}" fill="${C.paper}" stroke="${col}" stroke-width="6" stroke-dasharray="10 5"/>`)
    const p = placed[`~${e.name}`] // a small map leaves an unnamed move unlabeled: the arrow is enough
    if (p) o.push(`<text class="lbl${hi ? ' hi' : ' ghost'}" x="${p.tx}" y="${p.ty}" font-size="${FONT.label}">${esc(e.name)}</text>`)
  }
  for (const n of Object.values(scene.nodes)) {
    if (n.kind === 'anchor') {
      o.push(`<text class="lbl anchor" x="${n.x}" y="${n.y}" text-anchor="middle" font-size="${FONT.label}">${esc(n.name)}</text>`)
      continue
    }
    const hi = isHi(n.name)
    if (hi) {
      o.push(`<circle cx="${n.x}" cy="${n.y}" r="${DOT_R + 9}" fill="none" stroke="${C.accent}" stroke-width="5"/>`)
      o.push(`<circle cx="${n.x}" cy="${n.y}" r="${DOT_R}" fill="${C.accent}" stroke="${C.paper}" stroke-width="3"/>`)
    } else {
      o.push(`<circle cx="${n.x}" cy="${n.y}" r="${DOT_R}" fill="${C.paper}" stroke="${C.ink}" stroke-width="5"/>`)
    }
    if (n.inertia) {
      const b = inertiaBox(n)
      o.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${hi ? C.accent : C.ink}"/>`)
      const t = inertiaNote(n)
      if (!mini) o.push(`<text class="lbl note${hi ? ' hi' : ''}" x="${t.tx}" y="${t.ty}" font-size="${FONT.label}">${INERTIA_NOTE}</text>`)
    }
    const p = placed[n.name]
    o.push(`<text class="lbl${hi ? ' hi' : ''}" x="${p.tx}" y="${p.ty}" font-size="${FONT.label}">${esc(n.name)}</text>`)
  }
  return o.join('\n')
}

export const svgOpen = (g, label) =>
  `<svg class="map-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.width} ${g.height}" width="${g.width}" height="${g.height}" role="img" aria-label="${esc(label)}">`
