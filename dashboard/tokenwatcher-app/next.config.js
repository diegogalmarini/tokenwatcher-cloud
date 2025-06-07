/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Saltar ESLint en el build (Render)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de TypeScript en el build (Render)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname:
          "/trustwallet/assets/master/blockchains/ethereum/assets/**/logo.png",
      },
    ],
  },
  // …
};

module.exports = nextConfig;
