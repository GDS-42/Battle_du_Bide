import type { ReactNode, RefObject } from 'react';
import { Fighter } from '@/components/Fighter';
import type { SideView } from '@/lib/replay/model';

/** Pose de repos d'un camp : en garde, au tapis ou bras levés. */
export type RestPose = 'garde' | 'ko' | 'victoire';

/**
 * Ring du combat animé (look « BD ») : le décor peint et les deux camps au repos, dessinés par React, puis par-dessus
 * la scène du moteur d'animation (src/components/bd/engine.ts), qui ne s'allume qu'une fois ses dessins chargés.
 * Les deux couches ont la même géométrie : le passage de l'une à l'autre ne se voit pas.
 */
export function BdStage({ engineRef, live, a, b, poseA, poseB, banner, children }: {
  engineRef: RefObject<HTMLDivElement | null>; live: boolean;
  a: SideView; b: SideView; poseA: RestPose; poseB: RestPose; banner: string; children?: ReactNode;
}) {
  return (
    <div className="bdx">
      <div className="bdx-rest" aria-hidden={live || undefined}>
        <Corner side={a} at="left" pose={poseA} />
        <Corner side={b} at="right" pose={poseB} />
      </div>
      {/* Le moteur remplit lui-même cette boîte ; React n'y rend jamais rien. */}
      <div ref={engineRef} className={`bdx-engine${live ? ' live' : ''}`} aria-hidden />
      <div className="bdx-banner"><div key={banner}><span>{banner}</span></div></div>
      {children}
    </div>
  );
}

function Corner({ side, at, pose }: { side: SideView; at: 'left' | 'right'; pose: RestPose }) {
  const [main, second] = side.fighters;
  if (!main) return null;
  // Au tapis, le combattant est couché un peu vers le centre, comme à la fin de sa chute dans l'animation.
  const shift = pose === 'ko' ? { transform: `translateX(${at === 'left' ? 8 : -8}px)` } : undefined;
  return (
    <>
      {second ? <div className={`bdx-fighter bdx-partner ${at}`}><Fighter cfg={{ ...second.cfg, w: 150, spritePose: pose }} /></div> : null}
      <div className={`bdx-fighter ${at}${second ? ' duo' : ''}`} style={shift}><Fighter cfg={{ ...main.cfg, w: 150, spritePose: pose }} title={side.name} /></div>
    </>
  );
}
