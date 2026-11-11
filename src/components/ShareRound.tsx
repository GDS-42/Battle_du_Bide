'use client';
import { useState } from 'react';
import { Icon } from './ui';

/**
 * Partage l'image du bilan : feuille de partage du téléphone (Signal, Messages…) quand elle accepte
 * les fichiers, sinon téléchargement de l'image.
 */
export function ShareRound({ imageUrl, filename, text }: { imageUrl: string; filename: string; text: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  const share = async () => {
    setState('busy');
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], text }); setState('idle'); return; } catch (e) {
          if ((e as Error)?.name === 'AbortError') { setState('idle'); return; }
        }
      }
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 5000);
      setState('saved'); setTimeout(() => setState('idle'), 3000);
    } catch {
      setState('error'); setTimeout(() => setState('idle'), 3000);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn btn-soleil w-full text-[22px]" onClick={share} disabled={state === 'busy'}>
        <Icon name="share" size={20} /> {state === 'busy' ? 'Préparation…' : 'PARTAGER MON BILAN'}
      </button>
      {state === 'saved' ? <p role="status" className="text-center text-sm text-neon">Image enregistrée : envoie-la à tes rivaux !</p> : null}
      {state === 'error' ? <p role="alert" className="text-center text-sm text-[#FF8FA3]">Impossible de préparer l'image. Réessaie.</p> : null}
    </div>
  );
}
