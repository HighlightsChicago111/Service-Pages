'use client'

import {useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'
import {ConfirmNotes, IconBadge} from './atoms'
import {Icon, type IconName} from './icon'
import type {Editorial} from '@/lib/v3/content'

export type OwnerTag = {key: string; label: string; tone: 'green' | 'blue' | 'grey'; icon: IconName}
export type TrackStep = {title: string; body: Editorial; owners: OwnerTag[]; icon: IconName}

type Mode = 'swipe' | 'sticky'

/**
 * D11 Process track. Server HTML is the swipe layout (every step readable without JS).
 * On wide screens with motion allowed, the rail and cards pin to the viewport and
 * vertical scroll drives the track left to right; the rail fills and the counter
 * advances. The heading scrolls normally so the pinned part fits a laptop screen.
 */
export function ProcessTrack({head, steps, editorial}: {head: ReactNode; steps: TrackStep[]; editorial: boolean}) {
  const [mode, setMode] = useState<Mode>('swipe')
  const [active, setActive] = useState(0)
  const outer = useRef<HTMLDivElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLOListElement>(null)
  const travel = useRef(0)
  const offset = useRef(0)
  const count = steps.length

  // Sticky only on wide screens, with motion allowed, when the whole section fits the viewport.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 992px)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decide = () => {
      const fits = (content.current?.offsetHeight || Infinity) + 40 <= window.innerHeight
      setMode(wide.matches && !calm.matches && fits ? 'sticky' : 'swipe')
    }
    const frame = requestAnimationFrame(decide)
    window.addEventListener('resize', decide)
    wide.addEventListener('change', decide)
    calm.addEventListener('change', decide)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', decide)
      wide.removeEventListener('change', decide)
      calm.removeEventListener('change', decide)
    }
  }, [])

  // Sticky mode: the rail and cards pin at their own height, centred in the viewport,
  // and vertical progress through the pinned stretch becomes horizontal travel.
  useEffect(() => {
    const section = outer.current
    const pinned = pin.current
    const list = track.current
    if (mode !== 'sticky' || !section || !pinned || !list) return
    let frame = 0
    const measure = () => {
      const height = content.current?.offsetHeight || 0
      travel.current = Math.max(0, list.scrollWidth - (viewport.current?.clientWidth || 0))
      offset.current = Math.max(0, Math.round((window.innerHeight - height) / 2))
      pinned.style.top = `${offset.current}px`
      section.style.height = `${height + travel.current}px`
    }
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const distance = travel.current
        const moved = offset.current - section.getBoundingClientRect().top
        const progress = distance > 0 ? Math.min(1, Math.max(0, moved / distance)) : 0
        list.style.transform = `translate3d(${-progress * distance}px, 0, 0)`
        section.style.setProperty('--done', String(progress))
        setActive(Math.round(progress * (count - 1)))
      })
    }
    const onResize = () => {
      measure()
      update()
    }
    measure()
    update()
    window.addEventListener('scroll', update, {passive: true})
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', onResize)
      section.style.height = ''
      section.style.removeProperty('--done')
      pinned.style.top = ''
      list.style.transform = ''
    }
  }, [mode, count])

  // Swipe mode: the card nearest the left edge is the current step.
  const onSwipeScroll = useCallback(() => {
    const element = viewport.current
    const cards = track.current?.children
    if (mode !== 'swipe' || !element || !cards?.length) return
    const left = element.scrollLeft
    let nearest = 0
    for (let index = 1; index < cards.length; index++) {
      if (Math.abs((cards[index] as HTMLElement).offsetLeft - left) < Math.abs((cards[nearest] as HTMLElement).offsetLeft - left)) nearest = index
    }
    if (left + element.clientWidth >= element.scrollWidth - 4) nearest = cards.length - 1
    setActive(nearest)
  }, [mode])

  function goTo(index: number) {
    const target = Math.max(0, Math.min(count - 1, index))
    if (mode === 'sticky' && outer.current) {
      const top = outer.current.getBoundingClientRect().top + window.scrollY - offset.current
      window.scrollTo({top: top + (count > 1 ? (target / (count - 1)) * travel.current : 0), behavior: 'smooth'})
    } else {
      const card = track.current?.children[target] as HTMLElement | undefined
      viewport.current?.scrollTo({left: card ? card.offsetLeft : 0, behavior: 'smooth'})
    }
  }

  const done = count > 1 ? active / (count - 1) : 1

  return (
    <div className={`ds-process ds-process--${mode}`} style={mode === 'swipe' ? ({'--done': done} as CSSProperties) : undefined}>
      <div className="ds-wrap">{head}</div>
      <div className="ds-process-pin" ref={outer}>
        <div className="ds-process-inner" ref={pin}>
          <div className="ds-process-content" ref={content}>
            <div className="ds-wrap">
              <div className="ds-rail">
                <p className="ds-rail-count" aria-live="polite"><b>{String(active + 1).padStart(2, '0')}</b><span>/ {String(count).padStart(2, '0')}</span></p>
                <ol className="ds-rail-nodes" aria-label="Steps">
                  {steps.map((step, index) => (
                    <li key={step.title} className={index < active ? 'is-done' : index === active ? 'is-current' : undefined}>
                      <button type="button" onClick={() => goTo(index)} aria-label={`Step ${index + 1}: ${step.title}`} aria-current={index === active ? 'step' : undefined}>{index + 1}</button>
                    </li>
                  ))}
                </ol>
                <div className="ds-rail-arrows">
                  <button type="button" className="ds-round-btn" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous step"><Icon name="arrowLeft" size={18} /></button>
                  <button type="button" className="ds-round-btn ds-round-btn--solid" onClick={() => goTo(active + 1)} disabled={active === count - 1} aria-label="Next step"><Icon name="arrowRight" size={18} /></button>
                </div>
              </div>
            </div>
            <div className="ds-track-viewport" ref={viewport} onScroll={onSwipeScroll} tabIndex={0} aria-label="Process steps">
              <ol className="ds-track" ref={track}>
                {steps.map((step, index) => (
                  <li className={`ds-step${index === active ? ' is-current' : ''}`} key={step.title}>
                    <div className="ds-step-top"><span className="ds-step-num">{String(index + 1).padStart(2, '0')}</span><IconBadge icon={step.icon} tone="blue" /></div>
                    <h3 className="ds-h5">{step.title}</h3>
                    <p>{step.body.text}</p>
                    <ConfirmNotes notes={step.body.notes} show={editorial} />
                    {step.owners.length > 0 && <div className="ds-step-owners">{step.owners.map((owner) => <span className={`ds-owner ds-owner--${owner.tone}`} key={owner.key}><Icon name={owner.icon} size={14} />{owner.label}</span>)}</div>}
                  </li>
                ))}
              </ol>
            </div>
            <div className="ds-wrap">
              <p className="ds-track-hint"><IconBadge icon={mode === 'sticky' ? 'mouse' : 'pointer'} tone="white" size={32} />{mode === 'sticky' ? `Scroll to move through all ${count} steps` : `Swipe or use the arrows to see all ${count} steps`}<Icon name="arrowRight" size={16} /></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
