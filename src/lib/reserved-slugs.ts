import {serviceClusters} from './clusters'

/**
 * Slugs a new-design service page may never use, checked by Studio validation.
 *
 * REDIRECT_SOURCE_SLUGS mirrors the 77 permanent redirects in next.config.ts. That
 * file is deliberately left untouched, so this is a copy; `pnpm test:design` fails
 * if the two ever drift apart. A page published on one of these slugs would be
 * unreachable, because the redirect runs before any page renders.
 *
 * Service-group slugs (data/cluster-hierarchy.json) are refused as well: /services/<group>
 * renders the group page, so a service page there would be hidden behind it.
 */
export const RESERVED_PATH_SLUGS = ['studio', 'api', 'thank-you', 'sitemap.xml', 'images', 'icons'] as const

export const REDIRECT_SOURCE_SLUGS = [
  'circuit-breaker', 'amperage-upgrade', 'accent-lighting', 'afci-receptacles', 'art-accent', 'bathroom-exhaust-fan',
  'bus-duct', 'carbon-detectors', 'ceiling-fan', 'chandeliers', 'childproof-devices', 'closed-circuit', 'code-violations',
  'commercial-electrical-services', 'connections', 'controls-and-sensors', 'dimmers', 'dishwasher',
  'electric-charging-station', 'electrical-installations', 'electrical-repairs', 'emergency-light', 'emergency-services',
  'energy-audit', 'energy-star', 'ethernet', 'exit-signs', 'fans', 'fire-safety', 'fuse-box', 'garbage-disposal',
  'garden-lights', 'generators', 'gfci-receptacles', 'going-green', 'ground-fault-safety', 'heat-detectors',
  'home-theater-wiring', 'industrial-electrical-services', 'infrared-scanning', 'intercom-system', 'junction-box',
  'led-lighting', 'light-fixtures', 'lighting-upgrades', 'low-voltage-lighting', 'microwave', 'multimedia',
  'outdoor-lighting', 'outlets-and-switches', 'overhead-electrical-services', 'parking-garage-lighting', 'pendant',
  'phone-jacks', 'recessed-lighting', 'refrigerator', 'residential-electrical-services', 'rewiring', 'riser', 'sconces',
  'smoke-detectors', 'solar-photovoltaic', 'surge-protectors', 'switchgear-installation', 'temporary-power',
  'track-lighting', 'transformers', 'under-cabinet', 'underground-electrical-services', 'voice', 'voltage-120-220',
  'voltage-120-240', 'washer-dryer', 'ejector-pump', 'furnace', 'hvac', 'water-pump',
] as const

const reservedPaths = new Set<string>(RESERVED_PATH_SLUGS)
const groupSlugs = new Set<string>(serviceClusters.map((cluster) => cluster.slug))
const redirectSources = new Set<string>(REDIRECT_SOURCE_SLUGS)

/** Why a slug cannot be used, or undefined when it is free. */
export function reservedSlugReason(slug: string | undefined): string | undefined {
  const value = (slug || '').trim().toLowerCase()
  if (reservedPaths.has(value)) return `"${value}" is a reserved path under /services`
  if (groupSlugs.has(value)) return `/services/${value} is a service group page, so a page here could never be reached`
  if (redirectSources.has(value)) return `/services/${value} permanently redirects to another page (next.config.ts), so a page here could never be reached`
  return undefined
}
