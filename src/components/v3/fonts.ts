import {Inter, Space_Grotesk} from 'next/font/google'

// Design System v3: two families only. Inter keeps its optical-size axis so `opsz`
// can be pinned. Both are set on the template's .ds wrapper, not the root layout,
// so the current design's pages keep the layout's Inter exactly as before.
// Not preloaded: the current pages share this route and would download them unused.
const dsInter = Inter({subsets: ['latin'], variable: '--font-inter', axes: ['opsz'], display: 'swap', preload: false})
const dsSpaceGrotesk = Space_Grotesk({subsets: ['latin'], weight: ['500', '600'], variable: '--font-space-grotesk', display: 'swap', preload: false})

export const dsFontVariables = `${dsInter.variable} ${dsSpaceGrotesk.variable}`
