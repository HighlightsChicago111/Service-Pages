export const PUBLIC_SITE_ORIGIN = 'https://www.highlightschicago.com'
export const SERVICES_PATH = '/services'

export type ServiceRoute = {
  serviceSlug: string
  areaSlug: string
}

export function servicePagePath(serviceSlug: string, areaSlug: string): string {
  return `${SERVICES_PATH}/${serviceSlug}/${areaSlug}`
}

export function servicePageUrl(serviceSlug: string, areaSlug: string): string {
  return `${PUBLIC_SITE_ORIGIN}${servicePagePath(serviceSlug, areaSlug)}`
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Convert legacy Sanity related-service URLs into a route that is known to be
 * published. Category segments and trailing slashes are deliberately removed.
 */
export function resolvePublishedServicePath(
  url: string | undefined,
  name: string | undefined,
  routes: ServiceRoute[],
  areaSlug: string,
): string | null {
  const areaRoutes = routes.filter((route) => route.areaSlug === areaSlug)
  if (!areaRoutes.length) return null

  const candidates: string[] = []
  if (url) {
    try {
      const parsed = new URL(url, PUBLIC_SITE_ORIGIN)
      if (!/(^|\.)highlightschicago\.com$/i.test(parsed.hostname)) return null
      const segments = parsed.pathname.split('/').filter(Boolean)
      const servicesIndex = segments.indexOf('services')
      if (servicesIndex >= 0) candidates.push(...segments.slice(servicesIndex + 1))
    } catch {
      return null
    }
  }
  if (name) candidates.push(slugify(name))

  const route = areaRoutes.find((item) => candidates.includes(item.serviceSlug))
  return route ? servicePagePath(route.serviceSlug, route.areaSlug) : null
}

/** Remove any stored brand suffix so the root metadata template adds it once. */
export function unbrandedPageTitle(title: string | null | undefined): string {
  return (title || '')
    .replace(/\s*(?:[|\-–—]\s*)?Highlights Chicago\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
