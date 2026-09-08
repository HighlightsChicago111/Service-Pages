import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'

type Row = Record<string, string>
type Source = {page: Row[]}
type PageDocument = {
  _id: string
  gallery?: Array<Record<string, unknown> & {_key?: string}>
}

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
if (!token || /^(PASTE_|your_)/i.test(token)) throw new Error('Add a Sanity Editor token to SANITY_API_WRITE_TOKEN in .env.local')

const client = createClient({projectId, dataset, apiVersion: '2026-03-01', token, useCdn: false, perspective: 'raw'})
const source = JSON.parse(fs.readFileSync(path.resolve('data/next-ten-draft-content.json'), 'utf8')) as Source
const first = (raw = '') => raw.split('||').map((item) => item.trim()).find(Boolean) || ''

function localFileFor(sitePath: string) {
  const publicPath = sitePath.replace(/^https?:\/\/www\.highlightschicago\.com/i, '').replace(/^\/services\//, '')
  return path.resolve('public', publicPath)
}

async function main() {
  const uploaded: Array<{serviceId: number; assetId: string; url: string; patched: string[]}> = []

  for (const row of source.page) {
    const serviceId = Number(row.service_id)
    const sourcePath = first(row.gallery)
    const filePath = localFileFor(sourcePath)
    if (!fs.existsSync(filePath)) throw new Error(`Missing cover image for service ${serviceId}: ${filePath}`)

    const asset = await client.assets.upload('image', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      title: `${row.equipment_slug} collection cover`,
    })
    const documentIds = [`servicePage-${serviceId}-chicago`, `drafts.servicePage-${serviceId}-chicago`]
    const documents = await client.getDocuments<PageDocument>(documentIds)
    const patched: string[] = []
    let transaction = client.transaction()

    for (const document of documents) {
      if (!document) continue
      const gallery = Array.isArray(document.gallery) ? [...document.gallery] : []
      if (!gallery[0]) throw new Error(`${document._id} has no first gallery item`)
      gallery[0] = {
        ...gallery[0],
        externalUrl: asset.url,
        image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
      }
      transaction = transaction.patch(document._id, {set: {gallery}})
      patched.push(document._id)
    }

    if (!patched.length) throw new Error(`No Sanity page document found for service ${serviceId}`)
    await transaction.commit()
    uploaded.push({serviceId, assetId: asset._id, url: asset.url, patched})
  }

  const pageIds = source.page.flatMap((row) => [
    `servicePage-${row.service_id}-chicago`,
    `drafts.servicePage-${row.service_id}-chicago`,
  ])
  const verification = await client.fetch<Array<{_id: string; coverUrl?: string; coverAsset?: string}>>(
    `*[_id in $pageIds]{_id, "coverUrl": gallery[0].image.asset->url, "coverAsset": gallery[0].image.asset._ref}`,
    {pageIds},
  )
  const invalid = verification.filter((page) => !page.coverAsset || !page.coverUrl?.startsWith('https://cdn.sanity.io/images/'))
  if (invalid.length) throw new Error(`Cover verification failed: ${invalid.map((page) => page._id).join(', ')}`)

  console.log(JSON.stringify({uploadedAssets: uploaded.length, patchedDocuments: uploaded.reduce((sum, item) => sum + item.patched.length, 0), verifiedDocuments: verification.length}))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
