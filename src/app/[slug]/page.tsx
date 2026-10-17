import type {Metadata} from 'next'
import {notFound, permanentRedirect} from 'next/navigation'
import {ClusterPage, publishedServices, serviceCardsBySlug} from '@/components/service-clusters'
import {clusterForService, clusterTitle, findCluster, serviceClusters} from '@/lib/clusters'
import type {CollectionItem} from '@/lib/collection-items'
import {preferNewDesign} from '@/lib/design-precedence'
import {publishedServiceSlugs, renderServicePage, serviceMetadata} from '@/lib/service-page'
import {PUBLIC_SITE_ORIGIN, clusterPagePath, serviceRoutePath} from '@/lib/service-urls'
import {metadataClient} from '@/sanity/lib/client'
import {SERVICE_INDEX_QUERY} from '@/sanity/lib/queries'

type Props = {params: Promise<{slug: string}>}

export const revalidate = 3600

// /services/<slug> is a service group (cluster) page. A service's old flat URL
// redirects to /services/<cluster>/<service>; a service that belongs to no
// cluster keeps its flat URL.
export async function generateStaticParams() {
  const services = await publishedServiceSlugs()
  return [...serviceClusters.map((cluster) => ({slug: cluster.slug})), ...services.map((slug) => ({slug}))]
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const cluster = findCluster(slug)
  if (cluster) {
    return {
      title: clusterTitle(cluster),
      description: `${cluster.description} Licensed, code-focused electrical work from Highlights Chicago.`,
      alternates: {canonical: `${PUBLIC_SITE_ORIGIN}${clusterPagePath(cluster.slug)}`},
    }
  }
  if (clusterForService(slug)) return {}
  return serviceMetadata(slug)
}

export default async function ServiceGroupOrServicePage({params}: Props) {
  const {slug} = await params
  const cluster = findCluster(slug)
  if (cluster) {
    const cards = serviceCardsBySlug(preferNewDesign((await metadataClient.fetch<CollectionItem[]>(SERVICE_INDEX_QUERY)) || []))
    if (!publishedServices(cluster, cards).length) notFound()
    return <ClusterPage cluster={cluster} cards={cards} />
  }
  // Redirect destinations are base-relative; Next.js re-adds /services.
  if (clusterForService(slug)) permanentRedirect(serviceRoutePath(slug))
  return renderServicePage(slug)
}
