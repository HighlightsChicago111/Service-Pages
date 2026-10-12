'use client'

import {useId, useState} from 'react'
import {useLeadSubmit} from '@/lib/use-lead-submit'
import {Icon} from './icon'

type ExtraField = {_key?: string; fieldName: string; label: string; options?: string[]}

type Props = {
  title: string
  subtitle?: string
  note?: string
  service: string
  area: string
  jobLabel: string
  issueQuestion?: string
  issueOptions?: string[]
  buildingTypes?: string[]
  extraFields?: ExtraField[]
  addressPlaceholder?: string
}

/** A follow-up question about an existing system only applies once the visitor says they have one. */
const dependsOnExisting = (field: ExtraField) => field.fieldName === 'symptom'
const saysNoExisting = (value: string) => /^no\b/i.test(value.trim())
const NOT_APPLICABLE = 'Not applicable'

/** D1 quote form: two numbered groups, job type as chips, dependent fields inactive until relevant. */
export function QuoteForm(props: Props) {
  const {status, submit} = useLeadSubmit()
  const id = useId()
  const issueOptions = props.issueOptions || []
  const [issue, setIssue] = useState(issueOptions[0] || '')
  const existingField = props.extraFields?.find((field) => field.fieldName === 'existingSystem')
  const [existing, setExisting] = useState(existingField?.options?.[0] || '')

  return (
    <aside className="ds-form-card" id="quote" aria-labelledby={`${id}-title`}>
      <h2 className="ds-form-title" id={`${id}-title`}>{props.title}</h2>
      {props.subtitle && <p className="ds-form-sub">{props.subtitle}</p>}
      <form onSubmit={submit}>
        <input type="hidden" name="service" value={props.service} />
        <input type="hidden" name="area" value={props.area} />
        <label className="ds-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>

        <div className="ds-form-group" role="group" aria-labelledby={`${id}-g1`}>
          <p className="ds-form-group-title" id={`${id}-g1`}><span className="ds-step-dot">1</span>Your details</p>
          <div className="ds-form-row">
            <div className="ds-field"><label htmlFor={`${id}-name`}>Name</label><input id={`${id}-name`} name="name" required autoComplete="name" /></div>
            <div className="ds-field"><label htmlFor={`${id}-phone`}>Phone</label><input id={`${id}-phone`} name="phone" type="tel" required autoComplete="tel" inputMode="tel" /></div>
          </div>
          <div className="ds-field ds-field--icon">
            <label htmlFor={`${id}-address`}>Street or cross streets</label>
            <span className="ds-input-icon"><Icon name="mapPin" size={18} /><input id={`${id}-address`} name="address" placeholder={props.addressPlaceholder} autoComplete="street-address" /></span>
          </div>
        </div>

        <div className="ds-form-group" role="group" aria-labelledby={`${id}-g2`}>
          <p className="ds-form-group-title" id={`${id}-g2`}><span className="ds-step-dot">2</span>{props.jobLabel}</p>
          {Boolean(props.buildingTypes?.length) && <div className="ds-field">
            <label htmlFor={`${id}-building`}>Building type</label>
            <span className="ds-select"><select id={`${id}-building`} name="buildingType">{props.buildingTypes?.map((item) => <option key={item}>{item}</option>)}</select><Icon name="chevronDown" size={18} /></span>
          </div>}
          {issueOptions.length > 0 && <div className="ds-field" role="radiogroup" aria-labelledby={`${id}-issue`}>
            <span className="ds-label" id={`${id}-issue`}>{props.issueQuestion || 'What do you need?'}</span>
            <div className="ds-chip-options">
              {issueOptions.map((option) => (
                <label className={`ds-chip-option${issue === option ? ' is-selected' : ''}`} key={option}>
                  <input type="radio" name="issue" value={option} checked={issue === option} onChange={() => setIssue(option)} />
                  {issue === option && <Icon name="check" size={14} />}
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>}
          {props.extraFields?.map((field) => {
            const controlsOthers = field.fieldName === 'existingSystem'
            const inactive = dependsOnExisting(field) && Boolean(existingField) && saysNoExisting(existing)
            return (
              <div className={`ds-field${inactive ? ' is-inactive' : ''}`} key={field._key || field.fieldName}>
                <label htmlFor={`${id}-${field.fieldName}`}>{field.label}</label>
                <span className="ds-select">
                  <select
                    // Remount when the field switches state, so it resets to its first real option.
                    key={inactive ? 'inactive' : 'active'}
                    id={`${id}-${field.fieldName}`}
                    name={field.fieldName}
                    disabled={inactive}
                    defaultValue={controlsOthers ? undefined : inactive ? NOT_APPLICABLE : undefined}
                    value={controlsOthers ? existing : undefined}
                    onChange={controlsOthers ? (event) => setExisting(event.target.value) : undefined}
                  >
                    {/* Every option stays in the HTML; an inactive field just shows "Not applicable". */}
                    {inactive && <option value={NOT_APPLICABLE}>{NOT_APPLICABLE}</option>}
                    {field.options?.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <Icon name="chevronDown" size={18} />
                </span>
              </div>
            )
          })}
        </div>

        <button className="ds-btn ds-btn--primary ds-btn--block" type="submit" disabled={status === 'sending'}>
          <span>{status === 'sending' ? 'Sending…' : 'Request service'}</span><Icon name="arrowRight" size={18} />
        </button>
        {status === 'error' && <p className="ds-form-error" role="alert">We could not send the form. Please call us instead.</p>}
        {props.note && <p className="ds-form-note"><Icon name="circleCheck" size={16} />{props.note}</p>}
      </form>
    </aside>
  )
}
