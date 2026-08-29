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
        source: '/circuit-breaker',
        destination: '/circuit-breaker-replacement/chicago',
        permanent: true,
      },
      {
        source: '/amperage-upgrade',
        destination: '/electrical-panel-upgrade/chicago',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
