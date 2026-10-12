import {Copy, Eyebrow, keepHyphens} from '../atoms'
import {Icon, pickIcon} from '../icon'
import {ProcessTrack, type OwnerTag, type TrackStep} from '../process-track'
import {splitConfirm} from '@/lib/v3/content'
import {questionHeading} from '@/lib/headings'
import type {ProcessOwner} from '@/types/v2'
import type {BlockContext} from '../types'

export const hasProcess = ({page}: BlockContext) => Boolean(page.process?.steps?.length)

/** Owner tags: Highlights green, City of Chicago blue, utility and others neutral (playbook D11). */
const OWNERS: Record<ProcessOwner, OwnerTag> = {
  highlights: {key: 'highlights', label: 'Highlights', tone: 'green', icon: 'wrench'},
  city: {key: 'city', label: 'City of Chicago', tone: 'blue', icon: 'landmark'},
  comed: {key: 'comed', label: 'ComEd', tone: 'grey', icon: 'zap'},
  customer: {key: 'customer', label: 'You', tone: 'grey', icon: 'user'},
  manufacturer: {key: 'manufacturer', label: 'Manufacturer', tone: 'grey', icon: 'cpu'},
}

/** D11 Process track (horizontal), grey band. */
export function ProcessBlock({ctx}: {ctx: BlockContext}) {
  const {page, editorial} = ctx
  const process = page.process || {}
  const steps: TrackStep[] = (process.steps || []).map((step) => ({
    title: step.title,
    body: splitConfirm(step.body),
    owners: (step.owners || []).map((owner) => OWNERS[owner]).filter(Boolean),
    icon: pickIcon(step.title, 'clipboardCheck'),
  }))
  const used = Object.values(OWNERS).filter((owner) => steps.some((step) => step.owners.some((tag) => tag.key === owner.key)))

  const head = (
    <div className="ds-head ds-head--aside">
      <div className="ds-head-main">
        <Eyebrow>The process · {steps.length} steps</Eyebrow>
        <h2 className="ds-h2" id="process-title">{keepHyphens(questionHeading(process.heading))}</h2>
        <Copy value={process.lede} show={editorial} className="ds-lede" />
      </div>
      {used.length > 0 && <div className="ds-head-aside">
        <div className="ds-legend">
          <p className="ds-label-head ds-label-head--muted">Who controls the step</p>
          <ul>{used.map((owner) => <li key={owner.key}><span className={`ds-owner ds-owner--${owner.tone}`}><Icon name={owner.icon} size={14} />{owner.label}</span></li>)}</ul>
        </div>
      </div>}
    </div>
  )

  return <ProcessTrack head={head} steps={steps} editorial={editorial} />
}
