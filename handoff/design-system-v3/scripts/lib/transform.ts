/**
 * Workbook rows (data/v2-source.json) -> Sanity documents for the V2 collection.
 * Pure functions, no network: the build and the tests both use this.
 */

export type Row = Record<string, string>
export type Source = {workbook?: string; pages: Row[]; items: Row[]; areas: Row[]; settings: Row}
export type SanityDoc = {_id: string; _type: string; [key: string]: unknown}
export type BuildResult = {documents: SanityDoc[]; errors: string[]; warnings: string[]; placeholders: string[]}

export const ANCHORS = new Set([
  'your-job', 'equipment', 'equipment-choices', 'equipment-options', 'site-assessment', 'assessment-routes',
  'diagnose', 'brands', 'trust', 'reviews', 'why-us', 'working-in-area', 'process', 'areas',
  'other-services', 'pricing', 'whats-included', 'faq', 'guides', 'quote',
])
const OWNERS = new Set(['highlights', 'city', 'comed', 'customer', 'manufacturer'])
const EXTRA_FIELDS = new Set(['existingSystem', 'symptom', 'details'])
const PAGE_BLOCKS = new Set([
  'form_field', 'job_path', 'equipment', 'compare_row', 'option', 'assess_check', 'route', 'symptom', 'why', 'review',
  'gallery', 'working_photo', 'process_step', 'other_service', 'price_row', 'cost_driver', 'warranty', 'faq', 'guide_section',
])
const AREA_BLOCKS = new Set(['sub_area', 'shared_guide', 'local_faq'])
const SETTINGS_BLOCKS = new Set(['trust_line', 'trust_metric', 'trust_card'])
const REQUIRED_PAGE = [
  'service_id', 'slug', 'name', 'area_slug', 'meta_title', 'meta_description', 'h1_prefix', 'hero_lede', 'cta_secondary',
  'issue_question', 'issue_options', 'equip_heading', 'equip_lede', 'brands_heading', 'brands', 'why_heading',
  'pricing_heading', 'pricing_lede', 'pricing_caption', 'pricing_note', 'cta_heading', 'cta_body', 'guide_title', 'guide_heading', 'guide_intro',
]
const CONFIRM = /\[CONFIRM:[^\]]*\]/g

export const pageId = (serviceId: string | number) => `v2-page-${serviceId}`
export const areaId = (slug: string) => `v2-area-${slug}`
export const SETTINGS_ID = 'v2-siteSettings'

const list = (raw = '') => raw.split('||').map((item) => item.trim()).filter(Boolean)
const opt = (value?: string) => (value && value.trim() ? value.trim() : undefined)
const num = (value?: string) => (value && value.trim() && !Number.isNaN(Number(value)) ? Number(value) : undefined)

/** Drop undefined values, empty strings, empty arrays and empty objects so absent folds stay absent. */
export function compact<T>(value: T): T {
  if (Array.isArray(value)) return value.map(compact).filter((item) => item !== undefined) as T
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, compact(item)] as const)
      .filter(([, item]) => item !== undefined && item !== '' && !(Array.isArray(item) && item.length === 0) && !(item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0))
    return (entries.length ? Object.fromEntries(entries) : undefined) as T
  }
  return value
}

