import type {CSSProperties} from 'react'
import Link from 'next/link'
import type {Faq, Guide, ServicePageData} from '@/types/content'
import {LeadForm} from './lead-form'

type Props = {data: ServicePageData}

function imageStyle(url?: string): CSSProperties | undefined {
  return url ? {backgroundImage: `url(${JSON.stringify(url)})`} : undefined
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

function JsonLd({data}: Props) {
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
    {'@type': 'Service', name: `${service.h1Prefix} in ${area.name}`, serviceType: service.name, provider: {'@id': `${settings.siteUrl}/#business`}, areaServed: {'@type': 'City', name: `${area.name}, ${area.state}`}},
    {'@type': 'BreadcrumbList', itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Home', item: settings.siteUrl},
      {'@type': 'ListItem', position: 2, name: 'Services', item: `${settings.siteUrl}/services`},
      {'@type': 'ListItem', position: 3, name: service.name, item: service.hubUrl},
      {'@type': 'ListItem', position: 4, name: area.name, item: page.seo.canonicalUrl},
    ]},
    ...(faqs.length ? [{'@type': 'FAQPage', mainEntity: faqs.map((faq) => ({'@type': 'Question', name: faq.question, acceptedAnswer: {'@type': 'Answer', text: faq.answer}}))}] : []),
  ]
  const json = JSON.stringify({'@context': 'https://schema.org', '@graph': graph}).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: json}} />
}

