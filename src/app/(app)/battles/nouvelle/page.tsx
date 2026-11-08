import type { Metadata } from 'next';
import { requireFighter } from '@/lib/auth';
import { localDate, nextMonday, now, weekday } from '@/lib/time';
import { TopBar } from '@/components/ui';
import { CreateForm } from './CreateForm';

export const metadata: Metadata = { title: 'Nouvelle battle' };

export default async function NewBattlePage() {
  const user = await requireFighter('/battles/nouvelle');
  const today = localDate(now(), user.timezone);
  const mondays = [weekday(today) === 0 ? today : nextMonday(today)];
  for (let i = 0; i < 3; i++) mondays.push(nextMonday(mondays[mondays.length - 1]));
  return (
    <>
      <TopBar back="/battles" kicker="Nouvelle battle" title="Ouvre le ring" />
      <CreateForm mondays={mondays} defaultName={`La battle de ${user.name ?? 'la rentrée'}`} />
    </>
  );
}
