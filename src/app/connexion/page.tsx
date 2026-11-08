import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';
import { RingScene, Logo } from '@/components/ui';

export const metadata: Metadata = { title: 'Connexion' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <RingScene height={240} ropes={false} className="border-b-[5px] border-encre">
        <div className="absolute left-5 top-[max(24px,env(safe-area-inset-top))]"><Logo size={48} /></div>
      </RingScene>
      <section className="flex flex-col gap-4 px-5 py-6">
        <h1 className="font-display text-[30px] leading-tight">Monte sur le ring</h1>
        <p className="text-[15px] text-lilas">Pas de mot de passe : on t'envoie un lien magique par e-mail.</p>
        {sp.erreur === 'lien' ? (
          <p role="alert" className="rounded-xl border-2 border-rouge bg-rouge/20 px-4 py-3 text-sm">Ce lien a expiré ou a déjà servi. Demande-en un nouveau.</p>
        ) : null}
        <LoginForm next={sp.next ?? ''} />
      </section>
    </main>
  );
}
