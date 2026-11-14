/**
 * The site-wide navbar menu. The same folder (site-navbar/) is copied into the services,
 * service-areas and reviews apps, and the Webflow "Site Navbar" component carries the same
 * items, so a menu change is made in all four places.
 *
 * Every link is absolute: the three apps and Webflow sit under one domain behind the
 * Cloudflare Worker, so an absolute URL works the same from any of them.
 */
export const SITE = 'https://www.highlightschicago.com'

export const LOGO_URL = 'https://cdn.prod.website-files.com/69f58d69563c4c5bf9b01c60/6a3c3c20491b43b0858c1876_highlights-chicago-logo.webp'

export const PHONE_DISPLAY = '(773) 262-3333'
export const PHONE_TEL = 'tel:+17732623333'

export type NavSection = 'home' | 'services' | 'brands' | 'service-areas' | 'reviews' | 'resources' | 'about'

export type NavLink = {label: string; href: string}

export const SERVICE_GROUPS: Array<{name: string; links: NavLink[]}> = [
  {
    name: 'Electrical',
    links: [
      {label: 'Electrical Repair', href: `${SITE}/services/electrical-wiring/electrical-repair`},
      {label: 'GFCI Outlets', href: `${SITE}/services/electrical-outlets/gfci-outlet-installation`},
      {label: 'Circuit Breaker Replacement', href: `${SITE}/services/circuit-protection/circuit-breaker-replacement`},
      {label: 'Panel Upgrade', href: `${SITE}/services/panel-upgrades/electrical-panel-upgrade`},
      {label: 'Whole-House Surge Protector', href: `${SITE}/services/circuit-protection/whole-house-surge-protector`},
      {label: 'Outlet Repair & Replacement', href: `${SITE}/services/electrical-outlets/outlet-replacement-near-me`},
      {label: 'Fire Alarm Systems', href: `${SITE}/services/life-safety/fire-alarm-installation`},
      {label: 'Panel Replacement', href: `${SITE}/services/circuit-protection/electrical-panel-replacement-near-me`},
    ],
  },
  {
    name: 'EV Charging',
    links: [
      {label: 'Home & Tesla Charger Installation', href: `${SITE}/services/ev-charging/tesla-and-ev-charger-installation`},
      {label: 'Commercial & Multi-Unit EV Charging', href: `${SITE}/services/ev-charging/commercial-ev-charger-installation-near-me`},
      {label: 'EV Charger Repair & Maintenance', href: `${SITE}/services/ev-charging/ev-charger-repair-near-me`},
    ],
  },
  {
    name: 'Lighting',
    links: [
      {label: 'Outdoor & Security Lighting', href: `${SITE}/services/outdoor-lighting/outdoor-lighting-installation`},
      {label: 'Recessed Lighting', href: `${SITE}/services/interior-lighting/recessed-lighting-installation`},
      {label: 'Landscape Lighting', href: `${SITE}/services/outdoor-lighting/landscape-lighting-installation`},
      {label: 'Light Fixtures', href: `${SITE}/services/interior-lighting/light-fixture-installation-and-replacement`},
      {label: 'Chandeliers', href: `${SITE}/services/interior-lighting/chandelier-installation`},
      {label: 'LED Retrofit & Upgrades', href: `${SITE}/services/interior-lighting/led-retrofit`},
      {label: 'Under-Cabinet Lighting', href: `${SITE}/services/interior-lighting/under-cabinet-lighting-installation-near-me`},
    ],
  },
  {
    name: 'Commercial',
    links: [
      {label: 'Commercial Lighting', href: `${SITE}/services/outdoor-lighting/commercial-lighting-installation-near-me`},
      {label: 'Facility Electrical Maintenance', href: `${SITE}/services/electrical-wiring/electrical-maintenance-services-near-me`},
      {label: 'Parking Lot & Garage Lighting', href: `${SITE}/services/outdoor-lighting/parking-lot-lighting-repair-and-installation`},
      {label: 'Emergency Lighting', href: `${SITE}/services/outdoor-lighting/emergency-lighting-services-and-maintenance`},
    ],
  },
]

export const ALL_SERVICES_HREF = `${SITE}/services`

export const RESOURCES: Array<NavLink & {description: string; icon: 'blog' | 'learn'}> = [
  {label: 'Blog', href: `${SITE}/blog`, description: 'Tips, news and project stories', icon: 'blog'},
  {label: 'Learning Center', href: `${SITE}/learning-center`, description: 'Guides to panels, wiring and codes', icon: 'learn'},
]

export const LINKS = {
  home: `${SITE}/`,
  brands: `${SITE}/brands`,
  serviceAreas: `${SITE}/service-areas`,
  reviews: `${SITE}/reviews`,
  about: `${SITE}/about-us`,
  contact: `${SITE}/contact-us`,
}
