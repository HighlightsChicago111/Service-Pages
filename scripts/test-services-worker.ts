import assert from 'node:assert/strict'
// @ts-expect-error -- plain JS Worker module, deployed to Cloudflare as is.
import worker, {isServicesPath} from '../cloudflare/services-worker.js'

// The /services Cloudflare Worker sends every /services request to the app, whatever its depth or
// query string. A query string must never fall through to Webflow, which 301s /services to /new-services.
const ORIGIN = 'https://service-pages.example.vercel.app'
const env = {SERVICES_ORIGIN: ORIGIN}

const calls: string[] = []
globalThis.fetch = (async (input: Request | string) => {
  const request = typeof input === 'string' ? new Request(input) : input
  calls.push(request.url)
  if (request.url.startsWith(ORIGIN)) {
    // The app's own redirect, written with the origin host.
    if (new URL(request.url).pathname === '/services/ceiling-fan') return new Response(null, {status: 308, headers: {Location: `${ORIGIN}/services/ceiling-fan-installation`}})
    return new Response('app', {status: 200})
  }
  return new Response('webflow', {status: 200})
}) as typeof fetch

async function served(path: string) {
  calls.length = 0
  const response = await worker.fetch(new Request(`https://www.highlightschicago.com${path}`), env)
  return {response, upstream: calls[0], body: await response.text()}
}

async function run() {
  for (const path of [
    '/services',
    '/services?_rsc=abc12',
    '/services?utm_source=google',
    '/services/',
    '/services/ev-charging',
    '/services/ev-charging?_rsc=abc12',
    '/services/backup-power/generator-installation',
    '/services/generator-installation/chicago',
    '/services/_next/static/chunks/app.js',
    '/services/sitemap.xml',
  ]) {
    const {upstream, body} = await served(path)
    assert.equal(upstream, `${ORIGIN}${path}`, `${path} must go to the app with its query string`)
    assert.equal(body, 'app', `${path} must be served by the app`)
  }

  for (const path of ['/new-services', '/services-old', '/servicesx?x=1', '/', '/about-us']) {
    assert.equal(isServicesPath(new URL(path, 'https://x').pathname), false, `${path} is not an app path`)
    const {upstream, body} = await served(path)
    assert.equal(upstream, `https://www.highlightschicago.com${path}`, `${path} must stay on Webflow`)
    assert.equal(body, 'webflow', `${path} must be served by Webflow`)
  }

  const {response} = await served('/services/ceiling-fan')
  assert.equal(response.status, 308)
  assert.equal(response.headers.get('Location'), 'https://www.highlightschicago.com/services/ceiling-fan-installation', 'App redirects must point at the public domain')

  const missing = await worker.fetch(new Request('https://www.highlightschicago.com/services'), {})
  assert.equal(missing.status, 500, 'A worker without SERVICES_ORIGIN must fail loudly, not fall back to Webflow')

  console.log('Services worker test passed: every /services path and query goes to the app, other paths stay on Webflow, redirects keep the public domain.')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
