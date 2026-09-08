export type ServiceCluster = {
  id: number
  name: string
  slug: string
  description: string
  monthlySearchVolume: number
  plannedServiceCount: number
}

export type PublishedServiceRoute = {
  serviceId: number
  clusterSlug: string
  routeSlug: string
  sanitySlug: string
}

// Source: "Highlights Chicago Content Plan.xlsx", tabs "2 Cluster Level" and
// "3 Service Level". Cluster volume includes child-service demand and should
// not be added to the service-level totals.
export const serviceClusters: ServiceCluster[] = [
  {id: 201, name: 'EV Charging', slug: 'ev-charging', description: 'Home charging stations, Tesla connectors, Level 2 equipment, and dedicated EV circuits.', monthlySearchVolume: 118650, plannedServiceCount: 1},
  {id: 202, name: 'Backup & Standby Power', slug: 'backup-power', description: 'Whole-house generators, transfer equipment, standby power installation, repair, and maintenance.', monthlySearchVolume: 103960, plannedServiceCount: 2},
  {id: 203, name: 'Energy Efficiency & Solar', slug: 'energy-efficiency', description: 'Solar panels, battery storage, energy audits, efficient appliances, and electrical load planning.', monthlySearchVolume: 70370, plannedServiceCount: 7},
  {id: 204, name: 'Emergency Response', slug: 'emergency-electrical', description: 'Urgent electrical faults, outage restoration, sparking equipment, and immediate safety concerns.', monthlySearchVolume: 63130, plannedServiceCount: 1},
  {id: 205, name: 'Panels, Circuits & Protection', slug: 'panels-circuits', description: 'Breakers, load centers, junction boxes, surge protection, and circuit-level safety work.', monthlySearchVolume: 52960, plannedServiceCount: 6},
  {id: 206, name: 'Appliance & Equipment Circuits', slug: 'appliance-circuits', description: 'Dedicated circuits and connections for fans, disposals, pumps, kitchen equipment, and appliances.', monthlySearchVolume: 48840, plannedServiceCount: 8},
  {id: 207, name: 'Outlets, Switches & Controls', slug: 'outlets-switches', description: 'GFCI and AFCI protection, receptacles, switches, dimmers, sensors, and smart controls.', monthlySearchVolume: 32900, plannedServiceCount: 6},
  {id: 208, name: 'Wiring, Diagnostics & Compliance', slug: 'wiring-diagnostics', description: 'Electrical repair, rewiring, troubleshooting, installation, diagnostics, and code compliance.', monthlySearchVolume: 26920, plannedServiceCount: 5},
  {id: 209, name: 'Interior Lighting', slug: 'interior-lighting', description: 'Recessed, fixture, track, pendant, accent, cabinet, and energy-efficient indoor lighting.', monthlySearchVolume: 26770, plannedServiceCount: 11},
  {id: 210, name: 'Life Safety Detection', slug: 'life-safety', description: 'Fire alarms, smoke detectors, carbon monoxide detectors, heat detection, and system testing.', monthlySearchVolume: 22460, plannedServiceCount: 4},
  {id: 211, name: 'Exterior, Egress & Commercial Lighting', slug: 'exterior-lighting', description: 'Outdoor, landscape, security, commercial, exit-sign, and egress lighting systems.', monthlySearchVolume: 22310, plannedServiceCount: 5},
  {id: 212, name: 'Power Distribution & Service Entry', slug: 'power-distribution', description: 'Service upgrades, switchgear, temporary power, risers, busway, transformers, and utility entry work.', monthlySearchVolume: 17750, plannedServiceCount: 8},
  {id: 213, name: 'Low Voltage, Data & AV', slug: 'low-voltage', description: 'Structured cabling, network wiring, cameras, access control, audio-video, and communication systems.', monthlySearchVolume: 10910, plannedServiceCount: 8},
]

