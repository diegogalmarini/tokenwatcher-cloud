// dashboard/tokenwatcher-app/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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

  // La sección async rewrites() puede ser eliminada o comentada:
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
  //     },
  //   ];
  // },
};

module.exports = nextConfig;