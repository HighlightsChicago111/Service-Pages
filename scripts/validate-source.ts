import fs from 'node:fs'
import path from 'node:path'

type Row = Record<string, string>
type Source = {equip: Row[]; area: Row[]; page: Row[]}

const source = JSON.parse(fs.readFileSync(path.resolve('data/source-content.json'), 'utf8')) as Source
const fullReviews = JSON.parse(fs.readFileSync(path.resolve('data/full-reviews.json'), 'utf8')) as Record<string, string>
const errors: string[] = []
const unique = (values: string[]) => new Set(values).size === values.length
const entries = (raw = '') => raw.split('||').map((item) => item.trim()).filter(Boolean)
const equipmentSlugs = source.equip.map((row) => row.slug)
const areaSlugs = source.area.map((row) => row.slug)
const pageKeys = source.page.map((row) => `${row.equipment_slug}__${row.area_slug}`)
const expectedKeys = equipmentSlugs.flatMap((equipment) => areaSlugs.map((area) => `${equipment}__${area}`))

if (!unique(equipmentSlugs)) errors.push('Duplicate service slugs')
if (!unique(source.equip.map((row) => row.service_id))) errors.push('Duplicate service IDs')
if (!unique(pageKeys)) errors.push('Duplicate service-page joins')
for (const key of expectedKeys) if (!pageKeys.includes(key)) errors.push(`Missing service-page row: ${key}`)
for (const row of source.equip) {
  if (!/^\d+$/.test(row.service_id)) errors.push(`Invalid service_id for ${row.slug}`)
  if (!/^\d+$/.test(row.kw_volume)) errors.push(`Invalid kw_volume for ${row.slug}`)
  if (!row.h1_prefix || !row.hero_lede || !row.faqs) errors.push(`Missing required service content for ${row.slug}`)
  if (entries(row.types).length < 6) errors.push(`Too few equipment types for ${row.slug}`)
  if (entries(row.brands).length < 6) errors.push(`Too few brands for ${row.slug}`)
  if (entries(row.why).length < 3) errors.push(`Too few trust reasons for ${row.slug}`)
  if (entries(row.other_services).length < 3) errors.push(`Expected at least three related services for ${row.slug}`)
  if (entries(row.pricing_rows).length < 1) errors.push(`Missing pricing rows for ${row.slug}`)
  if (entries(row.faqs).length < 1) errors.push(`Missing FAQs for ${row.slug}`)
}
for (const row of source.page) {
  const expectedCanonical = `https://www.highlightschicago.com/services/${row.equipment_slug}/${row.area_slug}/`
  if (row.canonical_url !== expectedCanonical) errors.push(`Unexpected canonical URL for ${row.equipment_slug}`)
  const service = source.equip.find((candidate) => candidate.slug === row.equipment_slug)
  if (!service || service.service_id !== row.service_id) errors.push(`service_id mismatch for ${row.equipment_slug}`)
  if (entries(row.reviews).length !== 4) errors.push(`Expected four reviews for ${row.equipment_slug}`)
  if (entries(row.gallery).length < 1) errors.push(`Missing gallery for ${row.equipment_slug}`)
  if (entries(row.working_photos).length < 1) errors.push(`Missing working photos for ${row.equipment_slug}`)
  if (entries(row.guides).length < 1) errors.push(`Missing guides for ${row.equipment_slug}`)
  for (const review of entries(row.reviews)) {
    const [quote, , , sourceUrl, sourceId] = review.split('::').map((value) => value.trim())
    if (!sourceId || !fullReviews[sourceId]) errors.push(`Missing full review text for ${sourceId || row.equipment_slug}`)
    const quotedExcerpt = quote.split(/\s+—\s+/)[0].replace(/^["“]|["”]$/g, '').replace(/…$/, '')
    if (sourceId && fullReviews[sourceId]?.length < quotedExcerpt.length) errors.push(`Full review is shorter than excerpt ${sourceId}`)
    if (!/^https:\/\/www\.google\.com\/maps\/reviews\//.test(sourceUrl || '')) errors.push(`Invalid Google review URL for ${sourceId || row.equipment_slug}`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  services: source.equip.length,
  areas: source.area.length,
  pages: source.page.length,
  pageJoins: pageKeys,
  monthlySearchVolumeTotal: source.equip.reduce((sum, row) => sum + Number(row.kw_volume), 0),
  fullReviewRecords: Object.keys(fullReviews).length,
}, null, 2))
