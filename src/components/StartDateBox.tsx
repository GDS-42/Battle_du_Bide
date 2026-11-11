import { changeStartDate } from '@/app/actions/battle';
import { prettyDate } from '@/lib/time';
import { Icon } from './ui';

/** Carte de l'organisateur pendant l'échauffement : avancer ou reculer le premier combat. */
export function StartDateBox({ battleId, startDate, fightTime, today, tomorrow, maxDate, tonightOk, error }: {
  battleId: string; startDate: string; fightTime: string; today: string; tomorrow: string; maxDate: string;
  /** L'heure du combat n'est pas encore passée : la battle peut démarrer ce soir. */
  tonightOk: boolean;
  error: boolean;
}) {
  const time = fightTime.replace(':', ' h ');
  const quick: { date: string; label: string }[] = [];
  if (tonightOk && startDate !== today) quick.push({ date: today, label: 'Démarrer ce soir' });
  if (startDate !== tomorrow) quick.push({ date: tomorrow, label: 'Démarrer demain' });
  return (
    <section className="card flex flex-col gap-3 p-4" aria-labelledby="start-box-title">
      <div className="flex items-center gap-3">
        <Icon name="calendar" className="shrink-0 text-soleil" />
        <div className="min-w-0">
          <h2 id="start-box-title" className="font-display text-[20px] leading-tight">
            Premier combat {startDate === today ? 'ce soir' : prettyDate(startDate)} à {time}
          </h2>
          <p className="text-[13px] text-lilas">Tu as ouvert ce ring : tu peux changer la date tant qu'aucun combat n'a eu lieu.</p>
        </div>
      </div>
      {quick.length ? (
        <div className={`grid gap-2 ${quick.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {quick.map((q, i) => (
            <form key={q.date} action={changeStartDate}>
              <input type="hidden" name="battleId" value={battleId} />
              <input type="hidden" name="startDate" value={q.date} />
              <button className={`btn ${i === 0 ? 'btn-soleil' : 'btn-violet'} min-h-12 w-full text-base`}>{q.label}</button>
            </form>
          ))}
        </div>
      ) : null}
      <details>
        <summary className="cursor-pointer text-sm font-bold text-lilas">Choisir une autre date</summary>
        <form action={changeStartDate} className="mt-2 flex gap-2">
          <input type="hidden" name="battleId" value={battleId} />
          <input className="field min-w-0 flex-1" type="date" name="startDate" aria-label="Nouvelle date du premier combat"
            defaultValue={startDate} min={tonightOk ? today : tomorrow} max={maxDate} required />
          <button className="btn btn-violet min-h-12 shrink-0 px-4 text-base">Valider</button>
        </form>
      </details>
      {error ? <p role="alert" className="text-sm text-[#FF8FA3]">Date refusée : choisis une date entre {tonightOk ? "aujourd'hui" : 'demain'} et le {prettyDate(maxDate, false)}.</p> : null}
    </section>
  );
}
