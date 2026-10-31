/**
 * New-design service pages (v2ServicePage) <-> one spreadsheet row per page.
 *
 * The columns come from the Sanity schema, so every heading is the exact field path:
 *   name, serviceId, slug, area                  single fields (slug = slug.current, area = the area's _id)
 *   seo.title, hero.h1Prefix                     a part of an object field
 *   primaryKeywords[1], cta.readyItems[3]        item 1, item 3 of a list of text (numbered from 1)
 *   faqs[2].question, gallery[1].alt             a part of item 2 of a list
 *   equipment.comparison.rows[1].values[2]       a list inside a list item
 *   hero.image.image                             an uploaded Sanity image, one JSON cell
 * A field added to the schema later gets its columns automatically. The same rules as the
 * service area sheet (highlights-chicago-service-pages-v2, scripts/lib/sheet.ts).
 */
import * as v2Documents from '../../src/sanity/schemaTypes/v2/documents'
import * as v2Objects from '../../src/sanity/schemaTypes/v2/objects'

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- free-form Sanity documents
type SchemaField = {name: string; type: string; fields?: SchemaField[]; of?: Array<{type: string}>}
export type Column = {path: string; kind: 'text' | 'number' | 'slug' | 'reference' | 'json'}
/** List paths with indexes removed ("faqs", "equipment.comparison.rows.values") -> how many items get columns. */
export type Capacity = Record<string, number>

export const PAGE_TYPE = 'v2ServicePage'
/** Bookkeeping columns, before the fields. The import reads only _id and _updatedAt from them. */
export const META_COLUMNS = ['_id', '_status', '_url', '_updatedAt']
/** Extra empty item columns per list beyond the longest list on any page, so a new page has room. */
export const LIST_HEADROOM = 2

const NAMED_TYPES: Record<string, Json> = Object.fromEntries(
  ([...Object.values(v2Documents), ...Object.values(v2Objects)] as unknown[])
    .filter((value): value is Json => value !== null && typeof value === 'object' && 'name' in value && 'type' in value)
    .map((type) => [type.name, type]),
)
const SCALAR = new Set(['string', 'text', 'url', 'email', 'number', 'date', 'datetime', 'boolean'])

/** The fields of a named object type (v2Faq, v2Image ...) or of an inline object, or undefined. */
function objectFields(type: string, inline?: SchemaField[]): SchemaField[] | undefined {
  if (inline) return inline
  const named = NAMED_TYPES[type]
  return named && named.type === 'object' ? named.fields : undefined
}

export const pageFields = (): SchemaField[] => NAMED_TYPES[PAGE_TYPE].fields

/** Walks the schema in field order and pushes one column per cell; each list gets `capacity[key]` items. */
function walk(fields: SchemaField[], prefix: string, listKey: string, capacity: Capacity, columns: Column[]) {
  for (const field of fields) {
    const path = `${prefix}${field.name}`
    const key = listKey ? `${listKey}.${field.name}` : field.name
    if (field.type === 'slug') columns.push({path, kind: 'slug'})
    else if (field.type === 'reference') columns.push({path, kind: 'reference'})
    else if (field.type === 'image' || field.type === 'geopoint') columns.push({path, kind: 'json'})
    else if (SCALAR.has(field.type)) columns.push({path, kind: field.type === 'number' ? 'number' : 'text'})
    else if (field.type === 'array') {
      const member = field.of?.[0]?.type || 'string'
      const memberFields = objectFields(member)
      for (let i = 1; i <= (capacity[key] ?? 0); i++) {
        if (memberFields) walk(memberFields, `${path}[${i}].`, key, capacity, columns)
        else columns.push({path: `${path}[${i}]`, kind: member === 'number' ? 'number' : 'text'})
      }
    } else {
      const inner = objectFields(field.type, field.fields)
      if (inner) walk(inner, `${path}.`, key, capacity, columns)
      else columns.push({path, kind: 'json'})
    }
  }
}

export function sheetColumns(capacity: Capacity): Column[] {
  const columns: Column[] = []
  walk(pageFields(), '', '', capacity, columns)
  return columns
}

/** Every list path in the schema, so a capacity can be given for each. */
export function listKeys(): string[] {
  const keys: string[] = []
  const visit = (fields: SchemaField[], listKey: string) => {
    for (const field of fields) {
      const key = listKey ? `${listKey}.${field.name}` : field.name
      if (field.type === 'array') {
        keys.push(key)
        const inner = objectFields(field.of?.[0]?.type || 'string')
        if (inner) visit(inner, key)
      } else {
        const inner = objectFields(field.type, field.fields)
        if (inner && field.type !== 'slug') visit(inner, key)
      }
    }
  }
  visit(pageFields(), '')
  return keys
}

/** Room for the longest list on any of these pages, plus LIST_HEADROOM. */
export function capacityFor(docs: Json[]): Capacity {
  const longest: Capacity = Object.fromEntries(listKeys().map((key) => [key, 0]))
  const visit = (value: unknown, key: string) => {
    if (Array.isArray(value)) {
      if (key in longest) longest[key] = Math.max(longest[key], value.length)
      value.forEach((item) => visit(item, key))
    } else if (value && typeof value === 'object') {
      for (const [name, child] of Object.entries(value)) if (!name.startsWith('_')) visit(child, key ? `${key}.${name}` : name)
    }
  }
  docs.forEach((doc) => visit(doc, ''))
  return Object.fromEntries(Object.entries(longest).map(([key, n]) => [key, n + LIST_HEADROOM]))
}

