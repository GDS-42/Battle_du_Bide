import type { Metadata } from 'next';
import { requireUser, safeNext } from '@/lib/auth';
import { globalTrend } from '@/lib/progress';
import { localDate, now } from '@/lib/time';
import { FighterStudio } from './FighterStudio';

export const metadata: Metadata = { title: 'Ton combattant' };

export default async function FighterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser('/combattant');
  const trend = user.onboarded ? await globalTrend(user.id, localDate(now(), user.timezone)) : null;
  return (
    <FighterStudio
      next={safeNext(sp.next) ?? (user.onboarded ? '/profil' : '/battles')}
      initial={{
        presetKey: user.presetKey, cfg: user.fighter ?? null, name: user.name ?? '', nickname: user.nickname ?? '',
        superMove: user.superMove ?? '', entrance: user.entrance ?? '', heightCm: user.heightCm, weighTime: user.weighTime,
        weight: trend?.trend ?? trend?.last ?? null, firstTime: !user.onboarded
      }}
    />
  );
}
