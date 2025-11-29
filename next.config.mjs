/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config to silence Next.js 16 warning
  turbopack: {},
  // Webpack configuration for WalletConnect
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // Alias for wagmi experimental entry removed in newer versions
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "wagmi/experimental": "wagmi",
    };
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
