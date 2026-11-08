import { Logo } from '@/components/ui';

export const metadata = { title: 'Hors ligne' };

export default function Offline() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo size={44} />
      <h1 className="font-display text-[26px]">Pas de réseau</h1>
      <p className="text-lilas">Le ring a besoin d'Internet pour enregistrer ta pesée. Réessaie dès que tu as du réseau.</p>
    </main>
  );
}
