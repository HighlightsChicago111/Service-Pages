import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {createClient} from 'next-sanity'

type ImageItem = {
  _key?: string
  _type?: string
  image?: {asset?: {_ref?: string}}
  externalUrl?: string
  alt?: string
  caption?: string
}
type Page = {
  _id: string
  serviceId: number
  serviceSlug: string
  gallery: ImageItem[]
  workingPhotos: ImageItem[]
}

const firstTen: Record<number, [string, string, string]> = {
  301: ['generator-installation', 'generator-repair', 'whole-house-surge-protector'],
  302: ['solar-panel-installation', 'solar-battery-installation', 'home-energy-audit'],
  303: ['ceiling-fan-installation', 'light-fixture-installation-and-replacement', 'recessed-lighting-installation'],
  304: ['generator-repair', 'generator-installation', 'electrical-troubleshooting'],
  305: ['whole-house-surge-protector', 'electrical-panel-upgrade', 'circuit-breaker-replacement'],
  306: ['gfci-outlet-installation', 'electrical-outlet-installation', 'electrical-repair'],
  307: ['garbage-disposal-wiring', 'electrical-installation-services', 'gfci-outlet-installation'],
  308: ['electrical-repair', 'electrical-troubleshooting', 'electrical-wiring-and-repair-services'],
  309: ['electrical-panel-upgrade', 'breaker-box-and-panel-repair', 'circuit-breaker-replacement'],
  310: ['circuit-breaker-replacement', 'breaker-box-and-panel-repair', 'electrical-panel-upgrade'],
}

for (const line of fs.readFileSync(path.resolve('.env.local'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
}

const apply = process.argv.includes('--apply')
const token = apply ? process.env.SANITY_API_WRITE_TOKEN : process.env.SANITY_API_READ_TOKEN
if (!token) throw new Error(`Missing ${apply ? 'SANITY_API_WRITE_TOKEN' : 'SANITY_API_READ_TOKEN'}`)
const client = createClient({
  projectId: process.env.NEXT_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-03-01',
  token,
  useCdn: false,
})

function label(slug: string) {
  return slug.replace(/-/g, ' ')
}

function localSlug(url?: string) {
  return url?.match(/\/services\/images\/services\/([a-z0-9-]+)\.jpg(?:\?.*)?$/)?.[1]
}

async function main() {
  const pages = await client.fetch<Page[]>(`*[_type == "servicePage" && serviceId >= 301 && serviceId <= 330] | order(serviceId asc) {
    _id, serviceId, gallery, workingPhotos, "serviceSlug": service->slug.current
  }`)
  if (pages.length !== 30) throw new Error(`Expected 30 pages, found ${pages.length}`)
  const plan = pages.map((page) => {
    if (page.gallery?.length !== 3 || page.workingPhotos?.length !== 3) throw new Error(`${page._id}: expected three slots in each section`)
    const slugs = firstTen[page.serviceId] || page.workingPhotos.map((photo) => localSlug(photo.externalUrl))
    if (slugs.length !== 3 || slugs.some((slug) => !slug) || new Set(slugs).size !== 3) throw new Error(`${page._id}: three distinct local images required`)
    for (const slug of slugs) {
      if (!fs.existsSync(path.resolve('public', 'images', 'services', `${slug}.jpg`))) throw new Error(`${page._id}: missing ${slug}.jpg`)
    }
    const complete = [...page.gallery, ...page.workingPhotos].every((photo) => photo.image?.asset?._ref && !photo.externalUrl)
    return {page, slugs: slugs as [string, string, string], complete}
  })
  console.log(JSON.stringify(plan.map(({page, slugs, complete}) => ({id: page.serviceId, slugs, complete})), null, 2))
  if (!apply) return

  const pending = plan.filter(({complete}) => !complete)
  if (!pending.length) return
  const backup = path.resolve('outputs', 'service-three-images-before.json')
  fs.mkdirSync(path.dirname(backup), {recursive: true})
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, `${JSON.stringify(pages, null, 2)}\n`)

  const uniqueSlugs = [...new Set(pending.flatMap(({slugs}) => slugs))]
  const filenames = uniqueSlugs.map((slug) => `${slug}.jpg`)
  const existing = await client.fetch<Array<{_id: string; originalFilename: string}>>(
    `*[_type == "sanity.imageAsset" && originalFilename in $filenames]{_id, originalFilename}`,
    {filenames},
  )
  const assets = new Map<string, string>()
  for (const slug of uniqueSlugs) {
    const file = path.resolve('public', 'images', 'services', `${slug}.jpg`)
    const hash = createHash('sha1').update(fs.readFileSync(file)).digest('hex')
    const known = existing.find((asset) => asset.originalFilename === `${slug}.jpg` && asset._id.startsWith(`image-${hash}-`))
    const assetId = known?._id || (await client.assets.upload('image', fs.createReadStream(file), {
      filename: `${slug}.jpg`, title: `Illustrative photo of ${label(slug)}`,
    }))._id
    assets.set(slug, assetId)
    console.log(`${slug}: ${assetId}${known ? ' (reused)' : ' (uploaded)'}`)
  }

  for (const {page, slugs} of pending) {
    const photos = (items: ImageItem[]) => items.map((item, index) => {
      const slug = slugs[index]
      const caption = `Illustrative photo of ${label(slug)}`
      return {
        _key: item._key,
        _type: item._type || 'externalImage',
        image: {_type: 'image', asset: {_type: 'reference', _ref: assets.get(slug)}},
        alt: caption,
        caption,
      }
    })
    await client.patch(page._id).set({gallery: photos(page.gallery), workingPhotos: photos(page.workingPhotos)}).commit()
    console.log(`${page._id}: three hero and three work images saved`)
  }
  console.log(`Original Sanity fields saved to ${backup}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
