import type { Metadata } from 'next';
import { requireUser, safeNext } from '@/lib/auth';
import { globalTrend } from '@/lib/progress';
import { localDate, now } from '@/lib/time';
import { resolveLook } from '@/lib/fighter/bd';
import { fighterStyle } from '@/lib/look';
import { BdStudio } from './BdStudio';
import { FighterStudio, type StudioInitial } from './FighterStudio';

export const metadata: Metadata = { title: 'Ton combattant' };

export default async function FighterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser('/combattant');
  const trend = user.onboarded ? await globalTrend(user.id, localDate(now(), user.timezone)) : null;
  const initial: StudioInitial = {
    presetKey: user.presetKey, cfg: user.fighter ?? null, name: user.name ?? '', nickname: user.nickname ?? '',
    superMove: user.superMove ?? '', entrance: user.entrance ?? '', heightCm: user.heightCm, weighTime: user.weighTime,
    weight: trend?.trend ?? trend?.last ?? null, firstTime: !user.onboarded
  };
  const dest = safeNext(sp.next) ?? (user.onboarded ? '/profil' : '/battles');
  // Look « BD » : le studio devient le choix d'un combattant masqué et de sa couleur. L'ancien studio reste tel quel.
  if ((await fighterStyle()) === 'bd') return <BdStudio next={dest} initial={initial} look={resolveLook(user.fighter, user.presetKey)} />;
  return <FighterStudio next={dest} initial={initial} />;
}
