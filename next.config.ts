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
        // Dessins des combattants : chaque fichier est figé sous son numéro de version (/bd/v1), donc mis en cache longtemps.
        // Pour changer un dessin, on ouvre /bd/v2 ; on ne réécrit jamais un fichier publié.
        source: '/bd/:version/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      },
      {
        // Sons de la salle : même règle que les dessins (/son/v1 figé, un son modifié part dans /son/v2).
        source: '/son/:version/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      },
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
