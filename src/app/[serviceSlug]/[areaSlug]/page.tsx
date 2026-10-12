import {notFound, permanentRedirect} from 'next/navigation'
import {metadataClient} from '@/sanity/lib/client'
import {NEW_DESIGN_METADATA_QUERY, SERVICE_INDEX_QUERY, SERVICE_PAGE_METADATA_QUERY} from '@/sanity/lib/queries'
import {preferNewDesign, type ServiceDesign} from '@/lib/design-precedence'
import {PRIMARY_AREA_SLUG} from '@/lib/service-urls'

type Props = {params: Promise<{serviceSlug: string; areaSlug: string}>}
type Route = {serviceSlug?: string | null; areaSlug?: string | null; design?: ServiceDesign | null}

export async function generateStaticParams() {
  const routes = preferNewDesign((await metadataClient.fetch<Route[]>(SERVICE_INDEX_QUERY)) || [])
  return routes
    .filter((route): route is {serviceSlug: string; areaSlug: string} => Boolean(route.serviceSlug && route.areaSlug === PRIMARY_AREA_SLUG))
    .map(({serviceSlug, areaSlug}) => ({serviceSlug, areaSlug}))
}

export default async function LegacyAreaServicePage({params}: Props) {
  const resolved = await params
  if (resolved.areaSlug !== PRIMARY_AREA_SLUG) notFound()
  // The old /<slug>/chicago link works for a page in either design.
  const metadata = await metadataClient.fetch(NEW_DESIGN_METADATA_QUERY, resolved)
    || await metadataClient.fetch(SERVICE_PAGE_METADATA_QUERY, resolved)
  if (!metadata) notFound()
  // Redirect destinations are base-relative; Next.js re-adds /services.
  permanentRedirect(`/${resolved.serviceSlug}`)
}
