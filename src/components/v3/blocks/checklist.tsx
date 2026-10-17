import {Fragment, type CSSProperties} from 'react'
import {ConfirmNotes, Copy, IconBadge, PhotoFrame, SectionHead} from '../atoms'
import {Icon, pickIcon, type IconName} from '../icon'
import {NoteLine} from './equipment'
import {splitConfirm} from '@/lib/v3/content'
import type {BlockContext} from '../types'

export const hasChecklist = ({page}: BlockContext) => Boolean(page.assessment?.checks?.length)

/** Outcome tone by position: simplest route green, biggest job navy (playbook D4). */
function routeTone(index: number, count: number): {tone: 'green' | 'blue' | 'navy'; icon: IconName} {
  if (index === 0) return {tone: 'green', icon: 'circleCheck'}
  if (index === count - 1) return {tone: 'navy', icon: 'arrowUpCircle'}
  return {tone: 'blue', icon: 'filePlus'}
}

/** D4 Checklist split + decision flow. */
export function ChecklistBlock({ctx}: {ctx: BlockContext}) {
  const {page, visuals, editorial} = ctx
  const assessment = page.assessment || {}
  const checks = assessment.checks || []
  const routes = assessment.routes || []

  return (
    <div className="ds-wrap">
      <div className="ds-checklist">
        <div className="ds-checklist-rail">
          <SectionHead eyebrow="Site assessment" id="site-assessment-title" title={assessment.heading} lede={assessment.lede} editorial={editorial} />
          {visuals.assessment && <div className="ds-checklist-photo">
            <PhotoFrame photo={visuals.assessment} pill={false} className="ds-photo--tall">
              <span className="ds-numeral-badge"><b>{checks.length}</b><span><i aria-hidden="true" />Checks</span></span>
            </PhotoFrame>
            {visuals.assessment.illustrative && <p className="ds-meta">Illustrative photo</p>}
          </div>}
        </div>
        <ol className="ds-numbered">
          {checks.map((check, index) => {
            const body = splitConfirm(check.body)
            return (
              <li key={check._key || check.title}>
                <span className="ds-numbered-num">{String(index + 1).padStart(2, '0')}</span>
                <IconBadge icon={pickIcon(check.title, 'clipboardCheck')} tone="blue" size={44} />
                <div><h3 className="ds-h6">{check.title}</h3>{body.text && <p>{body.text}</p>}<ConfirmNotes notes={body.notes} show={editorial} /></div>
              </li>
            )
          })}
        </ol>
      </div>

      {routes.length > 0 && <div className="ds-sub" id="assessment-routes">
        <div className="ds-sub-head"><IconBadge icon="fork" tone="blue" /><h3 className="ds-h3">{assessment.routesHeading}</h3></div>
        <ol className="ds-flow" style={{'--routes': routes.length} as CSSProperties}>
          {routes.map((route, index) => {
            const {tone, icon} = routeTone(index, routes.length)
            return (
              <Fragment key={route._key || route.title}>
                {index > 0 && <li className="ds-flow-arrow" aria-hidden="true"><Icon name="arrowRight" size={18} /></li>}
                <li className={`ds-flow-card ds-flow-card--${tone}`}>
                  <div className="ds-flow-top"><span className="ds-flow-num">{index + 1}</span><Icon name={icon} size={24} /></div>
                  <h4 className="ds-h6">{route.title}</h4>
                  <Copy value={route.body} show={editorial} />
                </li>
              </Fragment>
            )
          })}
        </ol>
        {assessment.routesNote && <div className="ds-note-box"><NoteLine value={assessment.routesNote} editorial={editorial} /></div>}
      </div>}
    </div>
  )
}
