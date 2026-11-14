'use client';
import { useId, useMemo } from 'react';
import { gen } from '@/lib/fighter/gen';
import { hasSprites, spritePoseOf } from '@/lib/fighter/bd';
import type { FighterRender } from '@/lib/fighter/types';
import { BdFighter } from './BdFighter';

const S = (o: React.CSSProperties) => o;
const OUT = { strokeLinejoin: 'round' as const };

/**
 * Ceinture de champion, posée sur la taille. Elle se calcule à partir du tracé `waist` du générateur
 * (un quadrilatère : haut arrière, haut avant, bas avant, bas arrière), sans toucher au générateur
 * lui-même, qui doit rester identique à celui de l'atelier de design.
 */
function champBelt(waist: string): { strap: string; cx: number; cy: number; angle: number } | null {
  const n = (waist.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (n.length < 8) return null;
  const [x1, y1, x2, y2, x3, y3, x4, y4] = n;
  const r = (v: number) => Math.round(v * 10) / 10;
  const t = 0.56; // la plaque est un peu vers l'avant : le combattant est vu de trois quarts
  return {
    strap: `M ${r(x1 - 2)} ${r(y1 - 3)} L ${r(x2 + 2)} ${r(y2 - 3)} L ${r(x3 + 2)} ${r(y3 + 4)} L ${r(x4 - 2)} ${r(y4 + 4)} Z`,
    cx: r(x1 + (x2 - x1) * t),
    cy: r(((y1 + (y2 - y1) * t) + (y4 + (y3 - y4) * t)) / 2 + 0.5),
    angle: r((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI)
  };
}

/**
 * Le combattant d'un joueur. Quand le look « BD » est actif (`cfg.sprite`), c'est son dessin ; sinon, et pour les
 * silhouettes unies ou tout combattant sans dessin, c'est le tracé du générateur, inchangé.
 */
export function Fighter({ cfg, className, title }: { cfg: FighterRender; className?: string; title?: string }) {
  if (cfg.sprite && !cfg.ghost && hasSprites(cfg.sprite.who)) {
    return <BdFighter look={cfg.sprite} pose={spritePoseOf(cfg.pose, cfg.spritePose)} w={cfg.w} flip={cfg.flip} className={className} title={title} />;
  }
  return <SvgFighter cfg={cfg} className={className} title={title} />;
}

function SvgFighter({ cfg, className, title }: { cfg: FighterRender; className?: string; title?: string }) {
  const raw = useId();
  const id = 'f' + raw.replace(/[^a-zA-Z0-9_-]/g, '');
  const f = useMemo(() => gen({ ...cfg, id }), [cfg, id]);
  const belt = cfg.champ && !cfg.ghost ? champBelt(f.waist) : null;
  return (
    <svg
      viewBox="0 0 240 320"
      width={f.w}
      height={f.h}
      className={className}
      style={{ display: 'block', overflow: 'visible', transform: f.flip }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <clipPath id={f.idT}><path d={f.torso} /></clipPath>
        <clipPath id={f.idH}><path d={f.head} /></clipPath>
        <clipPath id={f.idLF}><path d={f.legF} /></clipPath>
        <clipPath id={f.idAL}><path d={f.lead} /></clipPath>
        <clipPath id={f.idAR}><path d={f.rear} /></clipPath>
        <clipPath id={f.idS}><path d={f.shortsD} /></clipPath>
        <clipPath id={f.idSL}><path d={f.sleeveL} /></clipPath>
        <clipPath id={f.idSR}><path d={f.sleeveR} /></clipPath>
      </defs>
      <ellipse cx="122" cy="303" rx={f.groundRx} ry="9" style={S({ fill: '#140A22', opacity: 0.35 })} />

      <path d={f.legR} style={S({ fill: f.legDeep, stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
      <g transform={f.footR}>
        <path d={f.footD} style={S({ fill: f.footSh, stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
        <path d={f.footSole} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.5 })} />
      </g>
      <g clipPath={f.clipLegF}>
        <path d={f.legF} style={S({ fill: f.legSh })} />
        <path d={f.legF} transform="translate(7 -2)" style={S({ fill: f.legHi })} />
        <path d={f.legF} transform="translate(4 -1)" style={S({ fill: f.legC })} />
      </g>
      <path d={f.pantsStripe} style={S({ fill: 'none', stroke: f.trim, strokeWidth: 4, strokeLinecap: 'round' })} />
      <path d={f.legF} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
      <path d={f.hem} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.5, strokeLinecap: 'round' })} />
      <g transform={f.footF}>
        <path d={f.footD} style={S({ fill: f.footC, stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
        <path d={f.footBand} style={S({ fill: 'none', stroke: f.footBandC, strokeWidth: 3.5, strokeLinecap: 'round' })} />
        <path d={f.footSole} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.5 })} />
      </g>

      <path d={f.hairBack} style={S({ fill: f.hairC, stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
      <path d={f.hairStrands} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 12, strokeLinecap: 'round' })} />
      <path d={f.hairStrands} style={S({ fill: 'none', stroke: f.hairC, strokeWidth: 6.5, strokeLinecap: 'round' })} />
      <path d={f.neck} style={S({ fill: f.skinSh, stroke: f.ink, strokeWidth: 3.5, ...OUT })} />

      <g clipPath={f.clipTorso}>
        <path d={f.torso} style={S({ fill: f.skinSh })} />
        <path d={f.torso} transform="translate(9 -3)" style={S({ fill: f.skinHi })} />
        <path d={f.torso} transform="translate(5 -1)" style={S({ fill: f.skin })} />
        <path d={f.g0} style={S({ fill: f.g0Sh })} />
        <path d={f.g0} transform="translate(9 -3)" style={S({ fill: f.g0C })} />
        <path d={f.g1} style={S({ fill: f.g1Sh })} />
        <path d={f.g1} transform="translate(9 -3)" style={S({ fill: f.g1C })} />
        <path d={f.gLines} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.8, strokeLinecap: 'round', ...OUT })} />
        <path d={f.beltD} style={S({ fill: f.beltC, stroke: f.ink, strokeWidth: 2.5 })} />
      </g>
      <path d={f.pecs} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.5, strokeLinecap: 'round', opacity: f.pecsOp })} />
      <path d={f.abs} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.5, strokeLinecap: 'round', opacity: f.absOp })} />
      <path d={f.oblique} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.2, strokeLinecap: 'round', opacity: f.absOp })} />
      <path d={f.softChest} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.2, strokeLinecap: 'round', opacity: f.softOp })} />
      <path d={f.navel} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.2, strokeLinecap: 'round', opacity: f.bo })} />
      <path d={f.bellyLine} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.5, strokeLinecap: 'round', opacity: f.bo })} />
      <path d={f.torso} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 3.5, ...OUT })} />

      <g clipPath={f.clipShorts}>
        <path d={f.shortsD} style={S({ fill: f.bottomSh })} />
        <path d={f.shortsD} transform="translate(8 -3)" style={S({ fill: f.bottom })} />
      </g>
      <path d={f.waist} style={S({ fill: f.waistC, stroke: f.ink, strokeWidth: 3, ...OUT, opacity: f.waistOp })} />
      <path d={f.stripe} style={S({ fill: 'none', stroke: f.trim, strokeWidth: 4, strokeLinecap: 'round', opacity: f.stripeOp })} />
      <path d={f.shortsD} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
      <path d={f.beltKnot} style={S({ fill: f.beltC, stroke: f.ink, strokeWidth: 2.5, ...OUT })} />
      {belt ? (
        <g data-reward="ceinture">
          <path d={belt.strap} style={S({ fill: '#FFD23D', stroke: f.ink, strokeWidth: 3, ...OUT })} />
          <g transform={`translate(${belt.cx} ${belt.cy}) rotate(${belt.angle})`}>
            <rect x={-33} y={-8} width={12} height={16} rx={3} style={S({ fill: '#FFF4E3', stroke: f.ink, strokeWidth: 2.2 })} />
            <rect x={21} y={-8} width={12} height={16} rx={3} style={S({ fill: '#FFF4E3', stroke: f.ink, strokeWidth: 2.2 })} />
            <rect x={-15} y={-14} width={30} height={28} rx={8} style={S({ fill: '#FFE98A', stroke: f.ink, strokeWidth: 3 })} />
            <circle r={6.5} style={S({ fill: '#D22B3A', stroke: f.ink, strokeWidth: 2.2 })} />
            <circle cx={-2} cy={-2} r={1.8} style={S({ fill: '#FFFFFF', opacity: 0.7 })} />
          </g>
        </g>
      ) : null}

      <g clipPath={f.clipRear}>
        <path d={f.rear} style={S({ fill: f.skinSh })} />
        <path d={f.rear} transform="translate(5 -3)" style={S({ fill: f.skinHi })} />
        <path d={f.rear} transform="translate(3 -1)" style={S({ fill: f.skin })} />
      </g>
      <path d={f.rear} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
      <g clipPath={f.clipSR}>
        <path d={f.sleeveR} style={S({ fill: f.sleeveSh })} />
        <path d={f.sleeveR} transform="translate(5 -3)" style={S({ fill: f.sleeveHi })} />
        <path d={f.sleeveR} transform="translate(3 -1)" style={S({ fill: f.sleeveC })} />
      </g>
      <path d={f.sleeveStripeR} style={S({ fill: 'none', stroke: f.trim, strokeWidth: 3.5, strokeLinecap: 'round' })} />
      <path d={f.sleeveR} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
      <g transform={f.rearG}>
        <path d="M -12 -12 C 0 -18 17 -13 17 0 C 17 13 3 16 -9 13 Z" style={S({ fill: f.glove, stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
        <path d="M -9 7 C 2 12 12 9 16 3 C 14 11 3 15 -9 12 Z" style={S({ fill: f.gloveSh })} />
        <ellipse cx="6" cy="-4" rx="4.5" ry="2.6" style={S({ fill: '#FFFFFF', opacity: f.glossOp })} />
        <path d="M -19 -9 L -11 -10 L -11 10 L -19 9 Z" style={S({ fill: f.trim, stroke: f.ink, strokeWidth: 3, ...OUT })} />
      </g>

      <g clipPath={f.clipHead}>
        <path d={f.head} style={S({ fill: f.skinSh })} />
        <path d={f.head} transform="translate(7 -3)" style={S({ fill: f.skinHi })} />
        <path d={f.head} transform="translate(4 -1)" style={S({ fill: f.skin })} />
        <path d={f.maskD} style={S({ fill: f.maskSh })} />
        <path d={f.maskD} transform="translate(7 -3)" style={S({ fill: f.maskC })} />
        <path d={f.maskTrim} style={S({ fill: f.trim, stroke: f.ink, strokeWidth: 2.2, ...OUT })} />
      </g>
      <path d={f.chin2} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2.5, strokeLinecap: 'round', opacity: f.chin2Op })} />
      <path d={f.stubble} style={S({ fill: f.beardC, opacity: 0.42 })} />
      <path d={f.head} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
      <path d={f.wrinkles} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 1.8, strokeLinecap: 'round', opacity: 0.75 })} />
      <path d={f.nose} style={S({ opacity: f.faceOp, fill: f.noseFill, stroke: f.ink, strokeWidth: 3, strokeLinecap: 'round', ...OUT })} />
      <g style={S({ opacity: f.earOp })}>
        <path d="M 113 46 C 103 44 102 63 113 62 Z" style={S({ fill: f.skin, stroke: f.ink, strokeWidth: 3, ...OUT })} />
        <path d="M 111 50 C 107 51 107 57 111 58" style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2, strokeLinecap: 'round' })} />
      </g>
      <path d={f.hairCap} style={S({ fill: f.capC, stroke: f.ink, strokeWidth: 3, ...OUT })} />
      <path d={f.hairFront} style={S({ fill: f.hairC, stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
      <path d={f.hairLines} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 2, strokeLinecap: 'round', opacity: 0.7 })} />
      <path d={f.shine} style={S({ fill: '#FFFFFF', opacity: 0.55 })} />
      <path d={f.earring} style={S({ fill: 'none', stroke: '#140A22', strokeWidth: 4.6 })} />
      <path d={f.earring} style={S({ fill: 'none', stroke: '#FFD23D', strokeWidth: 2.4 })} />
      <path d={f.band} style={S({ fill: f.bandC, stroke: f.ink, strokeWidth: 3, ...OUT })} />
      <path d={f.bandana} style={S({ fill: f.bandanaC, stroke: f.ink, strokeWidth: 3, ...OUT })} />
      <path d={f.bandanaDots} style={S({ fill: '#FFF4E3' })} />
      <path d={f.beard} style={S({ fill: f.beardC, stroke: f.ink, strokeWidth: 3, ...OUT })} />
      <path d={f.eye} style={S({ opacity: f.faceOp, fill: f.eyeFill, stroke: f.ink, strokeWidth: 2.5, strokeLinecap: 'round', ...OUT })} />
      <path d={f.pupils} style={S({ fill: f.ink })} />
      <path d={f.brow} style={S({ opacity: f.faceOp, fill: 'none', stroke: f.browC, strokeWidth: 4.2, strokeLinecap: 'round' })} />
      <path d={f.mouth} style={S({ opacity: f.faceOp, fill: f.mouthFill, stroke: f.ink, strokeWidth: 2.8, strokeLinecap: 'round', ...OUT })} />
      <path d={f.lips} style={S({ fill: f.lipC, stroke: f.ink, strokeWidth: 1.6, strokeLinecap: 'round', ...OUT })} />
      <path d={f.moustache} style={S({ fill: f.beardC, stroke: f.ink, strokeWidth: 2.5, ...OUT })} />
      <path d={f.glasses} style={S({ fill: '#FFF4E3', fillOpacity: 0.22, stroke: f.ink, strokeWidth: 2.6, strokeLinecap: 'round', ...OUT })} />

      <g clipPath={f.clipLead}>
        <path d={f.lead} style={S({ fill: f.skinSh })} />
        <path d={f.lead} transform="translate(5 -4)" style={S({ fill: f.skinHi })} />
        <path d={f.lead} transform="translate(3 -2)" style={S({ fill: f.skin })} />
      </g>
      <path d={f.lead} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
      <g clipPath={f.clipSL}>
        <path d={f.sleeveL} style={S({ fill: f.sleeveSh })} />
        <path d={f.sleeveL} transform="translate(5 -4)" style={S({ fill: f.sleeveHi })} />
        <path d={f.sleeveL} transform="translate(3 -2)" style={S({ fill: f.sleeveC })} />
      </g>
      <path d={f.sleeveStripeL} style={S({ fill: 'none', stroke: f.trim, strokeWidth: 3.5, strokeLinecap: 'round' })} />
      <path d={f.sleeveL} style={S({ fill: 'none', stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
      <g transform={f.leadG}>
        <path d="M -12 -13 C 1 -19 19 -14 19 0 C 19 14 4 17 -10 14 Z" style={S({ fill: f.glove, stroke: f.ink, strokeWidth: 3.5, ...OUT })} />
        <path d="M -9 8 C 2 13 13 10 17 4 C 15 12 4 16 -9 13 Z" style={S({ fill: f.gloveSh })} />
        <path d="M -4 -11 C 4 -19 13 -16 12 -8 C 8 -5 2 -5 -4 -11 Z" style={S({ fill: f.glove, stroke: f.ink, strokeWidth: 2.8, ...OUT })} />
        <ellipse cx="7" cy="-3" rx="5" ry="3" style={S({ fill: '#FFFFFF', opacity: f.glossOp })} />
        <path d="M -20 -10 L -11 -11 L -11 11 L -20 10 Z" style={S({ fill: f.trim, stroke: f.ink, strokeWidth: 3, ...OUT })} />
      </g>
    </svg>
  );
}
