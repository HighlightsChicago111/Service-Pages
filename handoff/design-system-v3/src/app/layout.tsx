import type {Metadata} from 'next'
import {Inter, Space_Grotesk} from 'next/font/google'
import {siteUrl} from '@/sanity/env'
import './globals.css'
import './design-system-v3.css'

// Design System v3: two families only. Inter keeps its optical-size axis so `opsz` can be pinned.
const inter = Inter({subsets: ['latin'], variable: '--font-inter', axes: ['opsz'], display: 'swap'})
const spaceGrotesk = Space_Grotesk({subsets: ['latin'], weight: ['500', '600'], variable: '--font-space-grotesk', display: 'swap'})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {default: 'Highlights Chicago Service Pages', template: '%s | Highlights Chicago'},
  description: 'Licensed electrical services across Chicago.',
  icons: {
    icon: [
      {url: '/services/icons/highlights-chicago-32.png', type: 'image/png', sizes: '32x32', media: '(prefers-color-scheme: light)'},
      {url: '/services/icons/highlights-chicago-32.png', type: 'image/png', sizes: '32x32', media: '(prefers-color-scheme: dark)'},
      {url: '/services/icons/highlights-chicago-48.png', type: 'image/png', sizes: '48x48'},
      {url: '/services/icons/highlights-chicago-192.png', type: 'image/png', sizes: '192x192'},
      {url: '/services/icons/highlights-chicago-512.png', type: 'image/png', sizes: '512x512'},
    ],
    apple: [{url: '/services/icons/highlights-chicago-180.png', type: 'image/png', sizes: '180x180'}],
  },
}

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  )
}
