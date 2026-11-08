'use client';
import { useEffect } from 'react';
import { buzz, play } from '@/lib/sound';

/** Son et vibration à l'arrivée sur l'écran « Coup chargé ». */
export function CoupFx({ big }: { big: boolean }) {
  useEffect(() => {
    const t = setTimeout(() => { play('charge'); buzz(big ? [30, 40, 60] : 30); }, 150);
    return () => clearTimeout(t);
  }, [big]);
  return null;
}
