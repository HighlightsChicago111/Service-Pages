import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import nextConfig from '../next.config'
import {newDesignTitle, preferNewDesign} from '../src/lib/design-precedence'
import {REDIRECT_SOURCE_SLUGS, RESERVED_PATH_SLUGS, reservedSlugReason} from '../src/lib/reserved-slugs'
import {toNewDesignPageData} from '../src/lib/v3/page-data'
import {schemaTypes} from '../src/sanity/schemaTypes'
import type {V2Area, V2Page, V2Settings} from '../src/types/v2'

const CURRENT_TYPES = [
  'faq', 'externalImage', 'serviceType', 'titledBody', 'linkedService', 'pricingRow', 'review', 'guide', 'subArea',
  'trustMetric', 'siteSettings', 'servicePageTemplate', 'serviceDefinition', 'serviceArea', 'servicePage',
]

async function main() {
  // 1. The reserved-slug copy matches the 78 permanent redirects in next.config.ts exactly.
  const redirects = (await nextConfig.redirects?.()) || []
  const permanentSources = redirects
    .filter((redirect) => redirect.permanent)
    .map((redirect) => redirect.source.replace(redirect.basePath === false ? /^\/services\// : /^\//, ''))
  assert.equal(permanentSources.length, 78, 'next.config.ts should define 78 permanent redirects')
  assert.deepEqual([...REDIRECT_SOURCE_SLUGS].sort(), [...permanentSources].sort(), 'src/lib/reserved-slugs.ts is out of sync with next.config.ts')

  // 2. Studio slug validation: redirect sources and reserved paths are refused, live and new slugs are allowed.
  for (const slug of [...REDIRECT_SOURCE_SLUGS, ...RESERVED_PATH_SLUGS, 'Circuit-Breaker']) assert.ok(reservedSlugReason(slug), `${slug} should be refused`)
  for (const slug of ['solar-panel-installation', 'solar-inverter-installation', 'well-pump-wiring', undefined]) assert.equal(reservedSlugReason(slug), undefined)

  // 3. One entry per URL, new design first; with no new-design pages nothing changes.
  const current = [
    {design: 'current' as const, serviceSlug: 'a', areaSlug: 'chicago'},
    {design: 'current' as const, serviceSlug: 'b', areaSlug: 'chicago'},
    {design: 'current' as const, serviceSlug: 'c', areaSlug: 'chicago'},
  ]
  assert.deepEqual(preferNewDesign(current), current)
  assert.deepEqual(preferNewDesign([...current, {design: 'new', serviceSlug: 'b', areaSlug: 'chicago'}, {design: 'new', serviceSlug: 'd', areaSlug: 'chicago'}]).map((route) => `${route.design}:${route.serviceSlug}`), [
    'current:a', 'current:c', 'new:b', 'new:d',
  ])
  // Routes without a design tag (older callers) are kept as current pages.
  assert.deepEqual(preferNewDesign([{serviceSlug: 'a', areaSlug: 'chicago'}]), [{serviceSlug: 'a', areaSlug: 'chicago'}])

  // 4. Titles: the current pages' full titles are used as written; a new-design title gets the brand once.
  assert.deepEqual(newDesignTitle('Solar Panel Installation in Chicago | Highlights Chicago', 'x'), {absolute: 'Solar Panel Installation in Chicago | Highlights Chicago'})
  assert.equal(newDesignTitle('Solar Panel Installation & Service in Chicago', 'x'), 'Solar Panel Installation & Service in Chicago')
  assert.equal(newDesignTitle('  ', 'Solar Panel Installation in Chicago'), 'Solar Panel Installation in Chicago')

  // 5. The new design only takes a URL when it can render; otherwise the current page stays.
  const page = {_id: 'v2-page-302', serviceId: 302, name: 'Solar', slug: 'solar-panel-installation', hero: {h1Prefix: 'Solar'}} as V2Page
  const area = {name: 'Chicago', slug: 'chicago', state: 'IL'} as V2Area
  const settings = {companyName: 'Highlights Chicago'} as V2Settings
  assert.equal(toNewDesignPageData(null), null)
  assert.equal(toNewDesignPageData({page: null, settings}), null)
  assert.equal(toNewDesignPageData({page: {...page, area}, settings: null}), null)
  assert.equal(toNewDesignPageData({page: {...page, area: null}, settings}), null)
  const data = toNewDesignPageData({
    page: {...page, area},
    settings,
    serviceRoutes: [
      {design: 'current', serviceSlug: 'solar-panel-installation', areaSlug: 'chicago', serviceName: 'Solar Panel Installation (old)'},
      {design: 'current', serviceSlug: 'generator-installation', areaSlug: 'chicago', serviceName: 'Generator Installation'},
      {design: 'new', serviceSlug: 'solar-panel-installation', areaSlug: 'chicago', serviceName: 'Solar Panel Installation'},
      {design: 'current', serviceSlug: 'elsewhere', areaSlug: 'evanston', serviceName: 'Elsewhere'},
    ],
  })
  assert.ok(data)
  assert.equal(data.area?.slug, 'chicago')
  assert.equal('area' in (data.page || {}), false, 'the area is passed separately, not inside the page')
  assert.deepEqual(data.routes.map((route) => route.name), ['Generator Installation', 'Solar Panel Installation'])

  // 6. Schema: the current types are untouched and first; every new type starts with "v2" and clashes with none.
  const names = schemaTypes.map((type) => type.name)
  assert.deepEqual(names.slice(0, CURRENT_TYPES.length), CURRENT_TYPES)
  const added = names.slice(CURRENT_TYPES.length)
  assert.equal(added.length, 22)
  assert.ok(added.every((name) => name.startsWith('v2')), 'every new-design type name starts with v2')
  assert.equal(new Set(names.map((name) => name.toLowerCase())).size, names.length, 'no two types share a name')

  // 7. New-design pages are indexable: nothing on the service-page route or in the
  // ported template sets noindex (the V2 test app did; /thank-you rightly still does).
  const sources = ['src/app/[serviceSlug]', 'src/components/v3', 'src/lib/v3'].flatMap((dir) =>
    fs.readdirSync(dir, {recursive: true}).map((file) => path.join(dir, String(file))).filter((file) => /\.tsx?$/.test(file)),
  )
  assert.ok(sources.length >= 30, 'the template sources were found')
  const noindex = sources.filter((file) => /noindex|index:\s*false/.test(fs.readFileSync(file, 'utf8')))
  assert.deepEqual(noindex, [], `noindex found in ${noindex.join(', ')}`)

  console.log('Design precedence test passed: redirect slugs in sync, one page per URL, titles, schema names and indexing are safe.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
