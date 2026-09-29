import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
}

const origin = 'https://www.highlightschicago.com'
const client = createClient({
  projectId: process.env.NEXT_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-03-01',
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
})

async function pooled(items, limit, work) {
  const results = new Array(items.length)
  let cursor = 0
  await Promise.all(Array.from({length: limit}, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await work(items[index])
    }
  }))
  return results
}

function imageUrls(html) {
  return [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)].map((match) => ({
    src: match[1].replace(/&amp;/g, '&'),
    alt: match[0].match(/\balt="([^"]*)"/i)?.[1] || '',
  }))
}

async function checkImage(src) {
  try {
    const url = new URL(src, origin).href
    let response = await fetch(url, {method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000)})
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000)})
      await response.body?.cancel()
    }
    return {src, status: response.status, contentType: response.headers.get('content-type') || ''}
  } catch (error) {
    return {src, status: 0, error: error instanceof Error ? error.message : String(error)}
  }
}

const pages = await client.fetch(`*[_type == "servicePage" && defined(service->slug.current)] | order(serviceId asc) {
  serviceId, "slug": service->slug.current,
  gallery[]{externalUrl, "assetUrl": image.asset->url, alt},
  workingPhotos[]{externalUrl, "assetUrl": image.asset->url, alt}
}`)
const pageResults = await pooled(pages, 5, async (page) => {
  const pathname = `/services/${page.slug}`
  try {
    const response = await fetch(`${origin}${pathname}`, {signal: AbortSignal.timeout(20000)})
    const html = await response.text()
    const heroSection = html.match(/class="cs-gallery-rail"[\s\S]*?class="cs-gallery-head"/)?.[0] || ''
    const workSection = html.match(/id="working-in-area"[\s\S]*?id="areas"/)?.[0] || ''
    const heroImages = imageUrls(heroSection)
    const workImages = imageUrls(workSection)
    return {
      serviceId: page.serviceId, pathname, status: response.status,
      title: /<title>[^<]+<\/title>/i.test(html),
      heroImages: heroImages.length,
      distinctHeroImages: new Set(heroImages.map((image) => image.src)).size,
      workSection: Boolean(workSection),
      workImages: workImages.length,
      distinctWorkImages: new Set(workImages.map((image) => image.src)).size,
      images: imageUrls(html),
      gallerySources: (page.gallery || []).filter((item) => item.assetUrl || item.externalUrl).length,
      workSources: (page.workingPhotos || []).filter((item) => item.assetUrl || item.externalUrl).length,
    }
  } catch (error) {
    return {serviceId: page.serviceId, pathname, status: 0, error: error instanceof Error ? error.message : String(error), images: []}
  }
})
const uniqueImages = [...new Set(pageResults.flatMap((page) => page.images.map((image) => image.src)))]
const imageResults = await pooled(uniqueImages, 8, checkImage)
const failedImages = imageResults.filter((image) => image.status < 200 || image.status >= 400 || !image.contentType?.startsWith('image/'))
const failedPages = pageResults.filter((page) => page.status !== 200 || !page.title || !page.workSection || page.heroImages !== 3 || page.workImages !== 3 || page.distinctHeroImages !== 3 || page.distinctWorkImages !== 3 || page.gallerySources < 3 || page.workSources < 3 || page.images.some((image) => !image.alt))
const report = {
  generatedAt: new Date().toISOString(),
  summary: {pages: pageResults.length, failedPages: failedPages.length, uniqueImages: uniqueImages.length, failedImages: failedImages.length},
  failedPages,
  failedImages,
  pageResults: pageResults.map(({images, ...page}) => ({...page, imageCount: images.length, missingAlt: images.filter((image) => !image.alt).length})),
}
const output = path.resolve('outputs', 'service-page-image-audit.json')
fs.mkdirSync(path.dirname(output), {recursive: true})
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({summary: report.summary, failedPages, failedImages, report: output}, null, 2))
if (failedPages.length || failedImages.length) process.exitCode = 1
