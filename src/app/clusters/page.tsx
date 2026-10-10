import type {Metadata} from 'next'
import {ClusterHierarchyPage, HierarchyCard, clusterCover, formatCount, loadServiceCards} from '@/components/cluster-hierarchy'
import {CLUSTERS_PATH, clusterHref, serviceClusters} from '@/lib/clusters'
import {PUBLIC_SITE_ORIGIN} from '@/lib/service-urls'

export const revalidate = 3600
export const metadata: Metadata = {
  title: 'Electrical Service Clusters in Chicago',
  description: 'Browse Highlights Chicago electrical services by cluster: power, panels, wiring, outlets, lighting, life safety, EV charging, backup power and more.',
  alternates: {canonical: `${PUBLIC_SITE_ORIGIN}${CLUSTERS_PATH}`},
}

export default async function ClustersPage() {
  const cards = await loadServiceCards()
  const livePages = serviceClusters.reduce((total, cluster) => total + cluster.services.length, 0)
  return (
    <ClusterHierarchyPage
      level={0}
      crumbs={[{label: 'Clusters'}]}
      kicker="Service clusters"
      title="Electrical services by cluster"
      lede="Every Highlights Chicago service page, grouped into the clusters of our content plan. Pick a cluster to see its parent, its hub article and the services beneath it."
      stat={{label: 'Service clusters', value: String(serviceClusters.length), caption: `${livePages} live service pages`}}
      sectionKicker="Cluster level"
      sectionTitle="Choose a service cluster"
      sectionIntro="Each block is one cluster. The count shows how many live service pages sit beneath it."
    >
      <div className="collection-card-grid">
        {serviceClusters.map((cluster) => {
          const serviceNames = cluster.services.map((service) => cards.get(service.slug)?.serviceName || service.planService)
          return (
            <HierarchyCard
              key={cluster.slug}
              href={clusterHref.parent(cluster)}
              label={`Cluster ${cluster.number}`}
              title={cluster.name}
              description={serviceNames.length ? serviceNames.join(' · ') : 'Service pages coming soon'}
              meta={formatCount(cluster.services.length, 'service page')}
              image={clusterCover(cluster, cards)}
            />
          )
        })}
      </div>
    </ClusterHierarchyPage>
  )
}
