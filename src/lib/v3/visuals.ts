import type {Img, V2Area, V2Page} from '@/types/v2'
import {SERVICES_PATH} from '@/lib/service-urls'
import {isIllustrative, photoLabel} from './content'
import {backupOf} from '@/components/v3/diagrams'
import {YELP_STAND_INS} from './yelp-stand-ins'

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

/**
 * Where the subject sits in photos whose subject is off-centre, so a card crop keeps it
 * in view on every page that uses the file. Keyed by file name: a site photo's name, or
 * an uploaded photo's Sanity file name (the same file always uploads to the same name).
 * Checked by eye against 4:3 and 16:10 crops. A hotspot set in the Studio wins.
 */
const FOCAL_POINTS: Record<string, string> = {
  'breaker-panel-wall.webp': '5% 50%',
  'lamp-lit-living-room.webp': '92% 50%',
  'meter-bank-brick.webp': '70% 50%',
  'pad-transformers.webp': '55% 50%',
  'solar-rooftop-install-portrait.webp': '50% 75%',
  'standby-generator.webp': '62% 50%',
  'tech-panel-testing.webp': '50% 35%',
  'circuit-breaker-replacement.jpg': '50% 65%',
  'electrical-repair.jpg': '50% 45%',
  'garbage-disposal-wiring.jpg': '50% 75%',
  'gfci-outlet-installation.jpg': '50% 60%',
  'solar-panel-installation.jpg': '50% 75%',
  'whole-house-surge-protector.jpg': '50% 70%',
  // Yelp job photos: a downrod fan near the top, a ceiling track near the top.
  '901c637a20efa6d7e6a89fb6ff6ac3e806764e6e-750x1000.jpg': '50% 28%',
  '014b76bda20dc437ef11bfee63f4cd5ba34c97e2-750x1000.jpg': '50% 25%',
}

