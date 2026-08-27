import fs from 'node:fs'
import path from 'node:path'

type Row = Record<string, string>
type Source = {equip: Row[]; area: Row[]; page: Row[]}

const source = JSON.parse(fs.readFileSync(path.resolve('data/source-content.json'), 'utf8')) as Source
const errors: string[] = []
const unique = (values: string[]) => new Set(values).size === values.length
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
}
for (const row of source.page) {
  const expectedCanonical = `https://www.highlightschicago.com/services/${row.equipment_slug}/${row.area_slug}/`
  if (row.canonical_url !== expectedCanonical) errors.push(`Unexpected canonical URL for ${row.equipment_slug}`)
  const service = source.equip.find((candidate) => candidate.slug === row.equipment_slug)
  if (!service || service.service_id !== row.service_id) errors.push(`service_id mismatch for ${row.equipment_slug}`)
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
}, null, 2))
