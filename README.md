# Easy Is Taken

**What's left for platforms when software is a utility?** This repo backs a 10-minute lightning talk by Luke Philips. It holds [six scenarios](scenarios/README.md) for where platform engineering might go, each a Wardley map changing frame by frame, and the research behind them.

> **Starting point:** Steve Fenton's post ["Easy is taken"](https://stevefenton.co.uk/blog/2026/10/easy-is-taken/) gave this talk its phrase and idea. I read it as writing software becoming a utility. That's my supposition; neither Fenton nor Wardley says it. Four scenarios run with it and two push back.

## Start here

- **[The six scenarios](scenarios/README.md),** one page each. The talk walked [climate](scenarios/climate.md).
- **[The slides](deck/easy-is-taken.pdf)** as a PDF.

## The maps are text

Every map is an [OnlineWardleyMaps](https://onlinewardleymaps.com) `.owm` file, the format of [swardley/WARDLEY-MAP-REPOSITORY](https://github.com/swardley/WARDLEY-MAP-REPOSITORY). Fork one, move a component and see whether you agree with where it lands. Paste a file into [onlinewardleymaps.com](https://onlinewardleymaps.com), open it with the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=damonsk.vscode-wardley-maps), or render it with [cli-owm](https://www.npmjs.com/package/cli-owm).

## What's here

| Path | What |
|---|---|
| [`scenarios/`](scenarios/README.md) | The six scenarios |
| [`maps/candidates/`](maps/candidates/) | Every frame of every scenario as an editable `.owm` file, with a preview image |
| [`deck/`](deck/README.md) | The Slidev deck. `make present` runs it |
| [`tools/render_owm.py`](tools/render_owm.py) | Dependency-free preview renderer (`make previews`) |

## Credits

Presented at the CNCF Platform Engineering Community booth, KubeCon + CloudNativeCon North America 2026, Salt Lake City, 10 Nov 2026. "Easy is taken" is Steve Fenton's phrase and idea. Wardley mapping is Simon Wardley's. The readings, the maps and any mistakes are mine. Find me at [linktr.ee/lukephilips](https://linktr.ee/lukephilips).

## License

- **Maps, writing and slides:** [CC BY-SA 4.0](LICENSE), the license Wardley Maps are published under. Share and adapt them, with credit, under the same license.
- **Code:** [MIT](LICENSE-CODE). That covers the `Makefile`, `tools/`, and the deck's `build/`, `setup/`, `style.css` and `package.json`.
- **The CNPE logo** in `deck/public/` is the community's own, under its repo's Apache-2.0 license.