const fileName = (src: string) => src.replace(/[?#].*$/, '').split('/').pop() || ''

/** The focal point for a photo: its Studio hotspot, else the registered one for its file. */
export function focalPoint(src: string, image?: Img): string | undefined {
  const hotspot = image?.image?.hotspot
  if (typeof hotspot?.x === 'number' && typeof hotspot?.y === 'number') return `${Math.round(hotspot.x * 100)}% ${Math.round(hotspot.y * 100)}%`
  return FOCAL_POINTS[fileName(src)]
}

export const focus = (photo?: Photo) => {
  const position = photo && (photo.position || focalPoint(photo.src))
  return position ? {objectPosition: position} : undefined
}

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
  panel: {src: asset('breaker-panel-wall.webp'), alt: 'Open residential breaker panel set into a plain wall'},
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
  return {src, alt: image?.alt?.trim() || fallbackAlt, illustrative: isIllustrative(words), label: image?.caption || undefined, credit: image?.credit, position: focalPoint(src, image)}
}

const servicePhoto = (file: string) => `${SERVICES_PATH}/images/services/${file}`

/**
 * Photos an option card or equipment tile may borrow when the page sets none, each with
 * the words it suits: Highlights' own Yelp job photos first, then illustrative site
 * photos. A card takes the first match the page does not already show, so no photo
 * appears twice on a page. Photos of European hardware and off-topic scenes are left out.
 */
const standIn = (file: string, alt: string): Photo => ({src: servicePhoto(file), alt, illustrative: true})
const SERVICE_PHOTOS = {
  panelRepair: standIn('breaker-box-and-panel-repair.jpg', 'Electrician testing an open breaker panel with a multimeter'),
  troubleshooting: standIn('electrical-troubleshooting.jpg', 'Electrician testing wires at an open wall box with a multimeter'),
  roughIn: standIn('electrical-installation-services.jpg', 'Electrician fixing boxes to the studs of an open wall'),
  conduit: standIn('electrical-wiring-and-repair-services.jpg', 'Electrician running conduit along a brick wall'),
  outlet: standIn('electrical-outlet-installation.jpg', 'Electrician wiring a wall outlet'),
  lightSwitch: standIn('light-switch-replacement-and-installation.jpg', 'Electrician fitting a light switch into a wall box'),
  ceilingFan: standIn('ceiling-fan-installation.jpg', 'Bedroom with a ceiling fan over the bed'),
  mediaPanel: standIn('low-voltage-wiring-installation.jpg', 'Technician wiring a structured media panel beside a smart-home keypad'),
  networkRack: standIn('structured-cabling-installation.jpg', 'Technician connecting network cables at a patch panel in a rack'),
  alarmPanel: standIn('fire-alarm-installation.jpg', 'Technician testing a wall-mounted alarm panel in a corridor'),
  kitchenPanel: standIn('energy-star-appliances.jpg', 'Electrician working at an open panel beside a kitchen'),
  thermalScan: standIn('home-energy-audit.jpg', 'Technician scanning a breaker panel with a thermal camera'),
  recessed: standIn('recessed-lighting-installation.jpg', 'Electrician fitting recessed lights in a kitchen ceiling'),
  pendant: standIn('light-fixture-installation-and-replacement.jpg', 'Electrician hanging a pendant light over a dining table'),
  camera: standIn('cctv-installation.jpg', 'Technician mounting a security camera above a storefront door'),
  evCharger: standIn('tesla-and-ev-charger-installation.jpg', 'Electrician mounting an EV charger on a garage wall'),
  sink: standIn('garbage-disposal-wiring.jpg', 'Kitchen sink with a disposal below the counter'),
}
const SP = SERVICE_PHOTOS
const STAND_INS: Array<{photo: Photo; suits: RegExp; titleOnly?: boolean}> = [
  ...YELP_STAND_INS,
  {photo: P.battery, suits: /\bbatter(y|ies)\b|storage/i, titleOnly: true},
  {photo: P.generator, suits: /generator|standby/i, titleOnly: true},
  {photo: P.inverterDiagnosis, suits: /inverter|same model|failed part|fault|repair in place/i},
  {photo: P.stringInverter, suits: /inverter|compatible model|disconnect|shut ?off/i, titleOnly: true},
  {photo: P.microinverter, suits: /micro-?inverter|optimi[sz]er|change of type/i, titleOnly: true},
  {photo: P.rooftopPortrait, suits: /add(ing)? panels|more panels|array|solar panel/i, titleOnly: true},
  {photo: P.courtyardArray, suits: /add(ing)? panels|more panels|array|flat roof|commercial roof/i, titleOnly: true},
  {photo: P.heroRooftop, suits: /add(ing)? panels|more panels|array|rooftop/i, titleOnly: true},
  {photo: P.roofAssessment, suits: /assessment|site visit|roof/i, titleOnly: true},
  {photo: P.meters, suits: /\bmeters?\b|service upgrade|service entrance|at the service|utility (work|side)|comed/i},
  {photo: P.transformers, suits: /utility (work|side|transformer)|transformer/i},
  {photo: P.panel, suits: /\bpanel\b|breaker|own circuit|dedicated circuit|panel swap/i},
  {photo: P.techPanel, suits: /repair|swap|replace the switch|\bpanel\b|breaker/i},
  {photo: P.techTesting, suits: /test|troubleshoot|diagnos|repair in place/i},
  {photo: P.thermal, suits: /thermal|inspection|scan/i},
  {photo: P.livingRoom, suits: /in the room|living room|lamp/i, titleOnly: true},
  {photo: SP.panelRepair, suits: /\bpanel\b|breaker|own circuit|dedicated|repair/i},
  {photo: SP.troubleshooting, suits: /test|troubleshoot|fault|failed|repair/i},
  {photo: SP.roughIn, suits: /rewire|true 3-way|new circuit|own circuit|rough-in|run(ning)? (a )?(new )?(wire|cable)/i},
  {photo: SP.conduit, suits: /conduit|lines enter|cable and phone|wiring/i},
  {photo: SP.outlet, suits: /outlet|receptacle|plug|at the equipment|point of use|gfci|easy to see|reset/i},
  {photo: SP.lightSwitch, suits: /(wall|light|dimmer|smart) switch|switches|dimmer|wall control|companion|3-way|smart main|wireless remote/i},
  {photo: SP.ceilingFan, suits: /\bfan\b|pull chain|receiver/i},
  {photo: SP.mediaPanel, suits: /closet|utility room|low voltage|smart|wireless|keypad|data|phone|cable/i},
  {photo: SP.networkRack, suits: /rack|network|data|cable|closet|basement|equipment room/i},
  {photo: SP.alarmPanel, suits: /alarm|second line|backup|defen[cs]e/i},
  {photo: SP.kitchenPanel, suits: /appliance|kitchen|dedicated|circuit/i},
  {photo: SP.thermalScan, suits: /thermal|inspection|audit|scan/i},
  {photo: SP.recessed, suits: /recessed|\bled\b|ceiling light|fixture/i, titleOnly: true},
  {photo: SP.pendant, suits: /pendant|fixture|chandelier|\blights?\b/i, titleOnly: true},
  {photo: SP.camera, suits: /camera|cctv|security/i, titleOnly: true},
  {photo: SP.evCharger, suits: /\bev\b|charger|garage/i, titleOnly: true},
  {photo: SP.sink, suits: /sink|disposal|dishwasher/i, titleOnly: true},
]

/** When no stand-in suits a card: general electrical work, in this order. */
const GENERAL_STAND_INS = [P.techPanel, P.techTesting, SP.panelRepair, SP.roughIn, SP.troubleshooting, SP.conduit, SP.kitchenPanel, SP.thermalScan]

/** Same picture, two files: one stands for the other when checking repeats. */
const SAME_PICTURE: Record<string, string> = {
  'solar-battery-installation.jpg': 'solar-battery-install.webp',
  'solar-panel-installation.jpg': 'solar-rooftop-install-portrait.webp',
}
const pictureKey = (src: string) => SAME_PICTURE[fileName(src)] || fileName(src)

/**
 * The stand-in that best suits a card and is not on the page yet; it is then marked as
 * shown. The title is matched first, then the title with the text, then general work.
 * A photo of one specific thing (a battery, a generator, a solar array) is matched on
 * the title only, so a passing mention in the text never brings it in.
 * Undefined only when the page already shows every general photo (the card keeps its icon).
 */
function standInFor(title: string, text: string | undefined, shown: Set<string>): Photo | undefined {
  const free = (photo: Photo) => !shown.has(pictureKey(photo.src))
  const suiting = (words: string, titlePass: boolean) => STAND_INS.find(({photo, suits, titleOnly}) => (titlePass || !titleOnly) && suits.test(words) && free(photo))?.photo
  const photo = suiting(title, true) || suiting(`${title} ${text || ''}`, false) || GENERAL_STAND_INS.find(free)
  if (photo) shown.add(pictureKey(photo.src))
  return photo
}

/** A related-service card's photo: the card's own, else the linked service's card photo. */
export const relatedCardPhoto = (service: {image?: Img; url: string; name: string}) => fromImg(service.image, service.name) || serviceCardPhoto(service.url)

export type ResolvedVisuals = Required<Pick<PageVisuals, 'jobs' | 'equipment' | 'reasonStats' | 'gallery'>> & Omit<PageVisuals, 'jobs' | 'equipment' | 'reasonStats' | 'gallery'> & {
  /** One per option card; undefined where the card draws its diagram. */
  options: Array<Photo | undefined>
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
    // Once the page sets its own tile photos, a tile without one shows its icon: the
    // reference map is matched by position, so its photo would belong to another tile.
    equipment: page.equipment?.items?.some((item) => item.image)
      ? page.equipment.items.map((item) => fromImg(item.image, alt(item.name))) as Photo[]
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
    // A page with its own photos shows them in "Our works", never the reference page's set.
    gallery: page.workingPhotos?.length || page.gallery?.length ? undefined : mapped.gallery,
  }
  const toPhotos = (images: Img[]) => images
    .map((image) => fromImg(image, `${page.name} in ${area.name}`))
    .filter((photo): photo is Photo => Boolean(photo))
    .filter((photo, index, all) => all.findIndex((other) => other.src === photo.src) === index)
  // Hero photos first: the hero and library fallbacks have no credit slot for a Yelp photo.
  const pagePhotos = toPhotos([...(page.gallery || []), ...(page.workingPhotos || [])])
  // "Our works" shows the real job photos (workingPhotos, credited) first, then the hero photos.
  const worksPhotos = toPhotos([...(page.workingPhotos || []), ...(page.gallery || [])])
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

  const hero = own.hero || pagePhotos[0]
  const gallery = own.gallery || worksPhotos
  // Equipment tiles and option cards never stay empty: a card without its own photo
  // borrows the best-suited site photo the page is not already showing.
  const shown = new Set([
    hero, ...crew, ...(own.jobs || []), ...(own.equipment || []), own.assessment, own.diagnose, own.orphan, own.reasons,
    own.category, own.drivers, own.handover, own.serviceGuide, ...gallery.slice(0, 5), ...library,
    ...(page.otherServices?.items || []).slice(0, 4).map(relatedCardPhoto),
    // The shared blocks' photos: the van (credentials, closing call to action) and the FAQ photo.
    SHARED_PHOTOS.van, SHARED_PHOTOS.techTesting,
  ].flatMap((photo) => (photo ? [pictureKey(photo.src)] : [])))
  // A hole (undefined) only when the page already shows every stand-in: the tile keeps its icon.
  const equipment = (page.equipment?.items || []).map((item, index) => own.equipment?.[index] || standInFor(item.name, item.description, shown)) as Photo[]
  const options = (page.equipment?.options?.items || []).map((option) => fromImg(option.image, option.title)
    || (backupOf(option.title) ? undefined : standInFor(option.title, option.body, shown)))

  return {
    ...own,
    hero,
    jobs: own.jobs || [],
    equipment,
    options,
    reasonStats: own.reasonStats || [],
    gallery,
    crew,
    library,
    brandLogos,
  }
}
