import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {notFound} from 'next/navigation'
import {cache} from 'react'
import {ServiceLandingPage} from '@/components/service-landing-page'
import {dsFontVariables} from '@/components/v3/fonts'
import {ServiceLandingPage as NewDesignServicePage} from '@/components/v3/service-page'
// Design System v3 styles are all scoped under .ds, so they cannot touch the current pages.
import '../app/design-system-v3.css'
import {metadataClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {
  NEW_DESIGN_METADATA_QUERY,
  NEW_DESIGN_PAGE_QUERY,
  SERVICE_INDEX_QUERY,
  SERVICE_PAGE_METADATA_QUERY,
  SERVICE_PAGE_QUERY,
} from '@/sanity/lib/queries'
import {clusterForService, type ServiceCluster} from '@/lib/clusters'
import type {CollectionItem} from '@/lib/collection-items'
import {newDesignTitle, preferNewDesign, type ServiceDesign} from '@/lib/design-precedence'
import {toNewDesignPageData, type NewDesignQueryResult} from '@/lib/v3/page-data'
import type {ServicePageData} from '@/types/content'
import {PRIMARY_AREA_SLUG, servicePageUrl} from './service-urls'

type Route = {serviceSlug?: string | null; areaSlug?: string | null; design?: ServiceDesign | null; parentName?: string | null}
type PageMetadata = {title?: string; description?: string; serviceName?: string; areaName?: string} | null

/** Every published Chicago service page, in either design, one per URL (fetched once per request). */
export const publishedServiceRoutes = cache(async (): Promise<Array<{serviceSlug: string; parentName?: string}>> => {
  const routes = preferNewDesign((await metadataClient.fetch<Route[]>(SERVICE_INDEX_QUERY)) || [])
  return routes
    .filter((route): route is Route & {serviceSlug: string} => Boolean(route.serviceSlug && route.areaSlug === PRIMARY_AREA_SLUG))
    .map((route) => ({serviceSlug: route.serviceSlug, parentName: route.parentName || undefined}))
})

/** Slugs of every published Chicago service page, in either design, one per URL. */
export async function publishedServiceSlugs(): Promise<string[]> {
  return (await publishedServiceRoutes()).map((route) => route.serviceSlug)
}

/** A service's group: the workbook's, or the one named by its published page's Sanity cluster name. */
export async function serviceGroupOf(serviceSlug: string): Promise<ServiceCluster | undefined> {
  const route = (await publishedServiceRoutes()).find((item) => item.serviceSlug === serviceSlug)
  return clusterForService(serviceSlug, route?.parentName)
}

// Public visitors get the published content through the hourly-revalidated
// client. Editors previewing from the Studio (draft mode) get drafts, with
// click-to-edit markers on the page body, through the live fetcher.
async function fetchServiceContent<T>(query: string, params: Record<string, string>, stega: boolean): Promise<T> {
  if ((await draftMode()).isEnabled) return (await sanityFetch({query, params, stega})).data as T
  return metadataClient.fetch<T>(query, params)
}

/**
 * Cards for the collection and group pages: both designs, one per URL. Read fresh on
 * every revalidation, so a page published in Sanity shows up without a deploy.
 */
export async function fetchServiceIndex(): Promise<CollectionItem[]> {
  return preferNewDesign((await fetchServiceContent<CollectionItem[] | null>(SERVICE_INDEX_QUERY, {}, false)) || [])
}

export async function serviceMetadata(serviceSlug: string): Promise<Metadata> {
  const queryParams = {serviceSlug, areaSlug: PRIMARY_AREA_SLUG}
  const route = (await publishedServiceRoutes()).find((item) => item.serviceSlug === serviceSlug)
  const canonical = servicePageUrl(serviceSlug, route?.parentName)
  // Same rule as the page: a new-design page for this URL wins.
  const newDesign = await fetchServiceContent<PageMetadata>(NEW_DESIGN_METADATA_QUERY, queryParams, false)
  if (newDesign) {
    return {
      title: newDesignTitle(newDesign.title, `${newDesign.serviceName} in ${newDesign.areaName}`),
      description: newDesign.description,
      alternates: {canonical},
    }
  }
  const metadata = await fetchServiceContent<PageMetadata>(SERVICE_PAGE_METADATA_QUERY, queryParams, false)
  if (!metadata) return {}
  return {
    title: metadata.title
      ? {absolute: metadata.title}
      : `${metadata.serviceName} in ${metadata.areaName}`,
    description: metadata.description,
    alternates: {canonical},
  }
}

export async function renderServicePage(serviceSlug: string) {
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
