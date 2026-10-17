import type {ComponentType} from 'react'
import {telHref} from './atoms'
import {SiteFooter, SiteHeader} from './chrome'
import {HeroQuote} from './hero'
import {Icon} from './icon'
import {ChecklistBlock, hasChecklist} from './blocks/checklist'
import {ClosingBlock} from './blocks/closing'
import {CredentialsBlock, hasCredentials} from './blocks/credentials'
import {EquipmentBlock, hasEquipment} from './blocks/equipment'
import {FaqBlock, faqsOf, hasFaq} from './blocks/faq'
import {GalleryBlock, hasGallery} from './blocks/gallery'
import {JobsBlock, hasJobs} from './blocks/jobs'
import {LibraryBlock, hasLibrary} from './blocks/library'
import {LogosBlock, hasLogos} from './blocks/logos'
import {PricingBlock, hasPricing} from './blocks/pricing'
import {ProcessBlock, hasProcess} from './blocks/process'
import {ReasonsBlock, hasReasons} from './blocks/reasons'
import {RelatedBlock, hasRelated} from './blocks/related'
import {ReviewsBlock, hasReviews} from './blocks/reviews'
import {ScopeBlock, hasScope} from './blocks/scope'
import {SymptomsBlock, hasSymptoms} from './blocks/symptoms'
import {AreasBlock, hasAreas} from './blocks/areas'
import {hasConfirm, vocabularyFrom} from '@/lib/v3/content'
import {visualsFor} from '@/lib/v3/visuals'
import {clusterForService} from '@/lib/clusters'
import {PUBLIC_SITE_ORIGIN, SERVICES_PATH, clusterPagePath, servicePageUrl} from '@/lib/service-urls'
import type {V2PageData} from '@/types/v2'
import type {Band, BlockContext} from './types'

type BlockDef = {id: string; kind: 'light' | 'navy' | 'photo'; has: (ctx: BlockContext) => boolean; Block: ComponentType<{ctx: BlockContext}>}

/** Standard L3 order (playbook Part C). Drop a block only when its content does not exist. */
const BLOCKS: BlockDef[] = [
  {id: 'your-job', kind: 'light', has: hasJobs, Block: JobsBlock},
  {id: 'equipment', kind: 'light', has: hasEquipment, Block: EquipmentBlock},
  {id: 'site-assessment', kind: 'light', has: hasChecklist, Block: ChecklistBlock},
  {id: 'diagnose', kind: 'light', has: hasSymptoms, Block: SymptomsBlock},
  {id: 'brands', kind: 'light', has: hasLogos, Block: LogosBlock},
  {id: 'trust', kind: 'navy', has: hasCredentials, Block: CredentialsBlock},
  {id: 'reviews', kind: 'light', has: hasReviews, Block: ReviewsBlock},
  {id: 'why-us', kind: 'navy', has: hasReasons, Block: ReasonsBlock},
  {id: 'working-in-area', kind: 'light', has: hasGallery, Block: GalleryBlock},
  {id: 'process', kind: 'light', has: hasProcess, Block: ProcessBlock},
  {id: 'areas', kind: 'navy', has: hasAreas, Block: AreasBlock},
  {id: 'other-services', kind: 'light', has: hasRelated, Block: RelatedBlock},
  {id: 'pricing', kind: 'light', has: hasPricing, Block: PricingBlock},
  {id: 'whats-included', kind: 'light', has: hasScope, Block: ScopeBlock},
  {id: 'faq', kind: 'light', has: hasFaq, Block: FaqBlock},
  {id: 'closing', kind: 'photo', has: () => true, Block: ClosingBlock},
  {id: 'guides', kind: 'light', has: hasLibrary, Block: LibraryBlock},
]

/**
 * Band rhythm white → grey → white → NAVY (playbook A.9): a light block after a navy or
 * photo band is white, and consecutive light blocks alternate, so dropped blocks never
 * leave two greys touching.
 */
function withBands(blocks: BlockDef[]): Array<BlockDef & {band: Band}> {
  let previous: Band = 'photo'
  return blocks.map((block) => {
    const band: Band = block.kind === 'light' ? (previous === 'white' ? 'grey' : 'white') : block.kind
    previous = band
    return {...block, band}
  })
}

