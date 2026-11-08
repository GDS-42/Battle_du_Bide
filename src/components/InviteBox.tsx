'use client';
import { useState } from 'react';
import { Icon } from './ui';

export function InviteBox({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Je te défie sur Battle du Bide : « ${name} ». Que le meilleur perde ! ${url}`;
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Battle du Bide', text, url }); return; } catch {} }
    await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="font-display text-[20px] text-soleil">Invite tes adversaires</div>
      <div className="break-all rounded-xl border-2 border-prune bg-encre px-3 py-2 text-sm">{url}</div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn btn-soleil min-h-12 text-base" onClick={share}><Icon name="share" size={18} />{copied ? 'Copié !' : 'Partager'}</button>
        <a className="btn btn-violet min-h-12 text-base" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </div>
    </div>
  );
}
