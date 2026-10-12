/**
 * Checks the workbook -> Sanity mapping on the real extracted workbook, then
 * feeds it broken copies to prove each validation rule actually fires.
 * Run: pnpm content:extract && pnpm test:content
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {buildDocuments, type Row, type SanityDoc, type Source} from './lib/transform'

const source = JSON.parse(fs.readFileSync(path.resolve('data/v2-source.json'), 'utf8')) as Source
const fullReviews = JSON.parse(fs.readFileSync(path.resolve('data/full-reviews.json'), 'utf8')) as Record<string, string>
const clone = (): Source => JSON.parse(JSON.stringify(source)) as Source
let passed = 0
function check(name: string, fn: () => void) {
  fn()
  passed += 1
  console.log(`ok - ${name}`)
}
const errorsFor = (mutate: (copy: Source) => void) => {
  const copy = clone()
  mutate(copy)
  return buildDocuments(copy, fullReviews).errors
}

const base = buildDocuments(source, fullReviews)
const page = base.documents.find((doc) => doc._type === 'v2ServicePage' && doc.serviceId === 302) as SanityDoc & Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- assertion-only access into nested test data

check('the example workbook builds with no errors', () => assert.deepEqual(base.errors, []))
check('settings, area and page documents use v2 ids and types', () => {
  assert.deepEqual([...new Set(base.documents.map((doc) => doc._type))].sort(), ['v2ServiceArea', 'v2ServicePage', 'v2SiteSettings'])
  assert.equal(page._id, 'v2-page-302')
  assert.deepEqual(page.area, {_type: 'reference', _ref: 'v2-area-chicago'})
})
check('every V2 fold of the design file is populated for the example', () => {
  assert.equal(page.jobPaths.items.length, 5)
  assert.equal(page.equipment.items.length, 6)
  assert.equal(page.equipment.comparison.rows.length, 6)
  assert.equal(page.equipment.comparison.columns.length, 3)
  assert.equal(page.equipment.options.items.length, 3)
  assert.equal(page.assessment.checks.length, 10)
  assert.equal(page.assessment.routes.length, 3)
  assert.equal(page.diagnose.rows.length, 7)
  assert.equal(page.why.items.length, 6)
  assert.equal(page.process.steps.length, 9)
  assert.deepEqual(page.process.steps[4].owners, ['highlights', 'comed'])
  assert.equal(page.pricing.rows.length, 6)
  assert.equal(page.pricing.drivers.length, 10)
  assert.equal(page.included.inScope.length, 8)
  assert.equal(page.included.warranty.length, 4)
  assert.equal(page.faqs.length, 11)
  assert.equal(page.cta.readyItems.length, 6)
  assert.equal(page.serviceGuide.sections.length, 4)
  assert.equal(page.form.extraFields.length, 2)
  assert.equal(page.gallery.length, 3)
  assert.equal(page.workingPhotos.length, 3)
})
check('reviews keep their IDs and use the full text by ID', () => {
  assert.equal(page.reviews.length, 4)
  assert.equal(page.reviews[0].sourceId, 'R052')
  assert.equal(page.reviews[0].quote, fullReviews.R052)
})
check('comparison rows keep empty cells in their column position', () => {
  for (const row of page.equipment.comparison.rows) assert.equal(row.values.length, 3)
})
check('[CONFIRM] placeholders are reported', () => assert.ok(base.placeholders.length >= 5))
check('shared guides group into three tabs', () => {
  const area = base.documents.find((doc) => doc._type === 'v2ServiceArea') as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- assertion-only access
  assert.equal(area.sharedGuides.length, 3)
  assert.equal(area.subAreas.length, 12)
})

check('every page has 4 reviews with full text, 3+3 photos and a service guide', () => {
  for (const doc of base.documents.filter((item) => item._type === 'v2ServicePage') as Array<Record<string, any>>) { // eslint-disable-line @typescript-eslint/no-explicit-any -- assertion-only access
    assert.equal(doc.reviews.length, 4, `${doc._id} reviews`)
    for (const review of doc.reviews) assert.equal(review.quote, fullReviews[review.sourceId], `${doc._id} ${review.sourceId}`)
    assert.equal(doc.gallery.length, 3, `${doc._id} gallery`)
    assert.equal(doc.workingPhotos.length, 3, `${doc._id} working photos`)
    assert.ok(doc.serviceGuide.sections.length >= 3, `${doc._id} guide sections`)
    assert.ok(doc.faqs.length >= 6, `${doc._id} faqs`)
  }
})

const items = (copy: Source, block: string) => copy.items.filter((item: Row) => item.block === block && item.owner === '302')
check('rejects a link to an anchor that does not exist', () => {
  assert.match(errorsFor((copy) => { items(copy, 'why')[1].d = 'not-a-section' }).join('\n'), /not a page anchor/)
})
check('rejects an unknown block', () => {
  assert.match(errorsFor((copy) => { copy.items.push({owner: '302', block: 'mystery', order: '1', a: 'x', b: '', c: '', d: '', e: '', f: ''}) }).join('\n'), /unknown block "mystery"/)
})
check('rejects items for a page that is not in 01 Pages', () => {
  assert.match(errorsFor((copy) => { copy.items.push({owner: '999', block: 'faq', order: '1', a: 'Q', b: 'A', c: '', d: '', e: '', f: ''}) }).join('\n'), /owner "999" has no row/)
})
check('rejects a blank required column', () => {
  assert.match(errorsFor((copy) => { copy.pages[0].hero_lede = '' }).join('\n'), /hero_lede is required/)
})
check('rejects a 24/7 availability claim', () => {
  assert.match(errorsFor((copy) => { copy.pages[0].hero_lede += ' Call us 24/7.' }).join('\n'), /24\/7/)
})
check('rejects a listicle title', () => {
  assert.match(errorsFor((copy) => { copy.pages[0].meta_title = '10 Best Solar Installers' }).join('\n'), /listicle/)
})
check('rejects a comparison row wider than its headings', () => {
  assert.match(errorsFor((copy) => { items(copy, 'compare_row')[0].e = 'extra cell' }).join('\n'), /more cells than compare_columns/)
})
check('rejects an unknown process owner and form field name', () => {
  const errors = errorsFor((copy) => { items(copy, 'process_step')[0].c = 'landlord'; items(copy, 'form_field')[0].a = 'budget' }).join('\n')
  assert.match(errors, /owner "landlord"/)
  assert.match(errors, /field_name "budget"/)
})
check('rejects a duplicate slug and an over-long meta title', () => {
  const errors = errorsFor((copy) => { copy.pages.push({...copy.pages[0], service_id: '303'}); copy.pages[0].meta_title = 'x'.repeat(70) }).join('\n')
  assert.match(errors, /duplicate slug/)
  assert.match(errors, /max 65/)
})
check('an empty optional fold is left out of the document', () => {
  const copy = clone()
  copy.items = copy.items.filter((item) => !(item.owner === '302' && item.block === 'job_path'))
  for (const key of ['jobs_heading', 'jobs_lede', 'jobs_note']) copy.pages[0][key] = ''
  const built = buildDocuments(copy, fullReviews).documents.find((doc) => doc._type === 'v2ServicePage') as Record<string, unknown>
  assert.equal(built.jobPaths, undefined)
})

console.log(`\n${passed} checks passed`)
