import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'

type ImageItem = {
  _key?: string
  _type?: string
  image?: {_type: 'image'; asset: {_type: 'reference'; _ref: string}}
  externalUrl?: string
  alt?: string
  caption?: string
}

type Page = {
  _id: string
  serviceId: number
  serviceName: string
  serviceSlug: string
  gallery?: ImageItem[]
  workingPhotos?: ImageItem[]
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
  perspective: 'raw',
})

async function main() {
  const pages = await client.fetch<Page[]>(`*[_type == "servicePage" && serviceId >= 301 && serviceId <= 310]{
    _id, serviceId, gallery, workingPhotos,
    "serviceName": service->name,
    "serviceSlug": service->slug.current
  }`)
  if (pages.length !== 10) throw new Error(`Expected ten service pages, found ${pages.length}`)
  const plan = pages.filter((page) => !page.gallery?.[0]?.image?.asset?._ref && !page.workingPhotos?.[0]?.image?.asset?._ref &&
    [...(page.gallery || []), ...(page.workingPhotos || [])]
      .some((item) => /googleusercontent\.com|gstatic\.com/i.test(item.externalUrl || ''))).map((page) => {
    const file = path.resolve('public', 'images', 'services', `${page.serviceSlug}.jpg`)
    if (!fs.existsSync(file)) throw new Error(`Missing local image: ${file}`)
    return {page, file}
  })
  console.log(JSON.stringify(plan.map(({page, file}) => ({id: page._id, file: path.basename(file), gallerySlots: page.gallery?.length || 0, workSlots: page.workingPhotos?.length || 0})), null, 2))
  if (!apply || !plan.length) return

  const backupPath = path.resolve('outputs', 'google-service-images-before.json')
  fs.mkdirSync(path.dirname(backupPath), {recursive: true})
  fs.writeFileSync(backupPath, `${JSON.stringify(pages, null, 2)}\n`)

  for (const {page, file} of plan) {
    const asset = await client.assets.upload('image', fs.createReadStream(file), {
      filename: path.basename(file),
      title: `${page.serviceName} illustrative service image`,
    })
    const image = {_type: 'image' as const, asset: {_type: 'reference' as const, _ref: asset._id}}
    const cleanSlots = (items: ImageItem[] | undefined, kind: string): ImageItem[] => (items || []).map((item, index) => {
      const {_key, _type} = item
      return index === 0
        ? {_key, _type, image, alt: `Illustrative photo of ${page.serviceName.toLowerCase()}`, caption: `Illustrative photo of ${page.serviceName.toLowerCase()}`}
        : {_key, _type, alt: `Future ${page.serviceName.toLowerCase()} ${kind} photo ${index + 1}`}
    })
    const gallery = cleanSlots(page.gallery, 'gallery')
    const workingPhotos = cleanSlots(page.workingPhotos, 'project')
    if (!gallery.length || !workingPhotos.length) throw new Error(`${page._id}: missing image slots`)
    await client.patch(page._id).set({gallery, workingPhotos}).commit()
    console.log(`${page._id}: ${asset._id}`)
  }
  console.log(`Original Sanity fields saved to ${backupPath}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
