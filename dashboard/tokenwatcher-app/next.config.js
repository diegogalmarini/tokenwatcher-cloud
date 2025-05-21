/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Permitimos imágenes desde raw.githubusercontent.com
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

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
