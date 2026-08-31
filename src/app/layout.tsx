import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {DisableDraftMode} from '@/components/disable-draft-mode'
import {siteUrl} from '@/sanity/env'
import {SanityLive} from '@/sanity/lib/live'
import './globals.css'

const inter = Inter({subsets: ['latin'], variable: '--font-inter', display: 'swap'})

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

export default async function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  const draft = await draftMode()
  return (
    <html lang="en">
      <body className={inter.variable}>
        {children}
        <SanityLive />
        {draft.isEnabled && <><VisualEditing /><DisableDraftMode /></>}
      </body>
    </html>
  )
}
