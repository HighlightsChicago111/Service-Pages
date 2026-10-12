/**
 * data/v2-source.json -> data/v2-documents.json, with validation.
 * No network. The site reads data/v2-documents.json directly when no Sanity
 * project ID is set, so the result can be checked in the browser first.
 */
import fs from 'node:fs'
import path from 'node:path'
import {buildDocuments, type Source} from './lib/transform'

const sourcePath = path.resolve('data/v2-source.json')
if (!fs.existsSync(sourcePath)) throw new Error('Run pnpm content:extract first (data/v2-source.json is missing)')
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as Source
const fullReviewsPath = path.resolve('data/full-reviews.json')
const fullReviews = fs.existsSync(fullReviewsPath) ? JSON.parse(fs.readFileSync(fullReviewsPath, 'utf8')) as Record<string, string> : {}
const logoExists = (brand: string) => {
  const slug = brand.normalize('NFKD').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return fs.existsSync(path.resolve('public/images/brands', `${slug}.png`))
}

const {documents, errors, warnings, placeholders} = buildDocuments(source, fullReviews, logoExists)
for (const warning of warnings) console.warn(`warning: ${warning}`)
if (placeholders.length) {
  console.warn(`\n${placeholders.length} [CONFIRM] placeholder(s) to answer before publishing:`)
  for (const item of placeholders) console.warn(`  ${item}`)
}
if (errors.length) {
  console.error(`\n${errors.length} error(s). Nothing was written:`)
  for (const error of errors) console.error(`  ${error}`)
  process.exit(1)
}
fs.writeFileSync(path.resolve('data/v2-documents.json'), `${JSON.stringify(documents, null, 2)}\n`)
const pages = documents.filter((doc) => doc._type === 'v2ServicePage')
console.log(`\nWrote data/v2-documents.json: ${documents.length} documents (${pages.length} pages: ${pages.map((doc) => (doc.slug as {current: string}).current).join(', ')})`)
