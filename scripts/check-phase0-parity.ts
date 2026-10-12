/**
 * Phase 0 parity check: a candidate deployment must serve every current URL exactly
 * like production. Read-only GET requests only; it never submits a form.
 *
 *   pnpm check:parity <candidateBaseUrl> [referenceBaseUrl]
 *
 * Both base URLs are origins whose /services/... paths serve this app, e.g.
 * http://localhost:3000 (pnpm build && pnpm start) or a Vercel preview URL, against
 * https://www.highlightschicago.com (the default reference).
 */
import assert from 'node:assert/strict'
import {REDIRECT_SOURCE_SLUGS} from '../src/lib/reserved-slugs'

const candidate = (process.argv[2] || '').replace(/\/$/, '')
const reference = (process.argv[3] || 'https://www.highlightschicago.com').replace(/\/$/, '')
if (!candidate) throw new Error('Usage: pnpm check:parity <candidateBaseUrl> [referenceBaseUrl]')

const failures: string[] = []
const check = (ok: boolean, message: string) => { if (!ok) failures.push(message) }

async function get(base: string, pathname: string) {
  const response = await fetch(`${base}${pathname}`, {redirect: 'manual', headers: {'user-agent': 'phase0-parity-check'}})
  return {status: response.status, location: response.headers.get('location'), body: response.status === 200 ? await response.text() : ''}
}

const pathOf = (location: string | null) => (location ? new URL(location, 'https://x.invalid').pathname.replace(/\/$/, '') : null)
const titleOf = (html: string) => html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim()
const canonicalOf = (html: string) => html.match(/<link\b[^>]*rel="canonical"[^>]*>/i)?.[0].match(/href="([^"]+)"/)?.[1]
const robotsOf = (html: string) => html.match(/<meta\b[^>]*name="robots"[^>]*>/i)?.[0].match(/content="([^"]+)"/)?.[1] || ''
const jsonLdOf = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.stringify(JSON.parse(match[1])))
const locsOf = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort()

/** Page markup without scripts, stylesheets or build hashes. */
function visibleMarkup(html: string): string {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html
  return body
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/_next\/[^"' )]+/g, '/_next/*')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstDifference(left: string, right: string): string {
  let index = 0
  while (index < left.length && left[index] === right[index]) index++
  return `…${left.slice(Math.max(0, index - 60), index + 80)}… vs …${right.slice(Math.max(0, index - 60), index + 80)}…`
}

async function main() {
  // Sitemap: the same URLs.
  const [refSitemap, candSitemap] = await Promise.all([get(reference, '/services/sitemap.xml'), get(candidate, '/services/sitemap.xml')])
  assert.equal(refSitemap.status, 200, 'reference sitemap must load')
  check(candSitemap.status === 200, `sitemap status ${candSitemap.status}`)
  const refLocs = locsOf(refSitemap.body)
  check(JSON.stringify(locsOf(candSitemap.body)) === JSON.stringify(refLocs), `sitemap URLs differ (${locsOf(candSitemap.body).length} vs ${refLocs.length})`)
  console.log(`sitemap: ${refLocs.length} URLs compared`)

  // Every sitemap page: status, title, canonical, robots, JSON-LD and visible markup.
  const pagePaths = refLocs.map((loc) => new URL(loc).pathname)
  let identicalMarkup = 0
  for (const pathname of pagePaths) {
    const [ref, cand] = await Promise.all([get(reference, pathname), get(candidate, pathname)])
    check(cand.status === ref.status, `${pathname}: status ${cand.status} vs ${ref.status}`)
    if (ref.status !== 200 || cand.status !== 200) continue
    check(titleOf(cand.body) === titleOf(ref.body), `${pathname}: title "${titleOf(cand.body)}" vs "${titleOf(ref.body)}"`)
    check(canonicalOf(cand.body) === canonicalOf(ref.body), `${pathname}: canonical ${canonicalOf(cand.body)} vs ${canonicalOf(ref.body)}`)
    check(robotsOf(cand.body) === robotsOf(ref.body), `${pathname}: robots "${robotsOf(cand.body)}" vs "${robotsOf(ref.body)}"`)
    check(JSON.stringify(jsonLdOf(cand.body)) === JSON.stringify(jsonLdOf(ref.body)), `${pathname}: JSON-LD differs`)
    const [refMarkup, candMarkup] = [visibleMarkup(ref.body), visibleMarkup(cand.body)]
    if (refMarkup === candMarkup) identicalMarkup++
    else failures.push(`${pathname}: page markup differs ${firstDifference(candMarkup, refMarkup)}`)
  }
  console.log(`pages: ${pagePaths.length} compared, ${identicalMarkup} with identical markup`)

  // Old /<slug>/chicago links still redirect to the clean URL.
  const servicePaths = pagePaths.filter((pathname) => pathname !== '/services')
  for (const pathname of servicePaths) {
    const cand = await get(candidate, `${pathname}/chicago`)
    check(cand.status === 308 && pathOf(cand.location) === pathname, `${pathname}/chicago: ${cand.status} -> ${cand.location}`)
  }
  console.log(`/chicago links: ${servicePaths.length} checked`)

  // The 78 permanent redirects: same status and target as production.
  for (const slug of REDIRECT_SOURCE_SLUGS) {
    const [ref, cand] = await Promise.all([get(reference, `/services/${slug}`), get(candidate, `/services/${slug}`)])
    check(cand.status === ref.status && pathOf(cand.location) === pathOf(ref.location), `/services/${slug}: ${cand.status} -> ${cand.location} vs ${ref.status} -> ${ref.location}`)
  }
  console.log(`redirects: ${REDIRECT_SOURCE_SLUGS.length} checked`)

  // Thank-you page still serves (its content is checked by pnpm test:thank-you).
  const thankYou = await get(candidate, '/services/thank-you')
  check(thankYou.status === 200, `/services/thank-you: ${thankYou.status}`)

  if (failures.length) {
    console.error(`\nParity FAILED (${failures.length}):\n- ${failures.slice(0, 40).join('\n- ')}`)
    process.exitCode = 1
    return
  }
  console.log(`\nParity passed: ${candidate} serves every current URL exactly like ${reference}.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
