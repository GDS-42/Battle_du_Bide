import type { Metadata, Viewport } from 'next';
import './globals.css';
import { InstallPrompt } from '@/components/InstallPrompt';

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

const INSTALL_CAPTURE = "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bdbInstall=e;window.dispatchEvent(new Event('bdb-installable'))});";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Capte l'événement d'installation Android dès le chargement, avant l'hydratation de React. */}
        <script dangerouslySetInnerHTML={{ __html: INSTALL_CAPTURE }} />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
