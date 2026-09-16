import type {NextConfig} from 'next'

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
        destination: '/circuit-breaker-replacement',
        permanent: true,
      },
      {
        source: '/amperage-upgrade',
        destination: '/electrical-panel-upgrade',
        permanent: true,
      },
      ...Object.entries(legacyServiceRedirects).map(([from, to]) => ({
        source: `/${from}`,
        destination: `/${to}`,
        permanent: true,
      })),
      ...legacyHubRedirectSlugs.map((from) => ({
        source: `/services/${from}`,
        destination: '/services',
        permanent: true,
        basePath: false as const,
      })),
    ]
  },
}

export default nextConfig
