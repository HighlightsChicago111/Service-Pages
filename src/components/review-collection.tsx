'use client'

/* eslint-disable @next/next/no-img-element -- Sanity review collection images remain crawlable. */

import Link from 'next/link'
import {useMemo, useState} from 'react'
import type {Review, ReviewCollectionItem} from '@/types/content'
import {serviceCardImageForSlug} from '@/lib/collection-items'
import {GoogleRating} from './google-review-card'

export type ReviewAxis = 'rating' | 'years' | 'equipment'

type Props = {
  pages: ReviewCollectionItem[]
  aggregateRating: number
  activeAxis: ReviewAxis
  activeYear?: string
  activeRating?: string
}

function reviewYear(review: Review): string | undefined {
  const value = review.reviewDate || review.location
  return /^20\d{2}-\d{2}-\d{2}$/.test(value || '') ? value?.slice(0, 4) : undefined
}

function reviewMatchesRating(review: Review, filter: string | undefined): boolean {
  if (!filter || filter === 'all' || filter === 'google') return true
  if (!review.rating) return false
  return Math.round(review.rating).toString() === filter
}

function pluralReviews(count: number) {
  return `${count} review${count === 1 ? '' : 's'}`
}

export function ReviewCollection({pages, aggregateRating, activeAxis, activeYear, activeRating}: Props) {
  const [query, setQuery] = useState('')
  const stablePages = useMemo(() => {
    const unique = new Map<string, ReviewCollectionItem>()
    for (const page of pages) if (!unique.has(page.serviceSlug)) unique.set(page.serviceSlug, page)
    return [...unique.values()]
  }, [pages])
  const totalExcerpts = stablePages.reduce((sum, page) => sum + (page.reviews?.length || 0), 0)
  const years = useMemo(() => Array.from(new Set(stablePages.flatMap((page) => page.reviews.map(reviewYear).filter(Boolean) as string[]))).sort().reverse(), [stablePages])
  const starRatings = useMemo(() => Array.from(new Set(stablePages.flatMap((page) => page.reviews.map((review) => review.rating ? Math.round(review.rating) : undefined).filter(Boolean) as number[]))).sort((a, b) => b - a), [stablePages])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return stablePages.map((page) => {
      const matchingReviews = page.reviews.filter((review) => {
        if (activeAxis === 'years' && activeYear && reviewYear(review) !== activeYear) return false
        if (activeAxis === 'rating' && !reviewMatchesRating(review, activeRating)) return false
        return true
      })
      return {...page, matchingReviews}
    }).filter((page) => {
      const matchesTerm = !term || `${page.serviceName} ${page.parentName || ''}`.toLowerCase().includes(term)
      return matchesTerm && page.matchingReviews.length > 0
    })
  }, [activeAxis, activeRating, activeYear, query, stablePages])

  const heading = activeAxis === 'years' && activeYear
    ? `Reviews from ${activeYear}`
    : activeAxis === 'equipment'
      ? 'Reviews by electrical service'
      : 'Google review collections'

  return (
    <section className="review-directory" aria-labelledby="review-directory-title">
      <div className="collection-wrap review-directory-grid">
        <aside className="review-filter" aria-label="Review collection filters">
          <p className="review-filter-kicker">Split by</p>
          <nav className="review-axis-nav" aria-label="Choose how to browse reviews">
            <Link href={{pathname: '/reviews', query: {view: 'rating'}}} aria-current={activeAxis === 'rating' ? 'page' : undefined}>
              <span><strong>Rating</strong><small>Google score</small></span><b>{starRatings.length || 1}</b>
            </Link>
            {activeAxis === 'rating' && <div className="review-filter-values">
              <Link href={{pathname: '/reviews', query: {view: 'rating', rating: 'all'}}} aria-current={!activeRating || activeRating === 'all' ? 'page' : undefined}><span>All Google reviews</span><b>{totalExcerpts}</b></Link>
              {starRatings.length > 0 ? starRatings.map((rating) => {
                const count = stablePages.flatMap((page) => page.reviews).filter((review) => Math.round(review.rating || 0) === rating).length
                return <Link href={{pathname: '/reviews', query: {view: 'rating', rating: rating.toString()}}} aria-current={activeRating === rating.toString() ? 'page' : undefined} key={rating}><span>{rating}-star reviews</span><b>{count}</b></Link>
              }) : <Link href={{pathname: '/reviews', query: {view: 'rating', rating: 'google'}}} aria-current={activeRating === 'google' ? 'page' : undefined}><span>{aggregateRating.toFixed(1)}/5 Google rating</span><b>{totalExcerpts}</b></Link>}
            </div>}
            <Link href={{pathname: '/reviews', query: {view: 'years'}}} aria-current={activeAxis === 'years' ? 'page' : undefined}>
              <span><strong>Years</strong><small>Review date</small></span><b>{years.length}</b>
            </Link>
            {activeAxis === 'years' && <div className="review-filter-values">
              {years.map((year) => {
                const count = stablePages.flatMap((page) => page.reviews).filter((review) => reviewYear(review) === year).length
                return <Link href={{pathname: '/reviews', query: {view: 'years', year}}} aria-current={activeYear === year ? 'page' : undefined} key={year}><span>{year} reviews</span><b>{count}</b></Link>
              })}
            </div>}
            <Link href={{pathname: '/reviews', query: {view: 'equipment'}}} aria-current={activeAxis === 'equipment' ? 'page' : undefined}>
              <span><strong>Equipment</strong><small>Electrical service</small></span><b>{stablePages.length}</b>
            </Link>
            {activeAxis === 'equipment' && <div className="review-filter-values review-filter-values-scroll">
              {stablePages.map((page) => <Link href={`/reviews/${page.serviceSlug}`} key={page.serviceSlug}><span>{page.serviceName}</span><b>{page.reviews.length}</b></Link>)}
            </div>}
          </nav>
          <p className="review-filter-note">Rating and year filters stay within this collection. Equipment opens a dedicated service review URL.</p>
        </aside>

        <div className="review-results">
          <div className="review-results-heading">
            <div><p className="collection-kicker">Customer proof by service</p><h2 id="review-directory-title">{heading}</h2></div>
            <p>Choose a service collection to read every tagged review excerpt and follow it back to the original Google review.</p>
          </div>
          <div className="review-search-row">
            <label><span>Find a service</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search electrical services" /></label>
            <p aria-live="polite"><strong>{filtered.length}</strong> service collections</p>
          </div>
          {filtered.length === 0 && <div className="collection-empty"><h3>No matching review collections</h3><p>Try another service name or clear the search.</p><button type="button" onClick={() => setQuery('')}>Clear search</button></div>}
          <div className="review-collection-grid">
            {filtered.map((page) => {
              const cardImage = serviceCardImageForSlug(page.serviceSlug) || page.cardImage
              return (
              <Link className="review-collection-card" href={`/reviews/${page.serviceSlug}`} key={page._id}>
                <span className={`review-collection-media${cardImage ? '' : ' review-collection-media-empty'}`}>
                  {cardImage ? <img src={cardImage} alt={page.cardImageAlt || `${page.serviceName} work by Highlights Chicago`} loading="lazy" decoding="async" /> : <span aria-hidden="true">HC</span>}
                  <span className="review-card-count">{pluralReviews(page.matchingReviews.length)}</span>
                </span>
                <span className="review-collection-body">
                  <span className="review-collection-parent">{page.parentName || 'Electrical services'}</span>
                  <strong>{page.serviceName}</strong>
                  <GoogleRating rating={page.matchingReviews[0]?.rating || aggregateRating} compact />
                  <span className="review-collection-quote">“{page.matchingReviews[0]?.quote}”</span>
                  <span className="review-collection-link">Read this collection <span aria-hidden="true">→</span></span>
                </span>
              </Link>
            )})}
          </div>
        </div>
      </div>
    </section>
  )
}
