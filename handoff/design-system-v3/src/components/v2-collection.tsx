'use client'

/* eslint-disable @next/next/no-img-element -- Covers can be local or Sanity CDN URLs and must stay crawlable. */

import Link from 'next/link'
import {useMemo, useState} from 'react'
import type {RouteCard} from '@/lib/content'

const ALL = 'All services'

/** Card grid of the V2 service pages; each card opens its page. Styles reuse the live collection cards. */
export function V2Collection({pages}: {pages: RouteCard[]}) {
  const [query, setQuery] = useState('')
  const [cluster, setCluster] = useState(ALL)
  const clusters = useMemo(() => [ALL, ...Array.from(new Set(pages.map((page) => page.parentName).filter((name): name is string => Boolean(name)))).sort()], [pages])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return pages.filter((page) => {
      const inCluster = cluster === ALL || page.parentName === cluster
      const haystack = `${page.name} ${page.parentName || ''} ${page.description || ''}`.toLowerCase()
      return inCluster && (!term || haystack.includes(term))
    })
  }, [cluster, pages, query])

  return (
    <section className="collection-directory" aria-labelledby="service-directory-title">
      <div className="collection-wrap">
        <div className="collection-directory-heading">
          <div>
            <p className="collection-kicker">Explore our services</p>
            <h2 id="service-directory-title">Find the right electrical service</h2>
          </div>
          <p>Service pages built for Chicago buildings, permits and the jobs that come up most.</p>
        </div>
        {pages.length > 0 && <div className="collection-toolbar">
          <label>
            <span>Search services</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by service" type="search" />
          </label>
          {clusters.length > 2 && <div className="collection-area-filter" aria-label="Filter by category">
            {clusters.map((item) => <button type="button" aria-pressed={cluster === item} onClick={() => setCluster(item)} key={item}>{item}</button>)}
          </div>}
          <p className="collection-result-count" aria-live="polite">Showing <strong>{filtered.length}</strong> of {pages.length} service pages</p>
        </div>}
        {pages.length === 0 && <div className="collection-empty"><h3>No published pages yet</h3><p>Pages appear here once they are published in Sanity.</p></div>}
        {pages.length > 0 && filtered.length === 0 && <div className="collection-empty"><h3>No matching services</h3><p>Try a broader service name or clear the search.</p><button type="button" onClick={() => {setQuery(''); setCluster(ALL)}}>Clear filters</button></div>}
        <div className="collection-card-grid">
          {filtered.map((page) => (
            <Link className="collection-card" href={`/${page.slug}`} key={page.slug}>
              <span className={`collection-card-media${page.image ? '' : ' collection-card-media-empty'}`}>
                {page.image ? <img className="collection-card-image" src={page.image} alt={page.imageAlt || `${page.name} in Chicago`} loading="lazy" decoding="async" /> : <span aria-hidden="true">HC</span>}
              </span>
              <span className="collection-card-arrow" aria-hidden="true">→</span>
              <span className="collection-card-content">
                <span className="collection-card-area">{page.parentName || page.areaName || 'Chicago'}</span>
                <strong>{page.name}</strong>
                {page.description && <span className="collection-card-description">{page.description}</span>}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
