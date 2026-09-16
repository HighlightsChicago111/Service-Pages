import type {MetadataRoute} from 'next'
import {metadataClient} from '@/sanity/lib/client'
import {SERVICE_INDEX_QUERY} from '@/sanity/lib/queries'
import {PUBLIC_SITE_ORIGIN, SERVICES_PATH, servicePageUrl} from '@/lib/service-urls'

// Next serves this at /services/sitemap.xml because basePath is applied to the
// sitemap route automatically. Every <loc> is an absolute URL on the public
// canonical host (NEXT_SITE_URL, e.g. https://www.highlightschicago.com).
export const revalidate = 3600

type Route = {serviceSlug?: string | null; areaSlug?: string | null; _updatedAt?: string | null}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = (await metadataClient.fetch<Route[]>(SERVICE_INDEX_QUERY)) || []
  const servicePages = pages
    .filter((page): page is Route & {serviceSlug: string; areaSlug: string} => Boolean(page.serviceSlug && page.areaSlug))
    .map((page) => ({
      url: servicePageUrl(page.serviceSlug, page.areaSlug),
      lastModified: page._updatedAt ? new Date(page._updatedAt) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  const latestUpdate = pages
    .map((page) => page._updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)

  return [
    {url: `${PUBLIC_SITE_ORIGIN}${SERVICES_PATH}`, lastModified: latestUpdate ? new Date(latestUpdate) : undefined, changeFrequency: 'weekly', priority: 1},
    ...servicePages,
  ]
}
