import type {MetadataRoute} from 'next'
import {metadataClient} from '@/sanity/lib/client'
import {siteUrl} from '@/sanity/env'
import {SERVICE_INDEX_QUERY} from '@/sanity/lib/queries'

// Next serves this at /services/sitemap.xml because basePath is applied to the
// sitemap route automatically. Every <loc> is an absolute URL on the public
// canonical host (NEXT_SITE_URL, e.g. https://www.highlightschicago.com).
export const revalidate = 3600

type Route = {serviceSlug?: string | null; areaSlug?: string | null}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl.replace(/\/+$/, '')
  const lastModified = new Date()
  const pages = (await metadataClient.fetch<Route[]>(SERVICE_INDEX_QUERY)) || []
  const servicePages = pages
    .filter((page): page is {serviceSlug: string; areaSlug: string} => Boolean(page.serviceSlug && page.areaSlug))
    .map((page) => ({
      url: `${base}/services/${page.serviceSlug}/${page.areaSlug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  return [
    {url: `${base}/services`, lastModified, changeFrequency: 'weekly', priority: 1},
    ...servicePages,
  ]
}
