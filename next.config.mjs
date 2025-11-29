/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config to silence Next.js 16 warning
  turbopack: {},
  // Webpack configuration for WalletConnect
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
      },
    ],
  },
};

export default nextConfig;
