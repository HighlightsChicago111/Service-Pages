/* eslint-disable @next/next/no-img-element -- Local service imagery is intentionally rendered as crawlable HTML. */

import Link from 'next/link'
import {prepareCollectionItems, type CollectionItem} from '@/lib/collection-items'
import {routeByServiceId, serviceClusters} from '@/lib/service-hierarchy'

export function ClusterCollection({pages}: {pages: CollectionItem[]}) {
  const prepared = prepareCollectionItems(pages)

  return (
    <section className="collection-directory cluster-directory" aria-labelledby="cluster-directory-title">
      <div className="collection-wrap">
        <div className="collection-directory-heading">
          <div>
            <p className="collection-kicker">Explore service clusters</p>
            <h2 id="cluster-directory-title">Choose an electrical work category</h2>
          </div>
          <p>Start with the type of electrical system, then choose the exact installation, repair, inspection, or upgrade you need.</p>
        </div>
        <div className="cluster-card-grid">
          {serviceClusters.map((cluster) => {
            const clusterPages = prepared.filter((page) => routeByServiceId(page.serviceId)?.clusterSlug === cluster.slug)
            const representative = clusterPages[0]
            const image = representative?.cardImage || '/services/images/services/electrical-repair.jpg'
            return (
              <Link className="collection-card cluster-card" data-cluster-slug={cluster.slug} href={`/${cluster.slug}`} key={cluster.id}>
                <span className="collection-card-media">
                  <img className="collection-card-image" src={image} alt={`${cluster.name} electrical services in Chicago`} loading="lazy" decoding="async" />
                </span>
                <span className="collection-card-arrow" aria-hidden="true">→</span>
                <span className="collection-card-content">
                  <span className="collection-card-area">Chicago service cluster</span>
                  <strong>{cluster.name}</strong>
                  <span className="collection-card-description">{cluster.description}</span>
                  <span className="cluster-card-meta">
                    <span><b>{clusterPages.length}</b> published</span>
                    <span><b>{cluster.plannedServiceCount}</b> planned</span>
                  </span>
                  <span className="collection-card-volume">{cluster.monthlySearchVolume.toLocaleString()} monthly cluster searches</span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
