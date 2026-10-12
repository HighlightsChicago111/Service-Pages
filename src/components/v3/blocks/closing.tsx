/* eslint-disable @next/next/no-img-element -- Full-bleed band photo and the white logo from /public. */
import {Button, Eyebrow, GoogleG, IconBadge, Stars} from '../atoms'
import {Icon, pickIcon} from '../icon'
import {LogoTile} from './logos'
import {credentials} from '@/lib/v3/content'
import {LOGO_WHITE, SHARED_PHOTOS} from '@/lib/v3/visuals'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

/** D17 Closing CTA: branded photo into navy, proof numerals, "have these ready", brand logos. */
export function ClosingBlock({ctx}: {ctx: BlockContext}) {
  const {page, area, settings, tel, phone} = ctx
  const cta = page.cta || {}
  const proof = credentials(settings).filter((item) => item.kind !== 'founder')
  const order = ['bbb', 'permits', 'licence', 'other']
  proof.sort((left, right) => order.indexOf(left.kind) - order.indexOf(right.kind))
  const google = settings.google
  const brands = page.brands?.items || []
  const van = SHARED_PHOTOS.van

  return (
    <>
      <img className="ds-closing-bg" src={van.src} alt="" loading="lazy" decoding="async" />
      <div className="ds-closing-scrim" aria-hidden="true" />
      <div className="ds-wrap ds-closing">
        <img className="ds-closing-logo" src={LOGO_WHITE} alt="Highlights Chicago Electrical Services" width={170} height={50} loading="lazy" />
        <Eyebrow>Your next step</Eyebrow>
        <h2 className="ds-h1 ds-closing-title" id="closing-title">{questionHeading(`${cta.heading || 'Planning this work'} in ${area.name}?`)}</h2>
        {cta.body && <p className="ds-lede">{cta.body}</p>}
        <div className="ds-cta-row">
          <Button href={tel} tone="light" icon="phone">Call {phone}</Button>
          <Button href="#quote" tone="outline-light">{page.hero.secondaryCta || 'Request service'}</Button>
        </div>

        <ul className="ds-proof-strip">
          {google?.rating && <li><p className="ds-proof-big"><span className="ds-google-disc"><GoogleG size={22} /></span><b>{google.rating}</b><Stars size={14} /></p><p>{google.reviewCount} Google reviews</p></li>}
          {proof.map((item) => <li key={item.value}><p className="ds-proof-big"><IconBadge icon={item.icon} tone="navy" size={40} /><b>{item.value}</b></p><p>{item.caption}</p></li>)}
        </ul>

        {Boolean(cta.readyItems?.length) && <div className="ds-ready">
          <div className="ds-ready-head">
            <span className="ds-ready-badge"><Icon name="clipboardCheck" size={28} /></span>
            <h3 className="ds-h4">{cta.readyHeading || 'Have these ready when you call'}</h3>
            <a className="ds-ghost ds-ghost--dark ds-ghost--caps" href={tel}><span>Call {phone}</span><Icon name="arrowRight" size={16} /></a>
          </div>
          <ul className="ds-ready-items">
            {cta.readyItems?.map((item) => <li key={item}><IconBadge icon={pickIcon(item, 'circleCheck')} tone="navy" size={44} /><p>{item}</p></li>)}
          </ul>
        </div>}

        {brands.length > 0 && <div className="ds-closing-brands">
          <Eyebrow>{page.brands?.heading}</Eyebrow>
          <ul>{brands.map((brand) => <LogoTile brand={brand} compact key={brand} />)}</ul>
        </div>}
      </div>
    </>
  )
}
