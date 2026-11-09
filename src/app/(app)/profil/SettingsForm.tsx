'use client';
import { useActionState, useEffect, useState } from 'react';
import { updateSettings, type SettingsState } from '@/app/actions/profile';
import { subscribePush } from '@/components/PushPrompt';
import { Icon } from '@/components/ui';
import { play, setSoundOn, soundOn } from '@/lib/sound';

export function SettingsForm({ weighTime, notifyOn, timezone, vapidKey, pushDevices }: {
  weighTime: string; notifyOn: boolean; timezone: string; vapidKey: string | null; pushDevices: number;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateSettings, {});
  const [sound, setSound] = useState(true);
  const [push, setPush] = useState<'idle' | 'ok' | 'ko' | 'unsupported'>('idle');
  const [tz, setTz] = useState(timezone);
  useEffect(() => {
    setSound(soundOn());
    try { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || timezone); } catch {}
    if (!('Notification' in window) || !('PushManager' in window)) setPush('unsupported');
    else if (Notification.permission === 'granted' && pushDevices > 0) setPush('ok');
  }, [pushDevices, timezone]);

  return (
    <form action={action} className="card flex flex-col gap-4 p-4">
      <span className="font-display text-[20px] text-soleil">Réglages</span>
      <label className="flex flex-col gap-2"><span className="label">Heure de pesée (rappel du matin)</span>
        <input className="field" type="time" name="weighTime" defaultValue={weighTime} required /></label>
      <input type="hidden" name="timezone" value={tz} />

      <label className="flex min-h-11 items-center gap-3 text-[15px]">
        <input type="checkbox" name="notifyOn" defaultChecked={notifyOn} className="size-5 accent-[#FFD23D]" /> Notifications (rappel, combat prêt, série en danger)
      </label>
      {vapidKey ? (
        push === 'ok' ? <p className="flex items-center gap-2 text-sm text-neon"><Icon name="bell" size={18} /> Notifications actives sur cet appareil.</p>
          : push === 'unsupported' ? <p className="text-sm text-lilas">Sur iPhone : ajoute l'app à l'écran d'accueil (Partager → Sur l'écran d'accueil) pour recevoir les notifications.</p>
          : (
            <button type="button" className="btn btn-violet min-h-12 text-base" onClick={async () => setPush((await subscribePush(vapidKey)) ? 'ok' : 'ko')}>
              <Icon name="bell" size={18} /> Activer sur cet appareil
            </button>
          )
      ) : <p className="text-sm text-lilas">Les notifications ne sont pas configurées sur ce serveur.</p>}
      {push === 'ko' ? <p className="text-sm text-[#FF8FA3]">Permission refusée : autorise les notifications dans les réglages du navigateur.</p> : null}

      <button type="button" className="flex min-h-11 items-center gap-3 text-left text-[15px]" aria-pressed={sound}
        onClick={() => { const v = !sound; setSound(v); setSoundOn(v); if (v) play('cloche', true); }}>
        <Icon name={sound ? 'sound' : 'mute'} size={20} className="text-soleil" /> Sons du ring : <b>{sound ? 'activés' : 'coupés'}</b>
      </button>

      {state.error ? <p role="alert" className="text-sm text-[#FF8FA3]">{state.error}</p> : null}
      {state.ok ? <p role="status" className="text-sm text-neon">Réglages enregistrés.</p> : null}
      <button className="btn btn-soleil min-h-12 text-base" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</button>
    </form>
  );
}
