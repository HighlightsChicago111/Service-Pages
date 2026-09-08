import type {CSSProperties, ReactNode} from 'react'
import type {Review} from '@/types/content'

export function GoogleMark({large = false}: {large?: boolean}) {
  return (
    <span className={`mark${large ? ' mark-lg' : ''}`} title="Google">
      <svg viewBox="0 0 48 48" aria-label="Google" role="img">
        <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.6h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.2z" />
        <path fill="#34A853" d="M24 46c6 0 11-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8 41.3 15.4 46 24 46z" />
        <path fill="#FBBC04" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5A22 22 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.6z" />
        <path fill="#EA4335" d="M24 10.3c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C35 3.8 30 1.8 24 1.8 15.4 1.8 8 6.5 4.5 13.9l7.3 5.7c1.7-5.2 6.5-9.3 12.2-9.3z" />
      </svg>
    </span>
  )
}

export function GoogleRating({rating, count, compact = false, largeMark = false}: {rating: number; count?: number; compact?: boolean; largeMark?: boolean}) {
  const style = {'--pct': `${Math.max(0, Math.min(100, rating * 20))}%`} as CSSProperties
  return (
    <span className={`rating src-google${compact ? ' rating-sm' : ''}`}>
      <GoogleMark large={largeMark} />
      <span className="num">{rating.toFixed(1)}</span><span className="out">/5</span>
      <span className="stars" style={style} aria-label={`${rating.toFixed(1)} out of 5 stars`}>★★★★★</span>
      {count !== undefined && <span className="cnt">{count} reviews</span>}
    </span>
  )
}

function ReviewShell({review, children, className}: {review: Review; children: ReactNode; className: string}) {
  if (!review.sourceUrl) return <article className={className}>{children}</article>
  return <a className={className} href={review.sourceUrl} target="_blank" rel="noreferrer">{children}</a>
}

export function GoogleReviewCard({review, aggregateRating, fullText = false}: {review: Review; aggregateRating?: number; fullText?: boolean}) {
  const rating = review.rating || aggregateRating
  const context = review.reviewDate || review.location
  return (
    <ReviewShell review={review} className={`rev-card${fullText ? ' rev-card-full' : ''}`}>
      <blockquote>{review.quote}</blockquote>
      {rating && <div className="rev-rating"><GoogleRating rating={rating} compact /></div>}
      <footer className="rev-meta">
        <span><strong>{review.author || 'Google reviewer'}</strong>{context && <> · <time dateTime={review.reviewDate || undefined}>{context}</time></>}</span>
        {review.sourceUrl && <span className="rev-src">View on Google →</span>}
      </footer>
    </ReviewShell>
  )
}
