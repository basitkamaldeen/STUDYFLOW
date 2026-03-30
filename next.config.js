/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack and use webpack
  webpack: (config, { isServer }) => {
    // Add any custom webpack config here if needed
    return config
  },
  // Add empty turbopack config to silence the warning
  turbopack: {},
  // Environment variables that are available at build time
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig