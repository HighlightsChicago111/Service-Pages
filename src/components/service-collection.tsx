'use client'

import Link from 'next/link'
import {useMemo, useState} from 'react'

export type CollectionItem = {
  _id: string
  title: string
  serviceSlug: string
  areaSlug: string
  serviceName: string
  areaName: string
  monthlySearchVolume?: number
  metaDescription?: string
  cardImage?: string
}

export function ServiceCollection({pages}: {pages: CollectionItem[]}) {
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('All areas')
  const areas = useMemo(() => ['All areas', ...Array.from(new Set(pages.map((page) => page.areaName))).sort()], [pages])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return pages.filter((page) => {
      const matchesArea = area === 'All areas' || page.areaName === area
      const haystack = `${page.serviceName} ${page.areaName} ${page.metaDescription || ''}`.toLowerCase()
      return matchesArea && (!term || haystack.includes(term))
    })
  }, [area, pages, query])

  return (
    <section className="collection-directory" aria-labelledby="service-directory-title">
      <div className="collection-wrap">
        <div className="collection-directory-heading">
          <div>
            <p className="collection-kicker">Explore our services</p>
            <h2 id="service-directory-title">Find the right electrical service</h2>
          </div>
          <p>Browse locally focused service pages built for Chicago properties, permitting requirements, and common electrical needs.</p>
        </div>
        <div className="collection-toolbar">
          <label>
            <span>Search services</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by service or area" type="search" />
          </label>
          {areas.length > 2 && <div className="collection-area-filter" aria-label="Filter by area">
            {areas.map((item) => <button type="button" aria-pressed={area === item} onClick={() => setArea(item)} key={item}>{item}</button>)}
          </div>}
          <p className="collection-result-count" aria-live="polite">Showing <strong>{filtered.length}</strong> of {pages.length} service pages</p>
        </div>
        {!pages.length && <p className="setup-note">The Sanity dataset is connected but empty. Add the Viewer and Editor tokens to <code>.env.local</code>, then run <code>pnpm content:import</code>.</p>}
        {pages.length > 0 && filtered.length === 0 && <div className="collection-empty"><h3>No matching services</h3><p>Try a broader service name or clear the search.</p><button type="button" onClick={() => {setQuery(''); setArea('All areas')}}>Clear filters</button></div>}
        <div className="collection-card-grid">
          {filtered.map((page) => (
            <Link className="collection-card" href={`/services/${page.serviceSlug}/${page.areaSlug}`} key={page._id}>
              <span className={`collection-card-media${page.cardImage ? '' : ' collection-card-media-empty'}`} style={page.cardImage ? {backgroundImage: `linear-gradient(180deg, rgba(21,31,42,0) 45%, rgba(21,31,42,.14)), url("${page.cardImage}")`} : undefined} role="img" aria-label={`${page.serviceName} in ${page.areaName}`}>
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
          ))}
        </div>
      </div>
    </section>
  )
}
