import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {createClient} from 'next-sanity'

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
}

const apply = process.argv.includes('--apply')
const client = createClient({
  projectId: process.env.NEXT_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-03-01',
  token: apply ? process.env.SANITY_API_WRITE_TOKEN : process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
})
const requireFromNext = createRequire(import.meta.resolve('next'))
const sharp = requireFromNext('sharp')
const userAgent = 'HighlightsChicagoSiteAudit/1.0 (info@highlightschicago.com)'

function fileName(externalUrl) {
  return decodeURIComponent(externalUrl.split('/').at(-1).replace(/^500px-/, ''))
}

function plainText(html = '') {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()
}

async function fetchWithRetry(url) {
  let lastStatus = 0
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, {headers: {'user-agent': userAgent}, signal: AbortSignal.timeout(30000)})
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) return Buffer.from(await response.arrayBuffer())
    lastStatus = response.status
    await response.body?.cancel()
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)))
  }
  throw new Error(`${url}: image download failed with HTTP ${lastStatus}`)
}

const area = await client.getDocument('area-chicago')
if (!area?.subAreas?.length) throw new Error('Chicago area or neighborhood entries missing')
const pending = area.subAreas.filter((item) => !item.photo?.image?.asset?._ref && /upload\.wikimedia\.org/.test(item.photo?.externalUrl || ''))
console.log(JSON.stringify(pending.map((item) => ({name: item.name, file: fileName(item.photo.externalUrl)})), null, 2))
if (apply && pending.length) {
  const backup = path.resolve('outputs', 'chicago-area-images-before.json')
  fs.mkdirSync(path.dirname(backup), {recursive: true})
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, `${JSON.stringify(area, null, 2)}\n`)
  for (const item of pending) {
    const title = `File:${fileName(item.photo.externalUrl)}`
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata%7Curl%7Csize&titles=${encodeURIComponent(title)}`
    const metadataResponse = await fetch(apiUrl, {headers: {'user-agent': userAgent}, signal: AbortSignal.timeout(20000)})
    if (!metadataResponse.ok) throw new Error(`${item.name}: Wikimedia metadata HTTP ${metadataResponse.status}`)
    const metadata = Object.values((await metadataResponse.json()).query.pages)[0].imageinfo?.[0]
    const license = metadata?.extmetadata?.LicenseShortName?.value
    const artist = plainText(metadata?.extmetadata?.Artist?.value)
    if (!metadata?.url || !license || !artist || !/^(CC BY|CC0)/.test(license)) throw new Error(`${item.name}: missing or unsupported license metadata`)
    const original = await fetchWithRetry(metadata.url)
    const resized = await sharp(original).resize({width: 800, height: 600, fit: 'cover'}).jpeg({quality: 84}).toBuffer()
    const asset = await client.assets.upload('image', resized, {filename: `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-chicago.jpg`, title: `${item.name} neighborhood photo`})
    const credit = `${artist} · ${license} · Wikimedia Commons`
    const photo = {...item.photo, image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}, credit}
    delete photo.externalUrl
    const current = await client.getDocument('area-chicago')
    const subAreas = current.subAreas.map((entry) => entry._key === item._key ? {...entry, photo} : entry)
    await client.patch('area-chicago').set({subAreas}).commit()
    console.log(`${item.name}: ${asset._id} (${resized.length} bytes)`)
  }
  console.log(`Original Sanity fields saved to ${backup}`)
}
