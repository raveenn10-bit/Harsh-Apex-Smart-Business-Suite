import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // PGlite runs server-side only; exclude from client bundle
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Webpack: prevent PGlite WASM from being bundled on client
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        pg: false,
        'pg-native': false,
        '@electric-sql/pglite': false,
      };
    }
    // Ignore .wasm files that PGlite uses (handled server-side)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
