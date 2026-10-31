/**
 * The sheet's "Check selected rows", "Push selected rows to Sanity as drafts", "Add a page from
 * Claude" and "Get a page for Claude" (google-apps-script/service-pages.gs), run against a
 * simulated Google Sheet and Sanity.
 *
 *   pnpm test:sheet
 *
 * 1. A row becomes exactly the page `pnpm sheet:import` would write (same fields, _type, _key, errors).
 * 2. The same rules: required cells, _id vs serviceId, a slug owned by another page, the same page
 *    twice, and a Sanity edit after the row's _updatedAt.
 * 3. Push writes drafts only, only after Yes, only for rows that differ, and reads drafts with
 *    perspective=raw (since API 2025-02-19 Sanity hides drafts otherwise).
 * 4. Add writes a page Claude wrote into exactly the right cells, refuses anything that would be
 *    lost or is not true (unknown fields, invented reviews, listicle titles, stale pages), and Get
 *    hands back a page that Add accepts unchanged.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import {META_COLUMNS, capacityFor, flatten, sheetColumns, unflatten} from './lib/page-sheet'
import {APPS_SCRIPT_PATH, reviewPack} from './lib/page-sheet-apps-script'

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- free-form Sanity documents
type Row = Record<string, string>

const page: Json = {
  _id: 'v2-page-999', _type: 'v2ServicePage', _rev: 'abc', _updatedAt: '2026-10-31T06:00:00Z',
  serviceId: 999, name: 'Test Service', slug: {_type: 'slug', current: 'test-service'}, parentName: 'Electrical Wiring',
  area: {_type: 'reference', _ref: 'v2-area-chicago'},
  seo: {title: 'Test Service in Chicago', description: 'Line one,\nline two.'},
  primaryKeywords: ['test service', 'test service chicago'], monthlySearchVolume: 1300,
  hero: {h1Prefix: 'Test Service', lede: 'First line.', image: {_type: 'v2Image', alt: 'A photo of a panel', image: {_type: 'image', asset: {_type: 'reference', _ref: 'image-abc-800x600-jpg'}}}},
  equipment: {heading: 'Equipment', comparison: {columns: ['A', 'B'], rows: [{_key: 'r1', _type: 'v2ComparisonRow', label: 'Cost', values: ['$1', '$2']}]}},
  faqs: [{_key: 'f1', _type: 'v2Faq', question: 'Why?', answer: 'Because.'}, {_key: 'f2', _type: 'v2Faq', question: 'How?', answer: 'Carefully.'}],
  serviceGuide: {_type: 'v2Guide', title: 'Guide', sections: [{_key: 's1', _type: 'v2GuideSection', heading: 'One', body: 'Body.'}]},
}
const other: Json = {...page, _id: 'v2-page-998', serviceId: 998, name: 'Other', slug: {_type: 'slug', current: 'other-service'}, _updatedAt: '2026-10-30T00:00:00Z'}
const columns = sheetColumns(capacityFor([page, other]))
const headers = [...META_COLUMNS, ...columns.map((column) => column.path)]
const rowOf = (doc: Json): Row => ({_id: doc._id, _status: 'Published', _url: '', _updatedAt: doc._updatedAt, ...flatten(doc, columns)})

const source = fs.readFileSync(APPS_SCRIPT_PATH, 'utf8')
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value))
let passed = 0
function check(name: string, run: () => void) {
  run()
  passed++
  console.log(`ok - ${name}`)
}

// ---------- A simulated spreadsheet, Sanity and Apps Script services ----------

type World = {
  tab: string; grid: string[][]; selected: number[]; answer: 'YES' | 'NO'; token: string | null; promptText: string
  docs: Json[]; alerts: string[]; dialogs: string[]; mutations: Json[]; fetches: string[]; savedToken: string | null; locked: number
  live: number
}

function makeWorld(over: Partial<World> = {}): World {
  return {
    tab: 'Service Pages', grid: [[...headers], ...[page, other].map((doc) => headers.map((h) => rowOf(doc)[h] ?? ''))], selected: [2],
    answer: 'YES', token: 'good-token', promptText: '', docs: [plain(page), plain(other)],
    alerts: [], dialogs: [], mutations: [], fetches: [], savedToken: null, locked: 0, live: 0, ...over,
  }
}

function run(world: World, fn: string, args: unknown[] = []): any { // eslint-disable-line @typescript-eslint/no-explicit-any -- whatever the script returns
  const respond = (code: number, body: unknown) => ({getResponseCode: () => code, getContentText: () => JSON.stringify(body)})
  const range = (row: number, col: number, nRows = 1, nCols = 1): Json => ({
    getRow: () => row, getNumRows: () => nRows,
    getDisplayValues: () => Array.from({length: nRows}, (_, i) => Array.from({length: nCols}, (_, j) => world.grid[row - 1 + i]?.[col - 1 + j] ?? '')),
    setNumberFormat: () => range(row, col, nRows, nCols),
    setValue: (value: string) => { world.grid[row - 1][col - 1] = value; return range(row, col) },
    setValues: (values: string[][]) => { values.forEach((cells, i) => { world.grid[row - 1 + i] = [...cells] }); return range(row, col, nRows, nCols) },
  })
  const sheet = {
    getName: () => world.tab,
    getLastColumn: () => world.grid[0].length,
    getLastRow: () => world.grid.length,
    getRange: range,
    getActiveRangeList: () => ({getRanges: () => world.selected.map((r) => range(r, 1))}),
    getActiveRange: () => range(world.selected[0], 1),
    getDataRange: () => range(1, 1, world.grid.length, world.grid[0].length),
    clearContents: () => { world.grid = [] },
    getMaxRows: () => 1000, getMaxColumns: () => 5000, insertRowsAfter: () => {}, insertColumnsAfter: () => {},
  }
  const ui = {
    ButtonSet: {OK: 'OK', YES_NO: 'YES_NO', OK_CANCEL: 'OK_CANCEL'}, Button: {YES: 'YES', NO: 'NO', OK: 'OK'},
    alert: (...args: string[]) => { world.alerts.push(args.slice(0, 2).join('\n')); return world.answer },
    prompt: () => ({getSelectedButton: () => 'OK', getResponseText: () => world.promptText}),
    showModalDialog: (html: {text: string}, title: string) => { world.dialogs.push(`${title}\n${html.text}`) },
  }
  const sanityFetch = (url: string, options: Json) => {
    world.fetches.push(url)
    const auth = options.headers?.Authorization
    if (auth !== 'Bearer good-token') return respond(401, {message: 'Unauthorized'})
    const u = new URL(url)
    if (u.pathname.includes('/data/mutate/')) {
      const body = JSON.parse(options.payload)
      for (const m of body.mutations) {
        const doc = {...m.createOrReplace, _updatedAt: '2026-11-01T10:00:00Z'}
        world.mutations.push(doc)
        world.docs = [...world.docs.filter((d) => d._id !== doc._id), doc]
      }
      return respond(200, {transactionId: 'tx1', results: []})
    }
    const query = u.searchParams.get('query') || ''
    const raw = u.searchParams.get('perspective') === 'raw'
    // Like Sanity since API 2025-02-19: without perspective=raw, drafts are hidden.
    const visible = world.docs.filter((d) => raw || !d._id.startsWith('drafts.'))
    if (query.includes('_type == "servicePage"')) return respond(200, {result: world.live})
    if (query.startsWith('count(')) return respond(200, {result: visible.length})
    if (query.includes('serviceId == $n')) {
      const n = JSON.parse(u.searchParams.get('$n') || '-1'), key = JSON.parse(u.searchParams.get('$key') || '""')
      return respond(200, {result: visible.filter((d) => d.serviceId === n || d.slug?.current === key)})
    }
    if (query.includes('_id in $ids')) {
      const ids: string[] = JSON.parse(u.searchParams.get('$ids') || '[]')
      return respond(200, {result: visible.filter((d) => ids.includes(d._id)).map((d) => ({_id: d._id, _updatedAt: d._updatedAt}))})
    }
    return respond(200, {result: visible})
  }
  const context = vm.createContext({
    SpreadsheetApp: {getUi: () => ui, getActiveSheet: () => sheet, getActive: () => ({getSheetByName: (name: string) => (name === world.tab ? sheet : null)})},
    UrlFetchApp: {fetch: sanityFetch},
    PropertiesService: {getUserProperties: () => ({
      getProperty: () => world.token,
      setProperty: (_key: string, value: string) => { world.savedToken = value },
    })},
    LockService: {getDocumentLock: () => ({waitLock: () => { world.locked++ }, releaseLock: () => { world.locked-- }})},
    HtmlService: {createHtmlOutput: (text: string) => ({text, setWidth() { return this }, setHeight() { return this }})},
    URL,
  })
  vm.runInContext(`${source}\nthis.__result = ${fn}(...${JSON.stringify(args)})`, context)
  return (context as Json).__result
}

const pure = vm.createContext({})
vm.runInContext(`${source}\nthis.api = {spUnflatten, spColumns, spCapacity, spCheckRows, spDifferences}`, pure)
const api = pure.api as Json
const gsColumns = api.spColumns(api.spCapacity([], headers))
const col = (name: string) => headers.indexOf(name)

// ---------- 1. Same page as the CLI ----------

check('a row becomes exactly the page pnpm sheet:import writes (fields, _type, _key)', () => {
  for (const row of [rowOf(page), {...rowOf(page), 'faqs[1].question': '', 'faqs[1].answer': '', 'hero.lede': '  spaced  '}, {...rowOf(page), 'faqs[3].question': 'New?', 'faqs[3].answer': 'Yes.'}]) {
    assert.deepEqual(plain(api.spUnflatten(row, gsColumns)), plain(unflatten(row, columns)))
  }
})

check('bad numbers and bad JSON are the same errors as the CLI', () => {
  const row = {...rowOf(page), monthlySearchVolume: 'lots', 'hero.image.image': '{not json'}
  assert.deepEqual(plain(api.spUnflatten(row, gsColumns).errors), unflatten(row, columns).errors)
  assert.equal(api.spUnflatten({...rowOf(page), monthlySearchVolume: '1,300'}, gsColumns).doc.monthlySearchVolume, 1300)
})

// ---------- 2. Same rules ----------

const checkOne = (record: Row, docs: Json[] = [page, other], rowNumber = 2) => plain(api.spCheckRows([{rowNumber, record}], plain(docs)))[0]

check('an unchanged row has nothing to push; an edited cell is listed by its path', () => {
  assert.deepEqual(checkOne(rowOf(page)).changes, [])
  const edited = checkOne({...rowOf(page), 'faqs[2].answer': 'Very carefully.'})
  assert.deepEqual(edited.errors, [])
  assert.deepEqual(edited.changes, ['faqs.1.answer'])
})

check('a new row gets its _id from serviceId and is a new page', () => {
  const fresh = checkOne({...rowOf(page), _id: '', _updatedAt: '', serviceId: '1001', slug: 'brand-new'})
  assert.deepEqual(fresh.errors, [])
  assert.equal(fresh.id, 'v2-page-1001')
  assert.deepEqual(fresh.changes, ['(new page)'])
})

check('required cells, _id vs serviceId and a slug owned by another page are refused', () => {
  const bad = checkOne({...rowOf(page), 'seo.title': '', _id: 'v2-page-5'})
  assert.ok(bad.errors.includes('seo.title is empty'))
  assert.ok(bad.errors.includes('_id v2-page-5 does not match serviceId 999 (expected v2-page-999)'))
  const stolen = checkOne({...rowOf(page), _id: '', _updatedAt: '', serviceId: '1001', slug: 'other-service'})
  assert.deepEqual(stolen.errors, ['slug "other-service" already belongs to v2-page-998'])
})

check('a page edited in Sanity after the row (a newer draft) is refused, and so is a row with no _updatedAt', () => {
  const draft = {...page, _id: 'drafts.v2-page-999', _updatedAt: '2026-10-31T09:00:00Z', name: 'Studio edit'}
  assert.match(checkOne(rowOf(page), [page, draft, other]).errors.join(), /edited in Sanity at 2026-10-31T09:00:00Z/)
  assert.match(checkOne({...rowOf(page), _updatedAt: ''}).errors.join(), /no _updatedAt/)
})

check('the same page selected twice is refused', () => {
  const both = plain(api.spCheckRows([{rowNumber: 2, record: rowOf(page)}, {rowNumber: 5, record: rowOf(page)}], plain([page, other])))
  assert.deepEqual(both[1].errors, ['same page as row 2'])
})

// ---------- 3. Check and push in the sheet ----------

check('check writes nothing and reports each selected row', () => {
  const world = makeWorld({selected: [2, 3]})
  world.grid[1][col('faqs[1].answer')] = 'Edited'
  run(world, 'servicePagesCheck')
  assert.equal(world.mutations.length, 0)
  assert.match(world.dialogs[0], /project 5w5623jq, dataset production\. Nothing was written/)
  assert.match(world.dialogs[0], /Row 2 \(test-service\): 1 field\(s\) differ from Sanity: faqs\.0\.answer/)
  assert.match(world.dialogs[0], /Row 3 \(other-service\): same as Sanity/)
  assert.ok(world.fetches.every((url) => !url.includes('/mutate/')))
  assert.ok(world.fetches.every((url) => new URL(url).searchParams.get('perspective') === 'raw'), 'reads see drafts')
})

check('push writes only the changed row, as a draft, after Yes, and stamps the row', () => {
  const world = makeWorld({selected: [2, 3]})
  world.grid[1][col('faqs[1].answer')] = 'Edited'
  run(world, 'servicePagesPush')
  assert.match(world.alerts[0], /Write drafts to Sanity\?\nProject 5w5623jq, dataset production[\s\S]*drafts\.v2-page-999 \(row 2, 1 field\(s\)\)/)
  assert.doesNotMatch(world.alerts[0], /v2-page-998/)
  assert.equal(world.mutations.length, 1)
  const written = world.mutations[0]
  assert.equal(written._id, 'drafts.v2-page-999')
  assert.equal(written._type, 'v2ServicePage')
  assert.equal(written.faqs[0].answer, 'Edited')
  assert.equal(written.faqs[0]._type, 'v2Faq')
  assert.match(world.grid[1][col('_status')], /^Draft pushed .* UTC, publish in the Studio$/)
  assert.equal(world.grid[1][col('_updatedAt')], '2026-11-01T10:00:00Z')
  assert.match(world.dialogs[0], /Drafts written[\s\S]*v2-page-999[\s\S]*\/services\/studio/)
  assert.equal(world.locked, 0, 'the lock is released')
})

check('pushing the same row again after more edits works (its own draft is not "newer")', () => {
  const world = makeWorld()
  world.grid[1][col('faqs[1].answer')] = 'Edited'
  run(world, 'servicePagesPush')
  world.grid[1][col('faqs[2].answer')] = 'Edited again'
  run(world, 'servicePagesPush')
  assert.equal(world.mutations.length, 2)
  assert.equal(world.mutations[1].faqs[1].answer, 'Edited again')
})

check('No writes nothing; a row that is not ready blocks the whole push', () => {
  const no = makeWorld({answer: 'NO'})
  no.grid[1][col('faqs[1].answer')] = 'Edited'
  run(no, 'servicePagesPush')
  assert.equal(no.mutations.length, 0)
  assert.equal(no.grid[1][col('_status')], 'Published')
  const blocked = makeWorld({selected: [2, 3]})
  blocked.grid[1][col('faqs[1].answer')] = 'Edited'
  blocked.grid[2][col('seo.title')] = ''
  run(blocked, 'servicePagesPush')
  assert.equal(blocked.mutations.length, 0)
  assert.match(blocked.dialogs[0], /Not pushed: fix these rows first[\s\S]*Row 3 \(other-service\): NOT READY\n {2}- seo\.title is empty/)
})

check('a newer Studio draft (hidden from the default perspective) blocks the push', () => {
  const world = makeWorld()
  world.docs.push({...page, _id: 'drafts.v2-page-999', _updatedAt: '2026-10-31T09:00:00Z', name: 'Studio edit'})
  world.grid[1][col('faqs[1].answer')] = 'Edited'
  run(world, 'servicePagesPush')
  assert.equal(world.mutations.length, 0)
  assert.match(world.dialogs[0], /edited in Sanity at 2026-10-31T09:00:00Z/)
})

check('a column that is not a field is named, never sent', () => {
  const world = makeWorld()
  world.grid[0].push('notes')
  world.grid[1].push('check photos')
  world.grid[2].push('')
  world.grid[1][col('faqs[1].answer')] = 'Edited'
  run(world, 'servicePagesPush')
  assert.match(world.alerts[0], /not Sanity fields and are not sent: notes/)
  assert.equal(world.mutations[0].notes, undefined)
})

check('the menu only works on the Service Pages tab, and needs a token', () => {
  const wrongTab = makeWorld({tab: 'Service area pages'})
  run(wrongTab, 'servicePagesPush')
  assert.match(wrongTab.alerts[0], /Open the "Service Pages" tab/)
  const noToken = makeWorld({token: null})
  run(noToken, 'servicePagesCheck')
  assert.match(noToken.alerts[0], /No Sanity token yet/)
  assert.equal(noToken.fetches.length, 0)
})

check('a token is saved only after Sanity accepts it', () => {
  const bad = makeWorld({token: null, promptText: 'wrong'})
  run(bad, 'servicePagesSetToken')
  assert.equal(bad.savedToken, null)
  assert.match(bad.alerts[0], /refused the token \(401\)/)
  const good = makeWorld({token: null, promptText: ' good-token '})
  run(good, 'servicePagesSetToken')
  assert.equal(good.savedToken, 'good-token')
  assert.match(good.alerts[0], /accepted by project 5w5623jq/)
})

check('the hourly refresh keeps a pushed row and its "Draft pushed" status', () => {
  const merged = vm.createContext({})
  vm.runInContext(`${source}\nthis.spMerge = spMerge`, merged)
  const pushedRow = {...rowOf(page), 'faqs[1].answer': 'Edited', _status: 'Draft pushed 2026-11-01 10:00 UTC, publish in the Studio', _updatedAt: '2026-11-01T10:00:00Z'}
  const result = plain((merged.spMerge as (...args: unknown[]) => {rows: Row[]})([page], headers, [pushedRow], () => false))
  assert.equal(result.rows[0]['faqs[1].answer'], 'Edited')
  assert.equal(result.rows[0]._status, pushedRow._status)
})

// ---------- 4. Add a page from Claude, Get a page for Claude ----------

const pack = reviewPack()
const reviewOf = (n: number, words = 8): Json => {
  const [reviewer, date, text, link] = pack[n - 1]
  return {_key: `r${n}`, _type: 'v2Review', author: `${reviewer.split(' ')[0]} X.`, date, quote: text.split(/\s+/).slice(0, words).join(' '), sourceId: `hc-${n}`, sourceUrl: link}
}
const fresh: Json = {
  ...plain(page), _id: undefined, _rev: undefined, _updatedAt: undefined, serviceId: 1001, name: 'Brand New Service',
  slug: {_type: 'slug', current: 'brand-new-service'}, reviews: [reviewOf(158), reviewOf(1), reviewOf(2), reviewOf(3)],
}
const add = (world: World, doc: unknown, write: boolean): string => run(world, 'spAddFromClaude', [typeof doc === 'string' ? doc : JSON.stringify(doc), write])

check('add (check only) reports a ready new page and writes nothing', () => {
  const world = makeWorld()
  const before = JSON.stringify(world.grid)
  const report = add(world, fresh, false)
  assert.match(report, /^Ready to add: v2-page-1001 \(\/services\/brand-new-service\)\. Nothing was written/)
  assert.match(report, /Sanity: a new page\./)
  assert.equal(JSON.stringify(world.grid), before)
  assert.equal(world.mutations.length, 0)
})

check('add writes a new row with exactly the cells a refresh would write, then Check and Push take it as a new page', () => {
  const world = makeWorld()
  const report = add(world, fresh, true)
  assert.match(report, /^Added: v2-page-1001 \(\/services\/brand-new-service\), as a new row at the bottom/)
  assert.equal(world.grid.length, 4)
  const row = Object.fromEntries(world.grid[0].map((h, i) => [h, world.grid[3][i]]))
  for (const column of columns) assert.equal(row[column.path], flatten(fresh, columns)[column.path], column.path)
  assert.match(row._status, /^Added from Claude .* UTC, not pushed yet$/)
  assert.equal(row._id, '')
  world.selected = [4]
  run(world, 'servicePagesPush')
  assert.equal(world.mutations.length, 1)
  assert.equal(world.mutations[0]._id, 'drafts.v2-page-1001')
  assert.deepEqual(plain(api.spDifferences(world.mutations[0], fresh)), [], 'the draft is the page Claude wrote')
})

check('add replaces the page\'s existing row and keeps its _updatedAt, so a newer Sanity edit is still caught', () => {
  const world = makeWorld()
  const edited = {...plain(page), _updatedAt: undefined, _rev: undefined, reviews: fresh.reviews, faqs: [{_key: 'f1', _type: 'v2Faq', question: 'Why?', answer: 'Rewritten.'}]}
  const report = add(world, edited, true)
  assert.match(report, /^Added: v2-page-999 \(\/services\/test-service\), replacing row 2/)
  assert.equal(world.grid.length, 3)
  // Four reviews need more columns than the test tab had, so the tab widened: read cells by heading.
  const at = (r: number, heading: string) => world.grid[r][world.grid[0].indexOf(heading)]
  assert.ok(world.grid[0].includes('reviews[4].quote'))
  assert.equal(at(1, '_updatedAt'), page._updatedAt)
  assert.equal(at(1, 'faqs[1].answer'), 'Rewritten.')
  assert.equal(at(1, 'faqs[2].question'), '', 'the removed FAQ is gone from the row')
  for (const h of headers) assert.equal(at(2, h), rowOf(other)[h] ?? '', `other row untouched: ${h}`)
  const renamed = makeWorld()
  assert.match(add(renamed, {...edited, slug: {_type: 'slug', current: 'test-service-renamed'}}, true), /replacing row 2/, 'found by its _id even when the slug changed')
  assert.equal(renamed.grid.length, 3)
  const stale = makeWorld()
  stale.docs.push({...plain(page), _id: 'drafts.v2-page-999', _updatedAt: '2026-10-31T09:00:00Z'})
  assert.match(add(stale, edited, true), /^Not added[\s\S]*edited in Sanity at 2026-10-31T09:00:00Z/)
})

check('add refuses anything that would be lost or is the wrong kind of value, and names it', () => {
  const world = makeWorld()
  const before = JSON.stringify(world.grid)
  const typo = {...fresh, faqs: [{_type: 'v2Faq', questoin: 'Typo?', answer: 'Yes.'}], seo: {...fresh.seo, titel: 'x'}, serviceId: '1001'}
  const report = add(world, typo, true)
  assert.match(report, /^Not added/)
  assert.match(report, /faqs\.0\.questoin: not a field of the page/)
  assert.match(report, /seo\.titel: not a field of the page/)
  assert.match(report, /serviceId: not a field of the page, or the wrong kind of value/)
  assert.equal(JSON.stringify(world.grid), before)
  assert.match(add(world, '{"name": "half', true), /not valid JSON/)
  assert.match(add(world, {...fresh, _type: 'areaPage'}, false), /This is a areaPage, not a v2ServicePage/)
})

check('add checks every review against the real Google review', () => {
  const world = makeWorld()
  const invented = {...fresh, reviews: [{...reviewOf(158), quote: 'Best electricians in the whole city'}, {...reviewOf(1), sourceUrl: 'https://example.com'}, {...reviewOf(2), sourceId: 'hc-9999'}, reviewOf(3)]}
  const report = add(world, invented, false)
  assert.match(report, /reviews\[1\]: the quote is not in hc-158's text/)
  assert.match(report, /reviews\[2\]: sourceUrl must be hc-1's review link/)
  assert.match(report, /reviews\[3\]: sourceId "hc-9999" is not a review in the pack/)
  assert.doesNotMatch(report, /reviews\[4\]/)
  assert.match(add(world, {...fresh, reviews: [{...reviewOf(158), sourceId: 'hc-9999'}, ...fresh.reviews.slice(1)]}, false), /^Not ready/, 'an unknown review alone blocks the page')
  const curly = {...fresh, reviews: [{...reviewOf(158, 14), quote: `${reviewOf(158, 14).quote}…`}, ...fresh.reviews.slice(1)]}
  assert.match(add(world, curly, false), /^Ready to add/, 'a trailing ellipsis is fine')
})

check('add refuses listicle titles, lists [CONFIRM] placeholders, and warns about a current-design URL', () => {
  const world = makeWorld({live: 1})
  const report = add(world, {...fresh, seo: {...fresh.seo, title: '10 Best Electricians in Chicago'}, hero: {...fresh.hero, lede: 'Visits take [CONFIRM: how long?].'}}, false)
  assert.match(report, /seo\.title: "10 Best Electricians in Chicago" reads like a listicle title/)
  assert.match(report, /\[CONFIRM\] placeholders \(1\)[\s\S]*hero\.lede: \[CONFIRM: how long\?\]/)
  assert.match(report, /A published current-design page already uses \/services\/brand-new-service/)
  assert.doesNotMatch(add(makeWorld(), {...fresh, hero: {...fresh.hero, lede: 'Emergency service runs 24/7.'}}, false), /Not ready/, '24/7 emergency service is confirmed (31/10/2026)')
})

check('a page with more list items than the tab widens the tab and keeps every other row', () => {
  const world = makeWorld()
  const many = {...fresh, faqs: Array.from({length: 7}, (_, i) => ({_key: `f${i}`, _type: 'v2Faq', question: `Q${i}?`, answer: `A${i}.`}))}
  assert.match(add(world, many, true), /^Added/)
  const head = world.grid[0]
  assert.ok(head.includes('faqs[7].answer') && head.includes('faqs[9].answer'), 'room for 7 plus 2 spare')
  const rowAt = (r: number) => Object.fromEntries(head.map((h, i) => [h, world.grid[r][i]]))
  for (const [r, doc] of [[1, page], [2, other]] as const) for (const column of columns) assert.equal(rowAt(r)[column.path], rowOf(doc)[column.path], `row ${r + 1} ${column.path}`)
  assert.equal(rowAt(3)['faqs[7].question'], 'Q6?')
})

check('get gives the selected row as Claude needs it, and Add takes it back unchanged', () => {
  const world = makeWorld({promptText: ''})
  run(world, 'servicePagesGet')
  const json = /<textarea id="json"[^>]*>([\s\S]*)<\/textarea>/.exec(world.dialogs[0])?.[1] || ''
  const doc = JSON.parse(json.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'))
  assert.equal(doc._id, 'v2-page-999')
  assert.equal(doc._updatedAt, page._updatedAt)
  assert.match(world.dialogs[0], /From row 2 of the &quot;Service Pages&quot; tab, as written/)
  assert.match(add(world, doc, false), /^Ready to add: v2-page-999[\s\S]*Sanity: the same as the page already there/)
})

check('get by service ID gives Sanity\'s unpublished draft first', () => {
  const world = makeWorld({promptText: '999'})
  world.docs.push({...plain(page), _id: 'drafts.v2-page-999', _updatedAt: '2026-10-31T09:00:00Z', name: 'Draft name'})
  run(world, 'servicePagesGet')
  assert.match(world.dialogs[0], /From Sanity, the unpublished draft \(2026-10-31T09:00:00Z\)/)
  assert.match(world.dialogs[0], /&quot;name&quot;: &quot;Draft name&quot;/)
  assert.match(world.dialogs[0], /&quot;_id&quot;: &quot;v2-page-999&quot;/)
  assert.doesNotMatch(world.dialogs[0], /_rev/)
})

console.log(`\n${passed} sheet push checks passed`)
