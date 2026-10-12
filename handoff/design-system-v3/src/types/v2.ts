/** Shapes returned by the V2 queries (and stored in data/v2-documents.json). */

export type Keyed = {_key?: string}
export type Img = Keyed & {externalUrl?: string; resolvedUrl?: string; alt?: string; caption?: string; credit?: string}
export type Faq = Keyed & {question: string; answer: string}
export type TitledBody = Keyed & {title: string; body?: string}
export type LinkedCard = TitledBody & {linkLabel?: string; linkAnchor?: string}
export type Review = Keyed & {quote: string; author?: string; location?: string; date?: string; sourceUrl?: string; sourceId?: string}
export type GuideSection = Keyed & {heading?: string; body: string}
export type Guide = Keyed & {title: string; heading?: string; intro?: string; sections?: GuideSection[]}

export type V2Settings = {
  companyName: string
  siteUrl?: string
  phoneDisplay?: string
  phoneE164?: string
  email?: string
  address?: {street?: string; city?: string; state?: string; zip?: string}
  shopLocation?: {lat: number; lng: number}
  schemaBusinessType?: string
  google?: {rating?: number; reviewCount?: number; reviewsUrl?: string; verifiedAt?: string}
  trustLines?: string[]
  trustHeading?: string
  trustLede?: string
  trustMetrics?: Array<Keyed & {value: string; label: string}>
  trustCards?: TitledBody[]
  reviewsHeading?: string
  reviewsDisclaimer?: string
  formSubtitle?: string
  formNote?: string
}

export type V2Area = {
  name: string
  slug: string
  state: string
  heroEyebrow?: string
  galleryLabel?: string
  addressPlaceholder?: string
  buildingTypes?: string[]
  workingLede?: string
  areasHeading?: string
  areasLede?: string
  areasNote?: string
  subAreas?: Array<Keyed & {name: string; note?: string; photo?: Img}>
  mapQuery?: string
  libraryHeading?: string
  libraryLede?: string
  sharedGuides?: Guide[]
  localFaqs?: Faq[]
}

export type ProcessOwner = 'highlights' | 'city' | 'comed' | 'customer' | 'manufacturer'
export type LeadExtraField = 'existingSystem' | 'symptom' | 'details'

export type V2Page = {
  _id: string
  serviceId: number
  name: string
  slug: string
  parentName?: string
  seo?: {title?: string; description?: string}
  primaryKeywords?: string[]
  monthlySearchVolume?: number
  secondaryKeywords?: string[]
  hero: {h1Prefix: string; lede?: string; secondaryCta?: string}
  gallery?: Img[]
  form?: {
    issueQuestion?: string
    issueOptions?: string[]
    extraFields?: Array<Keyed & {fieldName: LeadExtraField; label: string; options?: string[]}>
  }
  jobPaths?: {
    heading?: string
    lede?: string
    items?: Array<Keyed & {title: string; whoFor?: string; scopeDrivers?: string; firstStep?: string; linkLabel?: string; linkAnchor?: string}>
    note?: string
  }
  equipment?: {
    heading?: string
    lede?: string
    items?: Array<Keyed & {name: string; description?: string}>
    footnote?: string
    footnoteLinkLabel?: string
    footnoteLinkAnchor?: string
    comparison?: {heading?: string; intro?: string; columns?: string[]; rows?: Array<Keyed & {label: string; values?: string[]}>}
    options?: {heading?: string; calloutLead?: string; calloutBody?: string; items?: TitledBody[]; note?: string}
  }
  assessment?: {
    heading?: string
    lede?: string
    checks?: TitledBody[]
    routesHeading?: string
    routes?: TitledBody[]
    routesNote?: string
  }
  diagnose?: {
    heading?: string
    lede?: string
    columns?: string[]
    rows?: Array<Keyed & {symptom: string; causes?: string; firstCheck?: string}>
    repairTitle?: string
    repairBody?: string
    orphanTitle?: string
    orphanBody?: string
  }
  brands?: {heading?: string; lede?: string; items?: string[]; note?: string}
  why?: {heading?: string; lede?: string; items?: LinkedCard[]}
  workingPhotos?: Img[]
  process?: {heading?: string; lede?: string; steps?: Array<Keyed & {title: string; body?: string; owners?: ProcessOwner[]}>}
  areasCallout?: string
  otherServices?: {
    featured?: {tag?: string; title?: string; description?: string}
    items?: Array<Keyed & {name: string; description?: string; url: string}>
  }
  pricing?: {
    heading?: string
    lede?: string
    caption?: string
    columns?: string[]
    rows?: Array<Keyed & {job: string; driver?: string; permit?: string}>
    note?: string
    driversHeading?: string
    drivers?: Array<Keyed & {factor: string; why?: string; when?: string}>
    incentivesNote?: string
  }
  included?: {
    heading?: string
    lede?: string
    inScopeHeading?: string
    inScope?: string[]
    inScopeNote?: string
    separateHeading?: string
    separate?: string[]
    separateNote?: string
    handoverHeading?: string
    handover?: string[]
    warrantyHeading?: string
    warranty?: Array<Keyed & {item: string; party: string}>
  }
  faqs?: Faq[]
  cta?: {heading?: string; body?: string; readyHeading?: string; readyItems?: string[]}
  serviceGuide?: Guide
  reviews?: Review[]
}

export type V2PageData = {
  page: V2Page | null
  area: V2Area | null
  settings: V2Settings | null
  routes: Array<{slug: string; name: string; parentName?: string}>
}
