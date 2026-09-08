import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'

type Row = Record<string, string>
type Source = {equip: Row[]; page: Row[]}

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
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN
if (!token || /^(PASTE_|your_)/i.test(token)) throw new Error('A Sanity write token is required')

const source = JSON.parse(fs.readFileSync(path.resolve('data/source-content.json'), 'utf8')) as Source
const serviceNameById = new Map(source.equip.map((row) => [row.service_id, row.name]))
const recentPages = source.page.filter((row) => Number(row.service_id) >= 311 && Number(row.service_id) <= 330)

if (recentPages.length !== 20) throw new Error(`Expected 20 recent pages, found ${recentPages.length}`)

async function updateWorkingPhotos() {
  const client = createClient({projectId, dataset, apiVersion: '2026-03-01', token, useCdn: false})
  const documentIds = recentPages.map((row) => `servicePage-${row.service_id}-${row.area_slug}`)
  const existingIds = await client.fetch<string[]>('*[_id in $ids]._id', {ids: documentIds})
  const missingIds = documentIds.filter((id) => !existingIds.includes(id))
  if (missingIds.length) throw new Error(`Missing service-page documents: ${missingIds.join(', ')}`)

  if (process.argv.includes('--verify-only')) {
    const counts = await client.fetch<Array<{_id: string; photoCount: number}>>(
      '*[_id in $ids]{_id, "photoCount": count(workingPhotos)} | order(_id asc)',
      {ids: documentIds},
      {perspective: 'published'},
    )
    console.log(JSON.stringify(counts, null, 2))
    if (counts.length !== 20 || counts.some((entry) => entry.photoCount !== 3)) process.exit(1)
    return
  }

  let transaction = client.transaction()
  for (const row of recentPages) {
    const serviceName = serviceNameById.get(row.service_id) || row.equipment_slug
    const workingPhotos = row.working_photos.split('||').map((externalUrl, index) => {
      const alt = `${serviceName} work in Chicago — project photo ${index + 1}`
      return {
        _key: `working-${row.service_id}-${index + 1}`,
        _type: 'externalImage',
        externalUrl: externalUrl.trim(),
        alt,
        caption: alt,
      }
    })
    if (workingPhotos.length !== 3) throw new Error(`Expected three working photos for ${row.equipment_slug}`)
    transaction = transaction.patch(`servicePage-${row.service_id}-${row.area_slug}`, {set: {workingPhotos}})
  }

  const result = await transaction.commit()
  console.log(`Updated working-photo galleries on ${recentPages.length} service pages in transaction ${result.transactionId}`)
}

updateWorkingPhotos().catch((error) => {
  console.error(error)
  process.exit(1)
})
