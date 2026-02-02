/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@quantum-finance/types', '@quantum-finance/utils', '@quantum-finance/config', '@quantum-finance/ui'],
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost']
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  }
};

export default nextConfig;
