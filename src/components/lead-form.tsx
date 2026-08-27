'use client'

import {FormEvent, useState} from 'react'

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(Object.fromEntries(form.entries())),
    })
    setStatus(response.ok ? 'sent' : 'error')
    if (response.ok) event.currentTarget.reset()
  }

  return (
    <aside className="form-card" id="quote">
      <h2>{props.service} in {props.area}</h2>
      {props.subtitle && <p className="muted small">{props.subtitle}</p>}
      <form onSubmit={submit}>
        <input type="hidden" name="service" value={props.service} />
        <input type="hidden" name="area" value={props.area} />
        <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <label>Name<input name="name" required autoComplete="name" /></label>
        <label>Phone<input name="phone" type="tel" required autoComplete="tel" /></label>
        <label>Street or cross streets<input name="address" placeholder={props.addressPlaceholder} autoComplete="street-address" /></label>
        <label>Building type<select name="buildingType">{props.buildingTypes?.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>{props.issueQuestion || 'What do you need?'}<select name="issue">{props.issueOptions?.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button className="button primary block" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Request service'}
        </button>
        {props.note && <p className="form-note">{props.note}</p>}
        {status === 'sent' && <p className="form-success" role="status">Thanks—your request was sent.</p>}
        {status === 'error' && <p className="form-error" role="alert">The form is not connected yet. Please call us instead.</p>}
      </form>
    </aside>
  )
}
