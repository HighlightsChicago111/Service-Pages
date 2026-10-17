import {Eyebrow, GoogleG, Stars} from '../atoms'
import {Icon} from '../icon'
import {ReviewText} from '../review-text'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

export const hasReviews = ({page}: BlockContext) => Boolean(page.reviews?.length)

const SHOP_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Highlights+Chicago+Inc+5766+N+Lincoln+Ave+Chicago'

/** Decorative street plan of the shop's block (Lincoln Ave diagonal, lake to the east). */
function ShopMapArt() {
  return (
    <svg className="ds-mini-map" viewBox="0 0 380 240" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="380" height="240" className="mm-land" />
      {[30, 70, 110, 150, 190, 230].map((y) => <path d={`M0 ${y}H320`} className="mm-street" key={`h${y}`} />)}
      {[40, 80, 120, 160, 200, 240, 280].map((x) => <path d={`M${x} 0V240`} className="mm-street" key={`v${x}`} />)}
      <rect x="18" y="160" width="74" height="58" rx="4" className="mm-park" />
      <rect x="205" y="180" width="64" height="52" rx="4" className="mm-park" />
      <path d="M20 0 330 230" className="mm-avenue" />
      <path d="M318 0c-10 60 18 120 0 240h62V0z" className="mm-lake" />
      <text x="352" y="70" className="mm-lake-label" transform="rotate(90 352 70)">LAKE MICHIGAN</text>
      <text x="190" y="128" className="mm-road-label" transform="rotate(37 190 128)">N LINCOLN AVE</text>
      <circle cx="150" cy="100" r="24" className="mm-halo" />
      <path d="M150 64c-10 0-18 8-18 18 0 13 18 30 18 30s18-17 18-30c0-10-8-18-18-18z" className="mm-pin" />
      <circle cx="150" cy="82" r="6" className="mm-pin-dot" />
    </svg>
  )
}

const initial = (name?: string) => (name || '?').trim().charAt(0).toUpperCase()

/** D8 Google reviews: place card + map card, 2×2 real, linked, unedited reviews. */
export function ReviewsBlock({ctx}: {ctx: BlockContext}) {
  const {page, settings} = ctx
  const google = settings.google
  const placeUrl = google?.reviewsUrl || SHOP_MAPS_URL
  const reviews = (page.reviews || []).slice(0, 4)

  return (
    <div className="ds-wrap">
      <div className="ds-head"><div className="ds-head-main"><Eyebrow>Google reviews</Eyebrow><h2 className="ds-h2" id="reviews-title">{questionHeading(settings.reviewsHeading)}</h2></div></div>
      <div className="ds-reviews">
        <aside className="ds-place-card">
          <div className="ds-place-top">
            <div className="ds-place-brand"><GoogleG size={40} /><div><p className="ds-place-title">Google reviews</p><p className="ds-place-sub">Highlights Chicago</p></div></div>
            {google?.rating && <div className="ds-place-score">
              <p className="ds-place-num"><b>{google.rating}</b><span>/5</span></p>
              <div><Stars size={20} /><p>{google.reviewCount} reviews</p></div>
            </div>}
            <a className="ds-ghost" href={placeUrl}><span>Read all {google?.reviewCount ? `${google.reviewCount} ` : ''}reviews</span><Icon name="arrowRight" size={16} /></a>
          </div>
          <a className="ds-place-map" href={SHOP_MAPS_URL} aria-label="Open the Highlights Chicago shop in Google Maps">
            <ShopMapArt />
            <span className="ds-map-chip"><Icon name="mapPin" size={14} />Google Maps</span>
          </a>
          <div className="ds-place-foot">
            <p><b>Highlights Chicago · {settings.address?.street}</b></p>
            <a className="ds-ghost" href={SHOP_MAPS_URL}><span>Open in Google Maps</span><Icon name="arrowRight" size={16} /></a>
          </div>
        </aside>
        <ul className="ds-review-grid">
          {reviews.map((review, index) => (
            <li className="ds-review" key={review._key || index}>
              <header className="ds-review-head">
                <span className="ds-avatar" aria-hidden="true">{initial(review.author)}</span>
                <div><p className="ds-review-name">{review.author}</p>{review.date && <p className="ds-review-date">{review.date}</p>}</div>
                <GoogleG size={22} />
              </header>
              <ReviewText text={review.quote} />
              <footer className="ds-review-foot">
                <span>Posted on Google</span>
                {review.sourceUrl && <a className="ds-ghost" href={review.sourceUrl} target="_blank" rel="noreferrer"><span>View on Google</span><Icon name="arrowRight" size={16} /></a>}
              </footer>
            </li>
          ))}
        </ul>
      </div>
      {settings.reviewsDisclaimer && <p className="ds-footnote"><Icon name="info" size={16} />{settings.reviewsDisclaimer}</p>}
    </div>
  )
}
