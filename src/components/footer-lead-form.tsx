'use client'

import {useId} from 'react'
import {useLeadSubmit} from '@/lib/use-lead-submit'

export function FooterLeadForm() {
  const {status, submit} = useLeadSubmit()
  const id = useId()

  return (
    <form className="hc-footer-form" aria-label="Footer quick quote form" onSubmit={submit}>
      <input type="hidden" name="service" value="General electrical service" />
      <input type="hidden" name="area" value="Chicago" />
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label htmlFor={`${id}-name`}>Name<input id={`${id}-name`} name="name" placeholder="Your name" required autoComplete="name" /></label>
      <label htmlFor={`${id}-email`}>Email<input id={`${id}-email`} name="email" type="email" placeholder="Your email" autoComplete="email" /></label>
      <label htmlFor={`${id}-phone`}>Phone number<input id={`${id}-phone`} name="phone" type="tel" placeholder="Your phone number" required autoComplete="tel" /></label>
      <label htmlFor={`${id}-address`}>Property address<input id={`${id}-address`} name="address" placeholder="Property address" autoComplete="street-address" /></label>
      <label className="hc-span-2" htmlFor={`${id}-issue`}>How can we help?<textarea id={`${id}-issue`} name="issue" placeholder="Hey, how can we help?" rows={3} /></label>
      <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Request Free Quote'}</button>
      {status === 'error' && <p className="hc-footer-error" role="alert">We could not send the form. Please call 773-262-3333.</p>}
      <p className="hc-footer-call">Or call<a href="tel:773-262-3333">773-262-3333</a></p>
    </form>
  )
}
