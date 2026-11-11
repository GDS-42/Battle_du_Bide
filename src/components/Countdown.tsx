'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** '2 j 4 h', '3 h 12', '12 min 05', '45 s' */
export function formatRemaining(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d > 0) return `${d} j ${h} h`;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`;
  if (m > 0) return `${m} min ${String(sec).padStart(2, '0')}`;
  return `${sec} s`;
}

/**
 * Compte à rebours jusqu'à `target` (millisecondes). `serverNow` est l'heure du serveur au rendu :
 * elle sert au premier affichage, et à corriger une horloge d'appareil déréglée.
 * À zéro, la page se rafraîchit pour révéler le combat.
 */
export function Countdown({ target, serverNow, prefix, done = "c'est l'heure !", refresh = true, className }: {
  target: number; serverNow: number; prefix: string; done?: string; refresh?: boolean; className?: string;
}) {
  const [remaining, setRemaining] = useState(target - serverNow);
  const router = useRouter();
  useEffect(() => {
    // Horloge de l'appareil fiable (à 2 minutes près) : on la suit. Sinon, on se cale sur le serveur.
    const drift = serverNow - Date.now();
    const skew = Math.abs(drift) < 120_000 ? 0 : drift;
    let fired = false;
    const tick = () => {
      const r = target - (Date.now() + skew);
      setRemaining(r);
      if (r <= 0 && refresh && !fired) { fired = true; setTimeout(() => router.refresh(), 1500); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, serverNow, refresh, router]);
  return <span className={className} role="timer">{remaining > 0 ? `${prefix} ${formatRemaining(remaining)}` : done}</span>;
}
