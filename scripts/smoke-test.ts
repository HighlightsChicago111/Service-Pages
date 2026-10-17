import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'
import {chooseServiceHeading, clusterForService, clusterTitle, serviceClusters} from '../src/lib/clusters'
import {PRIMARY_AREA_SLUG, clusterPagePath, servicePagePath} from '../src/lib/service-urls'

// Expected content comes from the live Sanity dataset (the source of truth once
// pages are published), not data/source-content.json, which only seeded the
// first import and does not include pages added later in the Studio.
type SanityPage = {
  serviceSlug: string
  areaSlug: string
  parentName?: string
  monthlySearchVolume?: number
  h1Prefix?: string
  brands?: string[]
  whyCount?: number
  pricingHeading?: string
  areaName?: string
  subAreaCount?: number
  reviewQuotes?: string[]
}

// A published new-design page (v2ServicePage) takes over its URL from the current page.
type NewDesignPage = {
  serviceSlug: string
  areaSlug: string
  parentName?: string
  monthlySearchVolume?: number
  name?: string
  h1Prefix?: string
  areaName?: string
  optionPhotoCount?: number
}

const baseUrl = (process.argv[2] || process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const sanity = createClient({
  projectId: process.env.NEXT_SANITY_PROJECT_ID || '5w5623jq',
  dataset: process.env.NEXT_SANITY_DATASET || 'production',
  apiVersion: '2026-03-01',
  useCdn: false,
  perspective: 'published',
})
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

function brandLogoPath(brand: string) {
  const slug = brand
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `/services/images/brands/${slug}.png`
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

function headingTexts(html: string) {
  return [...html.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map((match) => visibleText(match[1]).trim())
}

function imageAlts(html: string) {
  return [...html.matchAll(/<img\b[^>]*\balt="([^"]*)"/gi)].map((match) => match[1].trim())
}

async function testDocument(pathname: string, requiredText: string[]) {
  const {response, text} = await request(pathname)
  expect(response.status === 200, `${pathname} returned ${response.status}`)
  expect(!/This page couldn.t load|Application error|Internal Server Error/i.test(text), `${pathname} rendered an error page`)
  for (const value of requiredText) expect(text.includes(value), `${pathname} is missing ${JSON.stringify(value)}`)
  // Every page header: "Services" is a plain link to the /services collection page, with no dropdown.
  const primaryNav = text.match(/<nav class="(?:hc|ds)-nav-links" aria-label="Primary navigation">([\s\S]*?)<\/nav>/)?.[1]
  if (primaryNav) {
    expect(/<a [^>]*href="\/services"[^>]*>Services<\/a>/.test(primaryNav), `${pathname} header does not link Services to /services`)
    expect(!/<svg|<details|<ul/.test(primaryNav), `${pathname} header still has a dropdown in the primary navigation`)
  }
  return text
}

async function run() {
  const {pages, newDesignPages, googleReviewCount} = await sanity.fetch<{pages: SanityPage[]; newDesignPages: NewDesignPage[]; googleReviewCount?: number}>(`{
    "pages": *[_type == "servicePage" && defined(service->slug.current) && defined(area->slug.current)] {
      "serviceSlug": service->slug.current,
      "areaSlug": area->slug.current,
      "parentName": service->parentName,
      "monthlySearchVolume": service->monthlySearchVolume,
      "h1Prefix": service->h1Prefix,
      "brands": service->brands,
      "whyCount": count(service->whyItems),
      "pricingHeading": service->pricing.heading,
      "areaName": area->name,
      "subAreaCount": count(area->subAreas),
      "reviewQuotes": reviews[].quote
    },
    "newDesignPages": *[_type == "v2ServicePage" && defined(slug.current) && defined(area->slug.current) && defined(*[_id == "v2-siteSettings"][0]._id)] {
      "serviceSlug": slug.current,
      "areaSlug": area->slug.current,
      parentName,
      monthlySearchVolume,
      name,
      "h1Prefix": hero.h1Prefix,
      "areaName": area->name,
      "optionPhotoCount": count(equipment.options.items[defined(image.image.asset) || defined(image.externalUrl)])
    },
    "googleReviewCount": *[_id == "siteSettings"][0].google.reviewCount
  }`)
  expect(pages.length > 0, 'Sanity returned no publishable service pages')
  const newDesign = newDesignPages.filter((page) => page.areaSlug === PRIMARY_AREA_SLUG)
  const newDesignSlugs = new Set(newDesign.map((page) => page.serviceSlug))
  // Current-design pages whose URL has not been taken over by a new-design page.
  const servicePages = pages.filter((page) => page.areaSlug === PRIMARY_AREA_SLUG && !newDesignSlugs.has(page.serviceSlug))
  const allPages: Array<{serviceSlug: string; parentName?: string; monthlySearchVolume?: number}> = [...servicePages, ...newDesign]
  const pagePath = (page: {serviceSlug: string; parentName?: string}) => servicePagePath(page.serviceSlug, page.parentName)
  // Service groups shown on /services: every cluster with at least one published service,
  // the workbook's services first, then pages that joined by their Sanity cluster name.
  const groups = serviceClusters
    .map((cluster) => {
      const listed = cluster.services.map((slug) => allPages.find((page) => page.serviceSlug === slug)).filter((page) => page !== undefined)
      const added = allPages
        .filter((page) => !cluster.services.includes(page.serviceSlug) && clusterForService(page.serviceSlug, page.parentName)?.slug === cluster.slug)
        .sort((left, right) => (right.monthlySearchVolume || 0) - (left.monthlySearchVolume || 0))
      return {cluster, services: [...listed, ...added]}
    })
    .filter((group) => group.services.length > 0)
  const validServicePaths = new Set([
    '/services',
    ...groups.map(({cluster}) => clusterPagePath(cluster.slug)),
    ...allPages.map(pagePath),
  ])

  const collection = await testDocument('/services', ['Electrical services built around Chicago', 'Choose a service'])
  for (const href of [
    'https://www.highlightschicago.com/',
    'https://www.highlightschicago.com/about-us',
    '/services',
    'https://www.highlightschicago.com/service-areas',
    'https://www.highlightschicago.com/blog',
    'https://www.highlightschicago.com/learning-center',
    'https://www.highlightschicago.com/contact-us',
    'https://www.highlightschicago.com/our-team',
    'https://www.highlightschicago.com/testimonials',
    'https://www.highlightschicago.com/faq',
    'tel:773-262-3333',
    'mailto:info@highlightschicago.com',
  ]) expect(anchorHrefs(collection).includes(href), `Collection page is missing live destination ${href}`)
  expect(collection.includes('class="hc-footer-form"'), 'Collection page is missing the footer quote form')
  expect(collection.includes('served the Chicagoland area for over 12 years'), 'Collection footer is missing the live company summary')
  expect(collection.includes('class="hc-utility"'), 'Collection page is missing the utility bar')
  expect(collection.includes('6a3c3c20491b43b0858c1876_highlights-chicago-logo.webp'), 'Collection page is not using the exact live header logo')
  expect(collection.includes('class="hc-footer-title"'), 'Collection footer is missing the single-line quote heading')
  expect((collection.match(/aria-label="Highlights Chicago on (?:Facebook|X)"/g) || []).length === 2, 'Collection footer does not render both social icons')
  expect(collection.includes('class="collection-hero collection-hero--photo"'), 'Collection page is missing the photo hero')
  expect((collection.match(/class="collection-card-volume collection-card-explore">Explore services/g) || []).length === groups.length, 'Every service group block must end in "Explore services" with its arrow')
  expect((collection.match(/class="collection-card"/g) || []).length === groups.length, 'Collection page does not render one block per service group')
  for (const {cluster, services} of groups) {
    expect(anchorHrefs(collection).includes(clusterPagePath(cluster.slug)), `Collection page does not link to the ${cluster.name} group`)
    expect(visibleText(collection).includes(`${services.length} service${services.length === 1 ? '' : 's'} ${cluster.name}`), `Collection page does not show the ${cluster.name} service count`)
  }
  const collectionAlts = imageAlts(collection)
  expect(collectionAlts.length >= groups.length + 3, 'Collection page does not expose its card and chrome imagery as crawlable img elements')
  expect(collectionAlts.every(Boolean), 'Collection page contains an image without alt text')
  expect(collection.includes('alt="Electrical panel upgrade service by Highlights Chicago"'), 'Collection hero image is missing descriptive alt text')
  const cardImages = [...collection.matchAll(/data-card-image="([^"]+)"/g)].map((match) => match[1].replace(/&amp;/g, '&'))
  expect(cardImages.length === groups.length, 'Every service group block must have a cover image')
  expect(new Set(cardImages).size === groups.length, 'Service group blocks must use unique cover images')
  for (const image of cardImages) {
    // Covers are either bundled with the app or, for services added in the Studio, hosted on the Sanity CDN.
    if (image.startsWith('https://cdn.sanity.io/')) {
      const imageResponse = await fetch(image)
      expect(imageResponse.status === 200, `Collection image returned ${imageResponse.status}: ${image}`)
      expect(imageResponse.headers.get('content-type')?.startsWith('image/'), `Collection image has an invalid content type: ${image}`)
      continue
    }
    expect(image.startsWith('/services/images/services/'), `Collection image is neither local nor on the Sanity CDN: ${image}`)
    if (!image.startsWith('/services/images/services/')) continue
    const imagePath = path.resolve('public', image.replace('/services/', ''))
    expect(fs.existsSync(imagePath), `Collection image file is missing: ${image}`)
    const imageBytes = fs.readFileSync(imagePath)
    expect(imageBytes.length > 10_000, `Collection image is unexpectedly small: ${image}`)
    expect(imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff, `Collection image is not a valid JPEG: ${image}`)
    const imageResponse = await fetch(`${baseUrl}${image}`)
    expect(imageResponse.status === 200, `Collection image returned ${imageResponse.status}: ${image}`)
    expect(imageResponse.headers.get('content-type')?.startsWith('image/jpeg'), `Collection image has an invalid content type: ${image}`)
    expect((await imageResponse.arrayBuffer()).byteLength === imageBytes.length, `Collection image response is incomplete: ${image}`)
  }
  await testDocument('/services/studio', [])

  for (const {cluster, services} of groups) {
    const pathname = clusterPagePath(cluster.slug)
    const text = await testDocument(pathname, [clusterTitle(cluster), chooseServiceHeading(cluster)])
    const cardHrefs = [...text.matchAll(/<a class="collection-card"[^>]*href="([^"]+)"/g)].map((match) => match[1])
    expect(text.includes('class="collection-hero collection-hero--photo"') && text.includes('class="collection-hero-bg"'), `${pathname} is missing the photo hero`)
    expect(/<nav class="hierarchy-crumbs"[^>]*><ol><li><a href="https:\/\/www\.highlightschicago\.com">Home<\/a><\/li><li><a href="\/services">Services<\/a>/.test(text), `${pathname} breadcrumb does not link Services to /services`)
    expect((text.match(/class="collection-card-volume collection-card-explore">View service/g) || []).length === services.length, `${pathname} cards must end in "View service" with its arrow`)
    expect(JSON.stringify(cardHrefs) === JSON.stringify(services.map(pagePath)), `${pathname} does not list its services in order: ${cardHrefs.join(', ')}`)
    expect(imageAlts(text).every(Boolean), `${pathname} contains an image without alt text`)
    expect(!/content plan|cluster|keyword/i.test(visibleText(text)), `${pathname} shows internal planning wording`)
    for (const href of anchorHrefs(text).filter((value) => value.startsWith('/'))) {
      expect(validServicePaths.has(href), `${pathname} has an invalid internal URL ${href}`)
    }
  }
  expect((await fetch(`${baseUrl}/services/emergency-electrical`, {redirect: 'manual'})).status === 404, 'A service group without published services must not be published')

  for (const page of newDesign) {
    const pathname = pagePath(page)
    const group = clusterForService(page.serviceSlug, page.parentName)
    const text = await testDocument(pathname, [`${page.h1Prefix} in ${page.areaName}`, 'id="quote"'])
    expect(Boolean(group), `${pathname} has no service group: its Sanity cluster name "${page.parentName}" matches none in data/cluster-hierarchy.json`)
    if (group) expect(text.includes(`<a href="${clusterPagePath(group.slug)}">${group.name}</a>`), `${pathname} breadcrumb does not link to its ${group.name} group`)
    expect(!text.includes('ds-nav-menu'), `${pathname} still renders the Services dropdown`)
    expect(text.includes('<a class="ds-nav-current" href="/services">Services</a>'), `${pathname} navbar Services does not link to /services`)
    expect((text.match(/class="ds-photo ds-option-media"/g) || []).length === (page.optionPhotoCount || 0), `${pathname} does not show every option photo set in Sanity`)
    for (const legacy of [`/services/${page.serviceSlug}`, `/services/${page.serviceSlug}/${PRIMARY_AREA_SLUG}`].filter((value) => value !== pathname)) {
      const response = await fetch(`${baseUrl}${legacy}`, {redirect: 'manual'})
      const location = response.headers.get('location')
      expect(response.status === 308 && location && new URL(location, baseUrl).pathname === pathname, `${legacy} should permanently redirect to ${pathname}, got ${response.status} ${location}`)
    }
    for (const href of anchorHrefs(text).filter((value) => value.startsWith('/') && !value.startsWith('/services/images/'))) {
      expect(validServicePaths.has(href.replace(/[?#].*$/, '')), `${pathname} has an invalid internal URL ${href}`)
    }
  }

  for (const page of servicePages) {
    const pathname = servicePagePath(page.serviceSlug, page.parentName)
    const group = clusterForService(page.serviceSlug, page.parentName)
    const heading = `${page.h1Prefix} in ${page.areaName}`
    const text = await testDocument(pathname, [heading, 'id="quote"', 'id="reviews"', 'id="faq"', 'id="guides"'])
    if (group) expect(text.includes(`<a href="${clusterPagePath(group.slug)}">${group.name}</a>`), `${pathname} breadcrumb does not link to its ${group.name} group`)
    for (const legacy of [`/services/${page.serviceSlug}`, `/services/${page.serviceSlug}/${PRIMARY_AREA_SLUG}`].filter((value) => value !== pathname)) {
      const response = await fetch(`${baseUrl}${legacy}`, {redirect: 'manual'})
      const location = response.headers.get('location')
      expect(response.status === 308 && location && new URL(location, baseUrl).pathname === pathname, `${legacy} should permanently redirect to ${pathname}, got ${response.status} ${location}`)
    }
    const serviceImageAlts = imageAlts(text)
    expect(serviceImageAlts.length >= 10, `${pathname} does not expose its service photos as crawlable img elements`)
    expect(serviceImageAlts.every(Boolean), `${pathname} contains an image without alt text`)
    expect(!serviceImageAlts.some((alt) => /^[a-z0-9-]+ (?:project|work in [a-z0-9-]+) \d+$/i.test(alt)), `${pathname} still exposes imported placeholder alt text`)
    expect(text.includes('<figcaption>'), `${pathname} does not render captions for completed-work photos`)
    expect((text.match(/class="hc-nav"/g) || []).length === 1, `${pathname} does not render exactly one shared header`)
    expect((text.match(/class="hc hc-footer"/g) || []).length === 1, `${pathname} does not render exactly one shared footer`)
    expect((text.match(/class="hc-utility"/g) || []).length === 1, `${pathname} does not render exactly one utility bar`)
    const renderedText = visibleText(text)
    for (const pageHeading of headingTexts(text).filter((value) => /^(what|why|who)\b/i.test(value))) {
      expect(pageHeading.endsWith('?'), `${pathname} question heading is missing ?: ${pageHeading}`)
    }
    for (const href of anchorHrefs(text)) {
      expect(Boolean(href), `${pathname} contains an empty link`)
      if (href.startsWith('#')) expect(text.includes(`id="${href.slice(1)}"`), `${pathname} has a broken ${href} anchor`)
      else if (href.startsWith('tel:')) expect(/^\+?\d{10,15}$/.test(href.slice(4).replace(/[^+\d]/g, '')), `${pathname} has an invalid phone link ${href}`)
      else if (href.startsWith('mailto:')) expect(/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(href), `${pathname} has an invalid email link ${href}`)
      else if (/^https?:/.test(href)) expect(Boolean(new URL(href)), `${pathname} has an invalid external URL ${href}`)
      else expect(validServicePaths.has(href), `${pathname} has an invalid internal URL ${href}`)
    }
    for (const id of ['quote', 'working-in-area']) {
      expect(text.includes(`id="${id}"`), `${pathname} is missing the #${id} target`)
    }
    const reviewQuotes = page.reviewQuotes || []
    expect(reviewQuotes.length === 4, `${pathname} should have four reviews in Sanity, found ${reviewQuotes.length}`)
    for (const [index, quote] of reviewQuotes.entries()) {
      const expected = visibleText(quote || '').trim().slice(0, 80)
      expect(Boolean(expected && renderedText.includes(expected)), `${pathname} is missing the full text of review ${index + 1}`)
    }
    expect((text.match(/class="rev-card"/g) || []).length === reviewQuotes.length, `${pathname} does not render every review card`)
    expect(text.includes('reviews-grid-equal'), `${pathname} does not use equal-height review cards`)
    expect(!text.includes('class="rev-head"'), `${pathname} still renders the duplicate aggregate rating above reviews`)
    expect(text.indexOf('class="rev-rating"') > text.indexOf('<blockquote>'), `${pathname} does not place the rating after review feedback`)
    expect(text.includes('class="brands-section"'), `${pathname} does not use the footer-colored brand section`)
    expect(text.includes('class="brand-strip"'), `${pathname} does not use the shared horizontal brand marquee`)
    expect((text.match(/class="brand-sequence"/g) || []).length === 2, `${pathname} does not render two seamless brand-marquee sequences`)
    expect(text.includes('class="trust-cell google-proof-cell"'), `${pathname} is missing the normalized Google proof rating`)
    expect(text.indexOf('>A+</b>') < text.indexOf('class="trust-cell google-proof-cell"'), `${pathname} does not place A+ before the final Google proof cell`)
    expect(text.indexOf('class="trust-cell google-proof-cell"') > text.lastIndexOf('class="trust-cell"'), `${pathname} does not render Google proof as the fifth trust cell`)
    expect(!text.includes('class="static-stars"'), `${pathname} still renders a duplicate row of Google stars`)
    expect(!text.includes('class="fill"'), `${pathname} still renders an overlapping duplicate star layer`)
    for (const brand of page.brands || []) {
      const logoPath = brandLogoPath(brand)
      const logoSlug = logoPath.slice('/services/images/brands/'.length, -'.png'.length)
      expect(text.includes(logoPath), `${pathname} is missing the ${brand} logo`)
      expect(text.includes(`brand-mark--${logoSlug}`), `${pathname} is missing the ${brand} logo class`)
      expect(fs.existsSync(path.resolve('public', logoPath.replace('/services/', ''))), `Local brand logo is missing: ${logoPath}`)
    }
    const whySection = text.match(/<section class="wrap" id="why-us">([\s\S]*?)<\/section>/)?.[1] || ''
    expect((whySection.match(/<article class="why-item"/g) || []).length === page.whyCount, `${pathname} does not render every why-us item as always-visible content`)
    expect(!whySection.includes('<details') && !whySection.includes('why-chevron'), `${pathname} still renders mobile why-us accordion controls`)
    expect(renderedText.includes(`Read all ${googleReviewCount} reviews`), `${pathname} does not include the live review count in the all-reviews CTA`)
    expect(text.indexOf('class="cs-gallery-rail"') < text.indexOf('class="cs-gallery-head"'), `${pathname} does not place the crew gallery caption below its images`)
    expect(renderedText.includes(`Our Works in ${page.areaName}`), `${pathname} does not use the updated work-section heading`)
    expect(text.includes('class="single-line-mobile"'), `${pathname} does not mark the coverage heading as mobile single-line`)
    expect(text.includes('area-rail-single-row'), `${pathname} does not render the single-row horizontal location rail`)
    expect(!text.includes('class="area-grid"'), `${pathname} still renders locations as a wrapping grid`)
    expect(text.indexOf('class="area-map"') < text.indexOf('area-rail-single-row'), `${pathname} does not render the map before the location rail`)
    expect((text.match(/class="area-chip"/g) || []).length === page.subAreaCount, `${pathname} does not render every location in the rail`)
    expect(text.includes('scroll horizontally to view all columns'), `${pathname} does not expose its mobile pricing table as horizontally scrollable`)
    const faqSection = text.match(/<section class="wrap" id="faq">([\s\S]*?)<\/section>/)?.[1] || ''
    expect((faqSection.match(/class="faq-chevron"/g) || []).length === (faqSection.match(/<details\b/g) || []).length, `${pathname} does not render one FAQ chevron per question`)
    expect(text.includes('class="wrap closing-cta-section"'), `${pathname} is missing the compact closing-CTA spacing hook`)
    expect(text.includes('class="cta-heading"'), `${pathname} does not mark the closing CTA heading for responsive sizing`)
    expect(text.includes('class="section-tint library-section"'), `${pathname} does not use shared library section spacing`)
    expect(text.includes('class="hc-footer-form"'), `${pathname} is missing the footer quote form`)
    expect(renderedText.includes(`${page.pricingHeading} in ${page.areaName}?`), `${pathname} pricing heading is not a question`)
  }

  for (const [pathname, destination] of [
    ['/services/circuit-breaker', servicePagePath('circuit-breaker-replacement')],
    ['/services/amperage-upgrade', servicePagePath('electrical-panel-upgrade')],
    ['/services/generators', servicePagePath('generator-installation')],
  ]) {
    const response = await fetch(`${baseUrl}${pathname}`, {redirect: 'manual'})
    expect([307, 308].includes(response.status), `${pathname} did not redirect`)
    // Hosts differ in returning a relative or an absolute Location, so compare the resolved path.
    const location = response.headers.get('location')
    expect(location && new URL(location, baseUrl).pathname === destination, `${pathname} redirected to ${location}`)
  }

  const missing = await fetch(`${baseUrl}/services/not-a-service`, {redirect: 'manual'})
  expect(missing.status === 404, `Unknown service returned ${missing.status} instead of 404`)

  const invalidLead = await request('/services/api/lead', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({}),
  })
  expect(invalidLead.response.status === 400, `Invalid lead returned ${invalidLead.response.status}`)

  const honeypot = await request('/services/api/lead', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({website: 'bot.example'}),
  })
  expect(honeypot.response.status === 200, `Honeypot lead returned ${honeypot.response.status}`)

  const invalidWebhook = await request('/services/api/revalidate', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({documentType: 'servicePage'}),
  })
  expect(invalidWebhook.response.status === 401, `Unsigned revalidation returned ${invalidWebhook.response.status}`)

  if (failures.length) {
    console.error(`Smoke test failed with ${failures.length} failure(s):\n${failures.map((failure) => `- ${failure}`).join('\n')}`)
    process.exit(1)
  }

  console.log(`Smoke test passed: ${assertions} assertions across ${groups.length} service groups, ${servicePages.length} current-design and ${newDesign.length} new-design service pages.`)
}

run().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
