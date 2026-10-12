import {Copy, Eyebrow, IconBadge, PhotoFrame} from '../atoms'
import {Icon, pickIcon} from '../icon'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

export const hasReasons = ({page}: BlockContext) => Boolean(page.why?.items?.length)

/** D9 Reasons band (NAVY): head + photo, green stat row, 3×2 reasons on hairlines. */
export function ReasonsBlock({ctx}: {ctx: BlockContext}) {
  const {page, visuals, editorial} = ctx
  const why = page.why || {}
  return (
    <div className="ds-wrap">
      <div className="ds-reasons-top">
        <div>
          <Eyebrow>Why Highlights</Eyebrow>
          <h2 className="ds-h2" id="why-us-title">{questionHeading(why.heading)}</h2>
          {why.lede && <p className="ds-lede">{why.lede}</p>}
          {visuals.reasonStats.length > 0 && <dl className="ds-green-stats">
            {visuals.reasonStats.map((stat) => <div key={stat.label}><dt>{stat.value}</dt><dd>{stat.label}</dd></div>)}
          </dl>}
        </div>
        {visuals.reasons && <PhotoFrame photo={visuals.reasons} className="ds-reasons-photo" />}
      </div>
      <ol className="ds-reasons">
        {why.items?.map((item, index) => (
          <li key={item._key || item.title}>
            <div className="ds-reason-top"><IconBadge icon={pickIcon(item.title, 'circleCheck')} tone="navy" /><span>{String(index + 1).padStart(2, '0')}</span></div>
            <h3 className="ds-h6">{item.title}</h3>
            <Copy value={item.body} show={editorial} />
            {item.linkLabel && item.linkAnchor && <a className="ds-ghost ds-ghost--dark" href={`#${item.linkAnchor}`}><span>{item.linkLabel}</span><Icon name="arrowRight" size={16} /></a>}
          </li>
        ))}
      </ol>
    </div>
  )
}
