/* eslint-disable @next/next/no-img-element -- Logo file from /public. */
import {Button, Copy, Eyebrow, IconBadge} from '../atoms'
import {AreaCarousel, type AreaCard} from '../area-carousel'
import {Icon} from '../icon'
import {jobNoun} from '@/lib/v3/content'
import {LOGO} from '@/lib/v3/visuals'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

export const hasAreas = ({area}: BlockContext) => Boolean(area.subAreas?.length || area.areasHeading)

/** D12 Areas + map (NAVY): full-width live map, shop card, area carousel, "Not listed?" + service note. */
export function AreasBlock({ctx}: {ctx: BlockContext}) {
  const {page, area, settings, editorial, tel, phone} = ctx
  const address = settings.address
  const fullAddress = address ? `${address.street}, ${address.city}, ${address.state} ${address.zip}` : ''
  const mapsQuery = encodeURIComponent(`${settings.companyName}, ${fullAddress}`)
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`
  const home = area.subAreas?.find((sub) => /home patch/i.test(sub.note || ''))
  const noun = jobNoun(page.jobPaths?.heading)
  const cards: AreaCard[] = (area.subAreas || []).map((sub) => ({
    name: sub.name,
    note: sub.note,
    src: sub.photo?.resolvedUrl || sub.photo?.externalUrl,
    alt: sub.photo?.alt || `${sub.name}, ${area.name}`,
    credit: sub.photo?.credit,
  }))

  return (
    <div className="ds-wrap">
      <div className="ds-head ds-head--aside ds-head--dark">
        <div className="ds-head-main"><Eyebrow>Service area</Eyebrow><h2 className="ds-h2" id="areas-title">{questionHeading(area.areasHeading)}</h2>{area.areasLede && <p className="ds-lede">{area.areasLede}</p>}</div>
        <div className="ds-head-aside"><a className="ds-text-cta ds-text-cta--dark" href={openUrl}>Open in Google Maps<Icon name="arrowUpRight" size={18} /></a></div>
      </div>

      <div className="ds-map-frame">
        <div className="ds-map-canvas">
          <iframe title={`Map of ${settings.companyName} and the areas it covers`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${mapsQuery}&z=12&output=embed`} />
          <span className="ds-map-chip"><Icon name="map" size={14} />Google Maps · live embed</span>
        </div>
        <div className="ds-shop-card">
          <img src={LOGO} alt="Highlights Chicago Electrical Services" width={140} height={34} loading="lazy" />
          <h3 className="ds-h5">{settings.companyName.replace(/\s+Inc\.?$/, '')}</h3>
          <p className="ds-shop-address"><Icon name="mapPin" size={18} />{fullAddress}</p>
          {home && <p className="ds-proof-chip"><i aria-hidden="true" />{home.name} · {home.note}</p>}
          <Button href={directionsUrl} icon="navigation" block>Get directions</Button>
        </div>
      </div>

      {cards.length > 0 && <AreaCarousel areas={cards} />}

      <div className="ds-areas-foot">
        {area.areasNote && <div className="ds-not-listed">
          <div className="ds-not-listed-text"><IconBadge icon="search" tone="navy" size={44} /><p>{area.areasNote}</p></div>
          <Button href={tel} tone="outline-light" icon="phone" size="m">Call {phone}</Button>
        </div>}
        {page.areasCallout && <div className="ds-callout-rule">
          <IconBadge icon="sun" tone="navy" size={48} />
          <div><p className="ds-label-head ds-label-head--light">{noun ? `${noun} note` : 'Service note'} · {area.name} buildings</p><Copy value={page.areasCallout} show={editorial} /></div>
        </div>}
      </div>
    </div>
  )
}
