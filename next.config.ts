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

const nextConfig: NextConfig = {
  env: browserConfig,
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/services/circuit-breaker',
        destination: '/services/circuit-breaker-replacement/chicago',
        permanent: true,
      },
      {
        source: '/services/amperage-upgrade',
        destination: '/services/electrical-panel-upgrade/chicago',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
