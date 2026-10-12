import type {Img, V2Area, V2Page} from '@/types/v2'
import {SERVICES_PATH} from '@/lib/service-urls'
import {isIllustrative, photoLabel} from './content'

/**
 * Photos for the Design System v3 blocks.
 *
 * Each block photo comes from the page's own optional image field in Sanity first.
 * When a field is empty, the reference build (Solar, playbook Part C) still gets its
 * photos from this map, every other page falls back to its own gallery photos, and
 * blocks with no honest photo render an icon tile instead of a borrowed stock image.
 */
/** `position` is a CSS object-position focal point for photos whose subject is off-centre. */
export type Photo = {src: string; alt: string; illustrative?: boolean; label?: string; credit?: string; position?: string}

export const focus = (photo?: Photo) => (photo?.position ? {objectPosition: photo.position} : undefined)

const asset = (file: string) => `${SERVICES_PATH}/images/v3/photos/${file}`
export const LOGO = `${SERVICES_PATH}/images/v3/logos/highlights-chicago-logo.webp`
export const LOGO_WHITE = `${SERVICES_PATH}/images/v3/logos/highlights-chicago-logo-white.webp`

const P = {
  heroRooftop: {src: asset('gen-hero-rooftop-install.webp'), alt: 'Electrician fitting rooftop solar panels on a brick two-flat with the Chicago skyline behind', illustrative: true},
  courtyardArray: {src: asset('gen-commercial-flat-roof-array.webp'), alt: 'Flat-roof solar array on a Chicago courtyard apartment building', illustrative: true},
  inverterDiagnosis: {src: asset('gen-inverter-diagnosis.webp'), alt: 'Electrician testing a solar inverter circuit with a multimeter', illustrative: true},
  microinverter: {src: asset('gen-microinverter-under-panel.webp'), alt: 'Microinverter mounted on the racking under a solar panel', illustrative: true},
  roofAssessment: {src: asset('gen-roof-site-assessment.webp'), alt: 'Electrician on a shingle roof recording a solar site assessment on a tablet', illustrative: true},
  stringInverter: {src: asset('gen-string-inverter-on-wall.webp'), alt: 'String inverter and disconnect on a whitewashed brick basement wall', illustrative: true},
  rooftopPortrait: {src: asset('solar-rooftop-install-portrait.webp'), alt: 'Installer fixing solar panels to a red metal roof', illustrative: true},
  battery: {src: asset('solar-battery-install.webp'), alt: 'Electrician installing a wall-mounted home battery beside a breaker panel', illustrative: true},
  thermal: {src: asset('home-energy-audit-thermal.webp'), alt: 'Energy auditor checking a breaker panel with a thermal camera', illustrative: true},
  // Wide banner with the panel a quarter of the way in: keep it in frame when cropped.
  panel: {src: asset('breaker-panel-wall.webp'), alt: 'Open residential breaker panel set into a plain wall', position: '6% 50%'},
  meters: {src: asset('meter-bank-brick.webp'), alt: 'Bank of electric meter sockets on a common brick wall'},
  van: {src: asset('van-chicago-skyline.webp'), alt: 'Highlights Chicago service van in front of the Chicago skyline at dusk'},
  techPanel: {src: asset('tech-panel-work.webp'), alt: 'Highlights Chicago electrician working in an open breaker panel', illustrative: true},
  techTesting: {src: asset('tech-panel-testing.webp'), alt: 'Highlights Chicago electrician testing a panel with a multimeter', illustrative: true},
  generator: {src: asset('standby-generator.webp'), alt: 'Air-cooled standby generator beside a brick wall'},
  livingRoom: {src: asset('lamp-lit-living-room.webp'), alt: 'Parent and child reading by lamp light in a living room', illustrative: true},
  transformers: {src: asset('pad-transformers.webp'), alt: 'Two pad-mounted transformers beside a brick building'},
} satisfies Record<string, Photo>

/** Shared photos used by the global blocks on every page. */
export const SHARED_PHOTOS = {van: P.van, techPanel: P.techPanel, techTesting: P.techTesting}

type PageVisuals = {
  hero?: Photo
  jobs?: Photo[]
  equipment?: Photo[]
  assessment?: Photo
  diagnose?: Photo
  orphan?: Photo
  reasons?: Photo
  reasonStats?: Array<{value: string; label: string}>
  gallery?: Photo[]
  category?: Photo
  drivers?: Photo
  handover?: Photo
  serviceGuide?: Photo
}

const PAGE_VISUALS: Record<string, PageVisuals> = {
  'solar-panel-installation': {
    hero: P.heroRooftop,
    jobs: [P.rooftopPortrait, P.panel, P.battery, P.inverterDiagnosis, P.courtyardArray],
    equipment: [P.rooftopPortrait, P.stringInverter, P.microinverter, P.battery, P.panel, P.meters],
    assessment: P.roofAssessment,
    diagnose: P.inverterDiagnosis,
    orphan: P.stringInverter,
    reasons: P.techPanel,
    // Copied from the page's own "Why" copy (allowed: no new numbers, playbook F.4).
    reasonStats: [
      {value: '4,033', label: 'permits in 24 months'},
      {value: '$18,992', label: 'median reported value'},
      {value: '527', label: 'permits through the Express Permit Program'},
    ],
    gallery: [
      {...P.rooftopPortrait, label: 'Illustrative photo of solar panel installation'},
      {...P.battery, label: 'Illustrative photo of solar battery installation'},
      {...P.thermal, label: 'Illustrative photo of home energy audit'},
      {...P.heroRooftop, label: 'Illustrative photo of rooftop solar on a brick two-flat'},
      {...P.courtyardArray, label: 'Illustrative photo of a flat-roof array on a courtyard building'},
    ],
    category: P.courtyardArray,
    drivers: P.roofAssessment,
    handover: P.stringInverter,
    serviceGuide: P.courtyardArray,
  },
}

