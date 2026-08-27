import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
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
