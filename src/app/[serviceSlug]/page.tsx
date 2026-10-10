import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {notFound} from 'next/navigation'
import {ServiceLandingPage} from '@/components/service-landing-page'
import {metadataClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {SERVICE_INDEX_QUERY, SERVICE_PAGE_METADATA_QUERY, SERVICE_PAGE_QUERY} from '@/sanity/lib/queries'
import {PRIMARY_AREA_SLUG, servicePageUrl} from '@/lib/service-urls'
import type {ServicePageData} from '@/types/content'

type Props = {params: Promise<{serviceSlug: string}>}
type Route = {serviceSlug?: string | null; areaSlug?: string | null}
type PageMetadata = {title?: string; description?: string; serviceName?: string; areaName?: string} | null

export const revalidate = 3600

export async function generateStaticParams() {
  const routes = (await metadataClient.fetch<Route[]>(SERVICE_INDEX_QUERY)) || []
  return routes
    .filter((route): route is {serviceSlug: string; areaSlug: string} => Boolean(route.serviceSlug && route.areaSlug === PRIMARY_AREA_SLUG))
    .map(({serviceSlug}) => ({serviceSlug}))
}

// Public visitors get the published content through the hourly-revalidated
// client. Editors previewing from the Studio (draft mode) get drafts, with
// click-to-edit markers on the page body, through the live fetcher.
async function fetchServiceContent<T>(query: string, params: Record<string, string>, stega: boolean): Promise<T> {
  if ((await draftMode()).isEnabled) return (await sanityFetch({query, params, stega})).data as T
  return metadataClient.fetch<T>(query, params)
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {serviceSlug} = await params
  const queryParams = {serviceSlug, areaSlug: PRIMARY_AREA_SLUG}
  const metadata = await fetchServiceContent<PageMetadata>(SERVICE_PAGE_METADATA_QUERY, queryParams, false)
  if (!metadata) return {}
  return {
    title: metadata.title
      ? {absolute: metadata.title}
      : `${metadata.serviceName} in ${metadata.areaName}`,
    description: metadata.description,
    alternates: {canonical: servicePageUrl(serviceSlug)},
  }
}

export default async function ServicePage({params}: Props) {
  const {serviceSlug} = await params
  const typed = await fetchServiceContent<ServicePageData>(SERVICE_PAGE_QUERY, {
    serviceSlug,
    areaSlug: PRIMARY_AREA_SLUG,
  }, true)
  if (!typed.page || !typed.settings) notFound()
  return <ServiceLandingPage data={typed} />
}
