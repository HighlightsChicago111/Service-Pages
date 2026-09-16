import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {ServiceLandingPage} from '@/components/service-landing-page'
import {metadataClient} from '@/sanity/lib/client'
import {SERVICE_INDEX_QUERY, SERVICE_PAGE_METADATA_QUERY, SERVICE_PAGE_QUERY} from '@/sanity/lib/queries'
import {servicePageUrl, unbrandedPageTitle} from '@/lib/service-urls'
import type {ServicePageData} from '@/types/content'

type Props = {params: Promise<{serviceSlug: string; areaSlug: string}>}
type Route = {serviceSlug?: string | null; areaSlug?: string | null}

export const revalidate = 3600

export async function generateStaticParams() {
  const routes = (await metadataClient.fetch<Route[]>(SERVICE_INDEX_QUERY)) || []
  return routes
    .filter((route): route is {serviceSlug: string; areaSlug: string} => Boolean(route.serviceSlug && route.areaSlug))
    .map(({serviceSlug, areaSlug}) => ({serviceSlug, areaSlug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const resolved = await params
  const metadata = await metadataClient.fetch(SERVICE_PAGE_METADATA_QUERY, resolved)
  if (!metadata) return {}
  const title = unbrandedPageTitle(metadata.title)
  return {
    title: title || `${metadata.serviceName} in ${metadata.areaName}`,
    description: metadata.description,
    alternates: {canonical: servicePageUrl(resolved.serviceSlug, resolved.areaSlug)},
  }
}

export default async function ServicePage({params}: Props) {
  const resolved = await params
  const typed = await metadataClient.fetch<ServicePageData>(SERVICE_PAGE_QUERY, resolved)
  if (!typed.page || !typed.settings) notFound()
  return <ServiceLandingPage data={typed} />
}
