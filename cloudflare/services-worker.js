/**
 * Cloudflare Worker: serves the Service Pages app (Vercel + Sanity) on the main domain.
 *
 *   https://www.highlightschicago.com/services...  ->  <SERVICES_ORIGIN>/services...
 *
 * The visitor's address bar keeps www.highlightschicago.com; the rest of the site stays on Webflow.
 * The app's basePath is /services, so the path and query are forwarded unchanged: /services itself,
 * group pages, service pages, legacy redirects, /_next assets, images, the lead form API, the Studio
 * and /services/sitemap.xml all live under it.
 *
 * Every request under /services goes to the app, whatever its depth or query string. Two gaps in the
 * earlier proxy broke the site:
 * - /services with a query string reached Webflow, which 301s /services to /new-services. A Next.js
 *   link click asks for /services?_rsc=..., so the Services breadcrumb and menu item landed on
 *   /new-services. UTM-tagged links to /services had the same problem.
 * - /services/<group>/<service> reached Webflow and returned its 404.
 *
 * Worker route (Cloudflare → highlightschicago.com zone → Workers Routes):
 *   www.highlightschicago.com/services*
 * The apex domain already 301s to www, so it needs no route.
 *
 * Settings (Worker → Settings → Variables and Secrets):
 *   SERVICES_ORIGIN       required. The Vercel host the current worker forwards to, e.g. https://<project>.vercel.app
 *   VERCEL_BYPASS_SECRET  optional secret. Sent as x-vercel-protection-bypass when that host is behind
 *                         Vercel Deployment Protection.
 */

const PUBLIC_ORIGIN = 'https://www.highlightschicago.com'
const PREFIX = '/services'

/** /services and anything below it. The route pattern also matches /services-old and the like; those stay on Webflow. */
export function isServicesPath(pathname) {
  return pathname === PREFIX || pathname.startsWith(`${PREFIX}/`)
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url)
    // Match on the path only: the query string must never send a request to Webflow.
    if (!isServicesPath(url.pathname)) return fetch(request)

    const origin = String(env.SERVICES_ORIGIN || '').replace(/\/$/, '')
    if (!origin) return new Response('SERVICES_ORIGIN is not set on the services worker', {status: 500})

    // Vercel routes by Host, so it must be the origin's host, not the public one.
    const headers = new Headers(request.headers)
    headers.delete('Host')
    if (env.VERCEL_BYPASS_SECRET) headers.set('x-vercel-protection-bypass', env.VERCEL_BYPASS_SECRET)

    const upstream = new Request(`${origin}${url.pathname}${url.search}`, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      // Pass the app's own redirects to the browser instead of following them here.
      redirect: 'manual',
    })

    const response = await fetch(upstream)
    const proxied = new Response(response.body, response)

    // Redirects from the app must point back at the public domain, never at the origin host.
    const location = proxied.headers.get('Location')
    if (location && location.startsWith(origin)) proxied.headers.set('Location', PUBLIC_ORIGIN + location.slice(origin.length))

    return proxied
  },
}

export default worker
