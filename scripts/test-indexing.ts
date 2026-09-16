import assert from 'node:assert/strict'

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

function serviceLinks(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\bhref="(\/services\/[^"#?]+)"/gi)]
    .map((match) => match[1])
    .filter((href) => href.split('/').filter(Boolean).length === 3)
}

function relatedServiceLinks(html: string): string[] {
  const section = html.match(/<section\s+class="wrap"\s+id="other-services">([\s\S]*?)<\/section>/i)?.[1] || ''
  return serviceLinks(section)
}

function breadcrumbLists(html: string): Array<{itemListElement?: Array<{position?: number; item?: string}>}> {
  return [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      try {
        const parsed = JSON.parse(match[1]) as {'@graph'?: Array<{'@type'?: string; itemListElement?: Array<{position?: number; item?: string}>}>}
        return (parsed['@graph'] || []).filter((entry) => entry['@type'] === 'BreadcrumbList')
      } catch {
        return []
      }
    })
}

async function run() {
  const sitemapResponse = await fetch(`${baseUrl}/services/sitemap.xml`)
  assert.equal(sitemapResponse.status, 200, 'Sitemap must return 200')
  const sitemap = await sitemapResponse.text()
  const locations = xmlValues(sitemap, 'loc')
  const lastModified = xmlValues(sitemap, 'lastmod')
  const serviceLocations = locations.filter((url) => new URL(url).pathname.split('/').filter(Boolean).length === 3)
  const servicePaths = new Set(serviceLocations.map((url) => new URL(url).pathname))

  assert.equal(serviceLocations.length, expectedPageCount, `Sitemap must contain ${expectedPageCount} service pages`)
  assert.equal(locations.length, expectedPageCount + 1, 'Sitemap must contain the services hub plus every service page')
  assert.equal(lastModified.length, locations.length, 'Every sitemap URL must have a lastmod value')
  assert.ok(new Set(lastModified).size > 1, 'Sitemap lastmod values must come from document updates, not one build timestamp')

  for (const publicUrl of serviceLocations) {
    const pathname = new URL(publicUrl).pathname
    const response = await fetch(`${baseUrl}${pathname}`, {redirect: 'manual'})
    assert.equal(response.status, 200, `${pathname} must return 200 without a redirect`)
    assert.ok(!/no-store/i.test(response.headers.get('cache-control') || ''), `${pathname} must be cacheable`)
    const html = await response.text()
    assert.equal(canonicalFrom(html), publicUrl, `${pathname} canonical must exactly match its sitemap URL`)
    assert.ok(!publicUrl.endsWith('/'), `${pathname} canonical must not have a trailing slash`)
    assert.equal((titleFrom(html).match(/Highlights Chicago/gi) || []).length, 1, `${pathname} title must contain the brand once`)

    const breadcrumbs = breadcrumbLists(html)
    assert.equal(breadcrumbs.length, 1, `${pathname} must have one BreadcrumbList`)
    assert.equal(breadcrumbs[0].itemListElement?.length, 3, `${pathname} breadcrumb schema must have three items`)
    assert.equal(breadcrumbs[0].itemListElement?.at(-1)?.item, publicUrl, `${pathname} final breadcrumb must equal its canonical`)

    const relatedLinks = relatedServiceLinks(html)
    assert.equal(new Set(relatedLinks).size, 4, `${pathname} must link to four distinct published related services`)
    for (const href of relatedLinks) {
      assert.ok(servicePaths.has(href), `${pathname} links to unpublished service route ${href}`)
    }
  }

  console.log(`Indexing regression test passed for ${serviceLocations.length} service pages.`)
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
