'use client'

/* eslint-disable @next/next/no-img-element -- Wikimedia area photos via Sanity's CDN, credited under each card. */
import {useCallback, useEffect, useRef, useState} from 'react'
import {Icon} from './icon'

export type AreaCard = {name: string; note?: string; src?: string; alt: string; credit?: string}

const pad = (value: number) => String(value).padStart(2, '0')

/** D12 area carousel: raised navy cards, counter and arrows; swipe on touch screens. */
export function AreaCarousel({areas}: {areas: AreaCard[]}) {
  const rail = useRef<HTMLUListElement>(null)
  const [range, setRange] = useState({from: 1, to: Math.min(6, areas.length)})

  const measure = useCallback(() => {
    const element = rail.current
    const first = element?.children[0] as HTMLElement | undefined
    if (!element || !first) return
    const gap = parseFloat(getComputedStyle(element).columnGap || '0') || 0
    // Fractional width: offsetWidth rounds, which made six visible cards count as five.
    const step = first.getBoundingClientRect().width + gap
    const from = Math.min(areas.length, Math.round(element.scrollLeft / step) + 1)
    // n cards fill n * width + (n - 1) * gap, so add one gap back before dividing.
    const visible = Math.max(1, Math.round((element.clientWidth + gap) / step))
    setRange({from, to: Math.min(areas.length, from + visible - 1)})
  }, [areas.length])

  useEffect(() => {
    const frame = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  function page(direction: 1 | -1) {
    const element = rail.current
    if (!element) return
    element.scrollBy({left: direction * element.clientWidth, behavior: 'smooth'})
  }

  return (
    <div className="ds-areas">
      <div className="ds-areas-bar">
        <p className="ds-rail-count ds-rail-count--dark" aria-live="polite"><b>{pad(range.from)}–{pad(range.to)}</b><span>/ {areas.length}</span></p>
        <div className="ds-rail-arrows">
          <button type="button" className="ds-round-btn ds-round-btn--dark" onClick={() => page(-1)} disabled={range.from <= 1} aria-label="Previous areas"><Icon name="arrowLeft" size={18} /></button>
          <button type="button" className="ds-round-btn ds-round-btn--light" onClick={() => page(1)} disabled={range.to >= areas.length} aria-label="Next areas"><Icon name="arrowRight" size={18} /></button>
        </div>
      </div>
      <ul className="ds-area-rail" ref={rail} onScroll={measure} tabIndex={0} aria-label="Areas we cover">
        {areas.map((area) => (
          <li className="ds-area-card" key={area.name}>
            <span className="ds-area-photo">{area.src ? <img src={area.src} alt={area.alt} loading="lazy" decoding="async" /> : <Icon name="mapPin" size={24} />}</span>
            <h3 className="ds-h6">{area.name}</h3>
            {area.note && <p>{area.note}</p>}
            <small>{area.credit ? `Photo: ${area.credit}` : ''}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
