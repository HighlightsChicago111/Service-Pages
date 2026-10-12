'use client'

/* eslint-disable @next/next/no-img-element -- Credited Wikimedia/Sanity photos. */
import {useId, useRef, useState, type KeyboardEvent} from 'react'
import {IconBadge} from './atoms'
import {Icon, type IconName} from './icon'
import type {GuideView} from '@/lib/v3/content'
import {focus, type Photo} from '@/lib/v3/visuals'

export type LibraryGuide = GuideView & {icon: IconName; photo?: Photo}

const pad = (value: number) => String(value).padStart(2, '0')
const anchor = (guide: number, section: number) => `guide-${guide + 1}-part-${section + 1}`

/** D18 Library tabs. All guides are in the HTML; inactive panels are hidden (playbook F.3). */
export function LibraryTabs({guides}: {guides: LibraryGuide[]}) {
  const [active, setActive] = useState(0)
  const id = useId()
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const current = guides[active]

  function select(index: number, focus = false) {
    setActive(index)
    if (focus) tabs.current[index]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    select((index + step + guides.length) % guides.length, true)
  }

  return (
    <div className="ds-library">
      <div className="ds-library-nav">
        <div className="ds-library-tabs" role="tablist" aria-orientation="vertical" aria-label="Guides">
          {guides.map((guide, index) => (
            <button
              type="button"
              role="tab"
              className={index === active ? 'ds-guide-tab is-active' : 'ds-guide-tab'}
              id={`${id}-tab-${index}`}
              aria-selected={index === active}
              aria-controls={`${id}-panel-${index}`}
              tabIndex={index === active ? 0 : -1}
              ref={(element) => {tabs.current[index] = element}}
              onClick={() => select(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              key={guide.title}
            >
              <IconBadge icon={guide.icon} tone={index === active ? 'navy' : 'blue'} size={44} />
              <span className="ds-guide-tab-text"><small>Guide {pad(index + 1)}</small>{guide.title}</span>
              {index === active && <Icon name="chevronRight" size={18} />}
            </button>
          ))}
        </div>
        {current && current.sections.some((section) => section.heading) && <nav className="ds-guide-toc" aria-label="In this guide">
          <p className="ds-label-head ds-label-head--muted">In this guide</p>
          <ul>{current.sections.map((section, index) => section.heading && <li key={section.heading}><a href={`#${anchor(active, index)}`}>{section.heading}</a></li>)}</ul>
        </nav>}
      </div>
      <div className="ds-library-panels">
        {guides.map((guide, guideIndex) => (
          <article className="ds-guide" role="tabpanel" id={`${id}-panel-${guideIndex}`} aria-labelledby={`${id}-tab-${guideIndex}`} hidden={guideIndex !== active} key={guide.title}>
            <header className={guide.photo ? 'ds-guide-head' : 'ds-guide-head ds-guide-head--plain'}>
              {guide.photo && <img src={guide.photo.src} alt={guide.photo.alt} loading="lazy" decoding="async" style={focus(guide.photo)} />}
              {guide.photo?.credit && <span className="ds-credit-pill">Photo: {guide.photo.credit}</span>}
              {guide.photo?.illustrative && !guide.photo.credit && <span className="ds-credit-pill">Illustrative photo</span>}
              <div><p className="ds-guide-kicker">Guide {pad(guideIndex + 1)} / {pad(guides.length)}</p><h3 className="ds-h3">{guide.heading || guide.title}</h3></div>
            </header>
            <div className="ds-guide-body">
              {guide.intro && <p className="ds-lede">{guide.intro}</p>}
              {guide.stats.length > 0 && <dl className="ds-guide-stats">{guide.stats.map((stat) => <div key={stat.value}><dt>{stat.value}</dt><dd>{stat.caption}</dd></div>)}</dl>}
              {guide.sections.map((section, index) => (
                <section className={section.heading ? 'ds-guide-part' : 'ds-guide-part ds-guide-part--plain'} id={anchor(guideIndex, index)} key={`${guideIndex}-${index}`}>
                  {section.heading && <h4 className="ds-h6">{section.heading}</h4>}
                  <div>{section.body.split(/\n{2,}|\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
