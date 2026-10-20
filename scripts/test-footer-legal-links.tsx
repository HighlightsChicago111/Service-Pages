import assert from 'node:assert/strict'
import {renderToStaticMarkup} from 'react-dom/server'
import {CollectionFooter} from '../src/components/collection-chrome'
import {SiteFooter} from '../src/components/v3/chrome'
import {serviceClusters} from '../src/lib/clusters'
import {LEGAL_LINKS} from '../src/lib/legal-links'
import {SERVICES_PATH, THANK_YOU_PATH, clusterPagePath} from '../src/lib/service-urls'
import type {V2Settings} from '../src/types/v2'

// Every page ends with one of two footers: CollectionFooter (the /services index, service groups, current-design
// service pages and the thank-you page) or SiteFooter (new-design service pages). Both must show the same
// Privacy Policy and Terms and Conditions links as the Webflow home page, right under the copyright line.
//
//   tsx scripts/test-footer-legal-links.tsx                      offline: renders both footers
//   tsx scripts/test-footer-legal-links.tsx https://www.highlightschicago.com
//                                                                also checks the live pages and that both targets are published
const baseUrl = process.argv[2]?.replace(/\/$/, '')
const EXPECTED = [
  {label: 'Privacy Policy', href: 'https://www.highlightschicago.com/privacy-policy', title: /^Privacy Policy \| Highlights Chicago$/},
  {label: 'Terms and Conditions', href: 'https://www.highlightschicago.com/terms-and-conditions', title: /^Terms and Conditions \| Highlights Chicago$/},
]

const settings: V2Settings = {
  companyName: 'Highlights Chicago Inc.',
  phoneDisplay: '(773) 262-3333',
  email: 'info@highlightschicago.com',
  address: {street: '5766 N Lincoln Ave', city: 'Chicago', state: 'IL', zip: '60659'},
}

/** The footer's bottom row: copyright, the Legal nav, then the social icons, in that order. */
function checkFooter(name: string, html: string, navClass: string) {
  const navs = [...html.matchAll(/<nav\b[^>]*aria-label="Legal"[^>]*>([\s\S]*?)<\/nav>/g)]
  assert.equal(navs.length, 1, `${name}: expected exactly one Legal nav, found ${navs.length}`)
  assert.match(navs[0][0], new RegExp(`class="${navClass}"`), `${name}: the Legal nav must use ${navClass}`)

  const links = [...navs[0][1].matchAll(/<a\b([^>]*)>([^<]*)<\/a>/g)].map((m) => ({attrs: m[1], label: m[2], href: m[1].match(/href="([^"]*)"/)?.[1]}))
  assert.deepEqual(links.map((l) => [l.label, l.href]), EXPECTED.map((e) => [e.label, e.href]), `${name}: Legal links must be Privacy Policy then Terms and Conditions with the Webflow URLs`)
  for (const link of links) assert.ok(!/\b(target|download)=|data-prefetch|rel="nofollow"/.test(link.attrs), `${name}: ${link.label} must be a plain same-tab link, got ${link.attrs}`)

  const at = (needle: RegExp | string) => (typeof needle === 'string' ? html.indexOf(needle) : html.search(needle))
  const copyright = at('Copyright ©'), legal = at(navs[0][0]), social = at('aria-label="Highlights Chicago on Facebook"')
  assert.ok(copyright >= 0 && legal > copyright && social > legal, `${name}: order must be copyright, then legal links, then social icons`)
}

async function offline() {
  assert.deepEqual(LEGAL_LINKS.map((l) => [l.label, l.href]), EXPECTED.map((e) => [e.label, e.href]), 'LEGAL_LINKS must match the Webflow footer')
  checkFooter('CollectionFooter', renderToStaticMarkup(<CollectionFooter />), 'hc-footer-legal')
  checkFooter('SiteFooter', renderToStaticMarkup(<SiteFooter settings={settings} tel="tel:+17732623333" />), 'ds-footer-legal')
}

async function live(origin: string) {
  const html = async (path: string) => {
    const response = await fetch(`${origin}${path}`)
    assert.equal(response.status, 200, `${path} must return 200`)
    return response.text()
  }
  // One page of every kind, found from the sitemap so renamed service URLs do not break this test.
  const sitemap = await html(`${SERVICES_PATH}/sitemap.xml`)
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].replace(/&amp;/g, '&')).pathname)
  const groupPaths = new Set(serviceClusters.map((cluster) => clusterPagePath(cluster.slug)))
  const group = paths.find((path) => groupPaths.has(path))
  const service = paths.find((path) => path !== SERVICES_PATH && !groupPaths.has(path))
  assert.ok(group && service, 'The sitemap must list a service group page and a service page')
  // Current-design pages render the .hc footer; new-design pages render the .ds one.
  for (const path of [SERVICES_PATH, group, service, THANK_YOU_PATH]) {
    const page = await html(path)
    checkFooter(path, page, /<div class="ds[ "]/.test(page) ? 'ds-footer-legal' : 'hc-footer-legal')
  }
  // The links must not lead anywhere dead: both Webflow pages are published and keep their titles.
  for (const target of EXPECTED) {
    const response = await fetch(target.href, {redirect: 'manual'})
    assert.equal(response.status, 200, `${target.href} must answer 200 without a redirect`)
    const title = (await response.text()).match(/<title>([^<]*)<\/title>/)?.[1] || ''
    assert.match(title, target.title, `${target.href} must be the ${target.label} page`)
  }
}

async function run() {
  await offline()
  if (baseUrl) await live(baseUrl)
  console.log(`Footer legal links test passed: both footers show ${EXPECTED.map((e) => e.label).join(' and ')} after the copyright line${baseUrl ? `, and the live pages and both target pages are in order (${baseUrl})` : ''}.`)
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