export const publishedServiceRoutes: PublishedServiceRoute[] = [
  {serviceId: 301, clusterSlug: 'backup-power', routeSlug: 'generator-installation', sanitySlug: 'generator-installation'},
  {serviceId: 302, clusterSlug: 'energy-efficiency', routeSlug: 'solar-panel-installation-and-repair', sanitySlug: 'solar-panel-installation'},
  {serviceId: 303, clusterSlug: 'appliance-circuits', routeSlug: 'ceiling-fan-installation', sanitySlug: 'ceiling-fan-installation'},
  {serviceId: 304, clusterSlug: 'backup-power', routeSlug: 'generator-repair-and-maintenance', sanitySlug: 'generator-repair'},
  {serviceId: 305, clusterSlug: 'panels-circuits', routeSlug: 'whole-house-surge-protector', sanitySlug: 'whole-house-surge-protector'},
  {serviceId: 306, clusterSlug: 'outlets-switches', routeSlug: 'gfci-outlet-installation', sanitySlug: 'gfci-outlet-installation'},
  {serviceId: 307, clusterSlug: 'appliance-circuits', routeSlug: 'garbage-disposal-installation-and-wiring', sanitySlug: 'garbage-disposal-wiring'},
  {serviceId: 308, clusterSlug: 'wiring-diagnostics', routeSlug: 'electrical-repair-services', sanitySlug: 'electrical-repair'},
  {serviceId: 309, clusterSlug: 'power-distribution', routeSlug: 'electrical-panel-upgrade', sanitySlug: 'electrical-panel-upgrade'},
  {serviceId: 310, clusterSlug: 'panels-circuits', routeSlug: 'circuit-breaker-replacement-and-repair', sanitySlug: 'circuit-breaker-replacement'},
  {serviceId: 311, clusterSlug: 'exterior-lighting', routeSlug: 'outdoor-lighting-installation', sanitySlug: 'outdoor-lighting-installation'},
  {serviceId: 312, clusterSlug: 'ev-charging', routeSlug: 'tesla-and-ev-charger-installation', sanitySlug: 'tesla-and-ev-charger-installation'},
  {serviceId: 313, clusterSlug: 'life-safety', routeSlug: 'fire-alarm-installation', sanitySlug: 'fire-alarm-installation'},
  {serviceId: 314, clusterSlug: 'outlets-switches', routeSlug: 'electrical-outlet-installation', sanitySlug: 'electrical-outlet-installation'},
  {serviceId: 315, clusterSlug: 'interior-lighting', routeSlug: 'recessed-lighting-installation', sanitySlug: 'recessed-lighting-installation'},
  {serviceId: 316, clusterSlug: 'wiring-diagnostics', routeSlug: 'electrical-wiring-and-repair-services', sanitySlug: 'electrical-wiring-and-repair-services'},
  {serviceId: 317, clusterSlug: 'life-safety', routeSlug: 'carbon-monoxide-detector-installation', sanitySlug: 'carbon-monoxide-detector-installation'},
  {serviceId: 318, clusterSlug: 'exterior-lighting', routeSlug: 'landscape-lighting-installation', sanitySlug: 'landscape-lighting-installation'},
  {serviceId: 319, clusterSlug: 'life-safety', routeSlug: 'smoke-detector-installation-and-wiring', sanitySlug: 'smoke-detector-installation-and-wiring'},
  {serviceId: 320, clusterSlug: 'energy-efficiency', routeSlug: 'home-energy-audit', sanitySlug: 'home-energy-audit'},
  {serviceId: 321, clusterSlug: 'low-voltage', routeSlug: 'structured-cabling-installation', sanitySlug: 'structured-cabling-installation'},
  {serviceId: 322, clusterSlug: 'energy-efficiency', routeSlug: 'solar-battery-installation', sanitySlug: 'solar-battery-installation'},
  {serviceId: 323, clusterSlug: 'panels-circuits', routeSlug: 'breaker-box-and-panel-repair', sanitySlug: 'breaker-box-and-panel-repair'},
  {serviceId: 324, clusterSlug: 'interior-lighting', routeSlug: 'light-fixture-installation-and-replacement', sanitySlug: 'light-fixture-installation-and-replacement'},
  {serviceId: 325, clusterSlug: 'wiring-diagnostics', routeSlug: 'electrical-troubleshooting', sanitySlug: 'electrical-troubleshooting'},
  {serviceId: 326, clusterSlug: 'wiring-diagnostics', routeSlug: 'electrical-installation-services', sanitySlug: 'electrical-installation-services'},
  {serviceId: 327, clusterSlug: 'low-voltage', routeSlug: 'low-voltage-wiring-installation', sanitySlug: 'low-voltage-wiring-installation'},
  {serviceId: 328, clusterSlug: 'low-voltage', routeSlug: 'cctv-installation', sanitySlug: 'cctv-installation'},
  {serviceId: 329, clusterSlug: 'energy-efficiency', routeSlug: 'energy-star-appliances', sanitySlug: 'energy-star-appliances'},
  {serviceId: 330, clusterSlug: 'outlets-switches', routeSlug: 'light-switch-replacement-and-installation', sanitySlug: 'light-switch-replacement-and-installation'},
]

