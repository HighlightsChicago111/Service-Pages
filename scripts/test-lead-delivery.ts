import assert from 'node:assert/strict'
import {POST} from '../src/app/api/lead/route'

const originalFetch = global.fetch
const originalEnv = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  LEAD_FROM_EMAIL: process.env.LEAD_FROM_EMAIL,
  LEAD_NOTIFICATION_EMAIL: process.env.LEAD_NOTIFICATION_EMAIL,
  LEAD_WEBHOOK_URL: process.env.LEAD_WEBHOOK_URL,
}

function leadRequest(payload: Record<string, unknown>, referer?: string) {
  return new Request('http://localhost/api/lead', {
    method: 'POST',
    headers: {'content-type': 'application/json', ...(referer ? {referer} : {})},
    body: JSON.stringify(payload),
  })
}

async function run() {
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.LEAD_FROM_EMAIL = 'Highlights Chicago <leads@updates.example.com>'
  process.env.LEAD_NOTIFICATION_EMAIL = 'dispatch@example.com, owner@example.com'

  let capturedUrl = ''
  let capturedInit: RequestInit | undefined
  global.fetch = async (input, init) => {
    capturedUrl = String(input)
    capturedInit = init
    return new Response(JSON.stringify({id: 'email_test_123'}), {status: 200, headers: {'content-type': 'application/json'}})
  }

  const success = await POST(leadRequest({
    name: 'QA Customer',
    email: 'qa@example.com',
    phone: '(773) 555-0100',
    address: 'Lincoln & Foster',
    buildingType: 'Two-flat or three-flat',
    issue: 'Quote only',
    service: 'Generator Installation',
    area: 'Chicago',
  }))
  assert.equal(success.status, 200)
  assert.equal(capturedUrl, 'https://api.resend.com/emails')
  assert.equal(capturedInit?.method, 'POST')
  const headers = capturedInit?.headers as Record<string, string>
  assert.equal(headers.authorization, 'Bearer re_test_key')
  assert.match(headers['Idempotency-Key'], /^lead\/[0-9a-f-]{36}$/)
  const email = JSON.parse(String(capturedInit?.body)) as {from: string; to: string[]; subject: string; text: string}
  assert.equal(email.from, 'Highlights Chicago <leads@updates.example.com>')
  assert.deepEqual(email.to, ['dispatch@example.com', 'owner@example.com'])
  assert.equal(email.subject, 'New Generator Installation lead — Chicago')
  assert.match(email.text, /Name: QA Customer/)
  assert.match(email.text, /Email: qa@example.com/)
  assert.match(email.text, /Phone: \(773\) 555-0100/)
  assert.match(email.text, /Request: Quote only/)

  global.fetch = async () => new Response(null, {status: 429})
  const upstreamFailure = await POST(leadRequest({name: 'QA Customer', phone: '7735550100'}))
  assert.equal(upstreamFailure.status, 502)

  // GHL/CRM webhook forwarding: fires before the email, carries sourceUrl/submittedAt,
  // and both calls happen even though the webhook is unrelated to Resend.
  process.env.LEAD_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/test/webhook/'
  const calls: {url: string; init?: RequestInit}[] = []
  global.fetch = async (input, init) => {
    calls.push({url: String(input), init})
    if (String(input) === process.env.LEAD_WEBHOOK_URL) return new Response(null, {status: 200})
    return new Response(JSON.stringify({id: 'email_test_456'}), {status: 200, headers: {'content-type': 'application/json'}})
  }
  const withWebhook = await POST(leadRequest({
    name: 'QA Customer',
    phone: '(773) 555-0100',
    service: 'Generator Installation',
    area: 'Chicago',
  }, 'https://www.highlightschicago.com/services/generator-installation'))
  assert.equal(withWebhook.status, 200)
  assert.equal(calls.length, 2, 'expected one webhook call and one Resend call')
  assert.equal(calls[0].url, process.env.LEAD_WEBHOOK_URL)
  assert.equal(calls[1].url, 'https://api.resend.com/emails')
  const webhookBody = JSON.parse(String(calls[0].init?.body)) as Record<string, string>
  assert.equal(webhookBody.name, 'QA Customer')
  assert.equal(webhookBody.service, 'Generator Installation')
  assert.equal(webhookBody.sourceUrl, 'https://www.highlightschicago.com/services/generator-installation')
  assert.match(webhookBody.submittedAt, /^\d{4}-\d{2}-\d{2}T/)

  // A down/erroring webhook must never break or delay a real lead's email delivery.
  calls.length = 0
  global.fetch = async (input) => {
    if (String(input) === process.env.LEAD_WEBHOOK_URL) throw new Error('ECONNREFUSED')
    return new Response(JSON.stringify({id: 'email_test_789'}), {status: 200, headers: {'content-type': 'application/json'}})
  }
  const webhookDown = await POST(leadRequest({name: 'QA Customer', phone: '7735550100'}))
  assert.equal(webhookDown.status, 200, 'email must still succeed when the webhook is unreachable')

  // No LEAD_WEBHOOK_URL configured: no webhook call is made at all.
  delete process.env.LEAD_WEBHOOK_URL
  const noCalls: string[] = []
  global.fetch = async (input) => {
    noCalls.push(String(input))
    return new Response(JSON.stringify({id: 'email_test_000'}), {status: 200, headers: {'content-type': 'application/json'}})
  }
  const webhookDisabled = await POST(leadRequest({name: 'QA Customer', phone: '7735550100'}))
  assert.equal(webhookDisabled.status, 200)
  assert.deepEqual(noCalls, ['https://api.resend.com/emails'])

  delete process.env.RESEND_API_KEY
  const unconfigured = await POST(leadRequest({name: 'QA Customer', phone: '7735550100'}))
  assert.equal(unconfigured.status, 503)

  const invalid = await POST(leadRequest({name: 'QA Customer', phone: '123'}))
  assert.equal(invalid.status, 400)

  console.log('Lead delivery test passed: Resend request, recipients, content, idempotency, validation, failure handling, and GHL/CRM webhook forwarding (success, resilience, and disabled).')
}

run().finally(() => {
  global.fetch = originalFetch
  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
}).catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
