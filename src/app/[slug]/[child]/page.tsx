import type {Metadata} from 'next'
import {notFound, permanentRedirect} from 'next/navigation'
import {clusterForService, findCluster} from '@/lib/clusters'
import {publishedServiceSlugs, renderServicePage, serviceMetadata} from '@/lib/service-page'
import {PRIMARY_AREA_SLUG, serviceRoutePath} from '@/lib/service-urls'
import {metadataClient} from '@/sanity/lib/client'
import {SERVICE_PAGE_METADATA_QUERY} from '@/sanity/lib/queries'

type Props = {params: Promise<{slug: string; child: string}>}

export const revalidate = 3600

// /services/<cluster>/<service> is the service page. /services/<service>/chicago
// is a legacy URL from the first launch and redirects to the service page.
export async function generateStaticParams() {
  const services = await publishedServiceSlugs()
  return services.flatMap((service) => {
    const cluster = clusterForService(service)
    return [...(cluster ? [{slug: cluster.slug, child: service}] : []), {slug: service, child: PRIMARY_AREA_SLUG}]
  })
}

function isServiceRoute(slug: string, child: string) {
  return clusterForService(child)?.slug === slug
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug, child} = await params
  return isServiceRoute(slug, child) ? serviceMetadata(child) : {}
}

export default async function ClusterServicePage({params}: Props) {
  const {slug, child} = await params
  if (isServiceRoute(slug, child)) return renderServicePage(child)
  if (child === PRIMARY_AREA_SLUG && !findCluster(slug)) {
    const metadata = await metadataClient.fetch(SERVICE_PAGE_METADATA_QUERY, {serviceSlug: slug, areaSlug: PRIMARY_AREA_SLUG})
    // Redirect destinations are base-relative; Next.js re-adds /services.
    if (metadata) permanentRedirect(serviceRoutePath(slug))
  }
  notFound()
}
