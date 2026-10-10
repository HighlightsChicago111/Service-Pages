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
    title: `${cluster.name} Services in Chicago`,
    description: `${cluster.parent}: the content-plan cluster behind Highlights Chicago's ${cluster.name.toLowerCase()} services.`,
    alternates: {canonical: `${PUBLIC_SITE_ORIGIN}${CLUSTERS_PATH}/${cluster.slug}`},
  }
}

export default async function ClusterParentPage({params}: Props) {
  const cluster = findCluster((await params).clusterSlug)
  if (!cluster) notFound()
  const cards = await loadServiceCards()
  return (
    <ClusterHierarchyPage
      level={1}
      cluster={cluster}
      crumbs={[{label: 'Clusters', href: clusterHref.index()}, {label: cluster.name}]}
      kicker={`Cluster ${cluster.number}`}
      title={cluster.name}
      lede={`The content-plan parent for ${cluster.name.toLowerCase()}. Open it to see the hub article that covers this cluster and every service beneath it.`}
      stat={{label: 'Live service pages', value: String(cluster.services.length), caption: 'in this cluster'}}
      sectionKicker="Parent (content plan)"
      sectionTitle="Parent cluster"
      sectionIntro="This is the cluster exactly as the content plan names it."
    >
      <div className="collection-card-grid">
        <HierarchyCard
          href={clusterHref.hub(cluster)}
          label={`Cluster ${cluster.number} · Content plan`}
          title={cluster.parent}
          description={`${formatCount(cluster.hub.keywordCount, 'tracked keyword')} · ${formatCount(cluster.services.length, 'live service page')}`}
          meta={`${cluster.hub.volume.toLocaleString('en-US')} monthly searches`}
          image={clusterCover(cluster, cards)}
        />
      </div>
    </ClusterHierarchyPage>
  )
}
