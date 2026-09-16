import assert from 'node:assert/strict'
import {
  PUBLIC_SITE_ORIGIN,
  resolvePublishedServicePath,
  servicePagePath,
  servicePageUrl,
  unbrandedPageTitle,
} from '../src/lib/service-urls'

const routes = [
  {serviceSlug: 'gfci-outlet-installation', areaSlug: 'chicago'},
  {serviceSlug: 'ev-charger-installation', areaSlug: 'chicago'},
]

assert.equal(servicePagePath('gfci-outlet-installation'), '/services/gfci-outlet-installation')
assert.equal(
  servicePageUrl('gfci-outlet-installation'),
  `${PUBLIC_SITE_ORIGIN}/services/gfci-outlet-installation`,
)
assert.equal(
  resolvePublishedServicePath(
    'https://www.highlightschicago.com/services/residential-electrical-services/gfci-outlet-installation/',
    'GFCI Outlet Installation',
    routes,
    'chicago',
  ),
  '/services/gfci-outlet-installation',
)
assert.equal(
  resolvePublishedServicePath('/services/residential-electrical-services/', 'Residential electrical services', routes, 'chicago'),
  null,
)
assert.equal(resolvePublishedServicePath('https://example.com/services/ev-charger-installation', 'EV Charger Installation', routes, 'chicago'), null)
assert.equal(unbrandedPageTitle('GFCI Outlet Installation | Highlights Chicago'), 'GFCI Outlet Installation')
assert.equal(unbrandedPageTitle('EV Charger Installation — Highlights Chicago | Highlights Chicago'), 'EV Charger Installation')

console.log('Service URL contract passed: canonical, title, and related-link normalization are stable.')