function JsonLd({ctx}: {ctx: BlockContext}) {
  const {page, area, settings} = ctx
  // Unconfirmed FAQs stay out of the schema until they are resolved.
  const answered = faqsOf(ctx).filter((faq) => !hasConfirm(faq.answer) && !hasConfirm(faq.question))
  const cluster = clusterForService(page.slug)
  const graph = [
    {
      '@type': settings.schemaBusinessType || 'Electrician',
      '@id': `${PUBLIC_SITE_ORIGIN}/#business`,
      name: settings.companyName,
      telephone: settings.phoneE164 || settings.phoneDisplay,
      url: PUBLIC_SITE_ORIGIN,
      email: settings.email,
      address: {'@type': 'PostalAddress', streetAddress: settings.address?.street, addressLocality: settings.address?.city, addressRegion: settings.address?.state, postalCode: settings.address?.zip, addressCountry: 'US'},
      geo: settings.shopLocation ? {'@type': 'GeoCoordinates', latitude: settings.shopLocation.lat, longitude: settings.shopLocation.lng} : undefined,
      aggregateRating: settings.google?.rating ? {'@type': 'AggregateRating', ratingValue: settings.google.rating, reviewCount: settings.google.reviewCount} : undefined,
    },
    {'@type': 'Service', name: `${page.hero.h1Prefix} in ${area.name}`, serviceType: page.name, provider: {'@id': `${PUBLIC_SITE_ORIGIN}/#business`}, areaServed: {'@type': 'City', name: `${area.name}, ${area.state}`}},
    {'@type': 'BreadcrumbList', itemListElement: [
      {name: 'Home', item: PUBLIC_SITE_ORIGIN},
      {name: 'Services', item: `${PUBLIC_SITE_ORIGIN}${SERVICES_PATH}`},
      ...(cluster ? [{name: cluster.name, item: `${PUBLIC_SITE_ORIGIN}${clusterPagePath(cluster.slug)}`}] : []),
      {name: `${page.name} in ${area.name}`, item: servicePageUrl(page.slug)},
    ].map((crumb, index) => ({'@type': 'ListItem', position: index + 1, ...crumb}))},
    ...(answered.length ? [{'@type': 'FAQPage', mainEntity: answered.map((faq) => ({'@type': 'Question', name: faq.question, acceptedAnswer: {'@type': 'Answer', text: faq.answer}}))}] : []),
  ]
  const json = JSON.stringify({'@context': 'https://schema.org', '@graph': graph}).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: json}} />
}

/**
 * The Design System v3 service landing page (reference build: Solar Panel Installation).
 * `fontClassName` carries the v3 font variables; the route sets it with the stylesheet.
 */
export function ServiceLandingPage({data, draft, fontClassName}: {data: V2PageData; draft: boolean; fontClassName?: string}) {
  const {page, area, settings, routes} = data
  if (!page || !area || !settings) return null
  const ctx: BlockContext = {
    page,
    area,
    settings,
    routes,
    visuals: visualsFor(page, area),
    editorial: draft || process.env.NODE_ENV !== 'production',
    vocab: vocabularyFrom(page),
    tel: telHref(settings.phoneE164, settings.phoneDisplay),
    phone: settings.phoneDisplay || '',
  }
  const blocks = withBands(BLOCKS.filter((block) => block.has(ctx)))

  return (
    <div className={fontClassName ? `ds ${fontClassName}` : 'ds'}>
      <a className="ds-skip" href="#main">Skip to content</a>
      <SiteHeader settings={settings} routes={routes} tel={ctx.tel} />
      <main id="main">
        <HeroQuote ctx={ctx} />
        {blocks.map(({id, band, Block}) => (
          <section className={`ds-band ds-band--${band} ds-band--${id}`} id={id} aria-labelledby={`${id}-title`} key={id}>
            <Block ctx={ctx} />
          </section>
        ))}
      </main>
      <SiteFooter settings={settings} tel={ctx.tel} />
      <div className="ds-callbar">
        <a className="ds-btn ds-btn--primary" href={ctx.tel}><Icon name="phone" size={18} /><span>Call</span></a>
        <a className="ds-btn ds-btn--secondary" href="#quote"><span>{page.hero.secondaryCta || 'Request service'}</span></a>
      </div>
      <JsonLd ctx={ctx} />
    </div>
  )
}
