/**
 * Two designs share the /services/<slug> URLs during the rollout: the current
 * template (servicePage) and the new one (v2ServicePage, Design System v3). A URL
 * shows its published new-design page when there is one, otherwise its current
 * page, so publishing or unpublishing a new-design page switches the URL and
 * nothing is ever deleted.
 */
export type ServiceDesign = 'current' | 'new'

type DesignRoute = {design?: ServiceDesign | null; serviceSlug?: string | null; areaSlug?: string | null}

const urlKey = (route: DesignRoute) => `${route.areaSlug || ''}/${route.serviceSlug || ''}`

/**
 * One entry per URL. A new-design entry replaces the current-design entry for the
 * same URL; everything else keeps its place, so with no new-design pages the list
 * comes back unchanged.
 */
export function preferNewDesign<T extends DesignRoute>(routes: T[]): T[] {
  const replaced = new Set(routes.filter((route) => route.design === 'new' && route.serviceSlug).map(urlKey))
  return routes.filter((route) => route.design === 'new' || !replaced.has(urlKey(route)))
}

/**
 * The current pages store full titles ("… | Highlights Chicago"), so they are used
 * exactly as written. New-design titles may leave the brand out, and the root
 * layout's title template then adds it once. A title that ends in a cut-off brand
 * ("… | Highlights") loses that stub, so the template's full brand is not doubled.
 */
export function newDesignTitle(stored: string | null | undefined, fallback: string): string | {absolute: string} {
  const title = (stored || '').trim().replace(/\s*[|\-–—]\s*Highlights\s*$/i, '')
  if (!title) return fallback
  return /\bHighlights Chicago\b/i.test(title) ? {absolute: title} : title
}
