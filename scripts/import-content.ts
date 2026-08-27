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
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '5w5623jq'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN
if (!token || /^(PASTE_|your_)/i.test(token)) throw new Error('Add a Sanity Editor token to SANITY_API_WRITE_TOKEN in .env.local')

const source = JSON.parse(fs.readFileSync(path.resolve('data/source-content.json'), 'utf8')) as Source
const client = createClient({projectId, dataset, apiVersion: '2026-03-01', token, useCdn: false})
const key = (prefix: string, index: number) => `${prefix}-${index + 1}`
const strings = (raw = '') => raw.split('||').map((item) => item.trim()).filter(Boolean)
const keywords = (raw = '') => raw.split(/\|\||,/).map((item) => item.trim()).filter(Boolean)
const objects = (raw: string, fields: string[], prefix: string): Array<{_key: string} & Record<string, string>> => strings(raw).map((item, index) => {
  const parts = item.split('::')
  return {_key: key(prefix, index), ...Object.fromEntries(fields.map((field, fieldIndex) => [field, (parts[fieldIndex] || '').trim()]))}
})
const imageList = (raw: string, prefix: string, altPrefix: string) => strings(raw).map((externalUrl, index) => ({_key: key(prefix, index), _type: 'externalImage', externalUrl, alt: `${altPrefix} ${index + 1}`}))
const decode = (value: string) => value.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
const truncateMeta = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  const candidate = normalized.slice(0, maxLength - 1)
  const lastSpace = candidate.lastIndexOf(' ')
  const cutAt = lastSpace >= Math.floor(maxLength * 0.7) ? lastSpace : candidate.length
  return `${candidate.slice(0, cutAt).replace(/[\s,;:.!?'"—–-]+$/g, '')}…`
}
const titleFromSlug = (slug: string) => slug
  .split('-')
  .map((part) => part.toLowerCase() === 'gfci' ? 'GFCI' : `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join(' ')
const buildMetaDescription = (value: string, phone: string) => {
  const sourceSummary = value.split(/…\s*Registered Chicago/i)[0].trim()
  const callToAction = phone ? ` Call ${phone}.` : ''
  const summary = truncateMeta(sourceSummary, 169 - callToAction.length).replace(/[.…]+$/g, '')
  return `${summary}…${callToAction}`
}
const blocksFromHtml = (html: string, prefix: string) => decode(html)
  .replace(/<\/(p|h[1-6]|li|div)>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .split(/\n+/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((text, index) => ({_key: key(`${prefix}-block`, index), _type: 'block', style: 'normal', markDefs: [], children: [{_key: key(`${prefix}-span`, index), _type: 'span', text, marks: []}]}))

const firstPage = source.page[0]
const areaNameBySlug = new Map(source.area.map((row) => [row.slug, row.name]))
const siteSettings = {
  _id: 'siteSettings', _type: 'siteSettings',
  companyName: firstPage.company_name,
  siteUrl: firstPage.site_url,
  phoneDisplay: firstPage.phone_display,
  phoneE164: firstPage.phone_e164,
  email: firstPage.email,
  address: {street: firstPage.address_street, city: firstPage.address_city, state: firstPage.address_state, zip: firstPage.address_zip},
  shopLocation: {_type: 'geopoint', lat: Number(firstPage.shop_lat), lng: Number(firstPage.shop_lng)},
  schemaBusinessType: firstPage.schema_business_type,
  brand: {primary: firstPage.brand_color, dark: firstPage.brand_dark, light: firstPage.brand_light, secondary: firstPage.brand_secondary, accent: firstPage.accent_color, accentDark: firstPage.accent_dark},
  google: {rating: Number(firstPage.google_rating), reviewCount: Number(firstPage.google_review_count), reviewsUrl: firstPage.google_reviews_url, verifiedAt: '2026-08-27'},
  trustLines: [firstPage.trust_line_1, firstPage.trust_line_2].filter(Boolean),
  trustHeading: firstPage.trust_heading,
  trustLede: firstPage.trust_lede,
  trustMetrics: [1, 2, 4, 5].map((cell, index) => ({_key: key('metric', index), _type: 'trustMetric', value: firstPage[`trust_cell_${cell}_value`], label: firstPage[`trust_cell_${cell}_label`]})),
  trustCards: objects(firstPage.trust_cards, ['title', 'body'], 'trust-card').map((item) => ({...item, _type: 'titledBody'})),
  reviewsHeading: firstPage.reviews_heading,
  reviewsDisclaimer: firstPage.reviews_disclaimer,
  formSubtitle: firstPage.form_subtitle,
  formNote: firstPage.form_note,
}

const template = {
  _id: 'servicePageTemplate-standard-v1', _type: 'servicePageTemplate', name: 'Standard service landing page', version: '1.0.0', active: true,
  sectionOrder: ['hero', 'types', 'brands', 'trust', 'reviews', 'why', 'workingArea', 'coverage', 'otherServices', 'pricing', 'faq', 'closingCta', 'guides'],
}

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
  faqs: objects(row.faqs, ['question', 'answer'], `faq-${row.service_id}`).map((item) => ({...item, _type: 'faq'})), ctaHeading: row.cta_heading, ctaBody: row.cta_body,
}))

const areas = source.area.map((row) => ({
  _id: `area-${row.slug}`, _type: 'serviceArea', name: row.name, slug: {_type: 'slug', current: row.slug}, state: row.state,
  heroEyebrow: row.hero_eyebrow, galleryLabel: row.gallery_label, addressPlaceholder: row.address_placeholder, buildingTypes: strings(row.building_types),
  workingLede: row.working_lede, areasHeading: row.areas_heading, areasLede: row.areas_lede, areasNote: row.areas_note,
  subAreas: objects(row.sub_areas, ['name', 'note', 'externalUrl'], `subarea-${row.slug}`).map(({externalUrl, ...item}) => ({...item, _type: 'subArea', photo: {_type: 'externalImage', externalUrl, alt: item.name}})),
  mapQuery: row.map_query, libraryHeading: row.library_heading, libraryLede: row.library_lede,
  localFaqs: objects(firstPage.faqs_local, ['question', 'answer'], `local-faq-${row.slug}`).map((item) => ({...item, _type: 'faq'})),
}))

const pages = source.page.map((row) => ({
  _id: `servicePage-${row.service_id}-${row.area_slug}`, _type: 'servicePage', title: `${row.equipment_slug} — ${row.area_slug}`, serviceId: Number(row.service_id),
  service: {_type: 'reference', _ref: `service-${row.service_id}`}, area: {_type: 'reference', _ref: `area-${row.area_slug}`}, template: {_type: 'reference', _ref: template._id},
  seo: {
    title: truncateMeta(`${titleFromSlug(row.equipment_slug)} in ${areaNameBySlug.get(row.area_slug) || row.area_slug} | ${firstPage.company_name}`, 65),
    description: buildMetaDescription(row.meta_description, firstPage.phone_display),
    canonicalUrl: row.canonical_url,
  },
  reviews: objects(row.reviews, ['quote', 'author', 'location', 'sourceUrl', 'sourceId'], `review-${row.service_id}`).map((item) => ({...item, _type: 'review', verifiedAt: '2026-08-27'})),
  gallery: imageList(row.gallery, `gallery-${row.service_id}`, `${row.equipment_slug} project`),
  workingPhotos: imageList(row.working_photos, `working-${row.service_id}`, `${row.equipment_slug} work in ${row.area_slug}`),
  guides: objects(row.guides, ['title', 'legacyHtml'], `guide-${row.service_id}`).map((item, index) => ({...item, _type: 'guide', body: blocksFromHtml(item.legacyHtml, `guide-${row.service_id}-${index}`)})),
  localFaqOverrides: [],
}))

const documents: ImportDocument[] = [siteSettings, template, ...services, ...areas, ...pages]

async function importDocuments() {
  let transaction = client.transaction()
  for (const document of documents) transaction = transaction.createOrReplace(document)
  const result = await transaction.commit()
  console.log(`Imported ${documents.length} documents in transaction ${result.transactionId}`)
}

importDocuments().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
