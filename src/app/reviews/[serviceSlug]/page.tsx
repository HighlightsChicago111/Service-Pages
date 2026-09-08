import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {CollectionFooter, CollectionHeader} from '@/components/collection-chrome'
import {GoogleRating, GoogleReviewCard} from '@/components/google-review-card'
import {metadataClient} from '@/sanity/lib/client'
import {sanityFetch} from '@/sanity/lib/live'
import {REVIEW_SERVICE_QUERY} from '@/sanity/lib/queries'
import type {ReviewServiceData} from '@/types/content'

export const revalidate = 60
type Props = {params: Promise<{serviceSlug: string}>}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const resolved = await params
  const data = await metadataClient.fetch(REVIEW_SERVICE_QUERY, resolved) as ReviewServiceData
  if (!data.page) return {}
  const title = `${data.page.serviceName} Reviews in Chicago`
  return {
    title,
    description: `Read Google review excerpts for ${data.page.serviceName.toLowerCase()} from Highlights Chicago customers, with links to every original review.`,
    alternates: {canonical: `https://www.highlightschicago.com/services/reviews/${data.page.serviceSlug}`},
  }
}

export default async function ServiceReviewsPage({params}: Props) {
  const resolved = await params
  const {data} = await sanityFetch({query: REVIEW_SERVICE_QUERY, params: resolved, stega: false})
  const typed = data as ReviewServiceData
  if (!typed.page || !typed.settings) notFound()
  const {page, settings} = typed
  const aggregateRating = settings.google?.rating || 4.9
  const years = Array.from(new Set(page.reviews.map((review) => (review.reviewDate || review.location || '').slice(0, 4)).filter((year) => /^20\d{2}$/.test(year)))).sort().reverse()

  return (
    <div className="collection-page review-page">
      <CollectionHeader />
      <main>
        <section className="review-detail-hero">
          <div className="collection-wrap">
            <nav className="review-breadcrumb" aria-label="Breadcrumb"><a href="https://www.highlightschicago.com/">Home</a><span>/</span><Link href="/reviews">Reviews</Link><span>/</span><strong>{page.serviceName}</strong></nav>
            <p className="collection-hero-kicker">Google reviews by equipment</p>
            <h1>{page.serviceName} reviews</h1>
            <p>Customer experiences tagged to this exact service. Read the full excerpts here, then use the source link on any card to verify it on Google.</p>
            <div className="review-detail-summary"><GoogleRating rating={aggregateRating} count={settings.google?.reviewCount} largeMark /><span>{page.reviews.length} service-specific excerpts</span>{years.length > 0 && <span>{years.join(' · ')}</span>}</div>
          </div>
        </section>

        <section className="review-detail-content">
          <div className="collection-wrap review-detail-grid">
            <aside className="review-detail-sidebar">
              <p className="review-filter-kicker">Browse reviews</p>
              <nav>
                <Link href={{pathname: '/reviews', query: {view: 'rating'}}}><span>By rating</span><b>→</b></Link>
                <Link href={{pathname: '/reviews', query: {view: 'years'}}}><span>By year</span><b>→</b></Link>
                <Link href={{pathname: '/reviews', query: {view: 'equipment'}}}><span>All equipment</span><b>→</b></Link>
                <Link href={`/${page.serviceSlug}/${page.areaSlug}`}><span>View this service</span><b>→</b></Link>
              </nav>
              <div className="review-sidebar-help"><span>Considering this work?</span><strong>Talk through the scope with a Chicago electrician.</strong><a href={`tel:${settings.phoneE164 || '7732623333'}`}>Call {settings.phoneDisplay || '(773) 262-3333'}</a></div>
            </aside>
            <div className="review-detail-main">
              <div className="review-detail-heading"><div><p className="collection-kicker">What customers said</p><h2>All {page.serviceName.toLowerCase()} reviews</h2></div><p>{page.reviews.length} excerpts selected because they mention this service or closely related work.</p></div>
              <div className="reviews-grid review-detail-cards">
                {page.reviews.map((review, index) => <GoogleReviewCard review={review} aggregateRating={aggregateRating} fullText key={review._key || review.sourceId || index} />)}
              </div>
              {settings.google?.reviewsUrl && <div className="review-google-cta"><div><span>Want the complete picture?</span><strong>Read all {settings.google.reviewCount || ''} public reviews on Google.</strong></div><a href={settings.google.reviewsUrl} target="_blank" rel="noreferrer">Open Google reviews <span aria-hidden="true">→</span></a></div>}
              {settings.reviewsDisclaimer && <p className="review-disclaimer">{settings.reviewsDisclaimer}</p>}
            </div>
          </div>
        </section>
      </main>
      <CollectionFooter />
    </div>
  )
}
