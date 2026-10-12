import type {NextConfig} from 'next'

// Public Sanity identifiers the embedded Studio needs in the browser bundle.
const browserConfig = {
  NEXT_SANITY_PROJECT_ID: process.env.NEXT_SANITY_PROJECT_ID || '',
  NEXT_SANITY_DATASET: process.env.NEXT_SANITY_DATASET || '',
  NEXT_SANITY_API_VERSION: process.env.NEXT_SANITY_API_VERSION || '',
  NEXT_SANITY_STUDIO_URL: process.env.NEXT_SANITY_STUDIO_URL || '',
  NEXT_SITE_URL: process.env.NEXT_SITE_URL || '',
}

const nextConfig: NextConfig = {
  // Same URL shape as the live service pages, so a page tested here keeps its
  // URL when the V2 template replaces the live one.
  basePath: '/services',
  env: browserConfig,
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [{source: '/', destination: '/services', permanent: false, basePath: false}]
  },
}

export default nextConfig