export function ServiceLandingPage({data}: Props) {
  const {page, settings} = data
  if (!page || !settings) return null
  const {service, area} = page
  const localFaqs = page.localFaqOverrides?.length ? page.localFaqOverrides : area.localFaqs
  const brandStyle = {
    '--brand': settings.brand?.primary || '#223D90',
    '--brand-dark': settings.brand?.dark || '#182c69',
    '--brand-light': settings.brand?.light || '#e9edf7',
    '--brand-secondary': settings.brand?.secondary || '#0F7CC1',
    '--accent': settings.brand?.accent || '#66B143',
    '--accent-dark': settings.brand?.accentDark || '#4e8f33',
  } as CSSProperties

  return (
    <main style={brandStyle}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href={settings.siteUrl}>Home</a><span>›</span><Link href="/services">Services</Link><span>›</span>
        {service.parentUrl && <><a href={service.parentUrl}>{service.parentName}</a><span>›</span></>}
        <span aria-current="page">{service.name} in {area.name}</span>
      </nav>

      <section className="hero">
        <div className="page-wrap hero-grid">
          <div>
            <p className="eyebrow">{area.heroEyebrow}</p>
            <h1>{service.h1Prefix} in {area.name}</h1>
            <p className="lede">{service.heroLede}</p>
            <div className="trustbar">
              {settings.trustLines?.map((line) => <span key={line}>◆ {line}</span>)}
              {settings.google?.rating && <span>★ {settings.google.rating}/5 · {settings.google.reviewCount} reviews</span>}
            </div>
            <div className="button-row">
              <a className="button primary" href={`tel:${settings.phoneE164}`}>Call {settings.phoneDisplay}</a>
              <a className="button secondary" href="#quote">{service.secondaryCta || 'Request service'}</a>
            </div>
            <div className="gallery">
              <div className="section-head"><h2>{area.galleryLabel}</h2><a href="#working-in-area">See more →</a></div>
              <div className="gallery-grid">{page.gallery?.map((photo, index) => <div className="photo" key={photo._key || index} style={imageStyle(photo.externalUrl)} role="img" aria-label={photo.alt || `${service.name} project ${index + 1}`} />)}</div>
            </div>
          </div>
          <LeadForm service={service.name} area={area.name} issueQuestion={service.issueQuestion} issueOptions={service.issueOptions} buildingTypes={area.buildingTypes} addressPlaceholder={area.addressPlaceholder} subtitle={settings.formSubtitle} note={settings.formNote} />
        </div>
      </section>

      <section className="page-wrap"><h2>{service.typesHeading}</h2><p className="lede narrow">{service.typesLede}</p><div className="card-grid three">{service.types?.map((item) => <article className="card" key={item._key || item.name}><div className="icon">⚡</div><h3>{item.name}</h3><p>{item.description}</p></article>)}</div>{service.typesFootnote && <p className="muted small">{service.typesFootnote}</p>}</section>

      <section className="tint"><div className="page-wrap"><h2>{service.brandsHeading} in {area.name}</h2><p className="lede narrow">{service.brandsLede}</p><div className="brand-grid">{service.brands?.map((brand) => <span key={brand}>{brand}</span>)}</div><p className="muted small">{service.brandsNote}</p></div></section>

      <section className="page-wrap"><h2>{settings.trustHeading}</h2><p className="lede narrow">{settings.trustLede}</p><div className="metric-grid">{settings.trustMetrics?.map((metric) => <div className="metric" key={metric._key || metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}{settings.google?.rating && <div className="metric"><strong>{settings.google.rating}/5</strong><span>{settings.google.reviewCount} Google reviews</span></div>}</div><div className="card-grid three">{settings.trustCards?.map((item) => <article className="card" key={item._key || item.title}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>

      <section className="tint"><div className="page-wrap"><h2>{settings.reviewsHeading}</h2><div className="card-grid two">{page.reviews?.map((review, index) => <a className="review" href={review.sourceUrl} target="_blank" rel="noreferrer" key={review._key || index}><blockquote>{review.quote}</blockquote><span>{review.author}{review.location ? ` · ${review.location}` : ''}</span></a>)}</div><p className="muted small center">{settings.reviewsDisclaimer}</p></div></section>

      <section className="page-wrap"><h2>{service.whyHeading}</h2><p className="lede narrow">{service.whyLede}</p><div className="card-grid two">{service.whyItems?.map((item) => <details className="why" open key={item._key || item.title}><summary>{item.title}</summary><p>{item.body}</p></details>)}</div></section>

      <section className="tint" id="working-in-area"><div className="page-wrap"><h2>Working in {area.name}</h2><p className="lede narrow">{area.workingLede}</p><div className="gallery-grid">{page.workingPhotos?.map((photo, index) => <div className="photo working" key={photo._key || index} style={imageStyle(photo.externalUrl)} role="img" aria-label={photo.alt || `${service.name} work ${index + 1}`} />)}</div></div></section>

      <section className="page-wrap"><h2>{area.areasHeading}</h2><p className="lede narrow">{area.areasLede}</p><div className="neighborhood-grid">{area.subAreas?.map((subArea) => <article className="neighborhood" key={subArea._key || subArea.name}><div className="neighborhood-photo" style={imageStyle(subArea.photo?.externalUrl)} /><strong>{subArea.name}</strong><span>{subArea.note}</span></article>)}</div><p className="muted small">{area.areasNote}</p>{area.mapQuery && <iframe className="map" title={`${area.name} service area map`} loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(area.mapQuery)}&output=embed`} />}</section>

      <section className="page-wrap"><h2>Our other services in {area.name}</h2>{service.featuredCategory?.title && <a className="feature-card" href={service.featuredCategory.url}><span>{service.featuredCategory.tag}</span><h3>{service.featuredCategory.title}</h3><p>{service.featuredCategory.description}</p><strong>{service.featuredCategory.cta} →</strong></a>}<div className="card-grid two">{service.otherServices?.map((item) => <a className="card linked" href={item.url} key={item._key || item.name}><h3>{item.name}</h3><p>{item.description}</p></a>)}</div></section>

      <section className="tint"><div className="page-wrap"><h2>{service.pricing?.heading} in {area.name}</h2><p className="lede narrow">{service.pricing?.lede}</p><div className="table-scroll"><table><caption>{service.pricing?.caption}</caption><thead><tr><th>{service.pricing?.column1}</th><th>{service.pricing?.column2}</th><th>{service.pricing?.column3}</th></tr></thead><tbody>{service.pricing?.rows?.map((row) => <tr key={row._key || row.job}><td>{row.job}</td><td>{row.driver}</td><td>{row.permit}</td></tr>)}</tbody></table></div><p className="muted small">{service.pricing?.note}</p></div></section>

      <section className="page-wrap"><h2>{service.name} in {area.name} — FAQs</h2><div className="faq-list">{[...(service.faqs || []), ...(localFaqs || [])].map((faq) => <details key={faq._key || faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>

      <section className="page-wrap"><div className="closing"><h2>{service.ctaHeading} in {area.name}?</h2><p>{service.ctaBody}</p><div className="button-row center"><a className="button primary" href={`tel:${settings.phoneE164}`}>Call {settings.phoneDisplay}</a><a className="button secondary" href="#quote">{service.secondaryCta}</a></div></div></section>

      <section className="tint"><div className="page-wrap"><h2>{area.libraryHeading}</h2><p className="lede narrow">{area.libraryLede}</p><div className="guide-grid">{page.guides?.map((guide) => <article className="guide" key={guide._key || guide.title}><h3>{guide.title}</h3>{guideText(guide).slice(0, 8).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</article>)}</div></div></section>

      <div className="mobile-call"><a href={`tel:${settings.phoneE164}`}>Call {settings.phoneDisplay}</a><a href="#quote">Book service</a></div>
      <JsonLd data={data} />
    </main>
  )
}
