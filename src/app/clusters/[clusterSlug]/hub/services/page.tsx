import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {ClusterHierarchyPage, HierarchyCard, loadServiceCards} from '@/components/cluster-hierarchy'
import {CLUSTERS_PATH, clusterHref, findCluster, serviceClusters} from '@/lib/clusters'
import {PUBLIC_SITE_ORIGIN} from '@/lib/service-urls'

type Props = {params: Promise<{clusterSlug: string}>}

export const revalidate = 3600
export const dynamicParams = false

export function generateStaticParams() {
  return serviceClusters.map((cluster) => ({clusterSlug: cluster.slug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const cluster = findCluster((await params).clusterSlug)
  if (!cluster) return {}
  return {
    title: `${cluster.name} Services`,
    description: `Highlights Chicago services covered by "${cluster.hub.title}".`,
    alternates: {canonical: `${PUBLIC_SITE_ORIGIN}${CLUSTERS_PATH}/${cluster.slug}/hub/services`},
  }
}

export default async function ClusterServicesPage({params}: Props) {
  const cluster = findCluster((await params).clusterSlug)
  if (!cluster) notFound()
  const cards = await loadServiceCards()
  const services = cluster.services
    .map((service) => ({service, card: cards.get(service.slug)}))
    .filter((item) => item.card)
  return (
    <ClusterHierarchyPage
      level={3}
      cluster={cluster}
      crumbs={[
        {label: 'Clusters', href: clusterHref.index()},
        {label: cluster.name, href: clusterHref.parent(cluster)},
        {label: 'Hub article', href: clusterHref.hub(cluster)},
        {label: 'Services'},
      ]}
      kicker={`${cluster.name} services`}
      title={cluster.parentName}
      lede={cluster.hub.title}
      stat={{label: 'Service pages', value: String(services.length), caption: 'covered by this hub article'}}
      sectionKicker="Services we provide"
      sectionTitle={`${cluster.name} services`}
      sectionIntro="Each block opens the full service page with pricing, reviews, coverage and FAQs."
    >
      {services.length > 0 ? (
        <div className="collection-card-grid">
          {services.map(({service, card}) => (
            <HierarchyCard
              key={service.slug}
              href={`/${service.slug}`}
              label={card?.areaName || 'Chicago'}
              title={card?.serviceName || service.planService}
              description={card?.metaDescription}
              meta={card?.monthlySearchVolume ? `${card.monthlySearchVolume.toLocaleString('en-US')} monthly searches` : undefined}
              image={card?.cardImage ? {src: card.cardImage, alt: card.cardImageAlt} : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="collection-empty">
          <h3>No live service pages yet</h3>
          <p>The content plan has a hub article for this cluster, but none of its service pages are published.</p>
          <p><Link href={clusterHref.index()}>Browse other clusters</Link></p>
        </div>
      )}
    </ClusterHierarchyPage>
  )
}
