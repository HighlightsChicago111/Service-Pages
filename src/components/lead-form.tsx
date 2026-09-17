'use client'

import {FormEvent, useEffect, useId, useRef, useState} from 'react'

type Props = {
  service: string
  area: string
  issueQuestion?: string
  issueOptions?: string[]
  buildingTypes?: string[]
  addressPlaceholder?: string
  subtitle?: string
  note?: string
}

export function LeadForm(props: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const id = useId()
  const successDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = successDialogRef.current
    if (status === 'sent' && dialog && !dialog.open) dialog.showModal()
  }, [status])

  function closeSuccessDialog() {
    const dialog = successDialogRef.current
    if (dialog?.open) dialog.close()
    else setStatus('idle')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    const target = event.currentTarget
    const form = new FormData(target)
    try {
      const response = await fetch('/services/api/lead', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(Object.fromEntries(form.entries())),
      })
      setStatus(response.ok ? 'sent' : 'error')
      if (response.ok) target.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <aside className="form-card" id="quote">
      <h2>{props.service} in {props.area}</h2>
      {props.subtitle && <p className="muted small">{props.subtitle}</p>}
      <form onSubmit={submit}>
        <input type="hidden" name="service" value={props.service} />
        <input type="hidden" name="area" value={props.area} />
        <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <div className="field"><label htmlFor={`${id}-name`}>Name</label><input id={`${id}-name`} name="name" required autoComplete="name" /></div>
        <div className="field"><label htmlFor={`${id}-phone`}>Phone</label><input id={`${id}-phone`} name="phone" type="tel" required autoComplete="tel" /></div>
        <div className="field"><label htmlFor={`${id}-address`}>Street or cross streets</label><input id={`${id}-address`} name="address" placeholder={props.addressPlaceholder} autoComplete="street-address" /></div>
        <div className="field"><label htmlFor={`${id}-building`}>Building type</label><select id={`${id}-building`} name="buildingType">{props.buildingTypes?.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="field"><label htmlFor={`${id}-issue`}>{props.issueQuestion || 'What do you need?'}</label><select id={`${id}-issue`} name="issue">{props.issueOptions?.map((item) => <option key={item}>{item}</option>)}</select></div>
        <button className="btn btn-primary btn-block" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Request service'}
        </button>
        {props.note && <p className="form-note">{props.note}</p>}
        {status === 'error' && <p className="form-error" role="alert">The form is not connected yet. Please call us instead.</p>}
      </form>
      {status === 'sent' && (
        <dialog
          ref={successDialogRef}
          className="service-success-dialog"
          aria-labelledby={`${id}-success-title`}
          aria-describedby={`${id}-success-message`}
          onClose={() => setStatus('idle')}
        >
          <div className="service-success-dialog-content">
            <button className="service-success-dialog-close" type="button" aria-label="Close confirmation" onClick={closeSuccessDialog}>×</button>
            <div className="service-success-dialog-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m6.8 12.3 3.3 3.3 7.1-7.2" /></svg>
            </div>
            <p className="service-success-dialog-kicker">Request received</p>
            <h2 id={`${id}-success-title`}>Thank you.</h2>
            <p className="service-success-dialog-message" id={`${id}-success-message`}>Your request was sent.</p>
            <p className="service-success-dialog-detail">A Highlights Chicago team member will contact you shortly to discuss your service request.</p>
            <button className="btn btn-primary service-success-dialog-button" type="button" autoFocus onClick={closeSuccessDialog}>Done</button>
          </div>
        </dialog>
      )}
    </aside>
  )
}
