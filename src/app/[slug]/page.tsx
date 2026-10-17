import type {Metadata} from 'next'
import {notFound, permanentRedirect} from 'next/navigation'
import {ClusterPage, publishedServices, serviceCardsBySlug} from '@/components/service-clusters'
import {NESTED_SERVICE_URLS, clusterTitle, findCluster, serviceClusters} from '@/lib/clusters'
import {fetchServiceIndex, publishedServiceSlugs, renderServicePage, serviceGroupOf, serviceMetadata} from '@/lib/service-page'
import {PUBLIC_SITE_ORIGIN, clusterPagePath} from '@/lib/service-urls'

type Props = {params: Promise<{slug: string}>}

// Group pages list whatever is published, so they re-read Sanity every minute like /services.
export const revalidate = 60

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
  if (NESTED_SERVICE_URLS && await serviceGroupOf(slug)) return {}
  return serviceMetadata(slug)
}

export default async function ServiceGroupOrServicePage({params}: Props) {
  const {slug} = await params
  const cluster = findCluster(slug)
  if (cluster) {
    const cards = serviceCardsBySlug(await fetchServiceIndex())
    if (!publishedServices(cluster, cards).length) notFound()
    return <ClusterPage cluster={cluster} cards={cards} />
  }
  // With nested service URLs on, the flat URL redirects to the nested one.
  // Redirect destinations are base-relative; Next.js re-adds /services.
  const group = NESTED_SERVICE_URLS ? await serviceGroupOf(slug) : undefined
  if (group) permanentRedirect(`/${group.slug}/${slug}`)
  return renderServicePage(slug)
}
