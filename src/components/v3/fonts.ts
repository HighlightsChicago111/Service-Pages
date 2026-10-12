import {Space_Grotesk} from 'next/font/google'

// Design System v3 uses two families. Body text is Inter, which the root layout
// already loads; the v3 stylesheet pins Inter's optical size to 14, which is how
// the layout's Inter (loaded without the opsz axis) already draws. Loading a second
// Inter with the opsz axis would register another "Inter" font for the whole page
// and change the current pages' headings, so there is only one.
// Space Grotesk is set on the template's .ds wrapper. Not preloaded: the current
// pages share this route and would download it unused.
const dsSpaceGrotesk = Space_Grotesk({subsets: ['latin'], weight: ['500', '600'], variable: '--font-space-grotesk', display: 'swap', preload: false})

export const dsFontVariables = dsSpaceGrotesk.variable
