import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import {servicePageUrl} from '../src/lib/service-urls'
import {
  META_COLUMNS, capacityFor, capacityFromHeaders, comparable, differences, flatten, fromCsv, lostValues, sheetColumns, toCsv, unflatten, unknownColumns,
} from './lib/page-sheet'
import {APPS_SCRIPT_PATH, renderAppsScript} from './lib/page-sheet-apps-script'

// A page shaped like the live ones: inline objects, named objects, a reference, an uploaded image,
// a list inside a list item, and text with commas, quotes and line breaks.
const page = {
  _id: 'v2-page-999', _type: 'v2ServicePage', _rev: 'abc', _updatedAt: '2026-10-31T06:00:00Z',
  serviceId: 999, name: 'Test Service, "quoted"', slug: {_type: 'slug', current: 'test-service'}, parentName: 'Electrical Wiring',
  area: {_type: 'reference', _ref: 'v2-area-chicago'},
  seo: {title: 'Test Service in Chicago', description: 'Line one,\nline two.'},
  primaryKeywords: ['test service', 'test service chicago'], monthlySearchVolume: 1300,
  hero: {h1Prefix: 'Test Service', lede: 'First line.\nSecond line.', image: {_type: 'v2Image', alt: 'A photo of a panel', image: {_type: 'image', asset: {_type: 'reference', _ref: 'image-abc-800x600-jpg'}}}},
  gallery: [{_key: 'g1', _type: 'v2Image', alt: 'First photo here', externalUrl: '/services/images/a.webp'}],
  equipment: {heading: 'Equipment', comparison: {columns: ['A', 'B'], rows: [{_key: 'r1', _type: 'v2ComparisonRow', label: 'Cost', values: ['$1', '$2']}]}},
  process: {steps: [{_key: 's1', _type: 'v2ProcessStep', title: 'Visit', owners: ['highlights', 'city']}]},
  faqs: [{_key: 'f1', _type: 'v2Faq', question: 'Why?', answer: 'Because.'}, {_key: 'f2', _type: 'v2Faq', question: 'How?', answer: 'Carefully.'}],
  serviceGuide: {_type: 'v2Guide', title: 'Guide', sections: [{_key: 's1', _type: 'v2GuideSection', heading: 'One', body: 'Body.'}]},
}

const capacity = capacityFor([page])
const columns = sheetColumns(capacity)
const paths = columns.map((column) => column.path)

// 1. Headings are exact Sanity field paths, lists numbered from 1, in schema order.
for (const heading of ['serviceId', 'slug', 'area', 'seo.title', 'hero.h1Prefix', 'hero.image.image', 'faqs[1].question', 'faqs[2].answer',
  'equipment.comparison.rows[1].values[2]', 'process.steps[1].owners[1]', 'serviceGuide.sections[1].body']) {
  assert.ok(paths.includes(heading), `missing column ${heading}`)
}
assert.ok(paths.indexOf('faqs[1].answer') < paths.indexOf('faqs[2].question'), 'list items keep their parts together')
assert.equal(new Set(paths).size, paths.length, 'no duplicate headings')
// Room for the longest list plus 2 empty items.
assert.equal(capacity.faqs, 4)
assert.ok(paths.includes('faqs[4].answer') && !paths.includes('faqs[5].answer'))

// 2. Page -> row -> page loses nothing, and named objects get their _type and a _key back.
const row = flatten(page, columns)
assert.equal(row.slug, 'test-service')
assert.equal(row.area, 'v2-area-chicago')
assert.equal(row['primaryKeywords[2]'], 'test service chicago')
assert.deepEqual(lostValues(page, columns), [])
const back = unflatten(row, columns)
assert.deepEqual(back.errors, [])
assert.deepEqual(comparable(back.doc), comparable(page))
assert.equal(back.doc._type, 'v2ServicePage')
assert.equal(back.doc.faqs[1]._type, 'v2Faq')
assert.ok(back.doc.faqs[1]._key, 'list items get a _key')
assert.equal(back.doc.hero.image._type, 'v2Image')
assert.equal(back.doc.serviceGuide.sections[0]._type, 'v2GuideSection')
assert.equal(back.doc.hero._type, undefined, 'inline objects stay untyped')

// 3. A page with more items than columns is reported, never silently cut.
const tooMany = {...page, faqs: Array.from({length: 5}, (_, i) => ({_key: `f${i}`, _type: 'v2Faq', question: `Q${i}`, answer: `A${i}`}))}
assert.ok(lostValues(tooMany, columns).some((lost) => lost.startsWith('faqs')), 'a fifth FAQ must be reported as lost')

// 4. An edited cell shows up as exactly that change; a blank item disappears.
const edited = unflatten({...row, 'faqs[2].answer': 'Very carefully.', 'faqs[1].question': '', 'faqs[1].answer': ''}, columns)
assert.deepEqual(differences(page, edited.doc).map((change) => change.path), ['faqs.0.answer', 'faqs.0.question', 'faqs.1'])
assert.equal(edited.doc.faqs.length, 1)

// 5. Bad numbers and bad JSON are errors, never guesses.
const broken = unflatten({...row, monthlySearchVolume: 'lots', 'hero.image.image': '{not json'}, columns)
assert.deepEqual(broken.errors, ['monthlySearchVolume: "lots" is not a number', 'hero.image.image: not valid JSON'])

// 6. A misspelled heading is caught; bookkeeping headings are not fields but are allowed.
assert.deepEqual(unknownColumns([...META_COLUMNS, 'seo.title', 'seo.titel', 'faqs[1].questoin'], columns), ['seo.titel', 'faqs[1].questoin'])

