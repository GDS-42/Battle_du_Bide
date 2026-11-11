import type { Metadata } from 'next';
import { requireFighter } from '@/lib/auth';
import { START_MAX_DAYS } from '@/lib/start-date';
import { addDays, localDate, localTime, nextMonday, now } from '@/lib/time';
import { TopBar } from '@/components/ui';
import { CreateForm } from './CreateForm';

export const metadata: Metadata = { title: 'Nouvelle battle' };

export default async function NewBattlePage() {
  const user = await requireFighter('/battles/nouvelle');
  const at = now();
  const today = localDate(at, user.timezone);
  return (
    <>
      <TopBar back="/battles" kicker="Nouvelle battle" title="Ouvre le ring" />
      <CreateForm today={today} nowTime={localTime(at, user.timezone)} monday={nextMonday(today)} maxDate={addDays(today, START_MAX_DAYS)} defaultName={`La battle de ${user.name ?? 'la rentrée'}`} />
    </>
  );
}
