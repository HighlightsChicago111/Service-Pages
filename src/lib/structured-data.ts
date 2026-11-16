import {clusterTitle, type ServiceCluster} from './clusters'
import type {PreparedCollectionItem} from './collection-items'
import {PUBLIC_SITE_ORIGIN, SERVICES_PATH, clusterPagePath, servicePageUrl} from './service-urls'

/**
 * JSON-LD (schema.org) for the services app. Every page outputs one @graph; nodes on
 * different pages point at the same business and website through these @id strings.
 */
export const BUSINESS_ID = `${PUBLIC_SITE_ORIGIN}/#business`
export const WEBSITE_ID = `${PUBLIC_SITE_ORIGIN}/#website`
export const SERVICES_URL = `${PUBLIC_SITE_ORIGIN}${SERVICES_PATH}`

export type JsonLdNode = Record<string, unknown>
type Crumb = {name: string; item: string}
type ListedPage = {name: string; url: string}

export const HOME_CRUMB: Crumb = {name: 'Home', item: PUBLIC_SITE_ORIGIN}
export const SERVICES_CRUMB: Crumb = {name: 'Services', item: SERVICES_URL}

/** The script body for a @graph: undefined fields drop out, and "<" is escaped so the JSON cannot close the script tag. */
export function jsonLdHtml(graph: JsonLdNode[]): string {
  return JSON.stringify({'@context': 'https://schema.org', '@graph': graph}).replace(/</g, '\\u003c')
}

export function breadcrumbList(crumbs: Crumb[]): JsonLdNode {
  return {'@type': 'BreadcrumbList', itemListElement: crumbs.map((crumb, index) => ({'@type': 'ListItem', position: index + 1, ...crumb}))}
}

/** A hub page: the page itself, the list of pages it links to (in page order), and its breadcrumb trail. */
function collectionPageGraph({url, name, items, crumbs}: {url: string; name: string; items: ListedPage[]; crumbs: Crumb[]}): JsonLdNode[] {
  return [
    {
      '@type': 'CollectionPage',
      url,
      name,
      about: {'@id': BUSINESS_ID},
      isPartOf: {'@id': WEBSITE_ID},
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({'@type': 'ListItem', position: index + 1, name: item.name, url: item.url})),
      },
    },
    breadcrumbList(crumbs),
  ]
}

/** /services: the service groups exactly as the "Choose a service" grid lists them. */
export function servicesIndexGraph(heading: string, clusters: ServiceCluster[]): JsonLdNode[] {
  return collectionPageGraph({
    url: SERVICES_URL,
    name: heading,
    items: clusters.map((cluster) => ({name: cluster.name, url: `${PUBLIC_SITE_ORIGIN}${clusterPagePath(cluster.slug)}`})),
    crumbs: [HOME_CRUMB, SERVICES_CRUMB],
  })
}

/** /services/<group>: the group's service pages exactly as its card grid lists them. */
export function serviceGroupGraph(cluster: ServiceCluster, services: PreparedCollectionItem[]): JsonLdNode[] {
  const url = `${PUBLIC_SITE_ORIGIN}${clusterPagePath(cluster.slug)}`
  return collectionPageGraph({
    url,
    name: clusterTitle(cluster),
    items: services.map((service) => ({name: service.serviceName, url: servicePageUrl(service.serviceSlug, service.parentName)})),
    crumbs: [HOME_CRUMB, SERVICES_CRUMB, {name: cluster.name, item: url}],
  })
}

/** The first non-empty text, trimmed; undefined when none has any. */
export function firstText(...values: Array<string | null | undefined>): string | undefined {
  return values.map((value) => value?.trim()).find(Boolean)
}

/**
 * An absolute https URL for an image the page renders: a site path (/services/images/...)
 * gets the public origin, an https URL stays as it is, anything else is left out.
 */
export function absoluteImageUrl(src: string | null | undefined): string | undefined {
  const value = src?.trim()
  if (!value) return undefined
  if (value.startsWith('/') && !value.startsWith('//')) return `${PUBLIC_SITE_ORIGIN}${value}`
  return /^https:\/\/[^/\s]+\/\S+$/i.test(value) ? value : undefined
}
