/**
 * The sheet's "Check selected rows" and "Push selected rows to Sanity as drafts"
 * (google-apps-script/service-pages.gs), run against a simulated Google Sheet and Sanity.
 *
 *   pnpm test:sheet
 *
 * 1. A row becomes exactly the page `pnpm sheet:import` would write (same fields, _type, _key, errors).
 * 2. The same rules: required cells, _id vs serviceId, a slug owned by another page, the same page
 *    twice, and a Sanity edit after the row's _updatedAt.
 * 3. Push writes drafts only, only after Yes, only for rows that differ, and reads drafts with
 *    perspective=raw (since API 2025-02-19 Sanity hides drafts otherwise).
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import {META_COLUMNS, capacityFor, flatten, sheetColumns, unflatten} from './lib/page-sheet'
import {APPS_SCRIPT_PATH} from './lib/page-sheet-apps-script'

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
}

function makeWorld(over: Partial<World> = {}): World {
  return {
    tab: 'Service Pages', grid: [[...headers], ...[page, other].map((doc) => headers.map((h) => rowOf(doc)[h] ?? ''))], selected: [2],
    answer: 'YES', token: 'good-token', promptText: '', docs: [plain(page), plain(other)],
    alerts: [], dialogs: [], mutations: [], fetches: [], savedToken: null, locked: 0, ...over,
  }
}

function run(world: World, fn: string) {
  const respond = (code: number, body: unknown) => ({getResponseCode: () => code, getContentText: () => JSON.stringify(body)})
  const range = (row: number, col: number, nRows = 1, nCols = 1): Json => ({
    getRow: () => row, getNumRows: () => nRows,
    getDisplayValues: () => Array.from({length: nRows}, (_, i) => Array.from({length: nCols}, (_, j) => world.grid[row - 1 + i]?.[col - 1 + j] ?? '')),
    setNumberFormat: () => range(row, col, nRows, nCols),
    setValue: (value: string) => { world.grid[row - 1][col - 1] = value; return range(row, col) },
  })
  const sheet = {
    getName: () => world.tab,
    getLastColumn: () => world.grid[0].length,
    getLastRow: () => world.grid.length,
    getRange: range,
    getActiveRangeList: () => ({getRanges: () => world.selected.map((r) => range(r, 1))}),
    getActiveRange: () => range(world.selected[0], 1),
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
    if (query.startsWith('count(')) return respond(200, {result: visible.length})
    if (query.includes('_id in $ids')) {
      const ids: string[] = JSON.parse(u.searchParams.get('$ids') || '[]')
      return respond(200, {result: visible.filter((d) => ids.includes(d._id)).map((d) => ({_id: d._id, _updatedAt: d._updatedAt}))})
    }
    return respond(200, {result: visible})
  }
  const context = vm.createContext({
    SpreadsheetApp: {getUi: () => ui, getActiveSheet: () => sheet},
    UrlFetchApp: {fetch: sanityFetch},
    PropertiesService: {getUserProperties: () => ({
      getProperty: () => world.token,
      setProperty: (_key: string, value: string) => { world.savedToken = value },
    })},
    LockService: {getDocumentLock: () => ({waitLock: () => { world.locked++ }, releaseLock: () => { world.locked-- }})},
    HtmlService: {createHtmlOutput: (text: string) => ({text, setWidth() { return this }, setHeight() { return this }})},
    URL,
  })
  vm.runInContext(`${source}\n${fn}()`, context)
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

console.log(`\n${passed} sheet push checks passed`)
