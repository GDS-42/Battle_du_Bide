import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Image autonome pour Docker / Coolify : `node server.js`.
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['pg', 'web-push', 'nodemailer'],
  experimental: {
    serverActions: { bodySizeLimit: '6mb' }
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' }
        ]
      }
    ];
  }
};

export default nextConfig;
