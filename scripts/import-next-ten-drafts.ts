import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'

type Row = Record<string, string>
type Source = {equip: Row[]; area: Row[]; page: Row[]}
type ImportDocument = {_id: string; _type: string; [key: string]: unknown}

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
const projectId = process.env.NEXT_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '5w5623jq'
const dataset = process.env.NEXT_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const siteUrl = 'https://www.highlightschicago.com'
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN
if (!token || /^(PASTE_|your_)/i.test(token)) throw new Error('Add a Sanity Editor token to SANITY_API_WRITE_TOKEN in .env.local')

const client = createClient({projectId, dataset, apiVersion: '2026-03-01', token, useCdn: false, perspective: 'raw'})
const source = JSON.parse(fs.readFileSync(path.resolve('data/next-ten-draft-content.json'), 'utf8')) as Source
const strings = (raw = '') => raw.split('||').map((item) => item.trim()).filter(Boolean)
const keywords = (raw = '') => raw.split(/\|\||,/).map((item) => item.trim()).filter(Boolean)
const key = (prefix: string, index: number) => `${prefix}-${index + 1}`
const truncateMeta = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  const candidate = normalized.slice(0, maxLength - 1)
  const lastSpace = candidate.lastIndexOf(' ')
  const cutAt = lastSpace >= Math.floor(maxLength * 0.7) ? lastSpace : candidate.length
  return `${candidate.slice(0, cutAt).replace(/[\s,;:.!?'"—–-]+$/g, '')}…`
}
const objects = (raw: string, fields: string[], prefix: string): Array<{_key: string} & Record<string, string>> => strings(raw).map((item, index) => {
  const parts = item.split('::')
  return {_key: key(prefix, index), ...Object.fromEntries(fields.map((field, fieldIndex) => [field, (parts[fieldIndex] || '').trim()]))}
})
const titleFromSlug = (slug: string) => slug.split('-').map((part) => part === 'led' ? 'LED' : `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
const imageList = (raw: string, prefix: string, serviceName: string) => strings(raw).map((sourceUrl, index) => {
  const externalUrl = sourceUrl.startsWith('/') ? `${siteUrl}${sourceUrl}` : sourceUrl
  const alt = index === 0
    ? `${serviceName} work by Highlights Chicago electricians in Chicago`
    : `${serviceName} project context in Chicago — supporting photo ${index + 1}`
  return {_key: key(prefix, index), _type: 'externalImage', externalUrl, alt, caption: alt}
})
const blocksFromHtml = (html: string, prefix: string) => html
  .replace(/<\/(p|h[1-6]|li|div)>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .split(/\n+/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((text, index) => ({_key: key(`${prefix}-block`, index), _type: 'block', style: 'normal', markDefs: [], children: [{_key: key(`${prefix}-span`, index), _type: 'span', text, marks: []}]}))

const services = source.equip.map((row) => ({
  _id: `service-${row.service_id}`, _type: 'serviceDefinition', serviceId: Number(row.service_id), name: row.name, slug: {_type: 'slug', current: row.slug},
  parentName: row.parent_name, parentUrl: row.parent_url, hubUrl: row.hub_url,
  primaryKeywords: keywords(row.kw_primary), monthlySearchVolume: Number(row.kw_volume), secondaryKeywords: keywords(row.kw_secondary),
  h1Prefix: row.h1_prefix, heroLede: row.hero_lede, secondaryCta: row.cta_secondary, issueQuestion: row.issue_question, issueOptions: strings(row.issue_options),
  typesHeading: row.types_heading, typesLede: row.types_lede,
  types: objects(row.types, ['legacyIconSvg', 'name', 'description'], `type-${row.service_id}`).map((item) => ({...item, _type: 'serviceType'})),
  typesFootnote: row.types_footnote, brandsHeading: row.brands_heading, brandsLede: row.brands_lede, brands: strings(row.brands), brandsNote: row.brands_note,
  whyHeading: row.why_heading, whyLede: row.why_lede, whyItems: objects(row.why, ['title', 'body'], `why-${row.service_id}`).map((item) => ({...item, _type: 'titledBody'})),
  featuredCategory: {tag: row.feature_tag, title: row.feature_title, description: row.feature_desc, cta: row.feature_cta, url: row.feature_url},
  otherServices: objects(row.other_services, ['name', 'description', 'url'], `other-${row.service_id}`).map((item) => ({...item, _type: 'linkedService'})),
  pricing: {heading: row.pricing_heading, lede: row.pricing_lede, caption: row.pricing_caption, column1: row.pricing_col_1, column2: row.pricing_col_2, column3: row.pricing_col_3, rows: objects(row.pricing_rows, ['job', 'driver', 'permit'], `price-${row.service_id}`).map((item) => ({...item, _type: 'pricingRow'})), note: row.pricing_note},
  faqs: objects(row.faqs, ['question', 'answer'], `faq-${row.service_id}`).map((item) => ({...item, _type: 'faq'})),
  ctaHeading: row.cta_heading, ctaBody: row.cta_body,
}))

const pages = source.page.map((row) => {
  const service = source.equip.find((item) => item.service_id === row.service_id)
  const serviceName = service?.name || titleFromSlug(row.equipment_slug)
  return {
    _id: `drafts.servicePage-${row.service_id}-chicago`, _type: 'servicePage', title: `${row.equipment_slug} — chicago`, serviceId: Number(row.service_id),
    service: {_type: 'reference', _ref: `service-${row.service_id}`},
    area: {_type: 'reference', _ref: 'area-chicago'}, template: {_type: 'reference', _ref: 'servicePageTemplate-standard-v1'},
    seo: {title: truncateMeta(row.meta_title, 65), description: truncateMeta(row.meta_description, 170), canonicalUrl: row.canonical_url},
    reviews: objects(row.reviews, ['quote', 'author', 'reviewDate', 'sourceUrl', 'sourceId'], `review-${row.service_id}`).map((item) => ({...item, _type: 'review', location: 'Chicago, IL', verifiedAt: '2026-09-08'})),
    gallery: imageList(row.gallery, `gallery-${row.service_id}`, serviceName),
    workingPhotos: imageList(row.working_photos, `working-${row.service_id}`, serviceName),
    guides: objects(row.guides, ['title', 'legacyHtml'], `guide-${row.service_id}`).map((item, index) => ({...item, _type: 'guide', body: blocksFromHtml(item.legacyHtml, `guide-${row.service_id}-${index}`)})),
    localFaqOverrides: [],
  }
})

async function main() {
  let transaction = client.transaction()
  const documents: ImportDocument[] = [...services, ...pages]
  for (const document of documents) transaction = transaction.createOrReplace(document)
  for (const service of services) transaction = transaction.delete(`drafts.${service._id}`)
  const result = await transaction.commit()
  const ids = documents.map((document) => document._id)
  const verification = await client.fetch<Array<{_id: string; serviceId: number; reviewCount: number; galleryCount: number; workingCount: number; guideCount: number}>>(
    `*[_id in $ids]{_id, serviceId, "reviewCount": count(reviews), "galleryCount": count(gallery), "workingCount": count(workingPhotos), "guideCount": count(guides)}`,
    {ids},
  )
  if (verification.length !== 20) throw new Error(`Expected 10 published service definitions and 10 draft pages, found ${verification.length} documents`)
  for (const document of verification.filter((item) => item._id.includes('servicePage-'))) {
    if (document.reviewCount !== 4 || document.galleryCount !== 3 || document.workingCount !== 3 || document.guideCount !== 4) {
      throw new Error(`Incomplete draft ${document._id}: ${JSON.stringify(document)}`)
    }
  }
  console.log(JSON.stringify({transactionId: result.transactionId, publishedServiceDefinitions: services.length, pageDrafts: pages.length, verifiedDocuments: verification.length}))
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
