/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  swcMinify: false,
  experimental: {
    swcMinify: false,
  },
}

export default nextConfig
