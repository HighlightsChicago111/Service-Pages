import type {Metadata} from 'next'
import {CollectionFooter, CollectionHeader} from '@/components/collection-chrome'
import {CollectionItem, ServiceCollection} from '@/components/service-collection'
import {sanityFetch} from '@/sanity/lib/live'
import {SERVICE_INDEX_QUERY} from '@/sanity/lib/queries'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Electrical Services in Chicago',
  description: 'Explore Highlights Chicago electrical service pages for installations, repairs, protection, power, lighting, and more.',
  alternates: {canonical: 'https://www.highlightschicago.com/services'},
}

export default async function HomePage() {
  const {data} = await sanityFetch({query: SERVICE_INDEX_QUERY, stega: false})
  const pages = (data || []) as CollectionItem[]
  return (
    <div className="collection-page">
      <CollectionHeader />
      <main>
        <section className="collection-hero">
          <div className="collection-wrap collection-hero-grid">
            <div>
              <p className="collection-hero-kicker">Licensed Chicago electricians</p>
              <h1>Electrical services built around Chicago</h1>
              <p>Explore service-specific guidance for safer installations, dependable repairs, and code-conscious electrical work across Chicago homes and businesses.</p>
              <div className="collection-hero-actions">
                <a href="#service-directory-title">Explore services</a>
                <a href="https://www.highlightschicago.com/contact-us">Contact us</a>
              </div>
            </div>
            <div className="collection-hero-panel" aria-label={`${pages.length} available local service pages`}>
              <span>Service library</span>
              <strong>{pages.length}</strong>
              <p>Local service pages and growing</p>
              <a href="tel:7732623333">Talk with an electrician <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
        <ServiceCollection pages={pages} />
        <section className="collection-trust-band">
          <div className="collection-wrap">
            <p>Why Highlights Chicago</p>
            <div><strong>12+</strong><span>Years serving Chicagoland</span></div>
            <div><strong>2,500+</strong><span>Projects completed</span></div>
            <div><strong>Licensed</strong><span>Safety- and code-focused work</span></div>
            <a href="https://www.highlightschicago.com/about-us">Meet the company <span aria-hidden="true">→</span></a>
          </div>
        </section>
      </main>
      <CollectionFooter />
    </div>
  )
}
