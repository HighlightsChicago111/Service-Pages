import type {NextConfig} from 'next'
import hierarchy from './data/cluster-hierarchy.json'

// These values are intentionally public application configuration, but the
// Vercel variable names do not need a NEXT_PUBLIC_ prefix. Next.js injects only
// this explicit allowlist into the browser bundle for the embedded Studio.
const browserConfig = {
  NEXT_SANITY_PROJECT_ID: process.env.NEXT_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_SANITY_DATASET: process.env.NEXT_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_SANITY_API_VERSION: process.env.NEXT_SANITY_API_VERSION || process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  NEXT_SANITY_STUDIO_URL: process.env.NEXT_SANITY_STUDIO_URL || process.env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  NEXT_SITE_URL: process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL,
}

// Retired Webflow service slugs -> the closest published Vercel+Sanity page.
// These URLs were indexed by Google under the old Webflow site; a permanent
// redirect transfers their ranking to the live page and keeps any inbound or
// homepage links working instead of 404ing. Base-relative; basePath re-adds the
// /services prefix to both source and destination.
const legacyServiceRedirects: Record<string, string> = {
  'accent-lighting': 'light-fixture-installation-and-replacement',
  'afci-receptacles': 'gfci-outlet-installation',
  'art-accent': 'light-fixture-installation-and-replacement',
  'bathroom-exhaust-fan': 'bathroom-exhaust-fan-installation',
  'bus-duct': 'electrical-installation-services',
  'carbon-detectors': 'carbon-monoxide-detector-installation',
  'ceiling-fan': 'ceiling-fan-installation',
  chandeliers: 'chandelier-installation',
  'childproof-devices': 'electrical-outlet-installation',
  'closed-circuit': 'cctv-installation',
  'code-violations': 'electrical-repair',
  'commercial-electrical-services': 'electrical-installation-services',
  connections: 'electrical-wiring-and-repair-services',
  'controls-and-sensors': 'low-voltage-wiring-installation',
  dimmers: 'light-switch-replacement-and-installation',
  dishwasher: 'garbage-disposal-wiring',
  'electric-charging-station': 'tesla-and-ev-charger-installation',
  'electrical-installations': 'electrical-installation-services',
  'electrical-repairs': 'electrical-repair',
  'emergency-light': 'emergency-lighting-services-and-maintenance',
  'emergency-services': 'electrical-repair',
  'energy-audit': 'home-energy-audit',
  'energy-star': 'energy-star-appliances',
  ethernet: 'structured-cabling-installation',
  'exit-signs': 'emergency-lighting-services-and-maintenance',
  fans: 'ceiling-fan-installation',
  'fire-safety': 'fire-alarm-installation',
  'fuse-box': 'fuse-box-replacement',
  'garbage-disposal': 'garbage-disposal-wiring',
  'garden-lights': 'landscape-lighting-installation',
  generators: 'generator-installation',
  'gfci-receptacles': 'gfci-outlet-installation',
  'going-green': 'energy-efficiency-upgrades',
  'ground-fault-safety': 'grounding-and-bonding',
  'heat-detectors': 'fire-alarm-installation',
  'home-theater-wiring': 'structured-cabling-installation',
  'industrial-electrical-services': 'electrical-installation-services',
  'infrared-scanning': 'infrared-electrical-inspection',
  'intercom-system': 'low-voltage-wiring-installation',
  'junction-box': 'electrical-wiring-and-repair-services',
  'led-lighting': 'led-retrofit',
  'light-fixtures': 'light-fixture-installation-and-replacement',
  'lighting-upgrades': 'led-retrofit',
  'low-voltage': 'low-voltage-wiring-installation',
  'low-voltage-lighting': 'landscape-lighting-installation',
  microwave: 'electrical-outlet-installation',
  multimedia: 'structured-cabling-installation',
  'outdoor-lighting': 'outdoor-lighting-installation',
  'outlets-and-switches': 'electrical-outlet-installation',
  'overhead-electrical-services': 'electrical-installation-services',
  'parking-garage-lighting': 'parking-lot-lighting-repair-and-installation',
  pendant: 'light-fixture-installation-and-replacement',
  'phone-jacks': 'structured-cabling-installation',
  'recessed-lighting': 'recessed-lighting-installation',
  refrigerator: 'electrical-outlet-installation',
  'residential-electrical-services': 'electrical-installation-services',
  rewiring: 'electrical-wiring-and-repair-services',
  riser: 'electrical-installation-services',
  sconces: 'light-fixture-installation-and-replacement',
  'smoke-detectors': 'smoke-detector-installation-and-wiring',
  'solar-photovoltaic': 'solar-panel-installation',
  'surge-protectors': 'whole-house-surge-protector',
  'switchgear-installation': 'electrical-panel-upgrade',
  'temporary-power': 'electrical-installation-services',
  'track-lighting': 'light-fixture-installation-and-replacement',
  transformers: 'electrical-installation-services',
  'under-cabinet': 'led-retrofit',
  'underground-electrical-services': 'electrical-installation-services',
  voice: 'structured-cabling-installation',
  'voltage-120-220': 'electrical-outlet-installation',
  'voltage-120-240': 'electrical-outlet-installation',
  'washer-dryer': 'electrical-outlet-installation',
}

