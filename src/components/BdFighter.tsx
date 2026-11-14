import { BD_BOSS, BD_CAST, faceFor, faceUrl, poseFor, spriteUrl, tintHex, tintable } from '@/lib/fighter/bd';
import type { SpriteLook } from '@/lib/fighter/types';

/** Cadre du dessin, identique à celui du générateur : 3 de large pour 4 de haut, pieds à 300/320 de la hauteur. */
export const BD_FRAME = { w: 150, h: 200, ground: 187.5, cx: 75 };
const GOLD = '#FFC61A';

/** Calque de couleur : le gris du dessin (plis et ombres) multiplié par la teinte, limité à sa zone par un masque. */
export function TintLayer({ url, color }: { url: string; color: string }) {
  return (
    <span
      className="bd-tint"
      style={{
        position: 'absolute', inset: 0,
        backgroundColor: color, backgroundImage: `url(${url})`, backgroundSize: '100% 100%', backgroundBlendMode: 'multiply',
        WebkitMaskImage: `url(${url})`, maskImage: `url(${url})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'
      }}
    />
  );
}

/**
 * Combattant dessiné (look « BD ») : l'image de la pose, placée dans le même cadre que le tracé du générateur,
 * avec sa couleur (calque), sa ceinture de champion (bande de taille dorée) et l'insigne des gants dorés.
 */
export function BdFighter({ look, pose, w = 240, flip, className, title }: {
  look: SpriteLook; pose: string; w?: number; flip?: boolean; className?: string; title?: string;
}) {
  const { pose: name, meta } = poseFor(look.who, pose);
  const k = w / BD_FRAME.w;
  const can = tintable(look.who);
  const label = title ?? undefined;
  return (
    <span
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-fighter={look.who}
      style={{ display: 'block', position: 'relative', flex: 'none', width: w, height: Math.round((w * 4) / 3), transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <span style={{ position: 'absolute', left: 0, top: 0, width: BD_FRAME.w, height: BD_FRAME.h, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        <span style={{ position: 'absolute', left: BD_FRAME.cx - 58, top: BD_FRAME.ground - 9, width: 116, height: 18, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(20,10,34,.5), rgba(20,10,34,0))' }} />
        <span style={{ position: 'absolute', left: BD_FRAME.cx - meta.ax, top: BD_FRAME.ground - meta.h, width: meta.w, height: meta.h }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={spriteUrl(look.who, name)} alt="" draggable={false} decoding="async" style={{ display: 'block', width: '100%', height: '100%', maxWidth: 'none' }} />
          {can && look.color ? <TintLayer url={spriteUrl(look.who, name, 'c')} color={tintHex(look.color)} /> : null}
          {can && look.belt ? <span data-reward="ceinture"><TintLayer url={spriteUrl(look.who, name, 'b')} color={GOLD} /></span> : null}
        </span>
        {look.gold && name !== 'ko' && name !== 'vol' ? (
          // Gants dorés (série de 21 jours) : une médaille portée derrière le combattant, à hauteur de taille
          // (rangée quand il vole ou gît au tapis : elle flotterait au-dessus de lui).
          <svg data-reward="gants" viewBox="-18 -18 36 36" width="34" height="34" style={{ position: 'absolute', left: BD_FRAME.cx - 74, top: BD_FRAME.ground - 104, overflow: 'visible' }}>
            <circle r="16" style={{ fill: '#FFF4E3', stroke: '#140A22', strokeWidth: 3 }} />
            <circle r="11.5" style={{ fill: 'none', stroke: GOLD, strokeWidth: 2 }} />
            <g transform="translate(-1 1) scale(.5)">
              <path d="M -12 -13 C 1 -19 19 -14 19 0 C 19 14 4 17 -10 14 Z" style={{ fill: GOLD, stroke: '#140A22', strokeWidth: 4.5, strokeLinejoin: 'round' }} />
              <path d="M -20 -10 L -11 -11 L -11 11 L -20 10 Z" style={{ fill: '#FFF4E3', stroke: '#140A22', strokeWidth: 4, strokeLinejoin: 'round' }} />
            </g>
            <path d="M11 -17 L12.6 -12.6 L17 -11 L12.6 -9.4 L11 -5 L9.4 -9.4 L5 -11 L9.4 -12.6 Z" style={{ fill: GOLD, stroke: '#140A22', strokeWidth: 1.4, strokeLinejoin: 'round' }} />
          </svg>
        ) : null}
      </span>
    </span>
  );
}

/** Gros plan d'expression d'un combattant, cadré dans un carré, avec sa couleur. */
export function BdFace({ look, expr, size, flip, title }: { look: SpriteLook; expr: string; size: number; flip?: boolean; title?: string }) {
  const f = faceFor(look.who, expr);
  if (!f) return null;
  const img = size * 1.2, cx = flip ? 1 - f.c[0] : f.c[0];
  return (
    <span role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      style={{ display: 'block', position: 'relative', width: size, height: size, overflow: 'hidden', flex: 'none' }}>
      <span style={{ position: 'absolute', left: size / 2 - cx * img, top: size / 2 - f.c[1] * img, width: img, height: img, transform: flip ? 'scaleX(-1)' : undefined }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={faceUrl(look.who, expr)} alt="" draggable={false} decoding="async" style={{ display: 'block', width: '100%', height: '100%', maxWidth: 'none' }} />
        {tintable(look.who) && look.color ? <TintLayer url={faceUrl(look.who, expr, 'c')} color={tintHex(look.color)} /> : null}
      </span>
    </span>
  );
}

/** Nom affichable d'un combattant dessiné. */
export const bdName = (who: SpriteLook['who']) => (who === 'bide' ? BD_BOSS.name : BD_CAST[who].name);
