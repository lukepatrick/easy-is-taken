# Deck

The 13-slide deck for *Easy Is Taken*, built with [Slidev](https://sli.dev). It runs offline: fonts are bundled, both QR codes are drawn at build time, and the build makes no off-origin requests.

- **Slides:** [`easy-is-taken.pdf`](easy-is-taken.pdf), one page per click, or [`screenshots/`](screenshots/).
- **No server needed:** `fallback.html` holds every screenshot in one file. Arrow keys or a click step through it.

## Run it

Needs Node, [`cli-owm`](https://www.npmjs.com/package/cli-owm) on the PATH, and Chrome at `/usr/bin/google-chrome` for screenshots and the PDF. From the repo root, `make` lists shortcuts; `make install` then `make present` is the usual path. The npm scripts underneath:

| Command | What it does |
|---|---|
| `npm ci --ignore-scripts` | Install, using the system Chrome in place of a Playwright download |
| `npm run dev` | Live dev server on port 3030 |
| `npm run build` | Static bundle in `dist/` |
| `npm run serve` | Serve `dist/` on <http://127.0.0.1:8765>. Presenter view is at `/#/presenter/1` |
| `npm run shoot` | With `serve` running, a 1920x1080 PNG of every slide and click state |
| `npm run fallback` | Rebuild `fallback.html` from the screenshots |
| `npm run export:pdf` | Rebuild `easy-is-taken.pdf` |

## Where things live

| File | What it holds |
|---|---|
| `content.md` | The words: speaker notes, the closing lines, the slide 5 tiles and the quotes on screen, each traced to its source |
| `maps/*.owm` | The four climate frames. `// @headline`, `@question` and `@highlight` comments set each slide |
| `maps/endings/*.owm` | Six small maps for slide 12, one per scenario, cut down from each scenario's last frame |
| `slides.src.md` | The slide template. `build/build.mjs` fills it in to make `slides.md`, which is generated |
| `build/render-map.mjs` | Draws each map as SVG in slide pixels, after cli-owm parses it |
| `style.css` | Theme. Nothing on screen is under 38px (28pt on a 1920x1080 TV) |
| `public/cnpe-logo.svg` | The [CNPE community](https://github.com/Cloud-Native-Platform-Engineering/cnpe-community) logo (Apache-2.0). The accent pink and blue come from the same site |

## How the maps are drawn

- **One geometry for all four frames,** so no dot or label moves between them.
- **One highlight per frame:** an accent dot with a ring and an accent label, so it doesn't rely on color alone.
- **The supposed move** (`evolve Writing software->Supposed utility 0.85`) leaves every link on the original dot and draws the new position as a dashed ghost, so it reads as supposed.
- **Inertia** is a bar labeled "holds still".
