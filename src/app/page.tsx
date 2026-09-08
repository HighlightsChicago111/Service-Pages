/* eslint-disable @next/next/no-img-element -- Crawlable local imagery is intentionally rendered without Next's generated image wrapper. */
import type {Metadata} from 'next'
import {CollectionFooter, CollectionHeader} from '@/components/collection-chrome'
import {ClusterCollection} from '@/components/cluster-collection'
import type {CollectionItem} from '@/components/service-collection'
import {sanityFetch} from '@/sanity/lib/live'
import {SERVICE_INDEX_QUERY} from '@/sanity/lib/queries'
import {serviceClusters} from '@/lib/service-hierarchy'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Electrical Services in Chicago',
  description: 'Explore Highlights Chicago electrical services by category, from power distribution and lighting to safety, backup power, EV charging, and low voltage.',
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
              <h1>Chicago electrical services, organized by system</h1>
              <p>Choose a service cluster first, then find the exact installation, repair, replacement, inspection, or upgrade for your property.</p>
              <div className="collection-hero-actions">
                <a href="#cluster-directory-title">Explore clusters</a>
                <a href="https://www.highlightschicago.com/contact-us">Contact us</a>
              </div>
            </div>
            <div className="collection-hero-panel" aria-label={`${serviceClusters.length} service clusters with ${pages.length} available local service pages`}>
              <img className="collection-hero-panel-image" src="/services/images/services/electrical-panel-upgrade.jpg" alt="Electrical panel upgrade service by Highlights Chicago" decoding="async" />
              <span>Electrical service tree</span>
              <strong>{serviceClusters.length}</strong>
              <p>Clusters connecting {pages.length} published service pages</p>
              <a href="tel:7732623333">Talk with an electrician <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
        <ClusterCollection pages={pages} />
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
