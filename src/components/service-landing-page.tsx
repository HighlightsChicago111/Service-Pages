/* eslint-disable @next/next/no-img-element -- Sanity permits arbitrary external image sources; native img keeps alt text crawlable. */
import type {CSSProperties, ReactNode} from 'react'
import Link from 'next/link'
import type {ExternalImage, Faq, Guide, ServicePageData, ServiceRouteContext} from '@/types/content'
import {GuideTabs} from './guide-tabs'
import {CenteredAreaRail} from './centered-area-rail'
import {LeadForm} from './lead-form'
import {CollectionFooter, CollectionHeader} from './collection-chrome'
import {questionHeading} from '@/lib/headings'
import {serviceCardImageForSlug} from '@/lib/collection-items'
import {GoogleRating, GoogleReviewCard} from './google-review-card'
import {routeByHierarchy, routeByServiceSlug, servicePath} from '@/lib/service-hierarchy'

type Props = {data: ServicePageData; route: ServiceRouteContext}

const LIGHT_MARK_ON_DARK_TILE = new Set(['eaton', 'generac', 'siemens', 'sma'])

function imageUrl(image?: ExternalImage): string | undefined {
  return image?.resolvedUrl || image?.externalUrl
}

function imageAlt(image: ExternalImage | undefined, fallback: string): string {
  const alt = image?.alt?.trim()
  const importedPlaceholder = /^[a-z0-9-]+ (?:project|work in [a-z0-9-]+) \d+$/i
  return alt && !importedPlaceholder.test(alt) ? alt : fallback
}

function imageCaption(image: ExternalImage | undefined, fallback: string): string {
  return image?.caption?.trim() || fallback
}

