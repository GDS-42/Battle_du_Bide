'use client';
import { useEffect, useState } from 'react';
import { Icon } from './ui';

function b64ToUint8(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const s = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export async function subscribePush(vapidKey: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(vapidKey) }));
  const res = await fetch('/api/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
  return res.ok;
}

/** Enregistre le service worker (PWA) et propose d'activer les notifications. */
export function PushPrompt({ vapidKey }: { vapidKey: string | null }) {
  const [show, setShow] = useState<'push' | 'ios' | null>(null);
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    let dismissed = false;
    try { dismissed = localStorage.getItem('bdb-push-dismissed') === '1'; } catch {}
    if (dismissed) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone;
    if (ios && !standalone) { setShow('ios'); return; }
    if (vapidKey && 'Notification' in window && 'PushManager' in window && Notification.permission === 'default') setShow('push');
  }, [vapidKey]);
  if (!show) return null;
  const dismiss = () => { try { localStorage.setItem('bdb-push-dismissed', '1'); } catch {} setShow(null); };
  return (
    <div className="fixed inset-x-0 bottom-[72px] z-30 mx-auto max-w-[520px] px-3 pb-[env(safe-area-inset-bottom)]">
      <div className="card flex items-center gap-3 p-3">
        <Icon name="bell" size={26} className="shrink-0 text-soleil" />
        <p className="flex-1 text-[13px] leading-snug">
          {show === 'ios'
            ? <>Sur iPhone : touche <b>Partager</b> puis <b>Sur l'écran d'accueil</b> pour installer l'app et recevoir les rappels.</>
            : <>Active les notifications pour ne rater ni la pesée ni le combat du soir.</>}
        </p>
        {show === 'push' ? (
          <button className="btn btn-soleil min-h-10 px-3 text-sm" onClick={async () => { await subscribePush(vapidKey!); dismiss(); }}>Activer</button>
        ) : null}
        <button className="pill min-h-10 px-3" onClick={dismiss} aria-label="Fermer">×</button>
      </div>
    </div>
  );
}