export function buildDocuments(source: Source, fullReviews: Record<string, string> = {}, brandLogoExists: (brand: string) => boolean = () => true): BuildResult {
  const errors: string[] = []
  const warnings: string[] = []
  const documents: SanityDoc[] = []
  const byOwner = new Map<string, Row[]>()
  for (const item of source.items) {
    const owner = item.owner?.trim()
    if (!owner || !item.block) {
      errors.push(`02 Items row ${JSON.stringify(item).slice(0, 80)}: owner and block are required`)
      continue
    }
    const rows = byOwner.get(owner) || []
    rows.push(item)
    byOwner.set(owner, rows)
  }
  for (const rows of byOwner.values()) rows.sort((left, right) => Number(left.order || 0) - Number(right.order || 0))
  const blocksOf = (owner: string, block: string) => (byOwner.get(owner) || []).filter((item) => item.block === block)

  // Settings
  const s = source.settings
  for (const field of ['company_name', 'phone_display', 'phone_e164']) if (!s[field]) errors.push(`04 Settings: ${field} is required`)
  for (const item of byOwner.get('settings') || []) if (!SETTINGS_BLOCKS.has(item.block)) errors.push(`02 Items: unknown settings block "${item.block}"`)
  documents.push(compact({
    _id: SETTINGS_ID, _type: 'v2SiteSettings',
    companyName: s.company_name, siteUrl: opt(s.site_url), phoneDisplay: opt(s.phone_display), phoneE164: opt(s.phone_e164), email: opt(s.email),
    address: {street: opt(s.address_street), city: opt(s.address_city), state: opt(s.address_state), zip: opt(s.address_zip)},
    shopLocation: num(s.shop_lat) !== undefined && num(s.shop_lng) !== undefined ? {_type: 'geopoint', lat: num(s.shop_lat), lng: num(s.shop_lng)} : undefined,
    schemaBusinessType: opt(s.schema_business_type),
    google: {rating: num(s.google_rating), reviewCount: num(s.google_review_count), reviewsUrl: opt(s.google_reviews_url), verifiedAt: opt(s.google_verified_at)},
    trustLines: blocksOf('settings', 'trust_line').map((item) => item.a),
    trustHeading: opt(s.trust_heading), trustLede: opt(s.trust_lede),
    trustMetrics: blocksOf('settings', 'trust_metric').map((item, index) => ({_key: `metric-${index + 1}`, _type: 'v2TrustMetric', value: item.a, label: item.b})),
    trustCards: blocksOf('settings', 'trust_card').map((item, index) => ({_key: `card-${index + 1}`, _type: 'v2TitledBody', title: item.a, body: opt(item.b)})),
    reviewsHeading: opt(s.reviews_heading), reviewsDisclaimer: opt(s.reviews_disclaimer), formSubtitle: opt(s.form_subtitle), formNote: opt(s.form_note),
  }))

  // Areas
  const areaSlugs = new Set<string>()
  for (const area of source.areas) {
    if (!area.slug || !area.name || !area.state) {
      errors.push('03 Area: slug, name and state are required')
      continue
    }
    areaSlugs.add(area.slug)
    const owner = `area:${area.slug}`
    for (const item of byOwner.get(owner) || []) if (!AREA_BLOCKS.has(item.block)) errors.push(`02 Items: unknown area block "${item.block}"`)
    const guides = new Map<string, {heading?: string; sections: Array<{heading?: string; body: string}>}>()
    for (const item of blocksOf(owner, 'shared_guide')) {
      const guide = guides.get(item.a) || {heading: opt(item.b), sections: []}
      guide.sections.push({heading: opt(item.c), body: item.d})
      guides.set(item.a, guide)
    }
    documents.push(compact({
      _id: areaId(area.slug), _type: 'v2ServiceArea', name: area.name, slug: {_type: 'slug', current: area.slug}, state: area.state,
      heroEyebrow: opt(area.hero_eyebrow), galleryLabel: opt(area.gallery_label), addressPlaceholder: opt(area.address_placeholder),
      buildingTypes: list(area.building_types), workingLede: opt(area.working_lede), areasHeading: opt(area.areas_heading),
      areasLede: opt(area.areas_lede), areasNote: opt(area.areas_note), mapQuery: opt(area.map_query),
      libraryHeading: opt(area.library_heading), libraryLede: opt(area.library_lede),
      subAreas: blocksOf(owner, 'sub_area').map((item, index) => ({
        _key: `sub-${index + 1}`, _type: 'v2SubArea', name: item.a, note: opt(item.b),
        photo: item.c ? {_type: 'v2Image', externalUrl: item.c, alt: `${item.a} neighborhood landmark in ${area.name}`, caption: opt(item.b), credit: opt(item.d)} : undefined,
      })),
      sharedGuides: [...guides.entries()].map(([title, guide], index) => ({
        _key: `guide-${index + 1}`, _type: 'v2Guide', title, heading: guide.heading,
        sections: guide.sections.map((section, sectionIndex) => ({_key: `s-${sectionIndex + 1}`, _type: 'v2GuideSection', ...section})),
      })),
      localFaqs: blocksOf(owner, 'local_faq').map((item, index) => ({_key: `local-faq-${index + 1}`, _type: 'v2Faq', question: item.a, answer: item.b})),
    }))
  }

  // Pages
  const seenIds = new Set<string>()
  const seenSlugs = new Set<string>()
  for (const p of source.pages) {
    const id = p.service_id
    const where = `Page ${id || '(no service_id)'} ${p.slug || ''}`.trim()
    for (const field of REQUIRED_PAGE) if (!p[field]) errors.push(`${where}: ${field} is required`)
    if (!/^\d+$/.test(id || '')) errors.push(`${where}: service_id must be a number`)
    if (p.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) errors.push(`${where}: slug must be lowercase words joined by hyphens`)
    if (seenIds.has(id)) errors.push(`${where}: duplicate service_id`)
    if (seenSlugs.has(p.slug)) errors.push(`${where}: duplicate slug`)
    seenIds.add(id)
    seenSlugs.add(p.slug)
    if (p.area_slug && !areaSlugs.has(p.area_slug)) errors.push(`${where}: area_slug "${p.area_slug}" is not in 03 Area`)
    if ((p.meta_title || '').length > 65) errors.push(`${where}: meta_title is ${p.meta_title.length} characters (max 65)`)
    if ((p.meta_description || '').length > 170) errors.push(`${where}: meta_description is ${p.meta_description.length} characters (max 170)`)
    if (/\b\d+\s+best\b/i.test(`${p.meta_title} ${p.h1_prefix}`)) errors.push(`${where}: listicle-style title ("10 Best ...") is not allowed on a service page`)
    if (p.equip_footnote_link_anchor && !ANCHORS.has(p.equip_footnote_link_anchor)) errors.push(`${where}: equip_footnote_link_anchor "${p.equip_footnote_link_anchor}" is not a page anchor`)

    const items = byOwner.get(id) || []
    for (const item of items) if (!PAGE_BLOCKS.has(item.block)) errors.push(`${where}: unknown block "${item.block}" in 02 Items`)
    const b = (block: string) => blocksOf(id, block)
    const k = (block: string, index: number) => `${block}-${index + 1}`
    const anchor = (value: string | undefined, context: string) => {
      if (value && !ANCHORS.has(value)) errors.push(`${where}: ${context} link_anchor "${value}" is not a page anchor`)
      return opt(value)
    }

    const compareColumns = list(p.compare_columns)
    const compareRows = b('compare_row').map((item, index) => {
      const values = [item.b, item.c, item.d, item.e, item.f].slice(0, compareColumns.length).map((value) => value || '')
      if ([item.b, item.c, item.d, item.e, item.f].slice(compareColumns.length).some(Boolean)) errors.push(`${where}: compare_row ${index + 1} has more cells than compare_columns`)
      return {_key: k('compare', index), _type: 'v2ComparisonRow', label: item.a, values}
    })
    const gallery = b('gallery')
    const working = b('working_photo')
    const reviews = b('review')
    if (gallery.length > 3 || working.length > 3) errors.push(`${where}: use at most 3 gallery and 3 working_photo items`)
    if (gallery.length < 3) warnings.push(`${where}: ${gallery.length} of 3 hero photos`)
    if (working.length < 3) warnings.push(`${where}: ${working.length} of 3 working photos`)
    if (reviews.length !== 4) warnings.push(`${where}: ${reviews.length} reviews (the standard is 4)`)
    for (const review of reviews) {
      if (review.e.split(/\s+/).filter(Boolean).length > 15) warnings.push(`${where}: review ${review.a} excerpt is longer than 14 words`)
      if (review.a && !fullReviews[review.a]) warnings.push(`${where}: review ${review.a} has no full text in data/full-reviews.json; the excerpt is shown`)
    }
    for (const brand of list(p.brands)) if (!brandLogoExists(brand)) warnings.push(`${where}: no logo file for brand "${brand}" (public/images/brands)`)
    const image = (prefix: string) => (item: Row, index: number) => ({_key: k(prefix, index), _type: 'v2Image', externalUrl: item.a, alt: item.b || `${p.name} in Chicago`, caption: opt(item.c)})
    const extraFields = b('form_field').map((item, index) => {
      if (!EXTRA_FIELDS.has(item.a)) errors.push(`${where}: form_field field_name "${item.a}" must be existingSystem, symptom or details`)
      return {_key: k('field', index), _type: 'v2ExtraFormField', fieldName: item.a, label: item.b, options: list(item.c)}
    })
    const steps = b('process_step').map((item, index) => {
      const owners = list(item.c)
      for (const owner of owners) if (!OWNERS.has(owner)) errors.push(`${where}: process_step ${index + 1} owner "${owner}" is not one of ${[...OWNERS].join(', ')}`)
      return {_key: k('step', index), _type: 'v2ProcessStep', title: item.a, body: opt(item.b), owners}
    })

    const doc = compact({
      _id: pageId(id), _type: 'v2ServicePage', serviceId: Number(id), name: p.name, slug: {_type: 'slug', current: p.slug},
      parentName: opt(p.parent_name), area: {_type: 'reference', _ref: areaId(p.area_slug)},
      seo: {title: opt(p.meta_title), description: opt(p.meta_description)},
      primaryKeywords: list(p.kw_primary), monthlySearchVolume: num(p.kw_volume), secondaryKeywords: list(p.kw_secondary),
      hero: {h1Prefix: p.h1_prefix, lede: opt(p.hero_lede), secondaryCta: opt(p.cta_secondary)},
      gallery: gallery.map(image('gallery')),
      form: {issueQuestion: opt(p.issue_question), issueOptions: list(p.issue_options), extraFields},
      jobPaths: {
        heading: opt(p.jobs_heading), lede: opt(p.jobs_lede), note: opt(p.jobs_note),
        items: b('job_path').map((item, index) => ({_key: k('path', index), _type: 'v2JobPath', title: item.a, whoFor: opt(item.b), scopeDrivers: opt(item.c), firstStep: opt(item.d), linkLabel: opt(item.e), linkAnchor: anchor(item.f, `job_path ${index + 1}`)})),
      },
      equipment: {
        heading: opt(p.equip_heading), lede: opt(p.equip_lede), footnote: opt(p.equip_footnote), footnoteLinkLabel: opt(p.equip_footnote_link_label), footnoteLinkAnchor: opt(p.equip_footnote_link_anchor),
        items: b('equipment').map((item, index) => ({_key: k('equip', index), _type: 'v2EquipmentItem', name: item.a, description: opt(item.b)})),
        comparison: {heading: opt(p.compare_heading), intro: opt(p.compare_intro), columns: compareColumns, rows: compareRows},
        options: {
          heading: opt(p.options_heading), calloutLead: opt(p.options_callout_lead), calloutBody: opt(p.options_callout_body), note: opt(p.options_note),
          items: b('option').map((item, index) => ({_key: k('option', index), _type: 'v2TitledBody', title: item.a, body: opt(item.b)})),
        },
      },
      assessment: {
        heading: opt(p.assess_heading), lede: opt(p.assess_lede), routesHeading: opt(p.routes_heading), routesNote: opt(p.routes_note),
        checks: b('assess_check').map((item, index) => ({_key: k('check', index), _type: 'v2TitledBody', title: item.a, body: opt(item.b)})),
        routes: b('route').map((item, index) => ({_key: k('route', index), _type: 'v2TitledBody', title: item.a, body: opt(item.b)})),
      },
      diagnose: {
        heading: opt(p.diagnose_heading), lede: opt(p.diagnose_lede), columns: list(p.diagnose_columns),
        rows: b('symptom').map((item, index) => ({_key: k('symptom', index), _type: 'v2SymptomRow', symptom: item.a, causes: opt(item.b), firstCheck: opt(item.c)})),
        repairTitle: opt(p.repair_title), repairBody: opt(p.repair_body), orphanTitle: opt(p.orphan_title), orphanBody: opt(p.orphan_body),
      },
      brands: {heading: opt(p.brands_heading), lede: opt(p.brands_lede), items: list(p.brands), note: opt(p.brands_note)},
      why: {
        heading: opt(p.why_heading), lede: opt(p.why_lede),
        items: b('why').map((item, index) => ({_key: k('why', index), _type: 'v2LinkedCard', title: item.a, body: opt(item.b), linkLabel: opt(item.c), linkAnchor: anchor(item.d, `why ${index + 1}`)})),
      },
      reviews: reviews.map((item, index) => ({
        _key: k('review', index), _type: 'v2Review', quote: fullReviews[item.a] || item.e, author: item.b, date: opt(item.c), sourceUrl: opt(item.d), sourceId: opt(item.a), location: opt(item.f),
      })),
      workingPhotos: working.map(image('working')),
      process: {heading: opt(p.process_heading), lede: opt(p.process_lede), steps},
      areasCallout: opt(p.areas_callout),
      otherServices: {
        featured: {tag: opt(p.feature_tag), title: opt(p.feature_title), description: opt(p.feature_desc)},
        items: b('other_service').slice(0, 4).map((item, index) => ({_key: k('other', index), _type: 'v2LinkedService', name: item.a, description: opt(item.b), url: item.c})),
      },
      pricing: {
        heading: opt(p.pricing_heading), lede: opt(p.pricing_lede), caption: opt(p.pricing_caption), columns: list(p.pricing_columns), note: opt(p.pricing_note),
        rows: b('price_row').map((item, index) => ({_key: k('price', index), _type: 'v2PriceRow', job: item.a, driver: opt(item.b), permit: opt(item.c)})),
        driversHeading: opt(p.drivers_heading), incentivesNote: opt(p.incentives_note),
        drivers: b('cost_driver').map((item, index) => ({_key: k('driver', index), _type: 'v2CostDriver', factor: item.a, why: opt(item.b), when: opt(item.c)})),
      },
      included: {
        heading: opt(p.incl_heading), lede: opt(p.incl_lede),
        inScopeHeading: opt(p.in_scope_heading), inScope: list(p.in_scope), inScopeNote: opt(p.in_scope_note),
        separateHeading: opt(p.separate_heading), separate: list(p.separate), separateNote: opt(p.separate_note),
        handoverHeading: opt(p.handover_heading), handover: list(p.handover), warrantyHeading: opt(p.warranty_heading),
        warranty: b('warranty').map((item, index) => ({_key: k('warranty', index), _type: 'v2WarrantyRow', item: item.a, party: item.b})),
      },
      faqs: b('faq').map((item, index) => ({_key: k('faq', index), _type: 'v2Faq', question: item.a, answer: item.b})),
      cta: {heading: opt(p.cta_heading), body: opt(p.cta_body), readyHeading: opt(p.ready_heading), readyItems: list(p.ready_items)},
      serviceGuide: {
        _type: 'v2Guide', title: p.guide_title, heading: opt(p.guide_heading), intro: opt(p.guide_intro),
        sections: b('guide_section').map((item, index) => ({_key: k('section', index), _type: 'v2GuideSection', heading: opt(item.a), body: item.b})),
      },
    })
    if (/24\s*\/\s*7|24-hour/i.test(JSON.stringify(doc))) errors.push(`${where}: no 24/7 or 24-hour availability claims (unresolved hours conflict)`)
    documents.push(doc)
  }

  for (const owner of byOwner.keys()) {
    if (owner === 'settings' || owner.startsWith('area:')) continue
    if (!seenIds.has(owner)) errors.push(`02 Items: owner "${owner}" has no row in 01 Pages`)
  }

  const placeholders: string[] = []
  for (const doc of documents) {
    for (const match of JSON.stringify(doc).match(CONFIRM) || []) placeholders.push(`${doc._id}: ${match}`)
  }
  return {documents, errors, warnings, placeholders}
}
