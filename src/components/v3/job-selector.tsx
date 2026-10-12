'use client'

/* eslint-disable @next/next/no-img-element -- Card photos from /public or Sanity's CDN. */
import {useId, useRef, useState, type CSSProperties, type KeyboardEvent} from 'react'
import {ConfirmNotes, GhostLink, IconBadge, IconTile} from './atoms'
import {Icon} from './icon'
import type {Editorial} from '@/lib/v3/content'
import {focus, type Photo} from '@/lib/v3/visuals'

export type Job = {title: string; situation: Editorial; scope: Editorial; firstStep: Editorial; link?: {label: string; href: string}; photo?: Photo}

/** D2 selector cards. Every detail panel is in the HTML; only the selected one is visible (playbook F.3). */
export function JobSelector({jobs, editorial}: {jobs: Job[]; editorial: boolean}) {
  const [active, setActive] = useState(0)
  const id = useId()
  const tabs = useRef<Array<HTMLButtonElement | null>>([])

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? jobs.length - 1 : (index + step + jobs.length) % jobs.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="ds-jobs" style={{'--jobs': jobs.length, '--active': active} as CSSProperties}>
      <div className="ds-job-cards" role="tablist" aria-label="Choose your job">
        {jobs.map((job, index) => {
          const selected = index === active
          return (
            <button
              type="button"
              role="tab"
              className={`ds-job-card${selected ? ' is-active' : ''}`}
              id={`${id}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${id}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              ref={(element) => {tabs.current[index] = element}}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              key={job.title}
            >
              <span className="ds-job-media">
                {job.photo ? <img src={job.photo.src} alt={job.photo.alt} loading="lazy" decoding="async" style={focus(job.photo)} /> : <IconTile icon="clipboardCheck" />}
                <span className="ds-num-tag">{String(index + 1).padStart(2, '0')}</span>
                {selected && <span className="ds-job-check"><Icon name="check" size={16} /></span>}
              </span>
              <span className="ds-job-body">
                <span className="ds-job-title">{job.title}</span>
                <span className="ds-job-situation">{job.situation.text}</span>
              </span>
              <span className="ds-job-toggle">Scope &amp; first step<span className="ds-job-toggle-icon"><Icon name="chevronDown" size={16} /></span></span>
            </button>
          )
        })}
      </div>
      {jobs.map((job, index) => (
        <div className="ds-job-panel" role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={index !== active} key={job.title}>
          <div className="ds-job-detail">
            <IconBadge icon="sliders" tone="blue" />
            <div>
              <h3 className="ds-label-head">Scope is decided by</h3>
              <p className="ds-job-scope">{job.scope.text}</p>
              <ConfirmNotes notes={[...job.situation.notes, ...job.scope.notes]} show={editorial} />
            </div>
          </div>
          <div className="ds-job-first">
            <IconBadge icon="flag" tone="solid-blue" />
            <div>
              <h3 className="ds-label-head">First step</h3>
              <p className="ds-job-step">{job.firstStep.text}</p>
              <ConfirmNotes notes={job.firstStep.notes} show={editorial} />
            </div>
            {job.link && <GhostLink href={job.link.href}>{job.link.label}</GhostLink>}
          </div>
        </div>
      ))}
    </div>
  )
}
