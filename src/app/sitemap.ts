import type {MetadataRoute} from 'next'
import {metadataClient} from '@/sanity/lib/client'
import {SERVICE_INDEX_QUERY} from '@/sanity/lib/queries'
import {clusterForService, serviceClusters} from '@/lib/clusters'
import {preferNewDesign, type ServiceDesign} from '@/lib/design-precedence'
import {PRIMARY_AREA_SLUG, PUBLIC_SITE_ORIGIN, SERVICES_PATH, clusterPagePath, servicePageUrl} from '@/lib/service-urls'

// Next serves this at /services/sitemap.xml because basePath is applied to the
// sitemap route automatically. Every <loc> is an absolute URL on the public
// canonical host (NEXT_SITE_URL, e.g. https://www.highlightschicago.com).
export const revalidate = 3600

type Route = {serviceSlug?: string | null; areaSlug?: string | null; parentName?: string | null; _updatedAt?: string | null; design?: ServiceDesign | null}

const latest = (dates: Array<string | null | undefined>) => dates
  .filter((value): value is string => Boolean(value))
  .sort()
  .at(-1)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Both designs, one entry per URL (a published new-design page wins).
  const pages = preferNewDesign((await metadataClient.fetch<Route[]>(SERVICE_INDEX_QUERY)) || [])
  const published = pages.filter((page): page is Route & {serviceSlug: string; areaSlug: string} => Boolean(page.serviceSlug && page.areaSlug === PRIMARY_AREA_SLUG))

  const servicePages = published.map((page) => ({
    url: servicePageUrl(page.serviceSlug, page.parentName),
    lastModified: page._updatedAt ? new Date(page._updatedAt) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // A group is listed once it has a published page, from the workbook or by its Sanity cluster name.
  const clusterPages = serviceClusters
    .map((cluster) => ({cluster, members: published.filter((page) => clusterForService(page.serviceSlug, page.parentName)?.slug === cluster.slug)}))
    .filter(({members}) => members.length > 0)
    .map(({cluster, members}) => {
      const lastModified = latest(members.map((page) => page._updatedAt))
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
