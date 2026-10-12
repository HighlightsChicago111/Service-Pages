import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {notFound} from 'next/navigation'
import {ServiceLandingPage} from '@/components/service-landing-page'
import {dsFontVariables} from '@/components/v3/fonts'
import {ServiceLandingPage as NewDesignServicePage} from '@/components/v3/service-page'
// Design System v3 styles are all scoped under .ds, so they cannot touch the current pages.
import '../design-system-v3.css'
import {metadataClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {
  NEW_DESIGN_METADATA_QUERY,
  NEW_DESIGN_PAGE_QUERY,
  SERVICE_INDEX_QUERY,
  SERVICE_PAGE_METADATA_QUERY,
  SERVICE_PAGE_QUERY,
} from '@/sanity/lib/queries'
import {newDesignTitle, preferNewDesign, type ServiceDesign} from '@/lib/design-precedence'
import {PRIMARY_AREA_SLUG, servicePageUrl} from '@/lib/service-urls'
import {toNewDesignPageData, type NewDesignQueryResult} from '@/lib/v3/page-data'
import type {ServicePageData} from '@/types/content'

type Props = {params: Promise<{serviceSlug: string}>}
type Route = {serviceSlug?: string | null; areaSlug?: string | null; design?: ServiceDesign | null}
type PageMetadata = {title?: string; description?: string; serviceName?: string; areaName?: string} | null

export const revalidate = 3600

export async function generateStaticParams() {
  // Both designs, one entry per URL.
  const routes = preferNewDesign((await metadataClient.fetch<Route[]>(SERVICE_INDEX_QUERY)) || [])
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
  // Same rule as the page: a new-design page for this URL wins.
  const newDesign = await fetchServiceContent<PageMetadata>(NEW_DESIGN_METADATA_QUERY, queryParams, false)
  if (newDesign) {
    return {
      title: newDesignTitle(newDesign.title, `${newDesign.serviceName} in ${newDesign.areaName}`),
      description: newDesign.description,
      alternates: {canonical: servicePageUrl(serviceSlug)},
    }
  }
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
  const queryParams = {serviceSlug, areaSlug: PRIMARY_AREA_SLUG}
  const draft = (await draftMode()).isEnabled
  // The v3 template matches on slugs and copy, so it reads clean strings (no
  // click-to-edit markers); Studio Presentation still previews and refreshes it.
  const newDesign = toNewDesignPageData(await fetchServiceContent<NewDesignQueryResult>(NEW_DESIGN_PAGE_QUERY, queryParams, false))
  if (newDesign) return <NewDesignServicePage data={newDesign} draft={draft} fontClassName={dsFontVariables} />

  const typed = await fetchServiceContent<ServicePageData>(SERVICE_PAGE_QUERY, queryParams, true)
  if (!typed.page || !typed.settings) notFound()
  return <ServiceLandingPage data={typed} />
}
