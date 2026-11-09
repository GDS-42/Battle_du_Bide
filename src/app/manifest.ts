import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Battle du Bide',
    short_name: 'Bide',
    description: 'Des battles entre amis pour perdre du poids. Que le meilleur perde !',
    start_url: '/battles',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1C0E33',
    theme_color: '#1C0E33',
    lang: 'fr',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
}
