/**
 * The Google Sheet copy of the new-design service pages (v2ServicePage), one row per page.
 *
 *   pnpm sheet:export                        published pages -> exports/service-pages.csv
 *   pnpm sheet:export -- --include-drafts    also pages that were never published
 *   pnpm sheet:import -- --sheet "<tab URL>"              dry run: checks every row, lists changes
 *   pnpm sheet:import -- --file service-pages.csv --only 341 --yes   writes DRAFTS, never publishes
 *   pnpm sheet:apps-script                   refreshes the schema inside google-apps-script/service-pages.gs
 *
 * The sheet's "Service pages" tab refreshes itself from Sanity (published pages) through that
 * Apps Script; the export here is the same rows as a file, for checking or for a manual import.
 *
 * Headings are exact Sanity field paths (see scripts/lib/page-sheet.ts). The import writes only rows
 * that differ from Sanity, and skips a page edited in Sanity after the sheet's _updatedAt.
 */
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'
import {servicePageUrl} from '../src/lib/service-urls'
import {
  META_COLUMNS, PAGE_TYPE, REQUIRED_FIELDS, capacityFor, capacityFromHeaders, differences, flatten, fromCsv, lostValues, sheetColumns, toCsv, unflatten, unknownColumns,
} from './lib/page-sheet'
import {APPS_SCRIPT_PATH, renderAppsScript} from './lib/page-sheet-apps-script'

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- free-form Sanity documents

