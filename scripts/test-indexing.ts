import assert from 'node:assert/strict'
import {clusterForService, serviceClusters} from '../src/lib/clusters'
import {PUBLIC_SITE_ORIGIN, clusterPagePath} from '../src/lib/service-urls'

const baseUrl = (process.argv[2] || process.env.INDEXING_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const expectedPageCount = Number(process.env.EXPECTED_SERVICE_PAGE_COUNT || 40)

function decodeXml(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function xmlValues(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}>([^<]+)</${tag}>`, 'g'))].map((match) => decodeXml(match[1]))
}

function canonicalFrom(html: string): string | undefined {
  return html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1]
    || html.match(/<link\s+href="([^"]+)"\s+rel="canonical"/i)?.[1]
}

function titleFrom(html: string): string {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ''
}

function relatedServiceLinks(html: string): string[] {
  const section = html.match(/<section\s+class="wrap"\s+id="other-services">([\s\S]*?)<\/section>/i)?.[1] || ''
  return [...section.matchAll(/<a\b[^>]*\bhref="(\/services\/[^"#?]+)"/gi)].map((match) => match[1])
}

function breadcrumbLists(html: string): Array<{itemListElement?: Array<{position?: number; name?: string; item?: string}>}> {
  return [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      try {
        const parsed = JSON.parse(match[1]) as {'@graph'?: Array<{'@type'?: string; itemListElement?: Array<{position?: number; name?: string; item?: string}>}>}
        return (parsed['@graph'] || []).filter((entry) => entry['@type'] === 'BreadcrumbList')
      } catch {
        return []
      }
    })
}

async function expectPermanentRedirect(pathname: string, destination: string) {
  const response = await fetch(`${baseUrl}${pathname}`, {redirect: 'manual'})
  assert.equal(response.status, 308, `${pathname} must permanently redirect`)
  const location = response.headers.get('location')
  assert.ok(location, `${pathname} must include a redirect location`)
  assert.equal(new URL(location, baseUrl).pathname, destination, `${pathname} must redirect to ${destination}`)
}

async function run() {
  const sitemapResponse = await fetch(`${baseUrl}/services/sitemap.xml`)
  assert.equal(sitemapResponse.status, 200, 'Sitemap must return 200')
  const sitemap = await sitemapResponse.text()
  const locations = xmlValues(sitemap, 'loc')
  const lastModified = xmlValues(sitemap, 'lastmod')
  const clusterUrls = new Set(serviceClusters.map((cluster) => `${PUBLIC_SITE_ORIGIN}${clusterPagePath(cluster.slug)}`))
  const hubUrl = `${PUBLIC_SITE_ORIGIN}/services`
  const clusterLocations = locations.filter((url) => clusterUrls.has(url))
  const serviceLocations = locations.filter((url) => url !== hubUrl && !clusterUrls.has(url))
  const servicePaths = new Set(serviceLocations.map((url) => new URL(url).pathname))

  assert.equal(serviceLocations.length, expectedPageCount, `Sitemap must contain ${expectedPageCount} service pages`)
  assert.ok(clusterLocations.length > 0, 'Sitemap must contain the service group pages')
  assert.equal(locations.length, expectedPageCount + clusterLocations.length + 1, 'Sitemap must contain the services hub, every service group and every service page')
  assert.equal(lastModified.length, locations.length, 'Every sitemap URL must have a lastmod value')
  assert.ok(new Set(lastModified).size > 1, 'Sitemap lastmod values must come from document updates, not one build timestamp')

  for (const publicUrl of clusterLocations) {
    const pathname = new URL(publicUrl).pathname
    const response = await fetch(`${baseUrl}${pathname}`, {redirect: 'manual'})
    assert.equal(response.status, 200, `${pathname} must return 200 without a redirect`)
    assert.ok(!/no-store/i.test(response.headers.get('cache-control') || ''), `${pathname} must be cacheable`)
    const html = await response.text()
    assert.equal(canonicalFrom(html), publicUrl, `${pathname} canonical must exactly match its sitemap URL`)
    assert.equal((titleFrom(html).match(/Highlights/gi) || []).length, 1, `${pathname} title must contain the brand once`)
  }

  for (const publicUrl of serviceLocations) {
    const pathname = new URL(publicUrl).pathname
    const serviceSlug = pathname.split('/').at(-1) || ''
    const cluster = clusterForService(serviceSlug)
    const response = await fetch(`${baseUrl}${pathname}`, {redirect: 'manual'})
    assert.equal(response.status, 200, `${pathname} must return 200 without a redirect`)
    assert.ok(!/no-store/i.test(response.headers.get('cache-control') || ''), `${pathname} must be cacheable`)
    const html = await response.text()
    assert.equal(canonicalFrom(html), publicUrl, `${pathname} canonical must exactly match its sitemap URL`)
    assert.ok(!pathname.endsWith('/chicago'), `${pathname} must not contain the area slug`)
    assert.ok(!publicUrl.endsWith('/'), `${pathname} canonical must not have a trailing slash`)
    if (cluster) assert.equal(pathname, `/services/${cluster.slug}/${serviceSlug}`, `${pathname} must sit under its service group`)
    const pageTitle = titleFrom(html)
    assert.equal((pageTitle.match(/Highlights/gi) || []).length, 1, `${pathname} title must contain the brand once`)
    assert.ok(!/(?:…|\.\.\.)/.test(pageTitle), `${pathname} title must not contain a truncation ellipsis`)
    assert.ok(!/\bInc\.\s*\|\s*Highlights Chicago$/i.test(pageTitle), `${pathname} title must not retain the old company suffix`)

    const breadcrumbs = breadcrumbLists(html)
    assert.equal(breadcrumbs.length, 1, `${pathname} must have one BreadcrumbList`)
    const items = breadcrumbs[0].itemListElement || []
    assert.equal(items.length, cluster ? 4 : 3, `${pathname} breadcrumb schema must list Home, Services${cluster ? ', its group' : ''} and the page`)
    assert.deepEqual(items.map((item) => item.position), items.map((_, index) => index + 1), `${pathname} breadcrumb positions must be sequential`)
    if (cluster) assert.equal(items[2].item, `${PUBLIC_SITE_ORIGIN}${clusterPagePath(cluster.slug)}`, `${pathname} breadcrumb must include its service group`)
    assert.equal(items.at(-1)?.item, publicUrl, `${pathname} final breadcrumb must equal its canonical`)

    const relatedLinks = relatedServiceLinks(html)
    assert.equal(new Set(relatedLinks).size, 4, `${pathname} must link to four distinct published related services`)
    for (const href of relatedLinks) {
      assert.ok(servicePaths.has(href), `${pathname} links to unpublished service route ${href}`)
    }

    // Earlier URLs keep working: the flat launch URL and the /chicago area URL.
    if (cluster) await expectPermanentRedirect(`/services/${serviceSlug}`, pathname)
    await expectPermanentRedirect(`/services/${serviceSlug}/chicago`, pathname)
  }

  console.log(`Indexing regression test passed for ${clusterLocations.length} service groups and ${serviceLocations.length} service pages.`)
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
