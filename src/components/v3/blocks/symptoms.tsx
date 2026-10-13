import {ConfirmNotes, IconBadge, PhotoFrame, SectionHead} from '../atoms'
import {Icon, pickIcon, type IconName} from '../icon'
import {jobNoun, listAfterColon, sentences, splitConfirm} from '@/lib/v3/content'
import {questionHeading} from '@/lib/headings'
import type {BlockContext} from '../types'

export const hasSymptoms = ({page}: BlockContext) => Boolean(page.diagnose?.rows?.length)

const OUTCOME_ICONS: IconName[] = ['wrench', 'swap', 'shieldCheck', 'circleCheck']

/** D5 Symptom accordion + info cards. */
export function SymptomsBlock({ctx}: {ctx: BlockContext}) {
  const {page, visuals, editorial} = ctx
  const diagnose = page.diagnose || {}
  const [seeing, causesLabel, startLabel] = diagnose.columns?.length === 3 ? diagnose.columns : ["What you're seeing", 'Common causes we check', 'Where we start']
  const noun = jobNoun(page.jobPaths?.heading)
  const repair = splitConfirm(diagnose.repairBody)
  const [repairLead, ...repairRows] = sentences(repair.text)
  const orphan = splitConfirm(diagnose.orphanBody)
  const orphanChips = listAfterColon(orphan.text)

  return (
    <div className="ds-wrap">
      <SectionHead eyebrow={noun ? `${noun} repair` : 'Repair'} id="diagnose-title" title={questionHeading(diagnose.heading)} lede={diagnose.lede} editorial={editorial} />
      <div className="ds-symptoms">
        {visuals.diagnose && <div className="ds-symptoms-photo">
          <PhotoFrame photo={visuals.diagnose} pill={false} className="ds-photo--tall" />
          {visuals.diagnose.illustrative && <p className="ds-meta">Illustrative photo</p>}
        </div>}
        <div className="ds-symptoms-list">
          <p className="ds-label-head ds-label-head--muted">{seeing}</p>
          {diagnose.rows?.map((row, index) => {
            const causes = splitConfirm(row.causes)
            const first = splitConfirm(row.firstCheck)
            return (
              <details className="ds-acc" name="symptoms" open={index === 0} key={row._key || row.symptom}>
                <summary><IconBadge icon={pickIcon(row.symptom, 'alert')} tone="blue" size={44} /><span className="ds-acc-title">{row.symptom}</span><Icon name="chevronDown" size={20} className="ds-acc-chevron" /></summary>
                <div className="ds-acc-body">
                  <p className="ds-label-head ds-label-head--muted">{causesLabel}</p>
                  <p>{causes.text}</p>
                  <ConfirmNotes notes={causes.notes} show={editorial} />
                  {first.text && <div className="ds-start-box"><Icon name="search" size={18} /><div><p className="ds-label-head ds-label-head--blue">{startLabel}</p><p>{first.text}</p><ConfirmNotes notes={first.notes} show={editorial} /></div></div>}
                </div>
              </details>
            )
          })}
        </div>
      </div>

      {(diagnose.repairTitle || diagnose.orphanTitle) && <div className="ds-info-cards">
        {diagnose.repairTitle && <article className="ds-info-card">
          <div className="ds-info-head"><IconBadge icon="refresh" tone="blue" /><h3 className="ds-h4">{diagnose.repairTitle}</h3></div>
          {repairLead && <p className="ds-info-lead">{repairLead}</p>}
          {repairRows.length > 0 && <ul className="ds-icon-rows">{repairRows.map((row, index) => <li key={row}><IconBadge icon={OUTCOME_ICONS[index % OUTCOME_ICONS.length]} tone="white" size={40} /><p>{row}</p></li>)}</ul>}
          <ConfirmNotes notes={repair.notes} show={editorial} />
        </article>}
        {diagnose.orphanTitle && <article className="ds-info-card ds-info-card--navy">
          {visuals.orphan && <PhotoFrame photo={visuals.orphan} className="ds-info-thumb" />}
          <div className="ds-info-head"><IconBadge icon="fileX" tone="navy" /><h3 className="ds-h4">{diagnose.orphanTitle}</h3></div>
          <p>{orphan.text}</p>
          {orphanChips.length > 0 && <ul className="ds-chip-grid">{orphanChips.map((chip) => <li key={chip}><Icon name={pickIcon(chip, 'fileText')} size={18} />{chip}</li>)}</ul>}
          <ConfirmNotes notes={orphan.notes} show={editorial} />
        </article>}
      </div>}
    </div>
  )
}
