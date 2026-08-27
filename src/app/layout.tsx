import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {DisableDraftMode} from '@/components/disable-draft-mode'
import {SanityLive} from '@/sanity/lib/live'
import './globals.css'

export const metadata: Metadata = {
  title: {default: 'Highlights Chicago Service Pages', template: '%s | Highlights Chicago'},
  description: 'Licensed electrical services across Chicago.',
}

export default async function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  const draft = await draftMode()
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
        {draft.isEnabled && <><VisualEditing /><DisableDraftMode /></>}
      </body>
    </html>
  )
}
