// Drives system Chrome over CDP: one 1920x1080 PNG per slide and click state, and a log of every request.
// node shoot.mjs <url> <outdir> "<pages e.g. 1 2 3 4:0 4:1 5>" [--offline]
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [base, outDir, pagesArg] = process.argv.slice(2)
const offline = process.argv.includes('--offline')
mkdirSync(outDir, { recursive: true })
const flags = ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run', '--remote-debugging-port=0',
  `--user-data-dir=${mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'cdp-'))}`, '--window-size=1920,1080', '--force-device-scale-factor=1',
  ...(offline ? ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'] : []), 'about:blank']
const t0 = performance.now()
const chrome = spawn('/usr/bin/google-chrome', flags, { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TMPDIR: '/tmp' } }) // Chrome's socket path must stay short
const wsUrl = await new Promise(res => {
  let buf = ''; chrome.stderr.on('data', c => { buf += c; const m = buf.match(/DevTools listening on (ws:\S+)/); if (m) res(m[1]) })
})
const ws = new WebSocket(wsUrl); await new Promise(r => ws.addEventListener('open', r))
let id = 0; const wait = new Map(), reqs = [], failed = []
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; wait.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId }))
})
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data)
  if (m.id && wait.has(m.id)) { const w = wait.get(m.id); wait.delete(m.id); m.error ? w.rej(new Error(m.error.message)) : w.res(m.result) }
  if (m.method === 'Network.requestWillBeSent') reqs.push(m.params.request.url)
  if (m.method === 'Network.loadingFailed') failed.push(`${m.params.errorText} ${m.params.requestId}`)
})
const sleep0 = ms => new Promise(r => setTimeout(r, ms))
await sleep0(400) // the initial about:blank target is not attachable straight away
const { targetInfos } = await send('Target.getTargets')
const { targetId } = targetInfos.find(t => t.type === 'page')
const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, s); await send('Network.enable', {}, s); await send('Runtime.enable', {}, s)
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false }, s)
const evalJs = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, s)).result.value
const sleep = ms => new Promise(r => setTimeout(r, ms))

let first = true
for (const p of pagesArg.split(/\s+/)) {
  const [n, c] = p.split(':')
  const url = `${base}/#/${n}${c !== undefined ? `?clicks=${c}` : ''}`
  await send('Page.navigate', { url }, s)
  await sleep(first ? 500 : 50) // a Runtime call during the document swap fails with 'Not attached'
  for (let i = 0; i < 200; i++) { if (await evalJs(`!!document.querySelector('.slidev-page')`).catch(() => false)) break; await sleep(25) }
  if (first) { console.log(`first paint path: ${Math.round(performance.now() - t0)} ms from Chrome launch`); first = false }
  await sleep(100)
  await evalJs(`Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => 1)`)
  await sleep(1300) // transitions and Magic Move settle
  const { data } = await send('Page.captureScreenshot', { format: 'png' }, s)
  writeFileSync(`${outDir}/slide-${n.padStart(2, '0')}${c !== undefined ? `-click${c}` : ''}.png`, Buffer.from(data, 'base64'))
}
if (process.env.KEYWALK) { // real key events through the built deck, clicker-style
  await send('Page.navigate', { url: `${base}/#/1` }, s); await sleep(800)
  const trail = []
  for (let i = 0; i < 11; i++) {
    trail.push(await evalJs('location.hash'))
    const key = { key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 }
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...key }, s); await send('Input.dispatchKeyEvent', { type: 'keyUp', ...key }, s)
    await sleep(1100)
  }
  console.log(trail.join(' ')); console.log('after last key', await evalJs('location.hash'))
}
const uniq = [...new Set(reqs)].filter(u => !u.startsWith('data:'))
const ext = uniq.filter(u => !u.startsWith(base) && !u.startsWith('about:'))
console.log(`requests: ${uniq.length} unique, ${ext.length} off-origin, ${failed.length} failed`)
ext.forEach(u => console.log('  OFF-ORIGIN', u))
writeFileSync(`${outDir}/requests.log`, uniq.join('\n') + '\n')
await send('Browser.close').catch(() => {}); chrome.kill()
process.exit(0)
