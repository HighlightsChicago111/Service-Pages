import type {Metadata} from 'next'
import {notFound, permanentRedirect} from 'next/navigation'
import {clusterForService, findCluster} from '@/lib/clusters'
import {publishedServiceRoutes, renderServicePage, serviceGroupOf, serviceMetadata} from '@/lib/service-page'
import {PRIMARY_AREA_SLUG, serviceRoutePath} from '@/lib/service-urls'
import {metadataClient} from '@/sanity/lib/client'
import {NEW_DESIGN_METADATA_QUERY, SERVICE_PAGE_METADATA_QUERY} from '@/sanity/lib/queries'

type Props = {params: Promise<{slug: string; child: string}>}

export const revalidate = 3600

// /services/<cluster>/<service> is the service page. /services/<service>/chicago
// is a legacy URL from the first launch and redirects to the service page.
export async function generateStaticParams() {
  const services = await publishedServiceRoutes()
  return services.flatMap(({serviceSlug, parentName}) => {
    const cluster = clusterForService(serviceSlug, parentName)
    return [...(cluster ? [{slug: cluster.slug, child: serviceSlug}] : []), {slug: serviceSlug, child: PRIMARY_AREA_SLUG}]
  })
}

async function isServiceRoute(slug: string, child: string) {
  return (await serviceGroupOf(child))?.slug === slug
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug, child} = await params
  return await isServiceRoute(slug, child) ? serviceMetadata(child) : {}
}

export default async function ClusterServicePage({params}: Props) {
  const {slug, child} = await params
  if (await isServiceRoute(slug, child)) return renderServicePage(child)
  if (child === PRIMARY_AREA_SLUG && !findCluster(slug)) {
    // The old /<slug>/chicago link works for a page in either design.
    const queryParams = {serviceSlug: slug, areaSlug: PRIMARY_AREA_SLUG}
    const metadata = await metadataClient.fetch(NEW_DESIGN_METADATA_QUERY, queryParams)
      || await metadataClient.fetch(SERVICE_PAGE_METADATA_QUERY, queryParams)
    // Redirect destinations are base-relative; Next.js re-adds /services.
    if (metadata) permanentRedirect(serviceRoutePath(slug, (await serviceGroupOf(slug))?.parentName))
  }
  notFound()
}
