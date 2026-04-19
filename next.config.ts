/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**", // accepte toutes les images hébergées
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "", // Pas de port spécifique pour Unsplash
        pathname: "/**",
      },
      {
        hostname: "bucket-production-3fe3.up.railway.app",
        protocol: "https",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.on.aws",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