function brandSlug(brand: string): string {
  return brand
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function brandLogoPath(brand: string): string {
  return `/services/images/brands/${brandSlug(brand)}.png`
}

function BrandMark({brand}: {brand: string}) {
  const slug = brandSlug(brand)
  const filter = LIGHT_MARK_ON_DARK_TILE.has(slug) ? 'brand-light-on-dark-filter' : 'brand-dark-on-light-filter'
  return <span className={`brand-mark brand-mark--${slug}`} role="img" aria-label={`${brand} logo`}><svg viewBox="0 0 64 40" aria-hidden="true"><image href={brandLogoPath(brand)} x="0" y="0" width="64" height="40" preserveAspectRatio="xMidYMid meet" filter={`url(#${filter})`} /></svg></span>
}

function BrandLogoFilter() {
  return <svg className="brand-filter-defs" aria-hidden="true"><defs><filter id="brand-dark-on-light-filter" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .88  0 0 0 0 .9  0 0 0 0 .92  -.333 -.333 -.333 1 0" /><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 1 1" /></feComponentTransfer></filter><filter id="brand-light-on-dark-filter" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .88  0 0 0 0 .9  0 0 0 0 .92  .333 .333 .333 0 0" /><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 1 1" /></feComponentTransfer></filter></defs></svg>
}

function asQuestion(value: string | undefined, area: string): string {
  const heading = `${value || 'What This Work Costs'} in ${area}`.trim()
  return heading.endsWith('?') ? heading : `${heading}?`
}

function serviceHref(url: string | undefined) {
  if (!url) return '/services'
  try {
    const parsed = new URL(url, 'https://www.highlightschicago.com')
    if (!/(^|\.)highlightschicago\.com$/i.test(parsed.hostname)) return url
    const segments = parsed.pathname.split('/').filter(Boolean)
    if (segments[0] !== 'services') return url
    const hierarchical = segments.length >= 3 ? routeByHierarchy(segments[1], segments[2]) : undefined
    const direct = routeByServiceSlug(segments[1])
    return hierarchical ? servicePath(hierarchical) : direct ? servicePath(direct) : '/services'
  } catch {
    return url
  }
}

function guideText(guide: Guide): string[] {
  if (Array.isArray(guide.body) && guide.body.length) {
    return guide.body.map((block) => {
      if (!block || typeof block !== 'object' || !('children' in block)) return ''
      const children = (block as {children?: Array<{text?: string}>}).children || []
      return children.map((child) => child.text || '').join('')
    }).filter(Boolean)
  }
  if (!guide.legacyHtml) return []
  return guide.legacyHtml
    .replace(/<\/(p|h[1-6]|li|div)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function EquipmentIcon({index}: {index: number}) {
  const icons: ReactNode[] = [
    <><rect x="12" y="8" width="24" height="32" rx="3" /><path className="ln" d="M18 16h12M18 22h12M18 28h12" /></>,
    <><rect x="12" y="8" width="24" height="32" rx="3" /><path className="ln" d="M18 18h12M18 26h12M24 8v32" /></>,
    <><rect x="12" y="8" width="24" height="32" rx="3" /><circle className="ln" cx="24" cy="18" r="3" /><path className="ln" d="M18 28h12" /></>,
    <><rect x="12" y="8" width="24" height="32" rx="3" /><path className="ln" d="M26 14l-6 10h8l-6 10" /></>,
    <><rect x="8" y="6" width="32" height="36" rx="3" /><path className="ln" d="M16 14h16M16 22h16M16 30h16M24 6v4" /></>,
    <><rect x="10" y="8" width="28" height="32" rx="3" /><circle className="ln" cx="19" cy="18" r="3" /><circle className="ln" cx="29" cy="18" r="3" /><circle className="ln" cx="19" cy="29" r="3" /><circle className="ln" cx="29" cy="29" r="3" /></>,
    <><rect x="12" y="8" width="24" height="32" rx="3" /><path className="ln" d="M17 15l14 18M31 15L17 33" /></>,
    <><rect x="14" y="10" width="20" height="28" rx="3" /><path className="ln" d="M19 18h10M19 25h10M24 4v6M10 24h4M34 24h4" /></>,
  ]
  return <svg viewBox="0 0 48 48" aria-hidden="true">{icons[index % icons.length]}</svg>
}

function EmptyImageIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="11" width="34" height="27" rx="3" /><circle cx="18" cy="21" r="4" /><path d="M9 34l10-8 7 6 5-4 8 6" /></svg>
}

function JsonLd({data, route}: Props) {
  const {page, settings} = data
  if (!page || !settings) return null
  const {service, area} = page
  const faqs: Faq[] = [...(service.faqs || []), ...(page.localFaqOverrides?.length ? page.localFaqOverrides : area.localFaqs || [])]
  const graph = [
    {
      '@type': settings.schemaBusinessType || 'Electrician',
      '@id': `${settings.siteUrl}/#business`,
      name: settings.companyName,
      telephone: settings.phoneE164 || settings.phoneDisplay,
      url: settings.siteUrl,
      email: settings.email,
      address: {'@type': 'PostalAddress', streetAddress: settings.address?.street, addressLocality: settings.address?.city, addressRegion: settings.address?.state, postalCode: settings.address?.zip, addressCountry: 'US'},
      geo: settings.shopLocation ? {'@type': 'GeoCoordinates', latitude: settings.shopLocation.lat, longitude: settings.shopLocation.lng} : undefined,
      aggregateRating: settings.google?.rating ? {'@type': 'AggregateRating', ratingValue: settings.google.rating, reviewCount: settings.google.reviewCount} : undefined,
    },
    {'@type': 'Service', '@id': route.canonicalUrl, url: route.canonicalUrl, name: `${service.h1Prefix} in ${area.name}`, serviceType: service.name, provider: {'@id': `${settings.siteUrl}/#business`}, areaServed: {'@type': 'City', name: `${area.name}, ${area.state}`}},
    {'@type': 'BreadcrumbList', itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Home', item: settings.siteUrl},
      {'@type': 'ListItem', position: 2, name: 'Services', item: `${settings.siteUrl}/services`},
      {'@type': 'ListItem', position: 3, name: route.clusterName, item: `${settings.siteUrl}/services/${route.clusterSlug}`},
      {'@type': 'ListItem', position: 4, name: service.name, item: route.canonicalUrl},
    ]},
    ...(faqs.length ? [{'@type': 'FAQPage', mainEntity: faqs.map((faq) => ({'@type': 'Question', name: faq.question, acceptedAnswer: {'@type': 'Answer', text: faq.answer}}))}] : []),
  ]
  const json = JSON.stringify({'@context': 'https://schema.org', '@graph': graph}).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: json}} />
}

