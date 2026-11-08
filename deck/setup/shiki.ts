import { defineShikiSetup } from '@slidev/types'

// Minimal OWM grammar. Shiki fails the whole build on an unknown language, so `owm` must be registered here.
const owm = {
  name: 'owm',
  scopeName: 'source.owm',
  patterns: [
    { match: '^(evolve|component|anchor|pipeline|note|title|style|evolution)\\b', name: 'keyword.control' },
    { match: '->', name: 'keyword.operator' },
    { match: '-?\\d*\\.\\d+', name: 'constant.numeric' },
    { match: '\\b(inertia|label)\\b', name: 'storage.modifier' },
  ],
}

export default defineShikiSetup(() => ({
  themes: { light: 'github-light', dark: 'github-light' },
  langs: ['md', 'markdown', owm as any],
}))
