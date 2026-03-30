/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add empty turbopack config to silence the warning
  turbopack: {},
  
  // Your webpack config (keep if you have one)
  webpack: (config, { isServer }) => {
    // Handle Prisma client in production
    if (isServer) {
      config.externals = [...config.externals, 'prisma', '@prisma/client'];
    }
    
    // Add fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  
  // Environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig