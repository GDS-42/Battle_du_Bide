import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Battle du Bide', template: '%s · Battle du Bide' },
  description: 'Des battles entre amis pour perdre du poids. Chaque matin, ta pesée charge ton coup. Que le meilleur perde !',
  applicationName: 'Battle du Bide',
  appleWebApp: { capable: true, title: 'Battle du Bide', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  icons: { icon: '/icons/192', apple: '/icons/180' }
};

export const viewport: Viewport = {
  themeColor: '#1C0E33',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
