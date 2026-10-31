import {preferNewDesign, type ServiceDesign} from '@/lib/design-precedence'
import {stegaClean} from 'next-sanity'
import {PRIMARY_AREA_SLUG, resolvePublishedServicePath} from '@/lib/service-urls'
import type {V2Area, V2Page, V2PageData, V2Settings} from '@/types/v2'

type Route = {design?: ServiceDesign | null; serviceSlug?: string | null; areaSlug?: string | null; serviceName?: string | null; parentName?: string | null}

export type NewDesignQueryResult = {
  serviceRoutes?: Route[] | null
  page: (V2Page & {area?: V2Area | null}) | null
  settings: V2Settings | null
}

/**
 * Shapes NEW_DESIGN_PAGE_QUERY's result for the Design System v3 template. Returns
 * null when the URL has no new-design page that can render (no page, no area or
 * no settings), and the URL then keeps its current-design page.
 */
export function toNewDesignPageData(result: NewDesignQueryResult | null | undefined): V2PageData | null {
  if (!result?.page || !result.settings) return null
  const {area = null, ...page} = result.page
  if (!area) return null
  // The header's service menu lists every live service page, whichever design it uses.
  const routes = preferNewDesign(result.serviceRoutes || [])
    .filter((route): route is Route & {serviceSlug: string} => Boolean(route.serviceSlug && route.areaSlug === PRIMARY_AREA_SLUG))
    .map((route) => ({slug: route.serviceSlug, name: route.serviceName || route.serviceSlug, parentName: route.parentName || undefined}))
    .sort((left, right) => left.name.localeCompare(right.name))
  // Related service cards link only to live pages, the same rule as the current design: a page
  // can be unpublished at any time, and its card then disappears instead of linking to a 404.
  const liveRoutes = routes.map((route) => ({serviceSlug: route.slug, areaSlug: PRIMARY_AREA_SLUG, parentName: route.parentName}))
  const v2Page = page as V2Page
  const otherServices = v2Page.otherServices && {
    ...v2Page.otherServices,
    items: v2Page.otherServices.items?.filter((item) => resolvePublishedServicePath(stegaClean(item.url), undefined, liveRoutes, PRIMARY_AREA_SLUG)),
  }
  return {page: otherServices ? {...v2Page, otherServices} : v2Page, area, settings: result.settings, routes}
}
