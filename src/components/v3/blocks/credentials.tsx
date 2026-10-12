import {Eyebrow, GoogleG, IconBadge, PhotoFrame, Stars} from '../atoms'
import {Icon, pickIcon, type IconName} from '../icon'
import {credentials} from '@/lib/v3/content'
import {SHARED_PHOTOS} from '@/lib/v3/visuals'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

export const hasCredentials = ({settings}: BlockContext) => Boolean(settings.trustMetrics?.length || settings.trustCards?.length)

const PROMISE_ICONS: IconName[] = ['search', 'clipboardCheck', 'users']

/** D7 Credentials band (NAVY): only verified facts; reused unchanged on every page. */
export function CredentialsBlock({ctx}: {ctx: BlockContext}) {
  const {settings} = ctx
  const stats = credentials(settings)
  const google = settings.google

  return (
    <div className="ds-wrap">
      <div className="ds-head ds-head--split ds-head--dark">
        <div className="ds-head-main"><Eyebrow>About Highlights Chicago</Eyebrow><h2 className="ds-h2" id="trust-title">{questionHeading(settings.trustHeading)}</h2></div>
        {settings.trustLede && <p className="ds-lede ds-head-lede">{settings.trustLede}</p>}
      </div>
      <div className="ds-cred">
        <PhotoFrame photo={SHARED_PHOTOS.van} pill={false} className="ds-cred-photo">
          {settings.address?.street && <span className="ds-address-chip"><Icon name="mapPin" size={16} />{settings.address.street}</span>}
        </PhotoFrame>
        <div className="ds-cred-stats">
          {stats.map((stat) => (
            <div className="ds-stat-tile" key={stat.value}>
              <p className="ds-stat-tag"><Icon name={stat.icon} size={16} />{stat.tag}</p>
              <p className="ds-stat-value">{stat.value}</p>
              <p className="ds-stat-caption">{stat.label}</p>
            </div>
          ))}
          {google?.rating && <div className="ds-stat-tile ds-stat-tile--google">
            <span className="ds-google-disc"><GoogleG size={36} /></span>
            <p className="ds-google-score"><b>{google.rating}</b><span>/5</span></p>
            <div className="ds-google-meta"><Stars size={18} /><p>{google.reviewCount} Google reviews</p></div>
            <p className="ds-stat-tag ds-stat-tag--end"><Icon name="check" size={16} />Google rating</p>
          </div>}
        </div>
      </div>
      {Boolean(settings.trustCards?.length) && <ul className="ds-promises">
        {settings.trustCards?.map((card, index) => (
          <li key={card._key || card.title}>
            <IconBadge icon={PROMISE_ICONS[index] || pickIcon(card.title)} tone="navy" />
            <h3 className="ds-h5">{card.title}</h3>
            {card.body && <p>{card.body}</p>}
          </li>
        ))}
      </ul>}
    </div>
  )
}