// Draft-only routes are resolvable in Sanity preview mode but are deliberately
// excluded from production counts, sitemap generation, and published smoke tests.
export const draftServiceRoutes: PublishedServiceRoute[] = [
  {serviceId: 331, clusterSlug: 'appliance-circuits', routeSlug: 'bathroom-exhaust-fan-installation', sanitySlug: 'bathroom-exhaust-fan-installation'},
  {serviceId: 332, clusterSlug: 'panels-circuits', routeSlug: 'grounding-and-bonding', sanitySlug: 'grounding-and-bonding'},
  {serviceId: 333, clusterSlug: 'exterior-lighting', routeSlug: 'emergency-lighting-services-and-maintenance', sanitySlug: 'emergency-lighting-services-and-maintenance'},
  {serviceId: 334, clusterSlug: 'interior-lighting', routeSlug: 'led-retrofit', sanitySlug: 'led-retrofit'},
  {serviceId: 335, clusterSlug: 'energy-efficiency', routeSlug: 'energy-efficiency-upgrades', sanitySlug: 'energy-efficiency-upgrades'},
  {serviceId: 336, clusterSlug: 'interior-lighting', routeSlug: 'chandelier-installation', sanitySlug: 'chandelier-installation'},
  {serviceId: 337, clusterSlug: 'low-voltage', routeSlug: 'fiber-optic-cable-installation', sanitySlug: 'fiber-optic-cable-installation'},
  {serviceId: 338, clusterSlug: 'exterior-lighting', routeSlug: 'parking-lot-lighting-repair-and-installation', sanitySlug: 'parking-lot-lighting-repair-and-installation'},
  {serviceId: 339, clusterSlug: 'panels-circuits', routeSlug: 'fuse-box-replacement', sanitySlug: 'fuse-box-replacement'},
  {serviceId: 340, clusterSlug: 'energy-efficiency', routeSlug: 'infrared-electrical-inspection', sanitySlug: 'infrared-electrical-inspection'},
]

export const serviceRoutes: PublishedServiceRoute[] = [...publishedServiceRoutes, ...draftServiceRoutes]

export function clusterBySlug(slug: string) {
  return serviceClusters.find((cluster) => cluster.slug === slug)
}

export function routeByServiceId(serviceId: number | string | null | undefined) {
  return serviceRoutes.find((route) => route.serviceId === Number(serviceId))
}

export function routeByServiceSlug(slug: string) {
  return serviceRoutes.find((route) => route.sanitySlug === slug || route.routeSlug === slug)
}

export function routeByHierarchy(clusterSlug: string, routeSlug: string) {
  return serviceRoutes.find((route) => route.clusterSlug === clusterSlug && route.routeSlug === routeSlug)
}

export function servicePath(route: PublishedServiceRoute) {
  return `/services/${route.clusterSlug}/${route.routeSlug}`
}