/** The capacity a sheet was exported with, read back from its headings. */
export function capacityFromHeaders(headers: string[]): Capacity {
  const capacity: Capacity = Object.fromEntries(listKeys().map((key) => [key, 0]))
  for (const header of headers) {
    let key = ''
    for (const part of header.split('.')) {
      const match = part.match(/^([^[]+)((?:\[\d+\])*)$/)
      if (!match) break
      key = key ? `${key}.${match[1]}` : match[1]
      const index = match[2].match(/\[(\d+)\]/)
      if (index && key in capacity) capacity[key] = Math.max(capacity[key], Number(index[1]))
    }
  }
  return capacity
}

/**
 * The schema as the Google Apps Script needs it (google-apps-script/service-pages.gs): each field
 * is {n: name, k: kind}, objects carry their fields in f, lists say what one item is in i.
 */
export type CompactField = {n: string; k: Column['kind'] | 'object' | 'list'; f?: CompactField[]; i?: CompactField}
export function compactSchema(fields: SchemaField[] = pageFields()): CompactField[] {
  return fields.map((field): CompactField => {
    if (field.type === 'slug') return {n: field.name, k: 'slug'}
    if (field.type === 'reference') return {n: field.name, k: 'reference'}
    if (field.type === 'image' || field.type === 'geopoint') return {n: field.name, k: 'json'}
    if (SCALAR.has(field.type)) return {n: field.name, k: field.type === 'number' ? 'number' : 'text'}
    if (field.type === 'array') {
      const member = field.of?.[0]?.type || 'string'
      const memberFields = objectFields(member)
      return {n: field.name, k: 'list', i: memberFields ? {n: '', k: 'object', f: compactSchema(memberFields)} : {n: '', k: member === 'number' ? 'number' : 'text'}}
    }
    const inner = objectFields(field.type, field.fields)
    return inner ? {n: field.name, k: 'object', f: compactSchema(inner)} : {n: field.name, k: 'json'}
  })
}

/** "faqs[2].question" -> ["faqs", 1, "question"] (list positions 0-based). */
function segments(path: string): Array<string | number> {
  const out: Array<string | number> = []
  for (const part of path.split('.')) {
    const match = part.match(/^([^[]+)((?:\[\d+\])*)$/)
    if (!match) throw new Error(`Bad column path: ${path}`)
    out.push(match[1])
    for (const index of match[2].matchAll(/\[(\d+)\]/g)) out.push(Number(index[1]) - 1)
  }
  return out
}

function getAt(doc: Json, path: string): unknown {
  let value: unknown = doc
  for (const segment of segments(path)) {
    if (value == null || typeof value !== 'object') return undefined
    value = (value as Json)[segment as string]
  }
  return value
}

function setAt(doc: Json, path: string, value: unknown) {
  const parts = segments(path)
  let node: Json = doc
  parts.forEach((segment, i) => {
    if (i === parts.length - 1) { node[segment as string] = value; return }
    if (node[segment as string] == null) node[segment as string] = typeof parts[i + 1] === 'number' ? [] : {}
    node = node[segment as string]
  })
}

function cellOf(value: unknown, kind: Column['kind']): string {
  if (value === undefined || value === null || value === '') return ''
  if (kind === 'json') return JSON.stringify(value)
  if (kind === 'slug') return typeof value === 'object' ? String((value as Json).current ?? '') : String(value)
  if (kind === 'reference') return typeof value === 'object' ? String((value as Json)._ref ?? '') : String(value)
  return String(value)
}

export function flatten(doc: Json, columns: Column[]): Record<string, string> {
  return Object.fromEntries(columns.map((column) => [column.path, cellOf(getAt(doc, column.path), column.kind)]))
}

/**
 * Every value a row could not hold, as "path: what". Empty when nothing is lost. The export stops on
 * any of these instead of writing a sheet that silently drops part of a page.
 */
export function lostValues(doc: Json, columns: Column[]): string[] {
  const back = unflatten(flatten(doc, columns), columns)
  return [...back.errors, ...differences(doc, back.doc).map(({path, before, after}) => `${path}: sheet would hold ${after} instead of ${before}`)]
}

/** The paths where two versions of a page differ (system fields and _key ignored), with short previews. */
export function differences(a: Json, b: Json): Array<{path: string; before: string; after: string}> {
  const out: Array<{path: string; before: string; after: string}> = []
  const preview = (value: unknown) => (value === undefined ? '(empty)' : JSON.stringify(value).slice(0, 60))
  const diff = (x: unknown, y: unknown, path: string) => {
    if (JSON.stringify(x) === JSON.stringify(y)) return
    if (x && y && typeof x === 'object' && typeof y === 'object') {
      for (const key of new Set([...Object.keys(x), ...Object.keys(y)])) diff((x as Json)[key], (y as Json)[key], path ? `${path}.${key}` : key)
    } else out.push({path, before: preview(x), after: preview(y)})
  }
  diff(comparable(a), comparable(b), '')
  return out
}

/** Adds _type to every named object (v2Faq, v2Image ...) and a stable _key to every list item. */
function typed(value: unknown, fields: SchemaField[] | undefined, keyPrefix: string): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !fields) return value
  const out: Json = {}
  for (const field of fields) {
    const child = (value as Json)[field.name]
    if (child === undefined) continue
    if (field.type === 'array' && Array.isArray(child)) {
      const member = field.of?.[0]?.type || 'string'
      const memberFields = objectFields(member)
      out[field.name] = memberFields
        ? child.map((item, i) => ({_key: `${keyPrefix}${field.name}-${i + 1}`, _type: member, ...(typed(item, memberFields, `${keyPrefix}${field.name}-${i + 1}-`) as Json)}))
        : child
    } else if (field.type === 'slug' || field.type === 'reference' || field.type === 'image' || field.type === 'geopoint' || SCALAR.has(field.type)) {
      out[field.name] = child
    } else {
      const inner = objectFields(field.type, field.fields)
      out[field.name] = inner ? {...(NAMED_TYPES[field.type] ? {_type: field.type} : {}), ...(typed(child, inner, `${keyPrefix}${field.name}-`) as Json)} : child
    }
  }
  return out
}