/** Card photos for related-service links, keyed by the linked page's slug. */
const SERVICE_CARD_PHOTOS: Record<string, Photo> = {
  'generator-installation': P.generator,
  'generator-repair': P.techPanel,
  'ceiling-fan-installation': P.livingRoom,
  'whole-house-surge-protector': P.panel,
  'electrical-panel-upgrade': P.panel,
  'breaker-box-and-panel-repair': P.panel,
  'solar-panel-installation': P.rooftopPortrait,
  'solar-battery-installation': P.battery,
  'home-energy-audit': P.thermal,
}

export function serviceCardPhoto(url: string): Photo | undefined {
  const slug = url.replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop() || ''
  return SERVICE_CARD_PHOTOS[slug]
}

export function fromImg(image: Img | undefined, fallbackAlt: string): Photo | undefined {
  const src = image?.resolvedUrl || image?.externalUrl
  if (!src) return undefined
  const words = `${image?.caption || ''} ${image?.alt || ''}`
  return {src, alt: image?.alt?.trim() || fallbackAlt, illustrative: isIllustrative(words), label: image?.caption || undefined, credit: image?.credit}
}

export type ResolvedVisuals = Required<Pick<PageVisuals, 'jobs' | 'equipment' | 'reasonStats' | 'gallery'>> & Omit<PageVisuals, 'jobs' | 'equipment' | 'reasonStats' | 'gallery'> & {
  crew: Array<Photo & {label: string}>
  library: Array<Photo | undefined>
  /** Uploaded logo URLs by brand name (lower case), for brands without a built-in logo. */
  brandLogos: Record<string, string>
}

export function visualsFor(page: V2Page, area: V2Area): ResolvedVisuals {
  const mapped = PAGE_VISUALS[page.slug] || {}
  const alt = (what: string) => `${what}, ${page.name} in ${area.name}`
  // The page's own image fields win; the reference map fills only what they leave empty.
  const own: PageVisuals = {
    ...mapped,
    hero: fromImg(page.hero?.image, alt('Hero')) || mapped.hero,
    jobs: page.jobPaths?.items?.some((item) => item.image)
      ? page.jobPaths.items.map((item, index) => fromImg(item.image, alt(item.title)) || mapped.jobs?.[index]) as Photo[]
      : mapped.jobs,
    equipment: page.equipment?.items?.some((item) => item.image)
      ? page.equipment.items.map((item, index) => fromImg(item.image, alt(item.name)) || mapped.equipment?.[index]) as Photo[]
      : mapped.equipment,
    assessment: fromImg(page.assessment?.image, alt('Site assessment')) || mapped.assessment,
    diagnose: fromImg(page.diagnose?.image, alt('Diagnosis')) || mapped.diagnose,
    orphan: fromImg(page.diagnose?.orphanImage, alt('Repair')) || mapped.orphan,
    reasons: fromImg(page.why?.image, alt('Why Highlights')) || mapped.reasons,
    reasonStats: page.why?.stats?.length ? page.why.stats.map(({value, label}) => ({value, label})) : mapped.reasonStats,
    category: fromImg(page.otherServices?.featured?.image, alt('Service category')) || mapped.category,
    drivers: fromImg(page.pricing?.driversImage, alt('Cost drivers')) || mapped.drivers,
    handover: fromImg(page.included?.handoverImage, alt('Handover')) || mapped.handover,
    serviceGuide: fromImg(page.serviceGuide?.image, alt('Service guide')) || mapped.serviceGuide,
  }
  const pagePhotos = [...(page.gallery || []), ...(page.workingPhotos || [])]
    .map((image) => fromImg(image, `${page.name} in ${area.name}`))
    .filter((photo): photo is Photo => Boolean(photo))
    .filter((photo, index, all) => all.findIndex((other) => other.src === photo.src) === index)
  const crew = (page.gallery || [])
    .map((image) => {
      const photo = fromImg(image, `${page.name} in ${area.name}`)
      return photo && {...photo, label: photoLabel(image.caption || image.alt) || page.name}
    })
    .filter((photo): photo is Photo & {label: string} => Boolean(photo))
    .slice(0, 3)
  // Library headers: a neighbourhood photo per shared guide (credited), then the service photo.
  const areaPhotos = (area.subAreas || []).map((sub) => fromImg(sub.photo, `${sub.name}, ${area.name}`)).filter((photo): photo is Photo => Boolean(photo))
  const preferredOrder = ['Wicker Park', 'Uptown', 'Lincoln Square', 'Lakeview']
  const orderedArea = [
    ...preferredOrder.map((name) => (area.subAreas || []).find((sub) => sub.name === name)).map((sub) => sub && fromImg(sub.photo, `${sub.name}, ${area.name}`)).filter((photo): photo is Photo => Boolean(photo)),
    ...areaPhotos,
  ]
  const library = (area.sharedGuides || []).map((guide, index) => fromImg(guide.image, `${guide.title}, ${area.name}`) || orderedArea[index])
  if (page.serviceGuide?.title) library.push(own.serviceGuide || own.hero || pagePhotos[0])
  const brandLogos = Object.fromEntries(
    (page.brands?.logos || [])
      .map((entry) => [entry.brand.trim().toLowerCase(), entry.logo?.resolvedUrl || entry.logo?.externalUrl] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1])),
  )

  return {
    ...own,
    hero: own.hero || pagePhotos[0],
    jobs: own.jobs || [],
    equipment: own.equipment || [],
    reasonStats: own.reasonStats || [],
    gallery: own.gallery || pagePhotos,
    crew,
    library,
    brandLogos,
  }
}
