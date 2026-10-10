import type {MetadataRoute} from 'next'
import {metadataClient} from '@/sanity/lib/client'
import {SERVICE_INDEX_QUERY} from '@/sanity/lib/queries'
import {serviceClusters} from '@/lib/clusters'
import {PRIMARY_AREA_SLUG, PUBLIC_SITE_ORIGIN, SERVICES_PATH, clusterPagePath, servicePageUrl} from '@/lib/service-urls'

// Next serves this at /services/sitemap.xml because basePath is applied to the
// sitemap route automatically. Every <loc> is an absolute URL on the public
// canonical host (NEXT_SITE_URL, e.g. https://www.highlightschicago.com).
export const revalidate = 3600

type Route = {serviceSlug?: string | null; areaSlug?: string | null; _updatedAt?: string | null}

const latest = (dates: Array<string | null | undefined>) => dates
  .filter((value): value is string => Boolean(value))
  .sort()
  .at(-1)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = (await metadataClient.fetch<Route[]>(SERVICE_INDEX_QUERY)) || []
  const published = pages.filter((page): page is Route & {serviceSlug: string; areaSlug: string} => Boolean(page.serviceSlug && page.areaSlug === PRIMARY_AREA_SLUG))
  const updatedAt = new Map(published.map((page) => [page.serviceSlug, page._updatedAt]))

  const servicePages = published.map((page) => ({
    url: servicePageUrl(page.serviceSlug),
    lastModified: page._updatedAt ? new Date(page._updatedAt) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const clusterPages = serviceClusters
    .filter((cluster) => cluster.services.some((service) => updatedAt.has(service)))
    .map((cluster) => {
      const lastModified = latest(cluster.services.map((service) => updatedAt.get(service)))
      return {
        url: `${PUBLIC_SITE_ORIGIN}${clusterPagePath(cluster.slug)}`,
        lastModified: lastModified ? new Date(lastModified) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }
    })

  const latestUpdate = latest(pages.map((page) => page._updatedAt))

  return [
    {url: `${PUBLIC_SITE_ORIGIN}${SERVICES_PATH}`, lastModified: latestUpdate ? new Date(latestUpdate) : undefined, changeFrequency: 'weekly', priority: 1},
    ...clusterPages,
    ...servicePages,
  ]
}