// Retired slugs with no electrical equivalent among the published pages (HVAC or
// plumbing scope we did not rebuild). Sent to the /services index rather than
// 404. Literal paths (basePath:false) so the destination is the hub itself, not
// "/services/services".
const legacyHubRedirectSlugs = ['ejector-pump', 'furnace', 'hvac', 'water-pump']

// Service pages live at /<cluster>/<service>, so redirects point straight at
// that path instead of chaining through the old flat URL. A retired slug that
// is now a service-group page (e.g. /low-voltage) is served, not redirected.
const publishedClusters = (hierarchy.clusters as {slug: string; formerSlugs?: string[]; services: string[]}[]).filter((cluster) => cluster.services.length > 0)
const clusterSlugs = new Set(publishedClusters.map((cluster) => cluster.slug))
const clusterOfService = new Map(publishedClusters.flatMap((cluster) => cluster.services.map((service) => [service, cluster.slug] as const)))
// Flat /<service> while the live proxy forwards only one segment (data/cluster-hierarchy.json nestedServiceUrls).
const servicePath = (service: string) => hierarchy.nestedServiceUrls === true && clusterOfService.has(service) ? `/${clusterOfService.get(service)}/${service}` : `/${service}`

const nextConfig: NextConfig = {
  // The app is served under the /services subdirectory of the main site.
  // basePath is compiled into the client bundle and is applied automatically to
  // routes, <Link> hrefs, redirect source/destination, and public assets — but
  // NOT to fetch() calls or raw string asset paths, which are prefixed manually.
  basePath: '/services',
  env: browserConfig,
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    // Sources/destinations are base-relative; basePath re-adds the /services prefix.
    return [
      {
        // The bare origin root has no page under basePath. basePath:false keeps this
        // matching the literal "/" (not "/services") and redirecting to the literal
        // "/services" collection (not "/services/services"). Only affects the direct
        // Vercel URL; at the public domain "/" is served by Webflow, not proxied here.
        source: '/',
        destination: '/services',
        permanent: false,
        basePath: false,
      },
      {
        source: '/circuit-breaker',
        destination: servicePath('circuit-breaker-replacement'),
        permanent: true,
      },
      {
        source: '/amperage-upgrade',
        destination: servicePath('electrical-panel-upgrade'),
        permanent: true,
      },
      ...Object.entries(legacyServiceRedirects).filter(([from]) => !clusterSlugs.has(from)).map(([from, to]) => ({
        source: `/${from}`,
        destination: servicePath(to),
        permanent: true,
      })),
      ...legacyHubRedirectSlugs.map((from) => ({
        source: `/services/${from}`,
        destination: '/services',
        permanent: true,
        basePath: false as const,
      })),
      // A group renamed to match its name on the site (data/cluster-hierarchy.json formerSlugs):
      // its old group URL and old /<old-group>/<service> URLs go to the new ones.
      ...publishedClusters.flatMap((cluster) => (cluster.formerSlugs || []).flatMap((former) => [
        {source: `/${former}`, destination: `/${cluster.slug}`, permanent: true},
        ...cluster.services.map((service) => ({source: `/${former}/${service}`, destination: servicePath(service), permanent: true})),
      ])),
      // The first launch's /<service>/chicago URLs. Declared here rather than in the page so
      // the response always carries one Location header. A grouped service goes straight to
      // its nested URL rather than chaining through the flat one.
      ...(hierarchy.nestedServiceUrls === true ? [...clusterOfService.keys()].map((service) => ({
        source: `/${service}/chicago`,
        destination: servicePath(service),
        permanent: true,
      })) : []),
      {
        source: '/:service/chicago',
        destination: '/:service',
        permanent: true,
      },
      // While service URLs are flat, a nested /<group>/<service> link goes to the flat page.
      ...(hierarchy.nestedServiceUrls === true ? [] : [...clusterOfService].map(([service, cluster]) => ({
        source: `/${cluster}/${service}`,
        destination: `/${service}`,
        permanent: true,
      }))),
    ]
  },
}

export default nextConfig
