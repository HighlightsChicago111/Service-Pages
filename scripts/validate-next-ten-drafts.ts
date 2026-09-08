import fs from 'node:fs'

type Row = Record<string, string>
type Source = {equip: Row[]; page: Row[]}
const source = JSON.parse(fs.readFileSync('data/next-ten-draft-content.json', 'utf8')) as Source
const errors: string[] = []
const expected = Array.from({length: 10}, (_, index) => String(331 + index))
const truncateMeta = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  const candidate = normalized.slice(0, maxLength - 1)
  const lastSpace = candidate.lastIndexOf(' ')
  const cutAt = lastSpace >= Math.floor(maxLength * 0.7) ? lastSpace : candidate.length
  return `${candidate.slice(0, cutAt).replace(/[\s,;:.!?'"—–-]+$/g, '')}…`
}
const equipmentIds = source.equip.map((row) => String(row.service_id))
const pageIds = source.page.map((row) => String(row.service_id))
if (equipmentIds.join(',') !== expected.join(',')) errors.push(`Unexpected equipment IDs: ${equipmentIds}`)
if (pageIds.join(',') !== expected.join(',')) errors.push(`Unexpected page IDs: ${pageIds}`)
for (const row of source.equip) {
  for (const [field, value] of Object.entries(row)) if (value === '' && !['kw_secondary'].includes(field)) errors.push(`Service ${row.service_id}: empty ${field}`)
  if (!String(row.hub_url).endsWith(`/${row.slug}/`)) errors.push(`Service ${row.service_id}: hierarchy mismatch`)
}
for (const row of source.page) {
  const reviews = String(row.reviews).split('||')
  const gallery = String(row.gallery).split('||')
  const working = String(row.working_photos).split('||')
  const guides = String(row.guides).split('||')
  if (reviews.length !== 4) errors.push(`Page ${row.service_id}: ${reviews.length} reviews`)
  if (gallery.length !== 3) errors.push(`Page ${row.service_id}: ${gallery.length} gallery images`)
  if (working.length !== 3) errors.push(`Page ${row.service_id}: ${working.length} working photos`)
  if (guides.length !== 4) errors.push(`Page ${row.service_id}: ${guides.length} guides`)
  for (const review of reviews) {
    const excerpt = review.match(/^"([^"]+)"/)?.[1]?.replace(/…$/, '') || ''
    if (excerpt.split(/\s+/).filter(Boolean).length > 14) errors.push(`Page ${row.service_id}: review excerpt over 14 words`)
  }
  if (!String(row.canonical_url).match(/^https:\/\/www\.highlightschicago\.com\/services\/[a-z0-9-]+\/[a-z0-9-]+\/$/)) errors.push(`Page ${row.service_id}: bad canonical`)
  if (truncateMeta(String(row.meta_title), 65).length > 65) errors.push(`Page ${row.service_id}: generated meta title exceeds 65 characters`)
  if (truncateMeta(String(row.meta_description), 170).length > 170) errors.push(`Page ${row.service_id}: generated meta description exceeds 170 characters`)
  for (const imagePath of [...gallery, ...working]) {
    if (!/^https?:\/\//i.test(imagePath) && !imagePath.startsWith('/')) errors.push(`Page ${row.service_id}: invalid image URL/path ${imagePath}`)
  }
}
if (errors.length) throw new Error(errors.join('\n'))
console.log(JSON.stringify({services: source.equip.length, pages: source.page.length, reviews: source.page.length * 4, galleryImages: source.page.length * 3, workingPhotos: source.page.length * 3, guides: source.page.length * 4}))
