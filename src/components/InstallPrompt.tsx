'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from './ui';

// Installation de la PWA sur smartphone.
// - Android (Chrome, Edge, Samsung…) : l'événement « beforeinstallprompt », capté dès le chargement par le
//   script de src/app/layout.tsx, permet d'afficher la fenêtre d'installation native.
// - iPhone / iPad : aucune API ; on explique « Partager → Sur l'écran d'accueil ».
// - Autres navigateurs mobiles (Firefox…) : on renvoie au menu du navigateur.

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
declare global {
  interface Window { __bdbInstall?: InstallEvent | null }
}

export const INSTALL_SEEN = 'bdb-install-seen';
/** Événement émis quand la proposition d'installation est fermée (le bandeau des notifications peut alors s'afficher). */
export const INSTALL_CLOSED_EVENT = 'bdb-install-closed';

type Platform = 'ios' | 'android' | 'mobile' | 'desktop';

function platform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/mobi/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

/** Faut-il encore proposer l'installation sur cet appareil ? (mobile, pas installée, pas déjà proposée) */
export function installPending(): boolean {
  let seen = false;
  try { seen = localStorage.getItem(INSTALL_SEEN) === '1'; } catch {}
  return !seen && platform() !== 'desktop' && !isStandalone();
}

function markSeen() {
  try { localStorage.setItem(INSTALL_SEEN, '1'); } catch {}
  window.dispatchEvent(new Event(INSTALL_CLOSED_EVENT));
}

/** État partagé : plateforme, application déjà installée, installation native disponible. */
function useInstall() {
  const [state, setState] = useState<{ platform: Platform; standalone: boolean; native: boolean } | null>(null);
  useEffect(() => {
    const update = () => setState({ platform: platform(), standalone: isStandalone(), native: !!window.__bdbInstall });
    update();
    window.addEventListener('bdb-installable', update);
    window.addEventListener('appinstalled', update);
    return () => { window.removeEventListener('bdb-installable', update); window.removeEventListener('appinstalled', update); };
  }, []);
  const install = async (): Promise<boolean> => {
    const e = window.__bdbInstall;
    if (!e) return false;
    window.__bdbInstall = null;
    await e.prompt();
    const { outcome } = await e.userChoice;
    setState((s) => (s ? { ...s, native: false } : s));
    return outcome === 'accepted';
  };
  return { state, install };
}

function ShareGlyph() {
  // Icône « Partager » d'iOS (carré avec flèche vers le haut)
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="inline-block align-[-3px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

function Steps({ platform: p }: { platform: Platform }) {
  if (p === 'ios') {
    return (
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-[15px]">
        <li>Touche <b>Partager</b> <ShareGlyph /> dans la barre de Safari.</li>
        <li>Choisis <b>« Sur l'écran d'accueil »</b>, puis <b>Ajouter</b>.</li>
        <li>Ouvre ensuite Battle du Bide depuis son icône.</li>
      </ol>
    );
  }
  return (
    <ol className="flex list-decimal flex-col gap-1 pl-5 text-[15px]">
      <li>Ouvre le <b>menu ⋮</b> du navigateur.</li>
      <li>Choisis <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.</li>
    </ol>
  );
}

/** Proposition d'installation affichée une seule fois, à la première visite sur smartphone. */
export function InstallPrompt() {
  const path = usePathname();
  const { state, install } = useInstall();
  const [open, setOpen] = useState(false);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    // Laisse le temps au navigateur Android d'annoncer l'installation native avant d'afficher la consigne manuelle.
    const t = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!state || path.startsWith('/auth')) return;
    if (!installPending()) return;
    if (state.platform === 'ios' || state.native || waited) setOpen(true);
  }, [state, waited, path]);

  if (!open || !state) return null;
  const close = () => { markSeen(); setOpen(false); };
  const native = state.native && state.platform !== 'ios';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-encre/60" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <div className="card mx-3 mb-[max(12px,env(safe-area-inset-bottom))] flex w-full max-w-[500px] flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <img src="/icons/96" alt="" width={48} height={48} className="rounded-xl border-2 border-encre" />
          <div>
            <div id="install-title" className="font-display text-[22px] leading-tight text-soleil">Installe l'app</div>
            <div className="text-[13px] text-lilas">Une icône sur ton écran d'accueil, en plein écran.</div>
          </div>
        </div>
        <p className="text-[15px]">Pèse-toi en deux secondes chaque matin et reçois les rappels et le combat du soir.</p>
        {native ? null : <Steps platform={state.platform} />}
        <div className={`grid gap-2 ${native ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {native ? (
            <>
              <button type="button" className="btn btn-ghost min-h-12 text-base" onClick={close}>Plus tard</button>
              <button type="button" className="btn btn-soleil min-h-12 text-base" onClick={async () => { await install(); close(); }}>
                <Icon name="plus" size={18} /> Installer
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-soleil min-h-12 text-base" onClick={close}>J'ai compris</button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Carte du profil : installer l'app plus tard (masquée si elle est déjà installée ou sur ordinateur). */
export function InstallCard() {
  const { state, install } = useInstall();
  const [done, setDone] = useState(false);
  if (!state || state.standalone || state.platform === 'desktop' || done) return null;
  const native = state.native && state.platform !== 'ios';
  return (
    <div className="card flex flex-col gap-3 p-4">
      <span className="font-display text-[20px] text-soleil">Installer l'app</span>
      {native ? (
        <button type="button" className="btn btn-violet min-h-12 text-base" onClick={async () => setDone(await install())}>
          <Icon name="plus" size={18} /> Ajouter à l'écran d'accueil
        </button>
      ) : <Steps platform={state.platform} />}
    </div>
  );
}
