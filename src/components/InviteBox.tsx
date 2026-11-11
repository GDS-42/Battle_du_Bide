'use client';
import { useState } from 'react';
import { Icon } from './ui';

export function InviteBox({ url, name, note }: { url: string; name: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  const [signalHint, setSignalHint] = useState(false);
  const text = `Je te défie sur Battle du Bide : « ${name} ». Que le meilleur perde ! ${url}`;
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Battle du Bide', text, url }); return; } catch {} }
    await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  // Signal n'accepte pas de message pré-rempli par URL : on passe par la feuille de partage
  // (texte seul, le lien est dedans), sinon on copie le message à coller dans Signal.
  const signal = async () => {
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
      }
    }
    try { await navigator.clipboard.writeText(text); } catch { return; }
    setSignalHint(true); setTimeout(() => setSignalHint(false), 2500);
  };
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="font-display text-[20px] text-soleil">Invite tes adversaires</div>
      <div className="break-all rounded-xl border-2 border-prune bg-encre px-3 py-2 text-sm">{url}</div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn btn-soleil min-h-12 text-base" onClick={share}><Icon name="share" size={18} />{copied ? 'Copié !' : 'Partager'}</button>
        <button type="button" className="btn btn-violet min-h-12 text-base" onClick={signal}>Signal</button>
      </div>
      {note ? <p className="text-[13px] text-lilas">{note}</p> : null}
      {signalHint ? <p role="status" className="text-sm text-neon">Message copié : colle-le dans Signal</p> : null}
    </div>
  );
}
