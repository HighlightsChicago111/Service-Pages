import type {CSSProperties} from 'react'
import {ConfirmNotes, Eyebrow, IconBadge, PhotoFrame, SectionHead} from '../atoms'
import {Icon, pickIcon, type IconName} from '../icon'
import {NoteLine} from './equipment'
import {parsePricing, permitTone, splitConfirm} from '@/lib/v3/content'
import type {BlockContext} from '../types'

export const hasPricing = ({page}: BlockContext) => Boolean(page.pricing?.rows?.length)

const PERMIT_ICON: Record<ReturnType<typeof permitTone>, IconName> = {yes: 'check', sometimes: 'clock', no: 'minus', other: 'info'}

function PermitPill({value, onDark}: {value?: string; onDark?: boolean}) {
  if (!value) return null
  const tone = permitTone(value)
  return <span className={`ds-permit ds-permit--${tone}${onDark ? ' ds-permit--dark' : ''}`}><Icon name={PERMIT_ICON[tone]} size={14} />{value}</span>
}

/** D14 Pricing stats: City permit medians as stat cards, other jobs as a compact list, cost drivers, incentives. */
export function PricingBlock({ctx}: {ctx: BlockContext}) {
  const {page, area, visuals, editorial, vocab} = ctx
  const pricing = page.pricing || {}
  const {stats, others, highest} = parsePricing(pricing.rows || [], vocab)
  const [jobLabel, driverLabel, permitLabel] = pricing.columns?.length === 3 ? pricing.columns : ['Job', 'Reported median, or what drives the price', 'Permit needed?']
  const drivers = pricing.drivers || []
  const incentives = splitConfirm(pricing.incentivesNote)
  const title = `${(pricing.heading || 'What this work costs').trim().replace(/\?$/, '')} in ${area.name}?`

  return (
    <div className="ds-wrap">
      <SectionHead eyebrow="Cost & permits" id="pricing-title" title={title} lede={pricing.lede} editorial={editorial} />
      {pricing.caption && <p className="ds-source"><IconBadge icon="cityStar" tone="blue" size={32} /><b>Data source</b><span>{pricing.caption}</span></p>}

      {stats.length > 0 && <ul className="ds-price-stats">
        {stats.map((stat, index) => {
          const featured = index === 0
          return (
            <li className={featured ? 'ds-price-card is-featured' : 'ds-price-card'} key={stat.job}>
              <div className="ds-price-top"><IconBadge icon={pickIcon(stat.job, 'receipt')} tone={featured ? 'navy' : 'blue'} /><span className="ds-price-permit">{permitLabel}<PermitPill value={stat.permit} onDark={featured} /></span></div>
              <h3 className="ds-h6">{stat.job}</h3>
              <p className="ds-price-value">{stat.display}</p>
              <p className="ds-price-sub">{stat.label}</p>
              <span className="ds-bar" style={{'--fill': stat.median / highest} as CSSProperties} aria-hidden="true" />
              {stat.permits && <p className="ds-price-count"><Icon name="fileText" size={18} />({stat.permits})</p>}
            </li>
          )
        })}
      </ul>}

      {others.length > 0 && <div className="ds-price-list" role="table" aria-label={`${page.name} jobs without a reported median`}>
        <div className="ds-price-row ds-price-row--head" role="row"><span role="columnheader">{jobLabel}</span><span role="columnheader">{driverLabel}</span><span role="columnheader">{permitLabel}</span></div>
        {others.map((row) => (
          <div className="ds-price-row" role="row" key={row.job}>
            <span role="cell" className="ds-price-job"><IconBadge icon={pickIcon(row.job, 'receipt')} tone="blue" size={40} /><b>{row.job}</b></span>
            <span role="cell">{row.driver}</span>
            <span role="cell" className="ds-price-pill"><PermitPill value={row.permit} /></span>
          </div>
        ))}
      </div>}
      {pricing.note && <NoteLine value={pricing.note} editorial={editorial} />}

      {drivers.length > 0 && <div className="ds-sub ds-drivers">
        <div className="ds-drivers-rail">
          <Eyebrow>{drivers.length} cost drivers</Eyebrow>
          <h3 className="ds-h3">{pricing.driversHeading}</h3>
          {visuals.drivers && <PhotoFrame photo={visuals.drivers} className="ds-photo--tall" />}
        </div>
        <div className="ds-drivers-list">
          <div className="ds-drivers-head"><span>Factor <i aria-hidden="true" /> Why it changes the price</span><span>When you find out</span></div>
          <ol>
            {drivers.map((driver, index) => (
              <li key={driver._key || driver.factor}>
                <span className="ds-numbered-num">{String(index + 1).padStart(2, '0')}</span>
                <div><h4 className="ds-h6">{driver.factor}</h4>{driver.why && <p>{driver.why}</p>}</div>
                {driver.when && <span className="ds-when"><Icon name="clock" size={14} />{driver.when}</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>}

      {(incentives.text || (editorial && incentives.notes.length > 0)) && <div className="ds-callout-light">
        <IconBadge icon="tag" tone="blue" />
        <div><p className="ds-label-head ds-label-head--blue">Incentives</p>{incentives.text && <p className="ds-callout-text">{incentives.text}</p>}<ConfirmNotes notes={incentives.notes} show={editorial} /></div>
      </div>}
    </div>
  )
}
