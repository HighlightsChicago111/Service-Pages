'use client'

import {FormEvent, useId, useState} from 'react'

export function FooterLeadForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const id = useId()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    const target = event.currentTarget
    const form = new FormData(target)
    try {
      const response = await fetch('/api/lead', {
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
    <form className="collection-footer-form" aria-label="Footer quick quote form" onSubmit={submit}>
      <input type="hidden" name="service" value="General electrical service" />
      <input type="hidden" name="area" value="Chicago" />
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label htmlFor={`${id}-name`}><span>Name</span><input id={`${id}-name`} name="name" placeholder="Your name" required autoComplete="name" /></label>
      <label htmlFor={`${id}-email`}><span>Email</span><input id={`${id}-email`} name="email" type="email" placeholder="Your email" autoComplete="email" /></label>
      <label htmlFor={`${id}-phone`}><span>Phone number</span><input id={`${id}-phone`} name="phone" type="tel" placeholder="Your phone number" required autoComplete="tel" /></label>
      <label htmlFor={`${id}-address`}><span>Property address</span><input id={`${id}-address`} name="address" placeholder="Property address" autoComplete="street-address" /></label>
      <label htmlFor={`${id}-issue`}><span>How can we help?</span><textarea id={`${id}-issue`} name="issue" placeholder="Hey, how can we help?" rows={3} /></label>
      <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Request Free Quote'}</button>
      {status === 'sent' && <p className="collection-footer-success" role="status">Thanks—your request was sent.</p>}
      {status === 'error' && <p className="collection-footer-error" role="alert">We could not send the form. Please call 773-262-3333.</p>}
    </form>
  )
}
