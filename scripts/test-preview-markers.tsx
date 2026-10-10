import {createClient, stegaClean} from 'next-sanity'
import {renderToStaticMarkup} from 'react-dom/server'
import {ServiceLandingPage} from '../src/components/service-landing-page'
import {projectId, dataset, apiVersion, studioUrl} from '../src/sanity/env'
import {SERVICE_PAGE_QUERY} from '../src/sanity/lib/queries'
import {PRIMARY_AREA_SLUG} from '../src/lib/service-urls'
import type {ServicePageData} from '../src/types/content'

// In Studio preview (draft mode) Sanity appends invisible click-to-edit markers to
// strings. Rendering every service page from marked and plain data, then removing
// the markers, must give identical HTML: markers may only add the edit overlay,
// never change links, logos, colours, headings or form values.
const base = {projectId, dataset, apiVersion, useCdn: false, perspective: 'published' as const}
const plainClient = createClient(base)
const markedClient = createClient({...base, stega: {enabled: true, studioUrl}})

async function run() {
  const slugs = process.argv.slice(2).length
    ? process.argv.slice(2)
    : await plainClient.fetch<string[]>('*[_type == "servicePage" && area->slug.current == $area].service->slug.current', {area: PRIMARY_AREA_SLUG})
  const failures: string[] = []
  let markedPages = 0
  for (const serviceSlug of slugs) {
    const params = {serviceSlug, areaSlug: PRIMARY_AREA_SLUG}
    const [plain, marked] = await Promise.all([
      plainClient.fetch<ServicePageData>(SERVICE_PAGE_QUERY, params),
      markedClient.fetch<ServicePageData>(SERVICE_PAGE_QUERY, params),
    ])
    const plainHtml = renderToStaticMarkup(<ServiceLandingPage data={plain} />)
    const markedHtml = renderToStaticMarkup(<ServiceLandingPage data={marked} />)
    if (markedHtml !== stegaClean(markedHtml)) markedPages += 1
    const cleaned = stegaClean(markedHtml)
    if (cleaned === plainHtml) continue
    let index = 0
    while (index < cleaned.length && cleaned[index] === plainHtml[index]) index += 1
    failures.push(`${serviceSlug} differs at ${index}:\n  preview: ${cleaned.slice(Math.max(0, index - 100), index + 100)}\n  public:  ${plainHtml.slice(Math.max(0, index - 100), index + 100)}`)
  }
  if (!markedPages) failures.push('No click-to-edit markers were rendered, so the preview comparison proved nothing')
  if (failures.length) {
    console.error(`Preview marker test failed:\n${failures.join('\n')}`)
    process.exit(1)
  }
  console.log(`Preview marker test passed: ${slugs.length} service pages render identically with and without click-to-edit markers.`)
}

run().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
