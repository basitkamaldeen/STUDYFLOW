/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PRISMA_CLIENT_ENGINE_TYPE: 'binary',
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    }
    return config
  },
}

module.exports = nextConfig