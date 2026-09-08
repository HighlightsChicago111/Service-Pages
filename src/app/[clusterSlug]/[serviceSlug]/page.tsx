import type {Metadata} from 'next'
import {notFound, redirect} from 'next/navigation'
import {ServiceLandingPage} from '@/components/service-landing-page'
import {clusterBySlug, routeByHierarchy, routeByServiceSlug, servicePath} from '@/lib/service-hierarchy'
import {metadataClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {SERVICE_PAGE_METADATA_QUERY, SERVICE_PAGE_QUERY} from '@/sanity/lib/queries'
import type {ServicePageData, ServiceRouteContext} from '@/types/content'

type Props = {params: Promise<{clusterSlug: string; serviceSlug: string}>}

function resolveRoute(clusterSlug: string, serviceSlug: string) {
  const hierarchyRoute = routeByHierarchy(clusterSlug, serviceSlug)
  if (hierarchyRoute) return {route: hierarchyRoute, legacy: false}
  if (serviceSlug === 'chicago') {
    const legacyRoute = routeByServiceSlug(clusterSlug)
    if (legacyRoute) return {route: legacyRoute, legacy: true}
  }
  return null
}

function routeContext(clusterSlug: string, serviceSlug: string): ServiceRouteContext | null {
  const resolved = resolveRoute(clusterSlug, serviceSlug)
  if (!resolved) return null
  const cluster = clusterBySlug(resolved.route.clusterSlug)
  if (!cluster) return null
  return {
    clusterSlug: cluster.slug,
    clusterName: cluster.name,
    routeSlug: resolved.route.routeSlug,
    canonicalUrl: `https://www.highlightschicago.com/services/${cluster.slug}/${resolved.route.routeSlug}`,
  }
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {clusterSlug, serviceSlug} = await params
  const resolved = resolveRoute(clusterSlug, serviceSlug)
  if (!resolved) return {}
  const metadata = await metadataClient.fetch(SERVICE_PAGE_METADATA_QUERY, {serviceSlug: resolved.route.sanitySlug, areaSlug: 'chicago'})
  if (!metadata) return {}
  const context = routeContext(clusterSlug, serviceSlug)
  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {canonical: context?.canonicalUrl},
  }
}

export default async function ServicePage({params}: Props) {
  const {clusterSlug, serviceSlug} = await params
  const resolved = resolveRoute(clusterSlug, serviceSlug)
  if (!resolved) notFound()
  if (resolved.legacy) redirect(servicePath(resolved.route).replace(/^\/services/, ''))

  const context = routeContext(clusterSlug, serviceSlug)
  if (!context) notFound()
  const {data} = await sanityFetch({query: SERVICE_PAGE_QUERY, params: {serviceSlug: resolved.route.sanitySlug, areaSlug: 'chicago'}})
  const typed = data as ServicePageData
  if (!typed.page || !typed.settings) notFound()
  return <ServiceLandingPage data={typed} route={context} />
}
