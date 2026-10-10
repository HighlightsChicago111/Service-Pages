import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {ClusterHierarchyPage, HierarchyCard, clusterCover, formatCount, loadServiceCards} from '@/components/cluster-hierarchy'
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
    title: `${cluster.parentName} Hub Article`,
    description: cluster.hub.title,
    alternates: {canonical: `${PUBLIC_SITE_ORIGIN}${CLUSTERS_PATH}/${cluster.slug}/hub`},
  }
}

export default async function ClusterHubPage({params}: Props) {
  const cluster = findCluster((await params).clusterSlug)
  if (!cluster) notFound()
  const cards = await loadServiceCards()
  const keywords = [...cluster.hub.primaryKeywords, ...cluster.hub.secondaryKeywords].map((item) => item.keyword)
  return (
    <ClusterHierarchyPage
      level={2}
      cluster={cluster}
      crumbs={[
        {label: 'Clusters', href: clusterHref.index()},
        {label: cluster.name, href: clusterHref.parent(cluster)},
        {label: 'Hub article'},
      ]}
      kicker={cluster.parent}
      title={cluster.parentName}
      lede="One hub article covers this cluster and every service beneath it. Open the title to see the services it covers."
      stat={{label: 'Monthly searches', value: cluster.hub.volume.toLocaleString('en-US'), caption: `across ${formatCount(cluster.hub.keywordCount, 'cluster keyword')}`}}
      sectionKicker="Hub listicle title"
      sectionTitle="Hub article"
      sectionIntro="The listicle title chosen for this cluster in the content plan."
    >
      <div className="collection-card-grid">
        <HierarchyCard
          href={clusterHref.services(cluster)}
          label={`Hub article · ID ${cluster.hub.id}`}
          title={cluster.hub.title}
          description={keywords.join(' · ')}
          meta={formatCount(cluster.services.length, 'service page')}
          image={clusterCover(cluster, cards)}
        />
      </div>
    </ClusterHierarchyPage>
  )
}