// 7. CSV keeps commas, quotes and line breaks, and the headings alone give back the same columns.
const headers = [...META_COLUMNS, ...paths]
const csv = toCsv(headers, [{_id: 'v2-page-999', ...row}])
const parsed = fromCsv(csv)
assert.deepEqual(parsed.headers, headers)
assert.equal(parsed.rows[0].name, 'Test Service, "quoted"')
assert.equal(parsed.rows[0]['seo.description'], 'Line one,\nline two.')
assert.equal(parsed.rows[0]['hero.lede'], 'First line.\nSecond line.', 'a line break alone must not split the row')
assert.deepEqual(sheetColumns(capacityFromHeaders(parsed.headers)), columns)
assert.deepEqual(comparable(unflatten(parsed.rows[0], columns).doc), comparable(page))

// 8. The in-sheet Apps Script is current with the schema and builds the same rows as this code.
const gsSource = fs.readFileSync(APPS_SCRIPT_PATH, 'utf8').replace(/\r\n/g, '\n') // a Windows checkout may add CRs
assert.equal(gsSource, renderAppsScript(gsSource), 'google-apps-script/service-pages.gs is out of date: run pnpm sheet:apps-script and paste it into the sheet')
type Row = Record<string, string>
const gs = vm.createContext({})
vm.runInContext(`${gsSource}\nthis.api = {spColumns, spCapacity, spRow, spUrl, spMerge}`, gs)
const api = gs.api as {
  spColumns: (capacity: Record<string, number>) => Array<{path: string; kind: string}>
  spCapacity: (docs: unknown[], headers: string[]) => Record<string, number>
  spRow: (doc: unknown, columns: unknown) => Row
  spUrl: (slug: string, parentName?: string) => string
  spMerge: (docs: unknown[], headers: string[], rows: Row[], unchanged: (row: Row) => boolean) => {headers: string[]; rows: Row[]; fromSanity: Set<string>}
}
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value))
assert.deepEqual(plain(api.spCapacity([page], [])), capacity, 'same list sizes')
assert.deepEqual(plain(api.spColumns(capacity)), columns, 'same columns, same order')
const gsRow = api.spRow(page, api.spColumns(capacity))
for (const column of columns) assert.equal(gsRow[column.path], row[column.path], `same cell ${column.path}`)
for (const [slug, parent] of [['gfci-outlet-installation', ''], ['test-service', 'Electrical Wiring'], ['brand-new-page', 'Power Distribution & Service Entry'], ['no-group', 'Unknown group']]) {
  assert.equal(api.spUrl(slug, parent), servicePageUrl(slug, parent), `same URL for ${slug}`)
}

// 9. The refresh never loses a row written in the sheet.
const merge = (...args: Parameters<typeof api.spMerge>) => {
  const result = api.spMerge(...args)
  return {headers: plain(result.headers), rows: plain(result.rows), fromSanity: result.fromSanity}
}
const fresh = merge([page], [], [], () => false)
assert.deepEqual(fresh.rows.map((r) => r._id), ['v2-page-999'])
assert.equal(fresh.rows[0]._status, 'Published')
assert.equal(fresh.rows[0]._url, servicePageUrl('test-service', 'Electrical Wiring'))
const written = fresh.rows[0]
const newRow: Row = {_id: '', name: 'Brand new page', slug: 'brand-new-page'}
const goneRow: Row = {_id: 'v2-page-998', _status: 'Published', name: 'Unpublished since'}
const later = {...page, _updatedAt: '2026-11-01T00:00:00Z', name: 'Renamed in Sanity'}
// a. Nobody touched the row: Sanity's newer version replaces it; other rows stay, marked.
let merged = merge([later], fresh.headers, [written, newRow, goneRow, {_id: '', name: ''}], () => true)
assert.deepEqual(merged.rows.map((r) => [r._id, r._status]), [['v2-page-999', 'Published'], ['', 'Not in Sanity yet'], ['v2-page-998', 'Not published']])
assert.equal(merged.rows[0].name, 'Renamed in Sanity')
assert.equal(merged.rows[1].name, 'Brand new page')
assert.ok(merged.fromSanity.has('v2-page-999') && merged.fromSanity.size === 1)
// b. The row was edited in the sheet: it is kept as written, and flagged when Sanity changed too.
const editedRow = {...written, 'faqs[1].answer': 'Edited in the sheet'}
merged = merge([later], fresh.headers, [editedRow], () => false)
assert.equal(merged.rows[0]['faqs[1].answer'], 'Edited in the sheet')
assert.equal(merged.rows[0]._status, 'Edited in sheet; also changed in Sanity since')
assert.equal(merged.fromSanity.size, 0)
// c. Once Sanity says what the sheet says (imported and published), the row follows Sanity again.
merged = merge([{...page, _updatedAt: '2026-11-02T00:00:00Z'}], fresh.headers, [{...written, _updatedAt: 'old'}], () => false)
assert.equal(merged.rows[0]._updatedAt, '2026-11-02T00:00:00Z')
assert.ok(merged.fromSanity.has('v2-page-999'))
// d. A column added by hand, and extra list items, are kept.
merged = merge([page], [...fresh.headers, 'notes'], [{...written, notes: 'check photos'}], () => true)
assert.equal(merged.headers.at(-1), 'notes')
assert.equal(merged.rows[0].notes, 'check photos')
merged = merge([page], [...fresh.headers, 'faqs[9].question'], [], () => true)
assert.ok(merged.headers.includes('faqs[9].answer'), 'a list never shrinks below what the sheet already has')

console.log('page sheet: all checks passed')
