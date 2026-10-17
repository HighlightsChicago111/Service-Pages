/* eslint-disable @next/next/no-img-element -- Full-bleed hero photo; native img keeps it crawlable and lets it load eagerly. */
import Link from 'next/link'
import {Button, Copy, Eyebrow, GoogleG, PhotoFrame, Stars} from './atoms'
import {Icon} from './icon'
import {QuoteForm} from './quote-form'
import {jobNoun} from '@/lib/v3/content'
import {focus} from '@/lib/v3/visuals'
import {PUBLIC_SITE_ORIGIN} from '@/lib/service-urls'
import type {BlockContext} from './types'

/** D1 Hero + quote form (dark photo band). */
export function HeroQuote({ctx}: {ctx: BlockContext}) {
  const {page, area, settings, visuals, editorial, tel, phone} = ctx
  const hero = visuals.hero
  const noun = jobNoun(page.jobPaths?.heading)
  const google = settings.google
  const chips = (settings.trustLines || []).slice(0, google?.rating ? 2 : 3)
  const crewIllustrative = visuals.crew.some((photo) => photo.illustrative)

  return (
    <header className="ds-hero" id="top">
      {hero && <img className="ds-hero-bg" src={hero.src} alt={hero.alt} loading="eager" fetchPriority="high" decoding="async" style={focus(hero)} />}
      <div className="ds-hero-scrim" aria-hidden="true" />
      <div className="ds-wrap ds-hero-grid">
        <div className="ds-hero-copy">
          <nav className="ds-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><a href={PUBLIC_SITE_ORIGIN}>Home</a></li>
              <li><Link href="/">Services</Link></li>
              {page.parentName && <li>{page.parentName}</li>}
              <li aria-current="page">{page.name} in {area.name}</li>
            </ol>
          </nav>
          {area.heroEyebrow && <Eyebrow className="ds-eyebrow--light">{area.heroEyebrow}</Eyebrow>}
          <h1 className="ds-h1">{page.hero.h1Prefix} in {area.name}</h1>
          <Copy value={page.hero.lede} show={editorial} className="ds-hero-lede" />
          <ul className="ds-trust-chips" aria-label="Credentials">
            {chips.map((line, index) => <li key={line}><Icon name={index === 0 ? 'shieldCheck' : 'circleCheck'} size={16} />{line}</li>)}
            {google?.rating && <li className="ds-trust-chip--google"><GoogleG size={20} /><b>{google.rating}</b><span className="ds-out">/5</span><Stars size={14} /><span>{google.reviewCount} reviews</span></li>}
          </ul>
          <div className="ds-cta-row">
            <Button href={tel} tone="light" icon="phone">Call {phone}</Button>
            <Button href="#quote" tone="outline-light" trailing="arrowRight">{page.hero.secondaryCta || 'Request service'}</Button>
          </div>
          {visuals.crew.length > 0 && <div className="ds-crew">
            <div className="ds-crew-head">
              <p>{area.galleryLabel || 'From the crews'}{crewIllustrative && <small>Illustrative photos</small>}</p>
              <a href="#working-in-area">See more<Icon name="arrowRight" size={16} /></a>
            </div>
            <ul className="ds-crew-strip">
              {visuals.crew.map((photo, index) => <li key={photo.src}><PhotoFrame photo={photo} pill={false} eager={index === 0}><span className="ds-crew-label">{photo.label}</span></PhotoFrame></li>)}
            </ul>
          </div>}
        </div>
        <QuoteForm
          title={`${page.name} in ${area.name}`}
          subtitle={settings.formSubtitle}
          note={settings.formNote}
          service={page.name}
          area={area.name}
          jobLabel={noun ? `Your ${noun} job` : 'Your job'}
          issueQuestion={page.form?.issueQuestion}
          issueOptions={page.form?.issueOptions}
          buildingTypes={area.buildingTypes}
          extraFields={page.form?.extraFields}
          addressPlaceholder={area.addressPlaceholder}
        />
      </div>
      {hero?.illustrative && <span className="ds-pill-caption ds-hero-pill">Illustrative photo</span>}
    </header>
  )
}
