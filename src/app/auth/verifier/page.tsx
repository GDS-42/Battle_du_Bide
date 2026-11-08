import type { Metadata } from 'next';
import { confirmLogin } from '@/app/actions/auth';
import { Logo, RingScene } from '@/components/ui';

export const metadata: Metadata = { title: 'Connexion' };

// Le lien ne se consomme qu'au clic (POST) : les antivirus de messagerie qui « visitent » les liens ne le grillent pas.
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <RingScene height={240} ropes={false} className="border-b-[5px] border-encre">
        <div className="absolute left-5 top-[max(24px,env(safe-area-inset-top))]"><Logo size={48} /></div>
      </RingScene>
      <form action={confirmLogin} className="flex flex-col gap-4 px-5 py-8">
        <h1 className="font-display text-[30px]">Prêt à entrer ?</h1>
        <input type="hidden" name="token" value={token} />
        <button className="btn btn-soleil w-full text-[24px]">ME CONNECTER</button>
      </form>
    </main>
  );
}
