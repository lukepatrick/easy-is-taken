// One HTML file, no server, no network: every screenshot as a data URI, arrow keys or a click to step. Opens from file://.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
const pngs = readdirSync('screenshots').filter(f => f.endsWith('.png')).sort()
if (!pngs.length) throw new Error('no screenshots: run `npm run shoot` first')
const imgs = pngs.map(f => `<img src="data:image/png;base64,${readFileSync(`screenshots/${f}`).toString('base64')}" alt="${f}">`).join('\n')
writeFileSync('fallback.html', `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Easy Is Taken (fallback)</title>
<style>html,body{margin:0;height:100%;background:#fff}img{display:none;width:100vw;height:100vh;object-fit:contain}img.on{display:block}</style>
${imgs}
<script>const s=[...document.images];let i=Math.max(0,+location.hash.slice(1)||0);const go=n=>{i=Math.min(s.length-1,Math.max(0,n));s.forEach((e,k)=>e.classList.toggle('on',k===i));location.hash=i};
addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key))go(i+1);if(['ArrowLeft','PageUp'].includes(e.key))go(i-1)});addEventListener('click',()=>go(i+1));go(i)</script>`)
console.log(`fallback.html: ${pngs.length} slides`)
