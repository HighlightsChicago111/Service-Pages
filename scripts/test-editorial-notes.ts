import assert from 'node:assert/strict'
import {readdirSync} from 'node:fs'
import {join} from 'node:path'
import {withoutEditorialNotes} from '../src/lib/v3/content'
import {BRAND_LOGO_FILES} from '../src/lib/v3/brand-logo-files'
import {brandLogoSrc} from '../src/components/v3/blocks/logos'

// Published pages drop every editorial flag, in any field, and a list entry that was only a flag.
const page = {
  _id: 'v2-page-1',
  hero: {lede: 'Fast help. [CONFIRM: arrival time]'},
  serviceGuide: {sections: [{_key: 's1', body: 'One check first. [CONFIRM: is this standard?] Then the fix.'}]},
  pricing: {drivers: [{_key: 'd1', when: 'At the check [CONFIRM: priced then?]'}]},
  included: {handover: ['Permit number', '[CONFIRM: what else is handed over]', 'Inspection result']},
  faqs: [{_key: 'f1', question: 'How long?', answer: 'A day. [CONFIRM: typical length]'}],
}
const clean = withoutEditorialNotes(page)
assert.equal(clean.hero.lede, 'Fast help.')
assert.equal(clean.serviceGuide.sections[0].body, 'One check first. Then the fix.')
assert.equal(clean.pricing.drivers[0].when, 'At the check')
assert.deepEqual(clean.included.handover, ['Permit number', 'Inspection result'])
assert.equal(clean.faqs[0].answer, 'A day.')
assert.equal(clean._id, 'v2-page-1')
assert.equal(JSON.stringify(clean).includes('CONFIRM'), false)
assert.equal(withoutEditorialNotes(null), null)

// The logo list matches the folder, and a brand with no file gets no image URL (the tile shows its name).
const folder = readdirSync(join(process.cwd(), 'public/images/brands')).filter((file) => file.endsWith('.png')).map((file) => file.slice(0, -4)).sort()
assert.deepEqual([...BRAND_LOGO_FILES].sort(), folder, 'src/lib/v3/brand-logo-files.ts is out of date with public/images/brands')
assert.equal(brandLogoSrc('Bulldog Pushmatic'), undefined)
assert.ok(brandLogoSrc('Federal Pacific')?.endsWith('/images/brands/federal-pacific.png'))
assert.ok(brandLogoSrc('Square D')?.includes('/images/v3/logos/'))

console.log('Editorial notes test passed: flags never reach a published page, and every logo tile has a real file or a name.')
