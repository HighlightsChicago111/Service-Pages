import assert from 'node:assert/strict'
import {renderToStaticMarkup} from 'react-dom/server'
import {CollectionHeader} from '../src/components/collection-chrome'
import {SiteHeader} from '../src/components/v3/chrome'
import {SERVICES_PATH, THANK_YOU_PATH} from '../src/lib/service-urls'
import type {V2Settings} from '../src/types/v2'

// Every service page shows the same main navigation as the Webflow site: Home, About Us, Services, Service Areas,
// Reviews, Blog, Learning Center. Two headers render it: CollectionHeader (the /services index, service groups,
// current-design service pages and the thank-you page) and SiteHeader (new-design service pages).
//
//   tsx scripts/test-header-nav.tsx                              offline: renders both headers
//   tsx scripts/test-header-nav.tsx https://www.highlightschicago.com
//                                                                also checks every page in the sitemap and that /reviews is published
const baseUrl = process.argv[2]?.replace(/\/$/, '')
const SITE = 'https://www.highlightschicago.com'
const EXPECTED = [
  {label: 'Home', href: `${SITE}/`},
  {label: 'About Us', href: `${SITE}/about-us`},
  {label: 'Services', href: SERVICES_PATH},
  {label: 'Service Areas', href: `${SITE}/service-areas`},
  {label: 'Reviews', href: `${SITE}/reviews`},
  {label: 'Blog', href: `${SITE}/blog`},
  {label: 'Learning Center', href: `${SITE}/learning-center`},
]

const settings: V2Settings = {
  companyName: 'Highlights Chicago Inc.',
  phoneDisplay: '(773) 262-3333',
  email: 'info@highlightschicago.com',
  address: {street: '5766 N Lincoln Ave', city: 'Chicago', state: 'IL', zip: '60659'},
}

/** The desktop navigation's links, in page order. */
function primaryNav(html: string): Array<{label: string; href: string}> {
  const navs = [...html.matchAll(/<nav\b[^>]*aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/g)]
  assert.equal(navs.length, 1, `expected exactly one Primary navigation, found ${navs.length}`)
  return [...navs[0][1].matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
    label: m[2].replace(/<[^>]+>/g, '').trim(),
    href: m[1],
  }))
}

function checkNav(name: string, html: string) {
  const links = primaryNav(html)
  // Labels differ only in letter case between the two designs ("About Us" and "About us").
  assert.deepEqual(links.map((l) => l.label.toLowerCase()), EXPECTED.map((e) => e.label.toLowerCase()), `${name}: navigation must list ${EXPECTED.map((e) => e.label).join(', ')} in that order, got ${links.map((l) => l.label).join(', ')}`)
  assert.deepEqual(links.map((l) => l.href), EXPECTED.map((e) => e.href), `${name}: navigation links must match the main site`)
}

async function offline() {
  checkNav('CollectionHeader', renderToStaticMarkup(<CollectionHeader />))
  checkNav('SiteHeader', renderToStaticMarkup(<SiteHeader settings={settings} tel="tel:+17732623333" />))
}

async function live(origin: string) {
  const get = async (path: string) => {
    const response = await fetch(`${origin}${path}`)
    assert.equal(response.status, 200, `${path} must return 200`)
    return response.text()
  }
  const sitemap = await get(`${SERVICES_PATH}/sitemap.xml`)
  const paths = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].replace(/&amp;/g, '&')).pathname)), THANK_YOU_PATH]
  assert.ok(paths.length > 10, 'The sitemap must list the service pages')
  const failures: string[] = []
  let next = 0
  await Promise.all(Array.from({length: 6}, async () => {
    while (next < paths.length) {
      const path = paths[next++]
      try { checkNav(path, await get(path)) } catch (error) { failures.push(error instanceof Error ? error.message : String(error)) }
    }
  }))
  assert.equal(failures.length, 0, `${failures.length} of ${paths.length} pages have the wrong navigation:\n  ${failures.slice(0, 5).join('\n  ')}`)
  // The Reviews link must lead to a published page, not a redirect or an error.
  const reviews = await fetch(`${SITE}/reviews`, {redirect: 'manual'})
  assert.equal(reviews.status, 200, `${SITE}/reviews must answer 200 without a redirect`)
  return paths.length
}

async function run() {
  await offline()
  const pages = baseUrl ? await live(baseUrl) : 0
  console.log(`Header navigation test passed: both headers list ${EXPECTED.map((e) => e.label).join(', ')}${baseUrl ? `, and all ${pages} live pages match, with /reviews published (${baseUrl})` : ''}.`)
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