export function ServiceLandingPage({data, route}: Props) {
  const {page, settings} = data
  if (!page || !settings) return null
  const {service, area} = page
  const localFaqs = page.localFaqOverrides?.length ? page.localFaqOverrides : area.localFaqs
  const rating = settings.google?.rating
  const reviewCount = settings.google?.reviewCount
  const presentation = page.template?.presentation
  const coverageMapFirst = presentation?.coverageMapFirst !== false
  const equalHeightReviews = presentation?.equalHeightReviewCards !== false
  const footerColor = presentation?.footerColor || '#151f2a'
  const accentColor = presentation?.accentColor || '#9ec837'
  const accentDarkColor = presentation?.accentDarkColor || '#82aa24'
  const brandStyle = {
    '--brand': footerColor,
    '--brand-dk': '#0f171f',
    '--brand-lt': '#f4f6f7',
    '--brand-2': accentDarkColor,
    '--accent': accentColor,
    '--accent-dk': accentDarkColor,
    '--footer': footerColor,
  } as CSSProperties
  const equipment = service.types || []
  const brands = service.brands || []
  const trustMetrics = settings.trustMetrics || []
  const aPlusIndex = trustMetrics.findIndex((metric) => metric.value.trim().toUpperCase() === 'A+' || /\bBBB\b/i.test(metric.label))
  const aPlusMetric = aPlusIndex >= 0 ? trustMetrics[aPlusIndex] : undefined
  const remainingTrustMetrics = trustMetrics.filter((_, index) => index !== aPlusIndex)
  const orderedTrustMetrics = aPlusMetric
    ? [...remainingTrustMetrics.slice(0, 2), aPlusMetric, ...remainingTrustMetrics.slice(2)]
    : trustMetrics
  const guideItems = (page.guides || []).map((guide) => ({title: guide.title, paragraphs: guideText(guide)}))
  const coverageMap = area.mapQuery ? <div className="area-map"><iframe title={`${area.name} service area map`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(area.mapQuery)}&output=embed`} /></div> : null
  const coverageAreas = <CenteredAreaRail label={`${area.name} service locations`}>{area.subAreas?.map((subArea) => {
    const src = imageUrl(subArea.photo)
    const neighborhoodFallback = `${subArea.name} neighborhood landmark in ${area.name}`
    const storedAlt = subArea.photo?.alt?.trim()
    const alt = !storedAlt || storedAlt.toLowerCase() === subArea.name.trim().toLowerCase()
      ? neighborhoodFallback
      : imageAlt(subArea.photo, neighborhoodFallback)
    return <a className="area-chip" role="listitem" href="#quote" key={subArea._key || subArea.name}><span className="area-img">{src ? <img src={src} alt={alt} title={imageCaption(subArea.photo, subArea.note || subArea.name)} loading="lazy" decoding="async" /> : <EmptyImageIcon />}</span><b>{subArea.name}</b><span>{subArea.note}</span></a>
  })}</CenteredAreaRail>

  return (
    <div className="site-chrome">
      <CollectionHeader />
      <main className="service-landing" style={brandStyle}>
      <nav className="crumbs wrap" aria-label="Breadcrumb"><ol><li><a href={settings.siteUrl}>Home</a></li><li><Link href="/">Services</Link></li><li><Link href={`/${route.clusterSlug}`}>{route.clusterName}</Link></li><li aria-current="page">{service.name}</li></ol></nav>

      <header className="hero"><div className="wrap hero-grid"><div>
        <p className="eyebrow">{area.heroEyebrow}</p><h1>{questionHeading(`${service.h1Prefix} in ${area.name}`)}</h1><p className="lede">{service.heroLede}</p>
        <div className="trustbar">{settings.trustLines?.map((line) => <span className="trust-item" key={line}>◆ {line}</span>)}{rating && <GoogleRating rating={rating} count={reviewCount} />}</div>
        <div className="btn-row"><a className="btn btn-primary" href={`tel:${settings.phoneE164}`}>Call {settings.phoneDisplay}</a><a className="btn btn-secondary" href="#quote">{service.secondaryCta || 'Request service'}</a></div>
        <div className="cs-gallery"><div className="cs-gallery-rail">{page.gallery?.slice(0, 3).map((photo, index) => {
          const src = (index === 0 ? serviceCardImageForSlug(service.slug) : undefined) || imageUrl(photo)
          const fallbacks = [
            `${service.name} project completed by Highlights Chicago electricians in ${area.name}`,
            'Highlights Chicago electrical services logo',
            `Highlights Chicago service van serving ${area.name}`,
          ]
          const alt = imageAlt(photo, fallbacks[index] || `${service.name} project in ${area.name}`)
          return <a className="cs-shot" href="#working-in-area" key={photo._key || index} aria-label={imageCaption(photo, alt)}><span className="cs-shot-img">{src ? <img src={src} alt={alt} title={imageCaption(photo, alt)} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" /> : <EmptyImageIcon />}</span></a>
        })}</div><div className="cs-gallery-head"><p className="eyebrow">{area.galleryLabel}</p><a href="#working-in-area">See more →</a></div></div>
      </div><LeadForm service={service.name} area={area.name} issueQuestion={service.issueQuestion} issueOptions={service.issueOptions} buildingTypes={area.buildingTypes} addressPlaceholder={area.addressPlaceholder} subtitle={settings.formSubtitle} note={settings.formNote} /></div></header>

      <section className="wrap" id="equipment"><h2>{questionHeading(service.typesHeading)}</h2><p className="lede narrow">{service.typesLede}</p><div className="equip-strip" aria-label={service.typesHeading}><div className="equip-track">{[...equipment, ...equipment].map((item, index) => <div className="equip" key={`${item._key || item.name}-${index}`} aria-hidden={index >= equipment.length || undefined}><EquipmentIcon index={index} /><b>{item.name}</b><span>{item.description}</span></div>)}</div></div>{service.typesFootnote && <p className="small muted section-note">{service.typesFootnote}</p>}</section>

      <section className="brands-section" id="brands"><BrandLogoFilter /><div className="wrap"><h2>{questionHeading(`${service.brandsHeading} in ${area.name}`)}</h2><p className="lede narrow">{service.brandsLede}</p><div className="brand-strip" aria-label={`${service.brandsHeading} in ${area.name}`}><div className="brand-track">{[0, 1].map((copy) => <div className="brand-sequence" aria-hidden={copy === 1 || undefined} key={copy}>{brands.map((brand) => <div className="brand-tile" key={`${copy}-${brand}`}><BrandMark brand={brand} /><strong>{brand}</strong></div>)}</div>)}</div></div>{service.brandsNote && <p className="small section-note">{service.brandsNote}</p>}</div></section>

      <section className="wrap" id="trust"><h2>{questionHeading(settings.trustHeading)}</h2><p className="lede narrow">{settings.trustLede}</p><div className="trust-strip">{orderedTrustMetrics.map((metric) => <div className="trust-cell" key={metric._key || metric.label}><b>{metric.value}</b><span>{metric.label}</span></div>)}{rating && <div className="trust-cell google-proof-cell"><b><GoogleRating rating={rating} largeMark /></b><span>{reviewCount} Google reviews</span></div>}</div><div className="grid grid-3 trust-cards">{settings.trustCards?.map((item) => <article className="card" key={item._key || item.title}><h3>{questionHeading(item.title)}</h3><p className="small">{item.body}</p></article>)}</div></section>

      <section className="section-tint" id="reviews"><div className="wrap"><h2>{questionHeading(settings.reviewsHeading)}</h2><div className={`grid grid-2 reviews-grid${equalHeightReviews ? ' reviews-grid-equal' : ''}`}>{page.reviews?.map((review, index) => <GoogleReviewCard review={review} aggregateRating={rating} key={review._key || index} />)}</div>{settings.google?.reviewsUrl && <div className="rev-cta"><a className="rev-cta-btn" href={settings.google.reviewsUrl}>Read all {reviewCount ? `${reviewCount} ` : ''}reviews →</a></div>}{settings.reviewsDisclaimer && <p className="small muted review-note">{settings.reviewsDisclaimer}</p>}</div></section>

      <section className="wrap" id="why-us"><h2>{questionHeading(service.whyHeading)}</h2><p className="lede narrow">{service.whyLede}</p><div className="why-grid">{service.whyItems?.map((item) => <article className="why-item" key={item._key || item.title}><h3 className="why-title">{questionHeading(item.title)}</h3><p className="why-body">{item.body}</p></article>)}</div></section>

      <section className="section-tint" id="working-in-area"><div className="wrap"><h2>{questionHeading(`Our Works in ${area.name}`)}</h2><p className="lede narrow">{area.workingLede}</p><div className="photo-grid">{page.workingPhotos?.map((photo, index) => {
        const src = imageUrl(photo)
        const fallback = `${service.name} work completed by Highlights Chicago in ${area.name} — project photo ${index + 1}`
        const alt = imageAlt(photo, fallback)
        const caption = imageCaption(photo, fallback)
        return <figure className="work-photo" key={photo._key || index}><div className="ph">{src ? <img src={src} alt={alt} title={caption} loading="lazy" decoding="async" /> : <EmptyImageIcon />}</div><figcaption>{caption}</figcaption></figure>
      })}</div></div></section>

      <section className="wrap" id="areas"><h2 className="single-line-mobile">{questionHeading(area.areasHeading)}</h2><p className="lede narrow">{area.areasLede}</p><div className="coverage-stack">{coverageMapFirst ? <>{coverageMap}{coverageAreas}</> : <>{coverageAreas}{coverageMap}</>}</div>{area.areasNote && <p className="small muted coverage-note">{area.areasNote}</p>}</section>

      <section className="wrap" id="other-services"><h2>{questionHeading(`Our other services in ${area.name}`)}</h2><div className="svc-split">{service.featuredCategory?.title && <a className="svc-feature" href={serviceHref(service.featuredCategory.url)}><span className="svc-feature-tag">{service.featuredCategory.tag}</span><h3>{questionHeading(service.featuredCategory.title)}</h3><p>{service.featuredCategory.description}</p><span className="svc-feature-tag">{service.featuredCategory.cta} →</span></a>}<div className="svc-four">{service.otherServices?.slice(0, 4).map((item) => <a className="svc-mini" href={serviceHref(item.url)} key={item._key || item.name}><b>{item.name}</b><span>{item.description}</span></a>)}</div></div></section>

      <section className="section-tint" id="pricing"><div className="wrap"><h2>{questionHeading(presentation?.pricingHeadingAsQuestion === false ? `${service.pricing?.heading} in ${area.name}` : asQuestion(service.pricing?.heading, area.name))}</h2><p className="lede narrow">{service.pricing?.lede}</p><div className="table-wrap" tabIndex={0} aria-label={`${service.name} pricing table, scroll horizontally to view all columns`}><table><caption>{service.pricing?.caption}</caption><thead><tr><th>{service.pricing?.column1}</th><th>{service.pricing?.column2}</th><th>{service.pricing?.column3}</th></tr></thead><tbody>{service.pricing?.rows?.map((row) => <tr key={row._key || row.job}><td>{row.job}</td><td>{row.driver}</td><td>{row.permit}</td></tr>)}</tbody></table></div>{service.pricing?.note && <p className="small muted section-note">{service.pricing.note}</p>}</div></section>

      <section className="wrap" id="faq"><h2>{questionHeading(`${service.name} in ${area.name} — FAQs`)}</h2><div className="faq">{[...(service.faqs || []), ...(localFaqs || [])].map((faq) => <details key={faq._key || faq.question}><summary><span>{faq.question}</span><span className="faq-chevron" aria-hidden="true" /></summary><div className="faq-body"><p>{faq.answer}</p></div></details>)}</div></section>

      <section className="wrap closing-cta-section"><div className="cta-final"><h2 className="cta-heading">{questionHeading(`${service.ctaHeading} in ${area.name}?`)}</h2><p>{service.ctaBody}</p><div className="btn-row centered"><a className="btn btn-primary" href={`tel:${settings.phoneE164}`}>Call {settings.phoneDisplay}</a><a className="btn btn-secondary" href="#quote">{service.secondaryCta}</a></div></div></section>

      {guideItems.length > 0 && <section className="section-tint library-section" id="guides"><div className="wrap"><h2>{questionHeading(area.libraryHeading)}</h2><p className="lede narrow">{area.libraryLede}</p><GuideTabs guides={guideItems} /></div></section>}

      <div className="callbar"><a className="c-call" href={`tel:${settings.phoneE164}`}>Call {settings.phoneDisplay}</a><a className="c-form" href="#quote">Book service</a></div>
      <JsonLd data={data} route={route} />
      </main>
      <CollectionFooter />
    </div>
  )
}
