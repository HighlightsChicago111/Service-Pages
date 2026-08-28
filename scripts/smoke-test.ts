import fs from 'node:fs'
import path from 'node:path'

type Row = Record<string, string>
type Source = {equip: Row[]; area: Row[]; page: Row[]}

const baseUrl = (process.argv[2] || process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const source = JSON.parse(fs.readFileSync(path.resolve('data/source-content.json'), 'utf8')) as Source
const fullReviews = JSON.parse(fs.readFileSync(path.resolve('data/full-reviews.json'), 'utf8')) as Record<string, string>
const serviceBySlug = new Map(source.equip.map((row) => [row.slug, row]))
const areaBySlug = new Map(source.area.map((row) => [row.slug, row]))
const validServicePaths = new Set(['/services', ...source.page.map((row) => `/services/${row.equipment_slug}/${row.area_slug}`)])
const failures: string[] = []
let assertions = 0

function expect(condition: unknown, message: string) {
  assertions += 1
  if (!condition) failures.push(message)
}

async function request(pathname: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${pathname}`, init)
  const text = await response.text()
  return {response, text}
}

function reviewIds(raw = '') {
  return raw.split('||').map((entry) => entry.split('::').at(-1)?.trim()).filter(Boolean) as string[]
}

function brandLogoPath(brand: string) {
  const slug = brand
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `/images/brands/${slug}.png`
}

function visibleText(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
}

function anchorHrefs(html: string) {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map((match) => match[1].replace(/&amp;/g, '&'))
}

async function testDocument(pathname: string, requiredText: string[]) {
  const {response, text} = await request(pathname)
  expect(response.status === 200, `${pathname} returned ${response.status}`)
  expect(!/This page couldn.t load|Application error|Internal Server Error/i.test(text), `${pathname} rendered an error page`)
  for (const value of requiredText) expect(text.includes(value), `${pathname} is missing ${JSON.stringify(value)}`)
  return text
}

async function run() {
  const collection = await testDocument('/', ['Electrical services built around Chicago', 'Find the right electrical service'])
  await testDocument('/services', ['Electrical services built around Chicago', 'Find the right electrical service'])
  for (const href of [
    'https://www.highlightschicago.com/',
    'https://www.highlightschicago.com/about-us',
    'https://www.highlightschicago.com/services',
    'https://www.highlightschicago.com/blog',
    'https://www.highlightschicago.com/learning-center',
    'https://www.highlightschicago.com/contact-us',
    'https://www.highlightschicago.com/our-team',
    'https://www.highlightschicago.com/testimonials',
    'https://www.highlightschicago.com/faq',
    'tel:7732623333',
    'mailto:info@highlightschicago.com',
  ]) expect(anchorHrefs(collection).includes(href), `Collection page is missing live destination ${href}`)
  expect((collection.match(/class="collection-card"/g) || []).length === source.page.length, 'Collection page does not render every Sanity service page')
  const cardImages = [...collection.matchAll(/data-card-image="([^"]+)"/g)].map((match) => match[1])
  expect(cardImages.length === source.page.length, 'Every collection card must have a cover image')
  expect(new Set(cardImages).size === source.page.length, 'Collection cards must use unique cover images')
  for (const image of cardImages) {
    expect(image.startsWith('/images/services/'), `Collection image is not local: ${image}`)
    const imagePath = path.resolve('public', image.slice(1))
    expect(fs.existsSync(imagePath), `Collection image file is missing: ${image}`)
    const imageBytes = fs.readFileSync(imagePath)
    expect(imageBytes.length > 10_000, `Collection image is unexpectedly small: ${image}`)
    expect(imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff, `Collection image is not a valid JPEG: ${image}`)
    const imageResponse = await fetch(`${baseUrl}${image}`)
    expect(imageResponse.status === 200, `Collection image returned ${imageResponse.status}: ${image}`)
    expect(imageResponse.headers.get('content-type')?.startsWith('image/jpeg'), `Collection image has an invalid content type: ${image}`)
    expect((await imageResponse.arrayBuffer()).byteLength === imageBytes.length, `Collection image response is incomplete: ${image}`)
  }
  await testDocument('/studio', [])

  for (const row of source.page) {
    const pathname = `/services/${row.equipment_slug}/${row.area_slug}`
    const service = serviceBySlug.get(row.equipment_slug)
    const area = areaBySlug.get(row.area_slug)
    const heading = `${service?.h1_prefix} in ${area?.name}`
    const text = await testDocument(pathname, [heading, 'id="quote"', 'id="reviews"', 'id="faq"', 'id="guides"'])
    expect((text.match(/class="collection-header"/g) || []).length === 1, `${pathname} does not render exactly one shared header`)
    expect((text.match(/class="collection-footer"/g) || []).length === 1, `${pathname} does not render exactly one shared footer`)
    const renderedText = visibleText(text)
    for (const href of anchorHrefs(text)) {
      expect(Boolean(href), `${pathname} contains an empty link`)
      if (href.startsWith('#')) expect(text.includes(`id="${href.slice(1)}"`), `${pathname} has a broken ${href} anchor`)
      else if (href.startsWith('tel:')) expect(/^tel:(?:\+\d{11,15}|\d{10})$/.test(href), `${pathname} has an invalid phone link ${href}`)
      else if (href.startsWith('mailto:')) expect(/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(href), `${pathname} has an invalid email link ${href}`)
      else if (/^https?:/.test(href)) expect(Boolean(new URL(href)), `${pathname} has an invalid external URL ${href}`)
      else expect(validServicePaths.has(href), `${pathname} has an invalid internal URL ${href}`)
    }
    for (const id of ['quote', 'working-in-area']) {
      expect(text.includes(`id="${id}"`), `${pathname} is missing the #${id} target`)
    }
    for (const sourceId of reviewIds(row.reviews)) {
      const expected = fullReviews[sourceId] ? visibleText(fullReviews[sourceId]).slice(0, 80) : ''
      expect(Boolean(expected && renderedText.includes(expected)), `${pathname} is missing full review ${sourceId}`)
    }
    expect((text.match(/class="rev-card"/g) || []).length === 4, `${pathname} does not render four review cards`)
    expect(text.includes('reviews-grid-equal'), `${pathname} does not use equal-height review cards`)
    expect(text.indexOf('class="rev-rating"') > text.indexOf('<blockquote>'), `${pathname} does not place the rating after review feedback`)
    expect(text.includes('class="brands-section"'), `${pathname} does not use the footer-colored brand section`)
    for (const brand of (service?.brands || '').split('||').filter(Boolean)) {
      const logoPath = brandLogoPath(brand)
      expect(text.includes(logoPath), `${pathname} is missing the ${brand} logo`)
      expect(fs.existsSync(path.resolve('public', logoPath.slice(1))), `Local brand logo is missing: ${logoPath}`)
    }
    expect(!text.includes('class="area-carousel"'), `${pathname} still renders the scrolling neighborhood carousel`)
    expect(text.indexOf('class="area-map"') < text.indexOf('class="area-grid"'), `${pathname} does not render the map before neighborhoods`)
    expect(renderedText.includes(`${service?.pricing_heading} in ${area?.name}?`), `${pathname} pricing heading is not a question`)
  }

  for (const [pathname, destination] of [
    ['/services/circuit-breaker', '/services/circuit-breaker-replacement/chicago'],
    ['/services/amperage-upgrade', '/services/electrical-panel-upgrade/chicago'],
  ]) {
    const response = await fetch(`${baseUrl}${pathname}`, {redirect: 'manual'})
    expect([307, 308].includes(response.status), `${pathname} did not redirect`)
    expect(response.headers.get('location') === destination, `${pathname} redirected to ${response.headers.get('location')}`)
  }

  const missing = await fetch(`${baseUrl}/services/not-a-service/chicago`, {redirect: 'manual'})
  expect(missing.status === 404, `Unknown service returned ${missing.status} instead of 404`)

  const invalidLead = await request('/api/lead', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({}),
  })
  expect(invalidLead.response.status === 400, `Invalid lead returned ${invalidLead.response.status}`)

  const honeypot = await request('/api/lead', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({website: 'bot.example'}),
  })
  expect(honeypot.response.status === 200, `Honeypot lead returned ${honeypot.response.status}`)

  const invalidWebhook = await request('/api/revalidate', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({documentType: 'servicePage'}),
  })
  expect(invalidWebhook.response.status === 401, `Unsigned revalidation returned ${invalidWebhook.response.status}`)

  if (failures.length) {
    console.error(`Smoke test failed with ${failures.length} failure(s):\n${failures.map((failure) => `- ${failure}`).join('\n')}`)
    process.exit(1)
  }

  console.log(`Smoke test passed: ${assertions} assertions across ${source.page.length} service pages.`)
}

run().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
