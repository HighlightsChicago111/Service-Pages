import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {LEAD_ENDPOINT} from '../src/lib/use-lead-submit'
import {SERVICES_PATH, THANK_YOU_PATH} from '../src/lib/service-urls'

// Run against a running server: `pnpm dev`, then `pnpm test:thank-you [baseUrl]`.
const baseUrl = (process.argv[2] || process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8')

async function run() {
  // The team tracks conversions on this exact URL, and the lead API path is what
  // the GHL/CRM webhook forwarding hangs off. Changing either is a breaking change.
  assert.equal(THANK_YOU_PATH, '/services/thank-you')
  assert.equal(LEAD_ENDPOINT, '/services/api/lead')

  // Both lead forms share one submit path and neither shows a confirmation popup.
  for (const file of ['src/components/lead-form.tsx', 'src/components/footer-lead-form.tsx']) {
    const source = read(file)
    assert.match(source, /useLeadSubmit\(\)/, `${file} must use the shared submit hook`)
    assert.doesNotMatch(source, /<dialog|showModal|service-success-dialog/, `${file} must not show a confirmation popup`)
  }
  assert.match(read('src/lib/use-lead-submit.ts'), /window\.location\.assign\(THANK_YOU_PATH\)/, 'a successful submit must send the visitor to the thank-you page')

  const page = await fetch(`${baseUrl}${THANK_YOU_PATH}`)
  const html = await page.text()
  assert.equal(page.status, 200, `${THANK_YOU_PATH} must be published`)
  assert.equal(html.match(/<h1[\s>]/g)?.length, 1, 'thank-you page must have exactly one h1')
  assert.match(html, /<h1[^>]*>Thank you\. Your request was sent to the team\.<\/h1>/)
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/, 'thank-you page must be noindex')
  assert.match(html, /href="tel:773-262-3333"/, 'thank-you page must offer the phone number')

  const sitemap = await (await fetch(`${baseUrl}${SERVICES_PATH}/sitemap.xml`)).text()
  assert.ok(!sitemap.includes('thank-you'), 'thank-you page must not be in the sitemap')

  console.log('Thank-you page test passed: tracked URL, shared submit path, no popup, noindex, and excluded from the sitemap.')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
