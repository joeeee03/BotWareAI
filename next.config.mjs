/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  // Rewrite API calls and Socket.IO to backend
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    console.log('[Next.js] Rewriting /api/* and /socket.io/* to:', backendUrl);
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/socket.io',
        destination: `${backendUrl}/socket.io`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      },
    ];
  },
  // Enable WebSocket upgrade support
  async headers() {
    return [
      {
        source: '/socket.io/:path*',
        headers: [
          {
            key: 'Connection',
            value: 'Upgrade',
          },
          {
            key: 'Upgrade',
            value: 'websocket',
          },
        ],
      },
    ];
  },
}

export default nextConfig
