import assert from 'node:assert/strict'
import {clusterForService, serviceClusters} from '../src/lib/clusters'
import {
  PUBLIC_SITE_ORIGIN,
  clusterPagePath,
  resolvePublishedServicePath,
  servicePagePath,
  servicePageUrl,
  serviceRoutePath,
  unbrandedPageTitle,
} from '../src/lib/service-urls'

const routes = [
  {serviceSlug: 'gfci-outlet-installation', areaSlug: 'chicago'},
  {serviceSlug: 'ev-charger-installation', areaSlug: 'chicago'},
]

// Service pages live under their group: /services/<cluster>/<service>.
assert.equal(serviceRoutePath('gfci-outlet-installation'), '/outlets-switches/gfci-outlet-installation')
assert.equal(servicePagePath('gfci-outlet-installation'), '/services/outlets-switches/gfci-outlet-installation')
assert.equal(
  servicePageUrl('gfci-outlet-installation'),
  `${PUBLIC_SITE_ORIGIN}/services/outlets-switches/gfci-outlet-installation`,
)
assert.equal(clusterPagePath('outlets-switches'), '/services/outlets-switches')
// A service outside every group keeps a flat URL.
assert.equal(servicePagePath('ev-charger-installation'), '/services/ev-charger-installation')
// A page published after the workbook joins the group its Sanity cluster name names.
assert.equal(servicePagePath('solar-inverter-installation', 'Energy Efficiency & Solar'), '/services/energy-efficiency/solar-inverter-installation')
assert.equal(serviceRoutePath('well-pump-wiring', ' appliance & equipment circuits '), '/appliance-circuits/well-pump-wiring')
assert.equal(servicePagePath('solar-inverter-installation', 'Not A Cluster'), '/services/solar-inverter-installation')
// The workbook's group wins over a page's cluster name, so listed URLs never move.
assert.equal(serviceRoutePath('gfci-outlet-installation', 'Interior Lighting'), '/outlets-switches/gfci-outlet-installation')

assert.equal(
  resolvePublishedServicePath(
    'https://www.highlightschicago.com/services/residential-electrical-services/gfci-outlet-installation/',
    'GFCI Outlet Installation',
    routes,
    'chicago',
  ),
  '/services/outlets-switches/gfci-outlet-installation',
)
assert.equal(
  resolvePublishedServicePath('/services/residential-electrical-services/', 'Residential electrical services', routes, 'chicago'),
  null,
)
assert.equal(resolvePublishedServicePath('https://example.com/services/ev-charger-installation', 'EV Charger Installation', routes, 'chicago'), null)
assert.equal(unbrandedPageTitle('GFCI Outlet Installation | Highlights Chicago'), 'GFCI Outlet Installation')
assert.equal(unbrandedPageTitle('EV Charger Installation — Highlights Chicago | Highlights Chicago'), 'EV Charger Installation')

// Every published group has services, and every service belongs to exactly one group.
const services = serviceClusters.flatMap((cluster) => cluster.services)
assert.ok(serviceClusters.every((cluster) => cluster.services.length > 0))
const parentNames = serviceClusters.map((cluster) => cluster.parentName?.trim().toLowerCase())
assert.equal(new Set(parentNames).size, parentNames.length, 'two groups must not share a Sanity cluster name')
assert.equal(new Set(services).size, services.length, 'a service must not appear in two groups')
assert.ok(services.every((service) => clusterForService(service)), 'every grouped service must resolve to its group')
assert.ok(!serviceClusters.some((cluster) => services.includes(cluster.slug)), 'a group slug must not equal a service slug')

console.log('Service URL contract passed: nested service paths, group paths, flat fallback, titles and related-link normalization are stable.')
