'use client'

/* eslint-disable @next/next/no-img-element -- Service covers can be local or Sanity-managed URLs and must remain crawlable. */

import Link from 'next/link'
import {useMemo, useState} from 'react'
import {prepareCollectionItems, type CollectionItem} from '@/lib/collection-items'
import {routeByServiceId} from '@/lib/service-hierarchy'

export type {CollectionItem}

type Props = {
  pages: CollectionItem[]
  clusterSlug?: string
  heading?: string
  description?: string
  emptyMessage?: string
}

export function ServiceCollection({pages, clusterSlug, heading = 'Find the right electrical service', description = 'Browse locally focused service pages built for Chicago properties, permitting requirements, and common electrical needs.', emptyMessage}: Props) {
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('All areas')
  const stablePages = useMemo(() => prepareCollectionItems(pages).filter((page) => {
    return !clusterSlug || routeByServiceId(page.serviceId)?.clusterSlug === clusterSlug
  }), [clusterSlug, pages])
  const areas = useMemo(() => ['All areas', ...Array.from(new Set(stablePages.map((page) => page.areaName))).sort()], [stablePages])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return stablePages.filter((page) => {
      const matchesArea = area === 'All areas' || page.areaName === area
      const haystack = `${page.serviceName} ${page.areaName} ${page.metaDescription || ''}`.toLowerCase()
      return matchesArea && (!term || haystack.includes(term))
    })
  }, [area, query, stablePages])

  return (
    <section className="collection-directory" aria-labelledby="service-directory-title">
      <div className="collection-wrap">
        <div className="collection-directory-heading">
          <div>
            <p className="collection-kicker">Explore our services</p>
            <h2 id="service-directory-title">{heading}</h2>
          </div>
          <p>{description}</p>
        </div>
        <div className="collection-toolbar">
          <label>
            <span>Search services</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by service or area" type="search" />
          </label>
          {areas.length > 2 && <div className="collection-area-filter" aria-label="Filter by area">
            {areas.map((item) => <button type="button" aria-pressed={area === item} onClick={() => setArea(item)} key={item}>{item}</button>)}
          </div>}
          <p className="collection-result-count" aria-live="polite">Showing <strong>{filtered.length}</strong> of {stablePages.length} service pages</p>
        </div>
        {!stablePages.length && <p className="setup-note">{emptyMessage || 'The Sanity dataset has no publishable service pages. Confirm each page has both a service and an area, or import the starter content.'}</p>}
        {stablePages.length > 0 && filtered.length === 0 && <div className="collection-empty"><h3>No matching services</h3><p>Try a broader service name or clear the search.</p><button type="button" onClick={() => {setQuery(''); setArea('All areas')}}>Clear filters</button></div>}
        <div className="collection-card-grid">
          {filtered.map((page) => {
            const route = routeByServiceId(page.serviceId)
            const href = route ? `/${route.clusterSlug}/${route.routeSlug}` : `/${page.serviceSlug}/${page.areaSlug}`
            return (
            <Link className="collection-card" data-card-image={page.cardImage} href={href} key={page._id}>
              <span className={`collection-card-media${page.cardImage ? '' : ' collection-card-media-empty'}`}>
                {page.cardImage && <img className="collection-card-image" src={page.cardImage} alt={page.cardImageAlt} title={page.cardImageCaption} loading="lazy" decoding="async" />}
                {!page.cardImage && <span aria-hidden="true">HC</span>}
              </span>
              <span className="collection-card-arrow" aria-hidden="true">→</span>
              <span className="collection-card-content">
                <span className="collection-card-area">{page.areaName}</span>
                <strong>{page.serviceName}</strong>
                {page.metaDescription && <span className="collection-card-description">{page.metaDescription}</span>}
                {page.monthlySearchVolume ? <span className="collection-card-volume">{page.monthlySearchVolume.toLocaleString()} monthly searches</span> : null}
              </span>
            </Link>
          )})}
        </div>
      </div>
    </section>
  )
}
