/* eslint-disable @next/next/no-img-element -- Local service imagery is intentionally rendered as crawlable HTML. */

import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {CollectionFooter, CollectionHeader} from '@/components/collection-chrome'
import {ServiceCollection, type CollectionItem} from '@/components/service-collection'
import {prepareCollectionItems} from '@/lib/collection-items'
import {clusterBySlug, routeByServiceId} from '@/lib/service-hierarchy'
import {sanityFetch} from '@/sanity/lib/live'
import {SERVICE_INDEX_QUERY} from '@/sanity/lib/queries'

export const revalidate = 60
type Props = {params: Promise<{clusterSlug: string}>}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {clusterSlug} = await params
  const cluster = clusterBySlug(clusterSlug)
  if (!cluster) return {}
  return {
    title: `${cluster.name} Services in Chicago`,
    description: cluster.description,
    alternates: {canonical: `https://www.highlightschicago.com/services/${cluster.slug}`},
  }
}

export default async function ClusterPage({params}: Props) {
  const {clusterSlug} = await params
  const cluster = clusterBySlug(clusterSlug)
  if (!cluster) notFound()
  const {data} = await sanityFetch({query: SERVICE_INDEX_QUERY, stega: false})
  const pages = (data || []) as CollectionItem[]
  const clusterPages = prepareCollectionItems(pages).filter((page) => routeByServiceId(page.serviceId)?.clusterSlug === cluster.slug)
  const representative = clusterPages[0]

  return (
    <div className="collection-page cluster-page">
      <CollectionHeader />
      <main>
        <nav className="collection-breadcrumbs collection-wrap" aria-label="Breadcrumb">
          <ol><li><a href="https://www.highlightschicago.com/">Home</a></li><li><Link href="/">Services</Link></li><li aria-current="page">{cluster.name}</li></ol>
        </nav>
        <section className="collection-hero cluster-hero">
          <div className="collection-wrap collection-hero-grid">
            <div>
              <p className="collection-hero-kicker">Chicago service cluster</p>
              <h1>{cluster.name}</h1>
              <p>{cluster.description}</p>
              <div className="collection-hero-actions"><a href="#service-directory-title">View services</a><a href="https://www.highlightschicago.com/contact-us">Contact us</a></div>
            </div>
            <div className="collection-hero-panel cluster-hero-panel" aria-label={`${clusterPages.length} published services in ${cluster.name}`}>
              {representative?.cardImage && <img className="collection-hero-panel-image" src={representative.cardImage} alt={`${cluster.name} electrical work in Chicago`} decoding="async" />}
              <span>Published in this cluster</span>
              <strong>{clusterPages.length}</strong>
              <p>{cluster.plannedServiceCount} services identified in the content plan</p>
              <Link href="/">View all clusters <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>
        <ServiceCollection
          pages={pages}
          clusterSlug={cluster.slug}
          heading={`${cluster.name} services`}
          description={`Choose a completed ${cluster.name.toLowerCase()} service page for Chicago-specific scope, costs, permits, reviews, and FAQs.`}
          emptyMessage={`${cluster.name} is included in the approved content plan. Its first service landing page has not been published yet.`}
        />
      </main>
      <CollectionFooter />
    </div>
  )
}