function loadLocalEnv() {
  const envPath = path.resolve('.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 1) continue
    const key = trimmed.slice(0, separator)
    const value = trimmed.slice(separator + 1).replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadLocalEnv()
const args = process.argv.slice(2)
const command = args[0]
const flag = (name: string) => args.includes(name)
const option = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '5w5623jq'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
function sanityClient() {
  const writing = command === 'import' && flag('--yes')
  const token = writing ? process.env.SANITY_API_WRITE_TOKEN : process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error(`Add ${writing ? 'SANITY_API_WRITE_TOKEN' : 'SANITY_API_READ_TOKEN'} to .env.local`)
  return createClient({projectId, dataset, apiVersion: '2026-03-01', token, useCdn: false, perspective: 'raw'})
}

function fail(error: unknown) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

const baseId = (id: string) => id.replace(/^drafts\./, '')
const pageId = (serviceId: number) => `v2-page-${serviceId}`

/** Every new-design page in the dataset: published and draft versions, grouped by page. */
async function loadPages() {
  const docs = await sanityClient().fetch<Json[]>(`*[_type == $type]`, {type: PAGE_TYPE})
  const pages = new Map<string, {published?: Json; draft?: Json}>()
  for (const doc of docs) {
    const entry = pages.get(baseId(doc._id)) || {}
    if (doc._id.startsWith('drafts.')) entry.draft = doc
    else entry.published = doc
    pages.set(baseId(doc._id), entry)
  }
  return {docs, pages}
}

async function exportSheet() {
  const includeDrafts = flag('--include-drafts')
  const out = path.resolve(option('--out') || 'exports/service-pages.csv')
  const {docs, pages} = await loadPages()
  // Columns sized from every page in the dataset, drafts included, so the column set stays stable
  // whichever pages are exported.
  const columns = sheetColumns(capacityFor(docs))
  const rows: Array<Record<string, string>> = []
  const problems: string[] = []
  for (const [id, {published, draft}] of pages) {
    // A published page is exported as published; its unsaved Studio edits are not the live page.
    const doc = published || (includeDrafts ? draft : undefined)
    if (!doc) continue
    for (const lost of lostValues(doc, columns)) problems.push(`${id}: ${lost}`)
    const status = published ? (draft ? 'Published (has unpublished edits)' : 'Published') : 'Draft'
    const slug = doc.slug?.current
    rows.push({
      _id: id, _status: status, _url: published && slug ? servicePageUrl(slug, doc.parentName) : '', _updatedAt: doc._updatedAt,
      ...flatten(doc, columns),
    })
  }
  if (problems.length) {
    console.error(`Stopped: the sheet would lose ${problems.length} value(s):\n  ${problems.slice(0, 20).join('\n  ')}`)
    process.exit(1)
  }
  rows.sort((a, b) => Number(a.serviceId) - Number(b.serviceId))
  fs.mkdirSync(path.dirname(out), {recursive: true})
  fs.writeFileSync(out, toCsv([...META_COLUMNS, ...columns.map((column) => column.path)], rows))
  console.log(`${projectId}/${dataset}: wrote ${rows.length} page(s), ${META_COLUMNS.length + columns.length} columns -> ${path.relative(process.cwd(), out)}`)
  console.log(`Pages: ${rows.map((row) => row.serviceId).join(' ')}`)
}

/** A Google Sheets tab URL (…/d/<id>/edit#gid=<gid>) -> its CSV download. The sheet must be shared "Anyone with the link". */
function csvUrl(sheetUrl: string) {
  const id = sheetUrl.match(/\/spreadsheets\/d\/([\w-]+)/)?.[1]
  const gid = sheetUrl.match(/[#&?]gid=(\d+)/)?.[1]
  if (!id || !gid) throw new Error('Pass the URL of the "Service pages" tab itself, including #gid=… (open the tab, copy the address bar)')
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
}

async function readSheet(): Promise<string> {
  const file = option('--file'), sheet = option('--sheet')
  if (file) return fs.readFileSync(path.resolve(file), 'utf8')
  if (!sheet) throw new Error('Pass --sheet "<tab URL>" or --file <csv>')
  const response = await fetch(csvUrl(sheet))
  const type = response.headers.get('content-type') || ''
  if (!response.ok || !type.includes('csv')) throw new Error(`Could not download the sheet (${response.status} ${type}). Share it as "Anyone with the link: Viewer".`)
  return response.text()
}

async function importSheet() {
  const {headers, rows} = fromCsv(await readSheet())
  const columns = sheetColumns(capacityFromHeaders(headers))
  const unknown = unknownColumns(headers, columns)
  if (unknown.length) throw new Error(`These headings are not Sanity fields (fix the spelling, or export a fresh sheet): ${unknown.join(', ')}`)
  const only = option('--only')
  const {pages} = await loadPages()
  const slugOwner = new Map<string, string>()
  for (const [id, {published, draft}] of pages) for (const doc of [published, draft]) if (doc?.slug?.current) slugOwner.set(doc.slug.current, id)

  const writes: Json[] = []
  let errors = 0, unchanged = 0, skipped = 0
  for (const row of rows) {
    if (only && ![row.serviceId, row.slug, row._id].includes(only)) continue
    const label = `${row.serviceId || '?'} ${row.slug || row.name || '(no slug)'}`
    const {doc, errors: rowErrors} = unflatten(row, columns)
    const problems = [...rowErrors, ...REQUIRED_FIELDS.filter((field) => !row[field]?.trim()).map((field) => `${field} is empty`)]
    const id = row._id?.trim() || (doc.serviceId ? pageId(doc.serviceId) : '')
    if (id && doc.serviceId && id !== pageId(doc.serviceId)) problems.push(`_id ${id} does not match serviceId ${doc.serviceId} (expected ${pageId(doc.serviceId)})`)
    const owner = doc.slug?.current && slugOwner.get(doc.slug.current)
    if (owner && owner !== id) problems.push(`slug "${doc.slug.current}" already belongs to ${owner}`)
    if (problems.length) {
      errors++
      console.log(`ERROR ${label}\n  ${problems.join('\n  ')}`)
      continue
    }
    const existing = pages.get(id)
    const current = existing?.draft || existing?.published
    if (current && !flag('--force')) {
      // The sheet row was taken from Sanity at _updatedAt. A later Studio edit would be overwritten.
      if (!row._updatedAt) { skipped++; console.log(`SKIP  ${label}: already in Sanity, but this row has no _updatedAt (export a fresh sheet first)`); continue }
      if (current._updatedAt > row._updatedAt) { skipped++; console.log(`SKIP  ${label}: edited in Sanity at ${current._updatedAt}, after this row (${row._updatedAt}); export a fresh sheet first`); continue }
    }
    const changes = current ? differences(current, doc) : []
    if (current && changes.length === 0) { unchanged++; continue }
    console.log(`${current ? 'CHANGE' : 'NEW   '} ${label} -> drafts.${id}`)
    for (const change of changes.slice(0, 15)) console.log(`  ${change.path}: ${change.before} -> ${change.after}`)
    if (changes.length > 15) console.log(`  … and ${changes.length - 15} more`)
    writes.push({...doc, _id: `drafts.${id}`})
  }
  console.log(`\n${projectId}/${dataset}: ${writes.length} draft(s) to write, ${unchanged} unchanged, ${skipped} skipped, ${errors} with errors.`)
  if (!flag('--yes')) { console.log('Dry run: nothing written. Add --yes to write these as drafts.'); return }
  if (errors) { console.log('Nothing written: fix the errors first.'); process.exit(1) }
  if (!writes.length) return
  const transaction = sanityClient().transaction()
  for (const doc of writes) transaction.createOrReplace(doc as Json & {_id: string; _type: string})
  await transaction.commit()
  console.log(`Wrote ${writes.length} draft(s). Review and publish them in the Studio (New design).`)
}

if (command === 'export') exportSheet().catch(fail)
else if (command === 'import') importSheet().catch(fail)
else if (command === 'apps-script') {
  fs.writeFileSync(APPS_SCRIPT_PATH, renderAppsScript())
  console.log(`Updated ${path.relative(process.cwd(), APPS_SCRIPT_PATH)}. Paste it into the sheet's Extensions > Apps Script (file service-pages.gs) and save.`)
} else console.log('Usage: tsx scripts/page-sheet.ts export [--include-drafts] [--out file.csv] | import (--sheet <tab URL> | --file <csv>) [--only <serviceId|slug>] [--yes] [--force] | apps-script')
