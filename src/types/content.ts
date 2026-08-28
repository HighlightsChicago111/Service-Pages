export type Faq = {_key?: string; question: string; answer: string}
export type TitledBody = {_key?: string; title: string; body: string}
export type ExternalImage = {_key?: string; externalUrl?: string; resolvedUrl?: string; alt?: string; credit?: string}
export type Review = {_key?: string; quote: string; author?: string; location?: string; sourceUrl?: string; sourceId?: string}
export type Guide = {_key?: string; title: string; body?: unknown[]; legacyHtml?: string}

export type ServiceDefinition = {
  serviceId: number
  name: string
  slug: string
  parentName?: string
  parentUrl?: string
  hubUrl?: string
  primaryKeywords?: string[]
  monthlySearchVolume?: number
  secondaryKeywords?: string[]
  h1Prefix: string
  heroLede?: string
  secondaryCta?: string
  issueQuestion?: string
  issueOptions?: string[]
  typesHeading?: string
  typesLede?: string
  types?: Array<{_key?: string; name: string; description?: string}>
  typesFootnote?: string
  brandsHeading?: string
  brandsLede?: string
  brands?: string[]
  brandsNote?: string
  whyHeading?: string
  whyLede?: string
  whyItems?: TitledBody[]
  featuredCategory?: {tag?: string; title?: string; description?: string; cta?: string; url?: string}
  otherServices?: Array<{_key?: string; name: string; description?: string; url: string}>
  pricing?: {
    heading?: string; lede?: string; caption?: string; column1?: string; column2?: string; column3?: string
    rows?: Array<{_key?: string; job: string; driver?: string; permit?: string}>; note?: string
  }
  faqs?: Faq[]
  ctaHeading?: string
  ctaBody?: string
}

export type ServiceArea = {
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
  subAreas?: Array<{_key?: string; name: string; note?: string; photo?: ExternalImage}>
  mapQuery?: string
  libraryHeading?: string
  libraryLede?: string
  localFaqs?: Faq[]
}

export type SiteSettings = {
  companyName: string
  siteUrl: string
  phoneDisplay?: string
  phoneE164?: string
  email?: string
  address?: {street?: string; city?: string; state?: string; zip?: string}
  shopLocation?: {lat: number; lng: number}
  schemaBusinessType?: string
  brand?: {primary?: string; dark?: string; light?: string; secondary?: string; accent?: string; accentDark?: string}
  google?: {rating?: number; reviewCount?: number; reviewsUrl?: string}
  trustLines?: string[]
  trustHeading?: string
  trustLede?: string
  trustMetrics?: Array<{_key?: string; value: string; label: string}>
  trustCards?: TitledBody[]
  reviewsHeading?: string
  reviewsDisclaimer?: string
  formSubtitle?: string
  formNote?: string
}

export type ServicePageData = {
  serviceRoutes?: Array<{serviceSlug: string; areaSlug: string}>
  page: {
    _id: string
    title: string
    seo: {title: string; description: string; canonicalUrl: string}
    reviews?: Review[]
    gallery?: ExternalImage[]
    workingPhotos?: ExternalImage[]
    guides?: Guide[]
    localFaqOverrides?: Faq[]
    template?: {
      name?: string
      version?: string
      active?: boolean
      sectionOrder?: string[]
      presentation?: {
        footerColor?: string
        accentColor?: string
        accentDarkColor?: string
        equalHeightReviewCards?: boolean
        ratingAfterReviewText?: boolean
        coverageMapFirst?: boolean
        neighborhoodGrid?: boolean
        brandLogoCards?: boolean
        pricingHeadingAsQuestion?: boolean
      }
    }
    service: ServiceDefinition
    area: ServiceArea
  } | null
  settings: SiteSettings | null
}