/** Drops blank list items (every cell empty) and empty objects, so unused columns add nothing. */
function tidy(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(tidy).filter((item) => item !== undefined && item !== null && item !== '' && !(typeof item === 'object' && !Array.isArray(item) && Object.keys(item as Json).length === 0))
  }
  if (value && typeof value === 'object') {
    const out: Json = {}
    for (const [key, child] of Object.entries(value)) {
      const clean = tidy(child)
      if (clean === undefined || (Array.isArray(clean) && clean.length === 0)) continue
      if (clean && typeof clean === 'object' && !Array.isArray(clean) && Object.keys(clean).length === 0) continue
      out[key] = clean
    }
    return out
  }
  return value
}

export type RowResult = {doc: Json; errors: string[]}

/** One sheet row -> the page's Sanity fields (no _id). Bad numbers and bad JSON are errors, never guesses. */
export function unflatten(row: Record<string, string>, columns: Column[]): RowResult {
  const doc: Json = {}
  const errors: string[] = []
  for (const column of columns) {
    const raw = (row[column.path] ?? '').trim()
    if (!raw) continue
    if (column.kind === 'number') {
      const n = Number(raw.replace(/,/g, ''))
      if (!Number.isFinite(n)) { errors.push(`${column.path}: "${raw}" is not a number`); continue }
      setAt(doc, column.path, n)
    } else if (column.kind === 'json') {
      try { setAt(doc, column.path, JSON.parse(raw)) } catch { errors.push(`${column.path}: not valid JSON`) }
    } else if (column.kind === 'slug') setAt(doc, column.path, {_type: 'slug', current: raw})
    else if (column.kind === 'reference') setAt(doc, column.path, {_type: 'reference', _ref: raw})
    else setAt(doc, column.path, raw)
  }
  return {doc: {_type: PAGE_TYPE, ...(typed(tidy(doc), pageFields(), '') as Json)}, errors}
}

/** Headings that are not fields (a typo in a heading would otherwise drop that cell silently). */
export function unknownColumns(headers: string[], columns: Column[]): string[] {
  const known = new Set([...META_COLUMNS, ...columns.map((column) => column.path)])
  return headers.filter((header) => header && !known.has(header))
}

/** A page with system fields and _key removed, empty values dropped and keys sorted, for comparing two versions. */
export function comparable(doc: Json): Json {
  const strip = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(strip)
    if (value && typeof value === 'object') {
      const out: Json = {}
      for (const [key, child] of Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) {
        if (key.startsWith('_') && !['_type', '_ref'].includes(key)) continue
        if (child === '' || child === null || child === undefined) continue
        if (Array.isArray(child) && child.length === 0) continue
        out[key] = strip(child)
      }
      return out
    }
    return value
  }
  return strip(doc) as Json
}

// CSV: RFC 4180, CRLF rows, cells with a comma, quote or line break are quoted. Google Sheets
// imports and downloads this form unchanged, line breaks inside a cell included.
const quote = (cell: string) => (/[",\r\n]/.test(cell) || /^\s|\s$/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)
export function toCsv(headers: string[], rows: Array<Record<string, string>>): string {
  return [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))].map((cells) => cells.map(quote).join(',')).join('\r\n') + '\r\n'
}

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  const source = text.replace(/^﻿/, '')
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i++ }
      else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === ',') { row.push(cell); cell = '' }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += char
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((cells) => cells.some((value) => value !== ''))
}

export function fromCsv(text: string): {headers: string[]; rows: Array<Record<string, string>>} {
  const [headers = [], ...body] = parseCsvRows(text)
  return {headers, rows: body.map((cells) => Object.fromEntries(headers.map((name, i) => [name, cells[i] ?? ''])))}
}
