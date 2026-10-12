import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {CollectionFooter, CollectionHeader} from '@/components/collection-chrome'
import {DisableDraftMode} from '@/components/disable-draft-mode'
import {V2Collection} from '@/components/v2-collection'
import {getRoutes} from '@/lib/content'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Electrical Services in Chicago',
  description: 'Highlights Chicago electrical service pages for installations, repairs, protection, power and lighting.',
  // Test collection: keep it out of search until it replaces the live pages.
  robots: {index: false, follow: false},
}

export default async function HomePage() {
  const draft = (await draftMode()).isEnabled
  const pages = await getRoutes(draft)
  return (
    <div className="collection-page">
      {draft && <DisableDraftMode />}
      <CollectionHeader />
      <main>
        <section className="collection-hero">
          <div className="collection-wrap v2-hero">
            <p className="collection-hero-kicker">Licensed Chicago electricians</p>
            <h1>Electrical services built around Chicago</h1>
            <p>Service-specific guidance on what each job involves, what drives the price and how the permit works, for Chicago homes and businesses.</p>
            <div className="collection-hero-actions">
              <a href="#service-directory-title">Explore services</a>
              <a href="tel:+17732623333">Call (773) 262-3333</a>
            </div>
          </div>
        </section>
        <V2Collection pages={pages} />
      </main>
      <CollectionFooter />
    </div>
  )
}
