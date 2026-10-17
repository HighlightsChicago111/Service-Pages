/* eslint-disable @next/next/no-img-element -- Crawlable local imagery is intentionally rendered without Next's generated image wrapper. */
import type {Metadata} from 'next'
import {CollectionFooter, CollectionHeader} from '@/components/collection-chrome'
import {ClusterDirectory, publishedServices, serviceCardsBySlug} from '@/components/service-clusters'
import {serviceClusters} from '@/lib/clusters'
import {fetchServiceIndex} from '@/lib/service-page'

// Re-read Sanity at most a minute after a page is published or unpublished.
export const revalidate = 60
export const metadata: Metadata = {
  title: 'Electrical Services in Chicago',
  description: 'Explore Highlights Chicago electrical service pages for installations, repairs, protection, power, lighting, and more.',
  alternates: {canonical: 'https://www.highlightschicago.com/services'},
}

export default async function HomePage() {
  // Both designs, one card per URL (a published new-design page wins). Not the live
  // fetcher: its cache only refreshes while <SanityLive> runs (draft mode), so
  // visitors would keep the pages from the last deploy.
  const cards = serviceCardsBySlug(await fetchServiceIndex())
  const groupCount = serviceClusters.filter((cluster) => publishedServices(cluster, cards).length > 0).length
  return (
    <div className="collection-page">
      <CollectionHeader />
      <main>
        <section className="collection-hero collection-hero--photo">
          <img className="collection-hero-bg" src="/services/images/services/electrical-panel-upgrade.jpg" alt="Electrical panel upgrade service by Highlights Chicago" decoding="async" fetchPriority="high" />
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
            <div className="collection-hero-panel" aria-label={`${groupCount} electrical service categories`}>
              <span>Service categories</span>
              <strong>{groupCount}</strong>
              <p>Categories covering {cards.size} electrical services across Chicago</p>
              <a href="https://www.highlightschicago.com/contact-us">Talk with an electrician <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
        <ClusterDirectory cards={cards} />
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
