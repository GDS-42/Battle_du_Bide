// Combat animé du look « BD » : animation limitée (poses dessinées échangées d'un coup, déformations, arrêts sur
// image, effets) et gros plans d'expression qui claquent à l'écran comme des cases de bande dessinée.
//
// Ce module ne touche au navigateur qu'à l'intérieur de createStage() : il peut donc être importé sans risque,
// et n'est chargé qu'au clic sur « Lancer le combat ». Tout texte venu d'un joueur est posé par textContent.
import { assetsOf, BD_BOSS, BD_CAST, faceFor, faceUrl, poseFor, spriteUrl, tintHex, tintable } from '@/lib/fighter/bd';
import { SPRITES, type FaceMeta, type PoseMeta } from '@/lib/fighter/bd-sprites';
import type { SpriteLook } from '@/lib/fighter/types';
import type { Beat } from '@/lib/replay/model';
import type { CrowdName, SoundName } from '@/lib/sound';

export interface StageSide { lead: SpriteLook; partner?: SpriteLook | null }
export interface StageDeps {
  play(name: SoundName): void;
  buzz(p: number | number[]): void;
  /** Réaction de la salle (acclamation, « oooh », déception, applaudissements…), à un volume relatif. */
  crowd?(name: CrowdName, level?: number): void;
  /** Fond de foule : allumé pendant le combat, éteint ensuite. */
  bed?(on: boolean): void;
}
export interface StageCallbacks { onBeat(index: number, beat: Beat): void; onImpact(by: 'a' | 'b'): void }
export interface Stage {
  /** Monte les deux camps et attend que leurs dessins soient prêts. Rejette si un dessin manque. */
  load(a: StageSide, b: StageSide): Promise<void>;
  /** Joue les séquences. Résout « aborted » si une autre lecture, un passage ou un démontage l'interrompt. */
  play(beats: Beat[], cb: StageCallbacks): Promise<'done' | 'aborted'>;
  /** Coupe tout et affiche l'état final, sans animation. */
  rest(end: { koA: boolean; koB: boolean }): void;
  destroy(): void;
}

const INK = '#140A22', CREAM = '#FFF4E3', SUN = '#FFD23D', MINT = '#2BFFB0', LILAS = '#CDB8F0', ORANGE = '#F7893B', MAG = '#E8287C', GOLD = '#FFC61A';
const FW = 150, FH = 200, SC = FW / 240, GROUND = 38, GY = 300 * SC, KO_X = 8;
const EASE = { out: 'cubic-bezier(.2,.8,.3,1)', in: 'cubic-bezier(.6,0,.9,.4)', back: 'cubic-bezier(.3,1.7,.5,1)', snap: 'cubic-bezier(.3,0,.1,1)' };
const STAR = 'M0 -9L2.2 -2.2L9 0L2.2 2.2L0 9L-2.2 2.2L-9 0L-2.2 -2.2Z';
const STAR5 = 'M0 -9L2.6 -3.6L8.6 -2.8L4.2 1.4L5.3 7.3L0 4.5L-5.3 7.3L-4.2 1.4L-8.6 -2.8L-2.6 -3.6Z';
const FLAME = 'M100 252C40 252 14 214 22 168C26 190 38 196 44 186C30 140 52 104 64 78C62 110 72 126 82 122C74 76 92 40 104 8C108 46 128 70 124 116C136 110 142 92 140 70C160 100 172 140 160 180C168 178 176 166 178 150C192 200 164 252 100 252Z';
const GP_BG: Record<string, [string, string]> = { defi: [MAG, '#5A2A7A'], rage: [ORANGE, '#D22B3A'], panique: ['#5A2A7A', '#2A1548'], impact: [CREAM, SUN], sonne: ['#2BB5FF', '#5A2A7A'], rire: [SUN, ORANGE], blase: [LILAS, '#5A2A7A'] };
// Gants dorés (série de 21 jours) : la même médaille que sur le combattant au repos (BdFighter), à hauteur de taille.
const MEDAL = `<svg data-reward="gants" viewBox="-18 -18 36 36" width="34" height="34" style="position:absolute;left:1px;top:83.5px;overflow:visible"><circle r="16" style="fill:${CREAM};stroke:${INK};stroke-width:3"/><circle r="11.5" style="fill:none;stroke:${GOLD};stroke-width:2"/><g transform="translate(-1 1) scale(.5)"><path d="M -12 -13 C 1 -19 19 -14 19 0 C 19 14 4 17 -10 14 Z" style="fill:${GOLD};stroke:${INK};stroke-width:4.5;stroke-linejoin:round"/><path d="M -20 -10 L -11 -11 L -11 11 L -20 10 Z" style="fill:${CREAM};stroke:${INK};stroke-width:4;stroke-linejoin:round"/></g><path d="M11 -17 L12.6 -12.6 L17 -11 L12.6 -9.4 L11 -5 L9.4 -9.4 L5 -11 L9.4 -12.6 Z" style="fill:${GOLD};stroke:${INK};stroke-width:1.4;stroke-linejoin:round"/></svg>`;
const PARTNER_POSES = ['garde', 'touche', 'ko', 'victoire'];
const ABORT = Symbol('abort');
const fl = (c: string, w: number) => `fill:${c};stroke:${INK};stroke-width:${w};stroke-linejoin:round`;
const st = (w: number, c = INK) => `fill:none;stroke:${c};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round`;

type Pt = { x: number; y: number };
interface Fighter {
  side: 'a' | 'b'; dir: 1 | -1; look: SpriteLook;
  el: HTMLElement; mv: HTMLElement; rot: HTMLElement; sq: HTMLElement; idle: HTMLElement; fig: HTMLElement; shade: HTMLElement;
  poses: Record<string, HTMLElement>; pose: string; pos: Pt; ang: number; sc: [number, number];
  partner: { el: HTMLElement; poses: Record<string, HTMLElement> } | null;
}

/** Fragment HTML statique (jamais de texte venu d'un joueur ici). */
function h(html: string): HTMLElement {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}
const colorOf = (l: SpriteLook) => l.color ?? (l.who === 'bide' ? BD_BOSS.color : BD_CAST[l.who].color);

/** Calque de teinte : le gris du dessin multiplié par la couleur, limité à sa zone par un masque. */
function tintLayer(url: string, color: string): HTMLElement {
  const s = document.createElement('span');
  s.className = 'bd-tint';
  const u = `url(${url})`;
  Object.assign(s.style, { position: 'absolute', inset: '0', backgroundColor: color, backgroundImage: u, backgroundSize: '100% 100%', backgroundBlendMode: 'multiply', maskImage: u, maskSize: '100% 100%' });
  s.style.setProperty('-webkit-mask-image', u);
  s.style.setProperty('-webkit-mask-size', '100% 100%');
  return s;
}
function image(url: string, sink: HTMLImageElement[]): HTMLImageElement {
  const im = document.createElement('img');
  im.alt = ''; im.draggable = false; im.decoding = 'sync'; im.src = url; // « sync » : une pose échangée s'affiche à l'image même, sans trou
  sink.push(im);
  return im;
}

export function createStage(root: HTMLElement, deps: StageDeps): Stage {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.replaceChildren();
  const cam = h('<div class="bdx-cam"><div class="bdx-layer bdx-fxb"></div><div class="bdx-layer bdx-actors"></div><div class="bdx-layer bdx-fxf"></div></div>');
  const bars = h('<div class="bdx-bars"></div>');
  root.append(cam, bars);
  const fxB = cam.children[0] as HTMLElement, actors = cam.children[1] as HTMLElement, fxF = cam.children[2] as HTMLElement;
  const sfx = (n: SoundName) => deps.play(n);
  const crowd = (n: CrowdName, level = 1) => deps.crowd?.(n, level);
  const letterbox = (on: boolean) => bars.classList.toggle('on', on);
  const W = () => root.clientWidth, H = () => root.clientHeight;
  const floorY = () => H() - GROUND - 8;
  const clampX = (x: number, m: number) => Math.max(m, Math.min(W() - m, x));

  let L: Fighter | null = null, R: Fighter | null = null;
  let images: HTMLImageElement[] = [];
  let RUN = 0, dead = false;
  const LIVE = new Set<Animation>();
  let CB: StageCallbacks = { onBeat() {}, onImpact() {} };

  // ---------- Combattants ----------
  function poseEl(look: SpriteLook, name: string, meta: PoseMeta): HTMLElement {
    const box = document.createElement('span');
    box.className = 'bdx-pose';
    Object.assign(box.style, { left: `${(FW / 2 - meta.ax).toFixed(1)}px`, top: `${(GY - meta.h).toFixed(1)}px`, width: `${meta.w}px`, height: `${meta.h}px` });
    box.appendChild(image(spriteUrl(look.who, name), images));
    if (tintable(look.who)) {
      if (look.color) box.appendChild(tintLayer(spriteUrl(look.who, name, 'c'), tintHex(look.color)));
      if (look.belt) box.appendChild(tintLayer(spriteUrl(look.who, name, 'b'), GOLD));
    }
    return box;
  }
  function figure(look: SpriteLook, only?: string[]): { fig: HTMLElement; poses: Record<string, HTMLElement> } {
    const fig = document.createElement('div'); fig.className = 'bdx-fig';
    const poses: Record<string, HTMLElement> = {};
    for (const [name, meta] of Object.entries(SPRITES[look.who].poses)) {
      if (only && !only.includes(name)) continue;
      poses[name] = poseEl(look, name, meta); fig.appendChild(poses[name]);
    }
    if (look.gold && !only) fig.appendChild(h(MEDAL));
    return { fig, poses };
  }
  const show = (poses: Record<string, HTMLElement>, name: string) => { for (const [p, e] of Object.entries(poses)) e.classList.toggle('on', p === name); };
  function mount(side: 'a' | 'b', s: StageSide): Fighter {
    const left = side === 'a';
    const el = h(`<div class="bdx-fighter ${left ? 'left' : 'right'}${s.partner ? ' duo' : ''}"><div class="bdx-shade"></div><div class="bdx-mv"><div class="bdx-rot"><div class="bdx-sq"><div class="bdx-idle"><div class="bdx-flip"></div></div></div></div></div></div>`);
    const q = (c: string) => el.querySelector(c) as HTMLElement;
    const { fig, poses } = figure(s.lead);
    q('.bdx-flip').appendChild(fig);
    let partner: Fighter['partner'] = null;
    if (s.partner) {
      // Second membre de l'équipe : en retrait, immobile ; il change seulement de dessin quand son camp encaisse, tombe ou gagne.
      const pe = h(`<div class="bdx-fighter bdx-partner ${left ? 'left' : 'right'}"><div class="bdx-flip"></div></div>`);
      const pf = figure(s.partner, PARTNER_POSES);
      (pe.firstElementChild as HTMLElement).appendChild(pf.fig);
      actors.appendChild(pe);
      partner = { el: pe, poses: pf.poses };
      show(pf.poses, 'garde');
    }
    actors.appendChild(el);
    const F: Fighter = { side, dir: left ? 1 : -1, look: s.lead, el, mv: q('.bdx-mv'), rot: q('.bdx-rot'), sq: q('.bdx-sq'), idle: q('.bdx-idle'), fig, shade: q('.bdx-shade'), poses, pose: 'garde', pos: { x: 0, y: 0 }, ang: 0, sc: [1, 1], partner };
    clearFighter(F);
    return F;
  }
  const meta = (F: Fighter, pose = F.pose) => poseFor(F.look.who, pose).meta;
  const swap = (F: Fighter, pose: string) => {
    F.pose = poseFor(F.look.who, pose).pose; show(F.poses, F.pose);
    const medal = F.fig.querySelector<SVGElement>('[data-reward="gants"]');
    if (medal) medal.style.visibility = F.pose === 'ko' || F.pose === 'vol' ? 'hidden' : '';
  };
  const partnerPose = (F: Fighter, pose: string) => { if (F.partner) show(F.partner.poses, F.partner.poses[pose] ? pose : 'garde'); };
  const mvT = (F: Fighter, p: Pt) => `translate(${(p.x * F.dir).toFixed(1)}px,${(-p.y).toFixed(1)}px)`;
  const shT = (F: Fighter, p: Pt) => `translateX(${(p.x * F.dir).toFixed(1)}px) scale(${Math.max(0.3, 1 - Math.max(0, p.y) / 240).toFixed(2)})`;
  const place = (F: Fighter, x: number, y: number) => { F.pos = { x, y }; F.mv.style.transform = mvT(F, F.pos); F.shade.style.transform = shT(F, F.pos); };
  const upright = (F: Fighter) => { F.ang = 0; F.rot.style.transform = ''; };
  const setSq = (F: Fighter, sx: number, sy: number) => { F.sc = [sx, sy]; F.sq.style.transform = `scale(${sx},${sy})`; };
  function clearFighter(F: Fighter) {
    F.pos = { x: 0, y: 0 }; F.ang = 0; F.sc = [1, 1];
    for (const e of [F.mv, F.rot, F.sq, F.idle, F.shade]) e.style.transform = '';
    F.el.style.opacity = ''; F.fig.classList.remove('burnt');
    swap(F, 'garde'); partnerPose(F, 'garde');
  }
  /** Point du cadre du combattant (repère 240 × 320 du générateur) → pixels de la scène, selon son déplacement et sa rotation. */
  function pt(F: Fighter, lx: number, ly: number): Pt {
    const bx = (F.dir > 0 ? lx * SC : FW - lx * SC) - FW / 2, by = ly * SC - FH * 0.55;
    const a = (-F.ang * F.dir * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return { x: F.el.offsetLeft + FW / 2 + F.pos.x * F.dir + bx * c - by * s, y: H() - GROUND - FH * 0.45 - F.pos.y + bx * s + by * c };
  }
  /** Point d'une pose (« head », « hand », « top », « feet », ou [x, y] en pixels du dessin) → pixels de la scène. */
  function bPt(F: Fighter, what: 'head' | 'hand' | 'top' | 'feet' | [number, number], pose = F.pose): Pt {
    const m = meta(F, pose);
    const p = what === 'head' ? m.head : what === 'hand' ? (m.hand ?? m.head) : what === 'top' ? [m.head[0], m.head[1] - 30] : what === 'feet' ? [m.ax, m.h] : what;
    return pt(F, 120 + (p[0] - m.ax) / SC, 300 + (p[1] - m.h) / SC);
  }
  const gap = (A: Fighter, D: Fighter) => Math.abs(D.el.offsetLeft - A.el.offsetLeft);
  /** Élan à prendre pour que la main de A (dans la pose visée) arrive sur la tête de D : avancée et petit saut. */
  function bReach(A: Fighter, D: Fighter, pose: string, overlap = 6, maxLift = 34) {
    const keep = { pos: A.pos, ang: A.ang }; A.pos = { x: 0, y: 0 }; A.ang = 0;
    const a = bPt(A, 'hand', pose); A.pos = keep.pos; A.ang = keep.ang;
    const d = bPt(D, 'head');
    return { dist: (d.x - a.x) * A.dir - overlap, lift: Math.max(0, Math.min(maxLift, a.y - d.y - 6)) };
  }

  // ---------- Une lecture : tout ce qui est animé passe par elle, pour pouvoir tout couper d'un coup ----------
  class Run {
    id = ++RUN;
    get alive() { return this.id === RUN && !dead; }
    check() { if (!this.alive) throw ABORT; }
    wait(ms: number) { this.check(); return new Promise<void>((res, rej) => setTimeout(() => (this.alive ? res() : rej(ABORT)), ms)); }
    /** Lance une animation secondaire sans l'attendre ; son interruption ne remonte pas. */
    fire(p: unknown) { Promise.resolve(p).catch(() => {}); }
    anim(el: Element, frames: Keyframe[], ms: number, o: KeyframeAnimationOptions = {}): Promise<void> {
      this.check();
      const a = el.animate(frames, { duration: Math.max(1, ms), fill: 'both', easing: EASE.out, ...o });
      LIVE.add(a);
      return a.finished.then(() => {
        LIVE.delete(a);
        if (el.isConnected) { try { a.commitStyles(); } catch { /* élément non rendu */ } }
        a.cancel(); this.check();
      }, () => { LIVE.delete(a); throw ABORT; });
    }
    move(F: Fighter, x: number, y: number, ms: number, easing?: string) {
      const a = mvT(F, F.pos), s0 = shT(F, F.pos); F.pos = { x, y };
      const o = easing ? { easing } : {};
      this.fire(this.anim(F.shade, [{ transform: s0 }, { transform: shT(F, F.pos) }], ms, o));
      return this.anim(F.mv, [{ transform: a }, { transform: mvT(F, F.pos) }], ms, o);
    }
    path(F: Fighter, pts: [number, number][], ms: number, easing = 'linear') {
      const frames = [{ transform: mvT(F, F.pos) }, ...pts.map(([x, y]) => ({ transform: mvT(F, { x, y }) }))];
      this.fire(this.anim(F.shade, [{ transform: shT(F, F.pos) }, ...pts.map(([x, y]) => ({ transform: shT(F, { x, y }) }))], ms, { easing }));
      const [x, y] = pts[pts.length - 1]; F.pos = { x, y };
      return this.anim(F.mv, frames, ms, { easing });
    }
    /** Rotation du corps entier ; positif = bascule en arrière (loin de l'adversaire). */
    spin(F: Fighter, deg: number, ms: number, easing?: string) {
      const a = `rotate(${-F.ang * F.dir}deg)`; F.ang = deg;
      return this.anim(F.rot, [{ transform: a }, { transform: `rotate(${-deg * F.dir}deg)` }], ms, easing ? { easing } : {});
    }
    squash(F: Fighter, sx: number, sy: number, ms: number, easing?: string) {
      const a = `scale(${F.sc[0]},${F.sc[1]})`; F.sc = [sx, sy];
      return this.anim(F.sq, [{ transform: a }, { transform: `scale(${sx},${sy})` }], ms, easing ? { easing } : {});
    }
  }

  function stopAll() {
    RUN++;
    for (const a of [...LIVE]) a.cancel();
    LIVE.clear(); fxB.replaceChildren(); fxF.replaceChildren();
    cam.className = 'bdx-cam'; cam.style.transform = ''; root.classList.remove('frozen'); letterbox(false);
  }

  // ---------- Effets ----------
  const put = <T extends Element>(layer: HTMLElement, e: T): T => { layer.appendChild(e); return e; };
  const gone = (r: Run, e: Element, p: unknown) => r.fire(Promise.resolve(p).finally(() => e.remove()));
  function flash(r: Run, ms = 120, color = '#fff') { if (reduce) return; const e = put(fxF, h('<div class="bdx-fx bdx-flash"></div>')); e.style.background = color; gone(r, e, r.anim(e, [{ opacity: 0.9 }, { opacity: 0 }], ms, { easing: 'linear' })); }
  function negative(r: Run, ms: number) { if (reduce) return; cam.classList.add('neg'); r.fire(r.wait(ms).finally(() => cam.classList.remove('neg'))); }
  function shake(r: Run, m: number, ms: number) { if (reduce) return; r.fire(r.anim(cam, [0, 1, -1, 0.7, -0.6, 0.4, -0.25, 0].map((k, i) => ({ transform: `translate(${k * m}px,${(i % 2 ? 0.5 : -0.5) * k * m}px)` })), ms, { easing: 'linear' })); }
  async function hitstop(r: Run, ms: number) { root.classList.add('frozen'); try { await r.wait(ms); } finally { root.classList.remove('frozen'); } }
  function speedLines(r: Run, dir: number, ms: number, strong = false) {
    const n = strong ? 24 : 14;
    for (let i = 0; i < n; i++) {
      const e = put(fxB, h('<div class="bdx-fx bdx-line"></div>'));
      Object.assign(e.style, { width: 40 + Math.random() * (strong ? 170 : 100) + 'px', top: 16 + Math.random() * 230 + 'px', left: Math.random() * W() - 40 + 'px', height: 2 + Math.random() * 3 + 'px' });
      gone(r, e, r.anim(e, [{ transform: `translateX(${dir * 90}px)`, opacity: 0 }, { opacity: 0.9, offset: 0.25 }, { transform: `translateX(${-dir * 230}px)`, opacity: 0 }], ms * 0.6, { delay: Math.random() * ms * 0.4, easing: 'linear' }));
    }
  }
  function focus(r: Run, cx: number, cy: number, ms: number, color = INK) {
    const w = W(), hh = H(), R0 = Math.hypot(w, hh), n = 36; let polys = '';
    const p = (a: number, rad: number) => (cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1);
    for (let i = 0; i < n; i++) { const a = ((i + Math.random() * 0.8) / n) * Math.PI * 2, ww = 0.012 + Math.random() * 0.03; polys += `<polygon points="${p(a - ww, R0)} ${p(a + ww, R0)} ${p(a, 64 + Math.random() * 60)}"/>`; }
    const e = put(fxF, h(`<svg class="bdx-fx" viewBox="0 0 ${w} ${hh}" style="inset:0;width:100%;height:100%"><g style="fill:${color}">${polys}</g></svg>`));
    gone(r, e, r.anim(e, [{ opacity: 0, transform: 'scale(1.25)' }, { opacity: 0.9, transform: 'scale(1)', offset: 0.15 }, { opacity: 0.9, transform: 'scale(1.04)', offset: 0.8 }, { opacity: 0, transform: 'scale(1.1)' }], ms, { easing: 'linear' }));
  }
  const BURST = (() => { const pts: string[] = []; for (let i = 0; i < 24; i++) { const a = (Math.PI * i) / 12 - Math.PI / 2, rr = i % 2 === 0 ? (i % 4 === 0 ? 58 : 50) : 34; pts.push(Math.round(60 + Math.cos(a) * rr) + ',' + Math.round(50 + Math.sin(a) * rr * 0.82)); } return pts.join(' '); })();
  /** Étoile d'onomatopée. `text` et `sub` sont des libellés du jeu, jamais un texte de joueur. */
  function burst(r: Run, x: number, y: number, text: string, sub: string, color: string, k = 1) {
    x = Math.max(78, Math.min(W() - 78, x)); y = Math.max(56, Math.min(H() - 90, y));
    const e = put(fxF, h(`<div class="bdx-fx bdx-burst" style="left:${x}px;top:${y}px"><svg viewBox="0 0 120 100" aria-hidden="true"><polygon points="${BURST}" style="fill:${color};stroke:${INK};stroke-width:4;stroke-linejoin:round"/></svg><div class="bdx-bt"><b></b></div></div>`));
    (e.querySelector('b') as HTMLElement).textContent = text;
    if (sub) { const i = document.createElement('i'); i.textContent = sub; (e.querySelector('.bdx-bt') as HTMLElement).appendChild(i); }
    gone(r, e, r.anim(e, [{ transform: 'scale(.2) rotate(-14deg)', opacity: 0 }, { transform: `scale(${1.22 * k}) rotate(5deg)`, opacity: 1, offset: 0.16 }, { transform: `scale(${k}) rotate(0deg)`, opacity: 1, offset: 0.28 }, { transform: `scale(${k}) rotate(0deg)`, opacity: 1, offset: 0.82 }, { transform: `scale(${1.12 * k}) rotate(0deg)`, opacity: 0 }], 1050, { easing: 'linear' }));
  }
  function sparks(r: Run, x: number, y: number, n: number, color = SUN) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 52, dx = Math.cos(a) * d, dy = Math.sin(a) * d;
      const e = put(fxF, h(`<svg class="bdx-fx" viewBox="-10 -10 20 20" style="left:${x - 8}px;top:${y - 8}px;width:16px;height:16px;overflow:visible"><path d="${STAR}" style="${fl(color, 1.8)}"/></svg>`));
      gone(r, e, r.anim(e, [{ transform: 'translate(0,0) scale(.4) rotate(0deg)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(1.1) rotate(140deg)`, opacity: 1, offset: 0.6 }, { transform: `translate(${dx * 1.2}px,${dy * 1.2 + 14}px) scale(.3) rotate(220deg)`, opacity: 0 }], 520));
    }
  }
  function dust(r: Run, x: number, y: number, n = 5, spread = 1) {
    for (let i = 0; i < n; i++) {
      const s = 10 + Math.random() * 16, dx = ((n > 1 ? i / (n - 1) : 0.5) - 0.5) * 96 * spread + (Math.random() - 0.5) * 14;
      const e = put(fxF, h(`<div class="bdx-fx bdx-puff" style="left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px"></div>`));
      gone(r, e, r.anim(e, [{ transform: 'translate(0,0) scale(.3)', opacity: 0.95 }, { transform: `translate(${dx}px,${-8 - Math.random() * 20}px) scale(1.35)`, opacity: 0 }], 560));
    }
  }
  function ono(r: Run, p: Pt, text: string, { color = SUN, size = 30, ms = 800, rot = -8 } = {}) {
    const e = put(fxF, h(`<div class="bdx-fx bdx-ono" style="left:${p.x}px;top:${p.y}px;font-size:${size}px;color:${color};translate:-50% -50%"></div>`));
    e.textContent = text;
    gone(r, e, r.anim(e, [{ transform: `scale(.3) rotate(${rot - 10}deg)`, opacity: 0 }, { transform: `scale(1.2) rotate(${rot + 3}deg)`, opacity: 1, offset: 0.2 }, { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.32 }, { transform: `scale(1.04) rotate(${rot}deg)`, opacity: 1, offset: 0.8 }, { transform: `scale(1.15) rotate(${rot}deg)`, opacity: 0 }], ms, { easing: 'linear' }));
  }
  /** Les dégâts s'envolent au-dessus de celui qui encaisse, et le replay est prévenu que le coup a porté. */
  function hurt(r: Run, D: Fighter, n: number, by: 'a' | 'b') {
    CB.onImpact(by);
    partnerPose(D, 'touche'); r.fire(r.wait(700).then(() => partnerPose(D, 'garde')));
    if (n <= 0) return;
    const p = pt(D, 70, 44), e = put(fxF, h(`<div class="bdx-fx bdx-dmg" style="left:${p.x}px;top:${Math.max(150, p.y)}px"></div>`));
    e.textContent = `−${Math.round(n)}`;
    gone(r, e, r.anim(e, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-44px)', opacity: 0 }], 1100));
  }
  function ghosts(r: Run, F: Fighter, dist: number, n: number) {
    for (let i = 1; i <= n; i++) r.fire(r.wait(i * 12).then(() => {
      const g = F.el.cloneNode(true) as HTMLElement; g.classList.add('bdx-ghost');
      (g.querySelector('.bdx-mv') as HTMLElement).style.transform = `translate(${((dist * i) / (n + 1)) * F.dir}px,0)`;
      put(fxB, g); gone(r, g, r.anim(g, [{ opacity: 0.5 }, { opacity: 0 }], 260, { easing: 'linear' }));
    }));
  }
  function tremble(r: Run, F: Fighter, ms: number, m = 2) { r.fire(r.anim(F.idle, [{ transform: `translate(${-m}px,0)` }, { transform: `translate(${m}px,1px)` }], ms, { duration: 50, iterations: Math.max(2, Math.round(ms / 50)), direction: 'alternate', easing: 'linear', fill: 'none' })); }
  function aura(r: Run, F: Fighter, color = MINT) {
    const mk = (layer: HTMLElement, op: number) => {
      const e = put(layer, h(`<div class="bdx-fx bdx-aura" style="left:${F.el.offsetLeft + FW / 2 - 115}px;bottom:${GROUND - 14}px;opacity:${op}"><svg class="f1" viewBox="0 0 200 260" preserveAspectRatio="none"><path d="${FLAME}" style="${fl(color, 3)}"/></svg><svg class="f2" viewBox="-42.9 -111.4 285.7 371.4" preserveAspectRatio="none"><path d="${FLAME}" style="fill:#F2FFF9"/></svg></div>`));
      r.fire(r.anim(e, [{ transform: 'scale(.5,.1)' }, { transform: 'scale(1,1)' }], 280, { easing: EASE.back }));
      return e;
    };
    const els = [mk(fxB, 0.95), mk(fxF, 0.2)];
    return { off: () => els.forEach((e) => gone(r, e, r.anim(e, [{ opacity: e.style.opacity }, { opacity: 0, transform: 'scale(1.1,1.3)' }], 280))) };
  }
  function rocks(r: Run, F: Fighter, ms: number) {
    const base = pt(F, 120, 300);
    for (let i = 0; i < 10; i++) {
      const s = 5 + Math.random() * 7, e = put(fxB, h(`<div class="bdx-fx" style="left:${base.x - 70 + Math.random() * 140}px;top:${base.y - 6}px;width:${s}px;height:${s}px;background:${i % 2 ? '#5A2A7A' : '#2A1548'};border:2px solid ${INK}"></div>`));
      gone(r, e, r.anim(e, [{ transform: 'translateY(0) rotate(0deg)', opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: `translateY(${-60 - Math.random() * 80}px) rotate(${200 * (Math.random() - 0.5)}deg)`, opacity: 0 }], 700, { delay: Math.random() * (ms - 500), easing: 'linear' }));
    }
  }
  function darken(r: Run, o = 0.6) {
    const e = put(fxB, h('<div class="bdx-fx bdx-dark" style="opacity:0"></div>')); r.fire(r.anim(e, [{ opacity: 0 }, { opacity: o }], 260));
    return { off: () => gone(r, e, r.anim(e, [{ opacity: o }, { opacity: 0 }], 320)) };
  }
  const GLOVE = (c: string, sh: string, trim: string) => `<path d="M -12 -13 C 1 -19 19 -14 19 0 C 19 14 4 17 -10 14 Z" style="${fl(c, 3.5)}"/><path d="M -9 8 C 2 13 13 10 17 4 C 15 12 4 16 -9 13 Z" style="fill:${sh}"/><path d="M -4 -11 C 4 -19 13 -16 12 -8 C 8 -5 2 -5 -4 -11 Z" style="${fl(c, 2.8)}"/><ellipse cx="7" cy="-3" rx="5" ry="3" style="fill:#fff;opacity:.6"/><path d="M -20 -10 L -11 -11 L -11 11 L -20 10 Z" style="${fl(trim, 3)}"/>`;
  async function fist(r: Run, A: Fighter, a: Pt, b: Pt) {
    const e = put(fxF, h(`<div class="bdx-fx" style="left:${a.x}px;top:${a.y}px;width:0;height:0"><svg viewBox="-60 -26 86 52" style="position:absolute;left:-130px;top:-56px;width:186px;height:112px;overflow:visible;transform-origin:130px 56px;transform:scaleX(${A.dir})"><path d="M-22 -11L-58 -17L-40 -6L-60 0L-40 6L-58 17L-22 11Z" style="${fl('#F2FFF9', 2)}"/>${GLOVE(MINT, '#1FBF8A', CREAM)}</svg></div>`));
    speedLines(r, A.dir, 300, true);
    await r.anim(e, [{ transform: 'translate(0px,0px) scale(.35)' }, { transform: `translate(${b.x - a.x}px,${b.y - a.y}px) scale(1.3)` }], 230, { easing: EASE.in });
    e.remove();
    return b;
  }
  function explosion(r: Run, x: number, y: number) {
    ([['#fff', 0, 1.9], [SUN, 40, 1.6], [ORANGE, 80, 1.3], [MAG, 120, 1.05]] as [string, number, number][]).forEach(([c, d, k]) => {
      const e = put(fxF, h(`<div class="bdx-fx bdx-ring-x" style="left:${x}px;top:${y}px;background:${c}"></div>`));
      gone(r, e, r.anim(e, [{ transform: 'scale(.1)', opacity: 1 }, { transform: `scale(${k})`, opacity: 1, offset: 0.6 }, { transform: `scale(${k * 1.15})`, opacity: 0 }], 540, { delay: d }));
    });
    dust(r, x, y + 34, 9, 2.4); sparks(r, x, y, 12, CREAM);
  }
  function orbit(p: Pt) {
    const star = `<svg viewBox="-10 -10 20 20" style="width:100%;height:100%;overflow:visible"><path d="${STAR5}" style="${fl(SUN, 1.8)}"/></svg>`;
    return put(fxF, h(`<div class="bdx-fx bdx-orbit" style="left:${p.x}px;top:${p.y}px"><i>${star}</i><i>${star}</i><i>${star}</i></div>`));
  }
  function zzz(r: Run, F: Fighter, n: number) {
    r.fire((async () => {
      for (let i = 0; i < n; i++) {
        const p = bPt(F, 'top'), e = put(fxF, h(`<div class="bdx-fx bdx-ono" style="left:${p.x}px;top:${p.y - 10}px;font-size:${15 + (i % 3) * 6}px;color:${CREAM};-webkit-text-stroke-width:2px">Z</div>`));
        gone(r, e, r.anim(e, [{ transform: 'translate(0,0) rotate(-12deg)', opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${F.dir * 30}px,-62px) rotate(14deg)`, opacity: 0 }], 1400, { easing: 'linear' }));
        sfx('snore'); await r.wait(520);
      }
    })());
  }
  function tumbleweed(r: Run, dir: number) {
    const w = W(), f: Keyframe[] = [];
    const e = put(fxF, h(`<svg class="bdx-fx" viewBox="-20 -20 40 40" style="left:${dir > 0 ? -44 : w + 8}px;bottom:26px;width:36px;height:36px;overflow:visible"><g style="${st(2.4, '#8A5A2B')}"><ellipse rx="15" ry="12"/><ellipse rx="12" ry="15" transform="rotate(30)"/><ellipse rx="14" ry="8" transform="rotate(-40)"/><path d="M-12 -4Q0 6 13 -3M-8 10Q2 -6 10 9M-14 2Q-2 -10 6 -13"/></g><ellipse rx="16" ry="14" style="${st(1.4)};opacity:.55"/></svg>`));
    for (let i = 0; i <= 14; i++) { const t = i / 14; f.push({ transform: `translate(${dir * (w + 70) * t}px,${-Math.abs(Math.sin(t * Math.PI * 4)) * 18}px) rotate(${dir * 1000 * t}deg)` }); }
    gone(r, e, r.anim(e, f, 2000, { easing: 'linear' }));
  }
  function tooth(r: Run, x: number, y: number, dir: number) {
    const e = put(fxF, h(`<svg class="bdx-fx" viewBox="-8 -8 16 16" style="left:${x - 9}px;top:${y - 9}px;width:18px;height:18px;overflow:visible"><path d="M-5 -6Q0 -8 5 -6Q6 0 3.5 6Q2 2 0 2Q-2 2 -3.5 6Q-6 0 -5 -6Z" style="${fl('#fff', 1.8)}"/></svg>`)), f: Keyframe[] = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; f.push({ transform: `translate(${dir * 96 * t}px,${-150 * t + 196 * t * t}px) rotate(${dir * 720 * t}deg)` }); }
    gone(r, e, r.anim(e, f, 900, { easing: 'linear' }).then(() => { sparks(r, x + dir * 96, y + 46, 4, CREAM); sfx('ting'); }));
  }
  function slam(r: Run, text: string, size: number) {
    const e = put(fxF, h(`<div class="bdx-fx bdx-center"><div class="bdx-extrude" style="font-size:${size}px"></div></div>`));
    (e.firstElementChild as HTMLElement).textContent = text;
    r.fire(r.anim(e, [{ transform: 'scale(3.4) rotate(-12deg)', opacity: 0 }, { transform: 'scale(1) rotate(-6deg)', opacity: 1 }], 200, { easing: EASE.snap }));
    return e;
  }

  // ---------- Gros plans d'expression ----------
  const hasFace = (F: Fighter, e: string) => !!faceFor(F.look.who, e);
  /** Gros plan : la tête (centre c) est placée au point (px, py) de sa boîte ; `flip` pour regarder vers la gauche. */
  function faceEl(look: SpriteLook, e: string, px: number, py: number, size: number, flip: boolean, glove?: string): HTMLElement {
    const f = faceFor(look.who, e) as FaceMeta, cx = flip ? 1 - f.c[0] : f.c[0];
    const box = document.createElement('span');
    box.className = 'bdx-gp-img';
    Object.assign(box.style, { width: `${size}px`, height: `${size}px`, left: `${(px - cx * size).toFixed(1)}px`, top: `${(py - f.c[1] * size).toFixed(1)}px`, transform: flip ? 'scaleX(-1)' : '' });
    box.appendChild(image(faceUrl(look.who, e), []));
    if (tintable(look.who)) {
      if (look.color) box.appendChild(tintLayer(faceUrl(look.who, e, 'c'), tintHex(look.color)));
      // le gant qui frappe prend la couleur de l'adversaire
      if (e === 'impact' && glove) box.appendChild(tintLayer(faceUrl(look.who, e, 'o'), tintHex(glove)));
    }
    return box;
  }
  const jitter = (r: Run, e: Element, ms: number, m = 1.5) => r.fire(r.anim(e, [{ translate: `${-m}px 0` }, { translate: `${m}px ${m * 0.6}px` }], ms, { duration: 60, iterations: Math.max(2, Math.round(ms / 60)), direction: 'alternate', easing: 'linear', fill: 'none' }));
  const gpTop = () => (bars.classList.contains('on') ? 36 : 10);
  /** Case de réaction : le visage du combattant, en grand, dans le coin de son côté. */
  async function gp(r: Run, F: Fighter, e: string, ms = 750, size = 118) {
    if (!hasFace(F, e)) return;
    const left = F.side === 'a', [c1, c2] = GP_BG[e] ?? GP_BG.defi, rot = left ? -4 : 4;
    const box = put(fxF, h(`<div class="bdx-fx bdx-gp" style="${left ? 'left' : 'right'}:9px;top:${gpTop()}px;width:${size}px;height:${size}px;--c1:${c1};--c2:${c2}"><div class="bdx-gp-rays"></div></div>`));
    const im = box.appendChild(faceEl(F.look, e, size / 2, size * 0.5, size * 1.22, !left));
    sfx('pop');
    await r.anim(box, [{ transform: `scale(.2) rotate(${rot * 4}deg)`, opacity: 0 }, { transform: `scale(1.12) rotate(${rot}deg)`, opacity: 1, offset: 0.7 }, { transform: `scale(1) rotate(${rot}deg)`, opacity: 1 }], 170, { easing: 'linear' });
    if (e !== 'blase') jitter(r, im, ms, e === 'rire' ? 2.5 : 1.5);
    await r.wait(ms);
    await r.anim(box, [{ transform: `scale(1) rotate(${rot}deg)`, opacity: 1 }, { transform: `scale(.5) rotate(${rot}deg)`, opacity: 0 }], 120, { easing: 'linear' });
    box.remove();
  }
  /** Case d'impact : le visage déformé de celui qui encaisse, l'onomatopée et les dégâts. */
  async function hitPanel(r: Run, D: Fighter, A: Fighter, { text, sub = '', big = false, ms = 420, color = SUN }: { text: string; sub?: string; big?: boolean; ms?: number; color?: string }) {
    if (!hasFace(D, 'impact')) { const c = bPt(D, 'head'); burst(r, c.x, 60, text, sub, color, big ? 1.1 : 0.8); return; }
    const left = D.side === 'a', w = big ? Math.min(304, W() - 36) : 152, hh = big ? 188 : 114;
    const x = big ? (W() - w) / 2 : (left ? 9 : W() - w - 9), y = big ? 60 : gpTop(), rot = big ? -3 : (left ? -3 : 3);
    const box = put(fxF, h(`<div class="bdx-fx bdx-gp bdx-hit${big ? ' big' : ''} ${left ? 'l' : 'r'}" style="left:${x}px;top:${y}px;width:${w}px;height:${hh}px;--c1:${CREAM};--c2:${color}"><div class="bdx-gp-rays"></div><div class="bdx-gp-txt"><b></b></div></div>`));
    const txt = box.querySelector('.bdx-gp-txt') as HTMLElement;
    (txt.firstElementChild as HTMLElement).textContent = text;
    if (sub) { const i = document.createElement('i'); i.textContent = sub; txt.appendChild(i); }
    const im = box.insertBefore(faceEl(D.look, 'impact', w * (left ? 0.4 : 0.6), hh * 0.56, hh * (big ? 1.34 : 1.3), !left, colorOf(A.look)), txt);
    await r.anim(box, [{ transform: `scale(1.7) rotate(${rot * 3}deg)`, opacity: 0 }, { transform: `scale(.96) rotate(${rot}deg)`, opacity: 1, offset: 0.6 }, { transform: `scale(1) rotate(${rot}deg)`, opacity: 1 }], 110, { easing: 'linear' });
    jitter(r, im, ms, big ? 3 : 2);
    r.fire(r.anim(txt, [{ scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1 }], 160, { easing: EASE.back }));
    await r.wait(ms);
    await r.anim(box, [{ transform: `scale(1) rotate(${rot}deg)`, opacity: 1 }, { transform: `scale(1.12) rotate(${rot}deg)`, opacity: 0 }], 130, { easing: 'linear' });
    box.remove();
  }
  /** Annonce du super : le visage de rage sur une bande, et le nom du coup spécial (texte du joueur, posé tel quel). */
  async function cutin(r: Run, A: Fighter, move: string | null) {
    const left = A.dir > 0;
    const box = put(fxF, h(`<div class="bdx-fx bdx-cutin ${left ? 'from-l' : 'from-r'}"><div class="bdx-cutin-lines"></div><div class="bdx-cutin-face"></div><div class="bdx-cutin-txt"></div></div>`));
    const face = box.querySelector('.bdx-cutin-face') as HTMLElement, txt = box.querySelector('.bdx-cutin-txt') as HTMLElement;
    if (hasFace(A, 'rage')) face.appendChild(faceEl(A.look, 'rage', 0, 0, 178, !left));
    const words = ((move || 'Le Super Coup').toUpperCase() + ' !').split(/\s+/).filter(Boolean), half = Math.ceil(words.length / 2);
    txt.append(words.slice(0, half).join(' '), document.createElement('br'), words.slice(half).join(' '));
    sfx('cutin');
    const off = `translateX(${left ? -112 : 112}%) skewY(-6deg)`, on = 'translateX(0%) skewY(-6deg)';
    await r.anim(box, [{ transform: off }, { transform: on }], 170, { easing: EASE.snap });
    r.fire(r.anim(face, [{ transform: 'translateX(0px)' }, { transform: `translateX(${left ? 16 : -16}px)` }], 950, { easing: 'linear' }));
    r.fire(r.anim(txt, [{ scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1 }], 200, { easing: EASE.back }));
    await r.wait(950);
    await r.anim(box, [{ transform: on }, { transform: `translateX(${left ? 112 : -112}%) skewY(-6deg)` }], 150, { easing: EASE.in });
    box.remove();
  }

  // ---------- Éclairs de BD : rubans en zigzag, effilés, cernés d'encre, qui s'entrechoquent ----------
  const zig = (a: Pt, b: Pt, amp: number, n: number): Pt[] => {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, pts: Pt[] = [];
    for (let i = 0; i <= n; i++) { const t = i / n, off = i === 0 || i === n ? 0 : (i % 2 ? 1 : -1) * amp * (0.55 + Math.random() * 0.9); pts.push({ x: a.x + dx * (t + (i && i < n ? ((Math.random() - 0.5) * 0.5) / n : 0)) + nx * off, y: a.y + dy * t + ny * off }); }
    return pts;
  };
  const ribbon = (pts: Pt[], w0: number, w1: number) => {
    const Ls: string[] = [], Rs: string[] = [], n = pts.length - 1, f = (v: number) => v.toFixed(1);
    for (let i = 0; i <= n; i++) {
      const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(n, i + 1)], dx = q1.x - q0.x, dy = q1.y - q0.y, len = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * (i / n)) / 2;
      Ls.push(f(p.x - (dy / len) * w) + ',' + f(p.y + (dx / len) * w)); Rs.push(f(p.x + (dy / len) * w) + ',' + f(p.y - (dx / len) * w));
    }
    return Ls.concat(Rs.reverse()).join(' ');
  };
  const spiky = (c: Pt, r0: number, r1: number, n: number) => { let s = ''; for (let i = 0; i < n * 2; i++) { const a = (Math.PI * i) / n + Math.random() * 0.25, rr = i % 2 ? r0 * (0.7 + Math.random() * 0.5) : r1 * (0.75 + Math.random() * 0.5); s += (c.x + Math.cos(a) * rr).toFixed(1) + ',' + (c.y + Math.sin(a) * rr).toFixed(1) + ' '; } return s; };
  /** Deux éclairs partent des yeux (a à gauche, b à droite) et se percutent au milieu ; redessinés à chaque image. */
  async function clash(r: Run, a: Pt, b: Pt, ms: number, colA = SUN, colB = '#8FE9FF') {
    const svg = put(fxF, h('<svg class="bdx-fx bdx-bolts" style="inset:0;width:100%;height:100%;overflow:visible"></svg>'));
    try {
      for (let i = 0; i < Math.round(ms / 70); i++) {
        const k = 0.5 + (Math.random() - 0.5) * 0.16, c = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k + (Math.random() - 0.5) * 10 };
        const A = zig(a, c, 9, 5), B = zig(b, c, 9, 5), big = i % 2 ? 1 : 1.25;
        const fork = (P: Pt[], col: string) => { const s = P[2 + (i % 2)], e = { x: s.x + (Math.random() - 0.5) * 30, y: s.y + (Math.random() < 0.5 ? -1 : 1) * (16 + Math.random() * 16) }; return `<polygon points="${ribbon(zig(s, e, 4, 3), 6, 1)}" style="fill:${col}"/>`; };
        svg.innerHTML = `<g style="stroke:${INK};stroke-width:5;stroke-linejoin:miter;paint-order:stroke">${fork(A, colA)}${fork(B, colB)}<polygon points="${ribbon(A, 15 * big, 6)}" style="fill:${colA}"/><polygon points="${ribbon(B, 15 * big, 6)}" style="fill:${colB}"/><polygon points="${spiky(c, 11 * big, 24 * big, 9)}" style="fill:${SUN}"/></g><polygon points="${ribbon(A, 5.5 * big, 2)}" style="fill:#fff"/><polygon points="${ribbon(B, 5.5 * big, 2)}" style="fill:#fff"/><polygon points="${spiky(c, 5 * big, 12 * big, 9)}" style="fill:#fff"/>`;
        if (i % 3 === 0) sparks(r, c.x, c.y, 2, i % 2 ? colA : colB);
        await r.wait(70);
      }
    } finally { svg.remove(); }
  }
  /** Le face-à-face : les deux visages en gros plan, de part et d'autre d'une case coupée en biais, puis les éclairs et le « VS ». */
  async function duel(r: Run, A: Fighter, B: Fighter) {
    const fA = faceFor(A.look.who, 'defi'), fB = faceFor(B.look.who, 'defi');
    if (!fA || !fB || !fA.eye || !fB.eye) { // pas de gros plan : un simple « VS »
      sfx('crochet'); flash(r, 160); shake(r, 8, 300);
      const v = slam(r, 'VS', 78); await r.wait(820);
      gone(r, v, r.anim(v, [{ opacity: 1 }, { opacity: 0 }], 200)); return;
    }
    const w = W(), T = 84, BH = 152, IM = 204, cy = BH / 2 + 2;
    const box = put(fxF, h(`<div class="bdx-fx bdx-duel" style="top:${T}px;height:${BH}px"><div class="bdx-duel-h l" style="--c1:${ORANGE};--c2:#D22B3A"><div class="bdx-gp-rays"></div></div><div class="bdx-duel-h r" style="--c1:#2BB5FF;--c2:#2A1548"><div class="bdx-gp-rays"></div></div><div class="bdx-duel-cut"></div></div>`));
    const hL = box.children[0] as HTMLElement, hR = box.children[1] as HTMLElement, cut = box.children[2] as HTMLElement;
    const iL = hL.appendChild(faceEl(A.look, 'defi', w * 0.235, cy, IM, false)), iR = hR.appendChild(faceEl(B.look, 'defi', w * 0.765, cy, IM, true));
    const eyeL = { x: w * 0.235 + (fA.eye[0] - fA.c[0]) * IM + 9, y: T + 4 + cy + (fA.eye[1] - fA.c[1]) * IM }, eyeR = { x: w * 0.765 - (fB.eye[0] - fB.c[0]) * IM - 9, y: T + 4 + cy + (fB.eye[1] - fB.c[1]) * IM };
    sfx('whoosh');
    await Promise.all([r.anim(hL, [{ transform: 'translateX(-105%)' }, { transform: 'translateX(0)' }], 190, { easing: EASE.snap }), r.anim(hR, [{ transform: 'translateX(105%)' }, { transform: 'translateX(0)' }], 190, { easing: EASE.snap }), r.anim(cut, [{ opacity: 0 }, { opacity: 1 }], 190)]);
    sfx('thud'); flash(r, 120); shake(r, 6, 240);
    await r.wait(220);
    sfx('zap'); jitter(r, iL, 980, 2); jitter(r, iR, 980, 2);
    await clash(r, eyeL, eyeR, 980);
    sfx('crochet'); crowd('ooh', 0.6); flash(r, 160); shake(r, 9, 320);
    const vs = slam(r, 'VS', 78);
    await r.wait(820);
    gone(r, vs, r.anim(vs, [{ opacity: 1, transform: 'scale(1) rotate(-6deg)' }, { opacity: 0, transform: 'scale(1.7) rotate(-6deg)' }], 200));
    await Promise.all([r.anim(hL, [{ transform: 'translateX(0)' }, { transform: 'translateX(-105%)' }], 170, { easing: EASE.in }), r.anim(hR, [{ transform: 'translateX(0)' }, { transform: 'translateX(105%)' }], 170, { easing: EASE.in }), r.anim(cut, [{ opacity: 1 }, { opacity: 0 }], 120)]);
    box.remove();
  }

  // ---------- Gestes communs ----------
  /** Changement de pose avec un petit rebond : l'œil lit un mouvement là où il n'y a que deux dessins. */
  function pop(r: Run, F: Fighter, pose: string, sx = 1.08, sy = 0.93, ms = 160) { swap(F, pose); setSq(F, sx, sy); return r.squash(F, 1, 1, ms, EASE.back); }
  async function recover(r: Run, F: Fighter, ms = 260) {
    swap(F, 'garde'); F.fig.classList.remove('burnt');
    await Promise.all([r.move(F, 0, 0, ms), r.squash(F, 1, 1, ms, EASE.back), r.spin(F, 0, ms)]);
  }
  async function flinch(r: Run, D: Fighter, power = 1) {
    swap(D, 'touche');
    await Promise.all([r.move(D, -16 * power, 0, 100), r.squash(D, 0.92, 1.06, 100), r.spin(D, 7 * power, 100)]);
    await r.squash(D, 1.04, 0.97, 120); await r.squash(D, 1, 1, 160, EASE.back);
  }
  /** Atterrissage sur le dos : le dessin couché prend le relais, avec poussière et rebonds. */
  async function land(r: Run, D: Fighter, bounce = false) {
    swap(D, 'ko'); upright(D); place(D, KO_X, 0);
    sfx('thud'); shake(r, 7, 240); dust(r, bPt(D, 'feet').x, floorY(), 7, 1.6);
    setSq(D, 1.1, 0.78); await r.squash(D, 0.97, 1.08, 90);
    if (bounce) { await Promise.all([r.path(D, [[KO_X, 20], [KO_X, 0]], 260, 'ease-in-out'), r.squash(D, 1, 1, 130)]); sfx('thud'); dust(r, bPt(D, 'feet').x, floorY(), 4, 1.2); setSq(D, 1.06, 0.88); }
    await r.squash(D, 1, 1, 200, EASE.back);
  }
  /** Tombe à la renverse depuis sa place. */
  async function fall(r: Run, D: Fighter, ms: number, easing: string) {
    swap(D, 'touche');
    await Promise.all([r.spin(D, 64, ms, easing), r.move(D, -4, 0, ms, easing)]);
    await land(r, D);
  }
  async function rise(r: Run, D: Fighter) {
    swap(D, 'garde'); setSq(D, 0.88, 1.14); sfx('pop');
    await Promise.all([r.path(D, [[KO_X / 2, 24], [0, 0]], 300, 'ease-in-out'), r.squash(D, 1, 1, 300, EASE.back)]);
  }
  /** Vol plané : monte en vrille (dessin « vol »), retombe sur le dos. */
  async function fly(r: Run, D: Fighter, top = 152, ms = 640, turns = 450) {
    swap(D, 'vol'); r.fire(r.spin(D, turns, ms, 'linear'));
    await r.path(D, [[0, top * 0.5], [-4, top * 0.85], [-8, top], [-4, top * 0.85], [0, top * 0.4], [KO_X, 6]], ms);
  }
  /** Élan du crochet et du K.O. : poing armé derrière la tête, tout le corps qui hurle. */
  async function windup(r: Run, A: Fighter, ms: number) {
    swap(A, 'elan'); setSq(A, 0.92, 1.1);
    await Promise.all([r.move(A, -18, 0, ms), r.squash(A, 1.1, 1.1, ms, EASE.back), r.spin(A, 6, ms)]);
  }

  // ---------- Séquences ----------
  async function sIntro(r: Run, A: Fighter, B: Fighter) {
    for (const F of [A, B]) { place(F, -290, 0); swap(F, 'jab'); }
    await r.wait(200);
    const enter = async (F: Fighter) => {
      sfx('whoosh'); await r.move(F, 0, 0, 300, EASE.snap);
      dust(r, bPt(F, 'feet', 'garde').x, floorY(), 5); sfx('thud');
      await pop(r, F, 'garde', 1.14, 0.86, 260);
    };
    speedLines(r, 1, 500); crowd('acclame', 0.6); // la salle salue l'entrée des deux camps
    await Promise.all([enter(A), r.wait(170).then(() => enter(B))]);
    letterbox(true);
    await Promise.all([r.spin(A, -7, 240), r.spin(B, -7, 240), r.move(A, 12, 0, 240), r.move(B, 12, 0, 240)]);
    await duel(r, A, B);
    letterbox(false); sfx('combat'); crowd('acclame', 0.85);
    await Promise.all([recover(r, A, 300), recover(r, B, 300)]);
  }

  async function sJab(r: Run, A: Fighter, D: Fighter, dmg: number) {
    const { dist, lift } = bReach(A, D, 'jab');
    await Promise.all([r.move(A, -12, 0, 130), r.spin(A, 5, 130), r.squash(A, 0.96, 1.04, 130)]);
    sfx('whoosh'); ghosts(r, A, dist, 3); speedLines(r, A.dir, 260);
    swap(A, 'jab'); r.fire(r.spin(A, 0, 60));
    await Promise.all([r.move(A, dist, lift, 80, EASE.snap), r.squash(A, 1.1, 0.95, 80)]);
    const c = bPt(D, 'head');
    sfx('jab'); deps.buzz(30); r.fire(flinch(r, D));
    flash(r, 90); sparks(r, c.x, c.y, 6); shake(r, 5, 200); hurt(r, D, dmg, A.side);
    r.fire(hitPanel(r, D, A, { text: 'PAF!', sub: `${dmg} PV`, ms: 430, color: CREAM }));
    await hitstop(r, 200);
    r.fire(r.squash(A, 1, 1, 140));
    await r.wait(220);
    swap(A, 'garde');
    await r.move(A, 0, 0, 260);
    await r.wait(240);
    await recover(r, D);
  }

  async function sCrochet(r: Run, A: Fighter, D: Fighter, dmg: number) {
    sfx('charge'); await windup(r, A, 300);
    tremble(r, A, 760); r.fire(gp(r, A, 'rage', 600)); r.fire(r.wait(140).then(() => gp(r, D, 'panique', 480)));
    await r.wait(900);
    const { dist, lift } = bReach(A, D, 'jab', 2);
    sfx('whoosh'); ghosts(r, A, dist, 5); speedLines(r, A.dir, 340, true);
    swap(A, 'jab'); r.fire(r.spin(A, -10, 70));
    await Promise.all([r.move(A, dist, lift, 100, EASE.snap), r.squash(A, 1.24, 0.96, 100)]);
    const c = bPt(D, 'head');
    sfx('crochet'); crowd('ooh'); deps.buzz(60); swap(D, 'touche'); r.fire(r.squash(D, 0.88, 1.08, 60));
    negative(r, 90); focus(r, c.x, c.y, 460); sparks(r, c.x, c.y, 10); shake(r, 12, 440); hurt(r, D, dmg, A.side);
    r.fire(hitPanel(r, D, A, { text: 'BOUM!', sub: `${dmg} PV`, big: true, ms: 520, color: SUN }));
    await hitstop(r, 640);
    flash(r, 150);
    r.fire(r.squash(A, 1, 1, 180)); r.fire(r.squash(D, 1, 1, 120));
    r.fire(r.wait(320).then(() => { swap(A, 'garde'); return Promise.all([r.move(A, 0, 0, 320), r.spin(A, 0, 200)]); }));
    await fly(r, D);
    await land(r, D);
    crowd('applaud', 0.8);
    const o = orbit(bPt(D, 'top'));
    r.fire(gp(r, D, 'sonne', 850)); r.fire(r.wait(180).then(() => gp(r, A, 'rire', 700)));
    await r.wait(1100); o.remove();
    await rise(r, D);
    await Promise.all([recover(r, D), recover(r, A)]);
  }

  async function sBloque(r: Run, A: Fighter, D: Fighter, dmg: number) {
    sfx('charge'); await windup(r, A, 300);
    tremble(r, A, 520); r.fire(gp(r, A, 'rage', 400));
    await r.wait(640);
    sfx('pschitt'); crowd('decu', 0.9);
    const g = bPt(A, 'hand');
    dust(r, g.x, g.y, 4, 0.6); ono(r, { x: clampX(g.x, 60), y: Math.max(150, g.y + 40) }, 'pschitt…', { color: LILAS, size: 20, ms: 1000, rot: 4 });
    swap(A, 'dodo');
    r.fire(gp(r, A, 'blase', 900)); r.fire(r.wait(200).then(() => gp(r, D, 'rire', 700)));
    await Promise.all([r.move(A, 0, 0, 380), r.squash(A, 1.07, 0.9, 300, 'ease-in'), r.spin(A, 0, 300)]);
    await r.squash(A, 1, 1, 220, EASE.back);
    await r.wait(620);
    await pop(r, A, 'garde');
    await sJab(r, A, D, dmg);
  }

  /** Charge du super : aura, cri, panique en face, puis l'annonce du coup spécial. */
  async function superCharge(r: Run, A: Fighter, D: Fighter, move: string | null) {
    const dark = darken(r, 0.62), au = aura(r, A); sfx('charge');
    swap(A, 'elan'); tremble(r, A, 1000, 2.5); rocks(r, A, 1000);
    r.fire(r.squash(A, 1.14, 1.14, 340, EASE.back));
    const g = bPt(A, 'top'); ono(r, { x: clampX(g.x, 96), y: 150 }, 'GRRAAAH !', { color: MINT, size: 26, ms: 950 });
    await r.wait(300); r.fire(gp(r, D, 'panique', 560)); await r.wait(640);
    await cutin(r, A, move);
    return { dark, au };
  }
  async function sSuper(r: Run, A: Fighter, D: Fighter, dmg: number, move: string | null) {
    const { dark, au } = await superCharge(r, A, D, move);
    // rafale : l'attaquant disparaît, les coups pleuvent
    swap(D, 'touche'); A.el.style.opacity = '0'; swap(A, 'jab'); setSq(A, 1, 1); sfx('whoosh');
    for (let i = 0; i < 6; i++) {
      const hd = bPt(D, 'head'), c = { x: hd.x + (Math.random() - 0.5) * 50, y: hd.y + Math.random() * 110 };
      const gh = A.el.cloneNode(true) as HTMLElement; gh.classList.add('bdx-ghost'); gh.style.opacity = '0.8';
      (gh.querySelector('.bdx-mv') as HTMLElement).style.transform = `translate(${(gap(A, D) - 120 + (i % 3) * 22) * A.dir}px,${-(i % 2) * 34}px)`;
      put(fxB, gh); gone(r, gh, r.anim(gh, [{ opacity: 0.8 }, { opacity: 0 }], 160, { easing: 'linear' }));
      sfx('jab'); burst(r, c.x, c.y, i % 2 ? 'PAF!' : 'TCHAK!', '', i % 2 ? CREAM : SUN, 0.62); sparks(r, c.x, c.y, 3); shake(r, 4, 90);
      r.fire(r.spin(D, i % 2 ? -5 : 12, 50)); r.fire(r.move(D, -6 - i * 2, 0, 50));
      await r.wait(95);
    }
    // coup final : un poing d'énergie géant
    A.el.style.opacity = '';
    const b = await fist(r, A, bPt(A, 'hand'), bPt(D, 'head'));
    sfx('superImpact'); crowd('acclame'); deps.buzz([40, 60, 90]); negative(r, 100); explosion(r, b.x, b.y); focus(r, b.x, b.y, 520); shake(r, 16, 520);
    hurt(r, D, dmg, A.side);
    r.fire(r.wait(120).then(() => hitPanel(r, D, A, { text: 'SUPER!', sub: `${dmg} PV`, big: true, ms: 520, color: MINT })));
    await hitstop(r, 760);
    flash(r, 200); dark.off(); au.off();
    // l'adversaire décolle, retombe la tête la première, ressort calciné
    swap(D, 'vol'); r.fire(r.spin(D, 720, 340, 'linear'));
    await r.path(D, [[-14, 170], [-22, 460]], 340, EASE.in);
    swap(A, 'garde'); r.fire(gp(r, A, 'rire', 800));
    await r.wait(520);
    sfx('fall'); swap(D, 'touche'); D.ang = 180; D.rot.style.transform = 'rotate(180deg)'; D.fig.classList.add('burnt');
    await r.path(D, [[-22, 14]], 320, EASE.in);
    sfx('thud'); crowd('ooh', 0.8); shake(r, 10, 300); dust(r, bPt(D, 'head').x, floorY(), 8, 1.8);
    await r.anim(D.rot, [{ transform: 'rotate(180deg)' }, { transform: 'rotate(172deg)' }, { transform: 'rotate(188deg)' }, { transform: 'rotate(176deg)' }, { transform: 'rotate(180deg)' }], 620, { easing: 'linear' });
    sfx('pop'); crowd('applaud', 0.7);
    r.fire(r.spin(D, 360, 380, EASE.out));
    await r.path(D, [[-16, 70], [-6, 0]], 380, EASE.out);
    upright(D); swap(D, 'dodo');
    const sm = bPt(D, 'top'); dust(r, sm.x, sm.y + 14, 3, 0.5);
    r.fire(gp(r, D, 'sonne', 800));
    setSq(D, 1.1, 0.9); await r.squash(D, 1, 1, 220, EASE.back);
    await r.wait(820);
    await Promise.all([recover(r, D), recover(r, A)]);
  }

  /** Pas de pesée (ou pesée après la cloche) : il dort debout, son adversaire n'en revient pas. */
  async function sAbsent(r: Run, A: Fighter, D: Fighter, late: boolean) {
    r.fire(pop(r, A, 'dodo', 1.04, 0.95, 400));
    r.fire(r.wait(500).then(() => zzz(r, A, 6)));
    r.fire(r.anim(D.idle, [{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)' }, { transform: 'translateY(0)' }], 900, { duration: 300, iterations: 3, easing: 'ease-in-out', fill: 'none' }));
    await r.wait(900);
    sfx('wind'); crowd('decu'); tumbleweed(r, A.dir); // la salle soupire devant celui qui ne s'est pas pesé
    await r.wait(800);
    await gp(r, D, 'blase', 1100);
    sfx('boing'); await fall(r, D, 280, EASE.in);
    const c = bPt(A, 'top'); burst(r, c.x, 60, late ? 'TROP TARD' : 'ABSENT', late ? 'pesée après la cloche' : 'pas de pesée', LILAS, 0.85);
    hurt(r, D, 0, A.side);
    await r.wait(1100);
    await rise(r, D);
    await Promise.all([recover(r, D, 340), recover(r, A, 340)]);
  }

  /** Le Bide gonfle, charge ventre en avant, et aplatit son adversaire. `ko` : l'adversaire ne se relève pas. */
  async function sBide(r: Run, A: Fighter, D: Fighter, dmg: number, ko = false) {
    sfx('inflate');
    r.fire(r.wait(250).then(() => gp(r, D, 'panique', 620)));
    await Promise.all([r.move(A, -12, 0, 700), r.squash(A, 1.2, 1.12, 700, 'ease-in')]);
    tremble(r, A, 320, 3); await r.wait(320);
    const { dist } = bReach(A, D, 'bide', 10, 0);
    sfx('whoosh'); ghosts(r, A, dist, 4); speedLines(r, A.dir, 300, true);
    swap(A, 'bide');
    await Promise.all([r.move(A, dist, 10, 110, EASE.snap), r.squash(A, 1.26, 1.04, 110)]);
    const hd = bPt(D, 'head'), c = { x: hd.x, y: hd.y + 56 };
    sfx('boing'); sfx('crochet'); crowd('ooh'); deps.buzz(60); swap(D, 'touche');
    flash(r, 110); burst(r, c.x - A.dir * 30, 64, ko ? 'K.O.' : 'BIDE!', ko ? '' : `${dmg} PV`, '#B98BFF', 0.95); sparks(r, c.x, c.y, 8); shake(r, 10, 360); hurt(r, D, dmg, A.side);
    r.fire(Promise.all([r.squash(D, 0.16, 1.1, 90), r.move(D, -24, 0, 90)]));
    await hitstop(r, 170);
    r.fire((async () => { await r.squash(A, 0.94, 1.05, 110); await r.squash(A, 1.06, 0.97, 120); await r.squash(A, 1, 1, 220, EASE.back); })());
    r.fire(r.wait(140).then(() => swap(A, 'victoire'))); r.fire(r.move(A, 0, 0, 420));
    r.fire(r.wait(300).then(() => gp(r, A, 'rire', 1000)));
    r.fire(r.anim(D.rot, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(14deg)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(0deg)' }], 1000, { easing: 'ease-in-out' }));
    await r.path(D, [[-30, 46], [-20, 58], [-34, 44], [-22, 26], [-30, 10], [-26, 0]], 1000, 'ease-in-out');
    sfx('pop');
    if (ko) {
      setSq(D, 1, 1); await land(r, D, true);
      crowd('ovation');
      orbit(bPt(D, 'top')); partnerPose(D, 'ko'); partnerPose(A, 'victoire');
      r.fire(gp(r, D, 'sonne', 1400));
      await r.wait(1500);
      return;
    }
    swap(D, 'garde'); crowd('applaud', 0.6); r.fire(r.wait(120).then(() => gp(r, D, 'sonne', 700)));
    await r.squash(D, 1.18, 0.88, 90); await r.squash(D, 1, 1, 200, EASE.back);
    await r.wait(820);
    await Promise.all([recover(r, D), recover(r, A)]);
  }

  /** Coup final : élan, uppercut, case d'impact, vol plané ; le vaincu voit des étoiles, le vainqueur prend la pose. */
  async function sKO(r: Run, A: Fighter, D: Fighter, dmg: number, cut: string | null | false) {
    letterbox(true); sfx('charge');
    await windup(r, A, 280);
    tremble(r, A, 700); r.fire(gp(r, A, 'rage', 620)); r.fire(r.wait(140).then(() => gp(r, D, 'panique', 500)));
    await r.wait(860);
    if (cut !== false) await cutin(r, A, cut);
    // ralenti : l'attaquant fonce, poing armé
    const near = gap(A, D) - 50, slow = 'cubic-bezier(.1,.7,.3,1)';
    sfx('slow'); speedLines(r, A.dir, 800, true); ghosts(r, A, near * 0.6, 4);
    r.fire(r.spin(A, -12, 300));
    await r.move(A, near * 0.7, 0, 620, slow);
    // l'uppercut part du sol
    sfx('whoosh'); swap(A, 'uppercut'); upright(A); setSq(A, 1.14, 0.8);
    await Promise.all([r.move(A, near, 30, 80, EASE.snap), r.squash(A, 0.92, 1.16, 80)]);
    const c = bPt(D, 'head');
    sfx('ko'); crowd('acclame'); r.fire(r.wait(350).then(() => crowd('ooh', 0.9))); // la clameur, puis le « oooh » pendant qu'il s'envole
    deps.buzz([80, 60, 160]); swap(D, 'touche'); r.fire(r.squash(D, 0.88, 1.08, 60));
    flash(r, 140); sparks(r, c.x, c.y, 12, CREAM); shake(r, 14, 500);
    hurt(r, D, dmg, A.side);
    r.fire(hitPanel(r, D, A, { text: 'K.O.', big: true, ms: 760, color: SUN }));
    await hitstop(r, 880);
    flash(r, 180); tooth(r, c.x, c.y, -A.dir);
    r.fire(r.squash(D, 1, 1, 140));
    r.fire((async () => { await Promise.all([r.path(A, [[near, 44], [near, 0]], 360, 'ease-in-out'), r.squash(A, 1, 1, 200)]); await r.move(A, 0, 0, 340); })());
    await fly(r, D, 176, 760, 540);
    await land(r, D, true);
    crowd('ovation'); // il est au tapis : la salle se lève
    orbit(bPt(D, 'top')); partnerPose(D, 'ko'); partnerPose(A, 'victoire');
    // pose de victoire : bras levés, petits sauts, et le vaincu qui voit des étoiles
    letterbox(false);
    swap(A, 'victoire'); r.fire(Promise.all([r.move(A, 0, 0, 300), r.spin(A, 0, 200), r.squash(A, 1, 1, 200)]));
    r.fire(gp(r, D, 'sonne', 1500)); r.fire(r.wait(250).then(() => gp(r, A, 'rire', 1250)));
    await r.wait(320);
    const m = meta(A, 'victoire'), hand = m.hand ?? m.head;
    for (let i = 0; i < 3; i++) {
      await r.squash(A, 1.08, 0.9, 90); sfx('ting');
      for (const q of [hand, [m.w - hand[0], hand[1]]] as [number, number][]) { const sp = bPt(A, q); sparks(r, sp.x, sp.y, 3, CREAM); }
      await Promise.all([r.path(A, [[0, 28], [0, 0]], 300, 'ease-in-out'), r.squash(A, 0.96, 1.06, 150).then(() => r.squash(A, 1, 1, 150))]);
    }
  }

  /** Double K.O. : les deux arment, se percutent au centre, et s'envolent chacun de leur côté. */
  async function sDoubleKO(r: Run, A: Fighter, B: Fighter) {
    letterbox(true); sfx('charge');
    await Promise.all([windup(r, A, 280), windup(r, B, 280)]);
    tremble(r, A, 700); tremble(r, B, 700); r.fire(gp(r, A, 'rage', 620)); r.fire(gp(r, B, 'rage', 620));
    await r.wait(860);
    const near = gap(A, B) / 2 - 34;
    sfx('whoosh'); speedLines(r, 1, 300, true); ghosts(r, A, near, 4); ghosts(r, B, near, 4);
    for (const F of [A, B]) { swap(F, 'uppercut'); upright(F); setSq(F, 1.14, 0.8); }
    await Promise.all([r.move(A, near, 26, 90, EASE.snap), r.move(B, near, 26, 90, EASE.snap), r.squash(A, 0.92, 1.16, 90), r.squash(B, 0.92, 1.16, 90)]);
    const c = { x: W() / 2, y: Math.min(bPt(A, 'head').y, bPt(B, 'head').y) };
    sfx('ko'); crowd('ooh'); deps.buzz([80, 60, 160]); negative(r, 110); focus(r, c.x, c.y, 620); sparks(r, c.x, c.y, 16, CREAM); shake(r, 16, 520);
    CB.onImpact('a'); CB.onImpact('b');
    const txt = slam(r, 'DOUBLE K.O.', 44);
    await hitstop(r, 700);
    flash(r, 180);
    for (const F of [A, B]) r.fire(r.squash(F, 1, 1, 140));
    await Promise.all([fly(r, A, 150, 700, 540), fly(r, B, 150, 700, 540)]);
    await Promise.all([land(r, A, true), land(r, B, true)]);
    crowd('acclame', 0.8); crowd('applaud', 0.7);
    orbit(bPt(A, 'top')); orbit(bPt(B, 'top')); partnerPose(A, 'ko'); partnerPose(B, 'ko');
    letterbox(false);
    r.fire(gp(r, A, 'sonne', 1400)); r.fire(gp(r, B, 'sonne', 1400));
    await r.wait(900);
    gone(r, txt, r.anim(txt, [{ opacity: 1 }, { opacity: 0 }], 300));
    await r.wait(600);
  }

  async function runBeat(r: Run, beat: Beat) {
    const A = L as Fighter, B = R as Fighter;
    if (beat.kind === 'intro') return sIntro(r, A, B);
    if (beat.kind === 'doubleKo') return sDoubleKO(r, A, B);
    const att = beat.by === 'a' ? A : B, def = beat.by === 'a' ? B : A;
    if (beat.kind === 'ko') {
      if (beat.blow === 'bide') return sBide(r, att, def, beat.dmg, true);
      return sKO(r, att, def, beat.dmg, beat.blow === 'super' ? beat.move : false);
    }
    switch (beat.blow) {
      case 'bide': return sBide(r, att, def, beat.dmg);
      case 'absent': return sAbsent(r, att, def, beat.late);
      case 'super': return sSuper(r, att, def, beat.dmg, beat.move);
      case 'crochet': return sCrochet(r, att, def, beat.dmg);
      case 'bloque': return sBloque(r, att, def, beat.dmg);
      default: return sJab(r, att, def, beat.dmg);
    }
  }

  /** État final, sans animation : qui est au tapis, qui a gagné. */
  function setRest(end: { koA: boolean; koB: boolean }) {
    for (const [F, ko, win] of [[L, end.koA, end.koB && !end.koA], [R, end.koB, end.koA && !end.koB]] as [Fighter | null, boolean, boolean][]) {
      if (!F) continue;
      clearFighter(F);
      if (ko) { swap(F, 'ko'); place(F, KO_X, 0); partnerPose(F, 'ko'); } else if (win) { swap(F, 'victoire'); partnerPose(F, 'victoire'); }
    }
  }

  return {
    async load(a, b) {
      stopAll();
      actors.replaceChildren(); images = [];
      L = mount('a', a); R = mount('b', b);
      // Tout ce qui servira est chargé d'avance, calques de couleur et gros plans compris : rien n'apparaît en retard.
      for (const s of [a, b]) {
        for (const url of assetsOf(s.lead)) image(url, images);
        if (s.partner) for (const url of assetsOf(s.partner, PARTNER_POSES)) image(url, images);
      }
      const ready = Promise.all(images.map((im) => (im.complete && im.naturalWidth > 0 ? Promise.resolve() : new Promise<void>((res, rej) => { im.addEventListener('load', () => res(), { once: true }); im.addEventListener('error', () => rej(new Error(`dessin introuvable : ${im.src}`)), { once: true }); }))));
      const late = new Promise<void>((_, rej) => setTimeout(() => rej(new Error('dessins trop longs à charger')), 8000));
      await Promise.race([ready, late]);
      if (dead) throw new Error('scène démontée');
    },
    async play(beats, cb) {
      if (!L || !R) throw new Error('scène non chargée');
      stopAll();
      CB = cb;
      setRest({ koA: false, koB: false });
      const r = new Run();
      deps.bed?.(true);
      try {
        for (let i = 0; i < beats.length; i++) {
          cb.onBeat(i, beats[i]);
          await runBeat(r, beats[i]);
          if (i < beats.length - 1) await r.wait(300);
        }
        // La salle se calme un peu après la fin, sauf si un autre combat a été lancé entre-temps.
        setTimeout(() => { if (r.alive) deps.bed?.(false); }, 2800);
        return 'done';
      } catch (e) {
        if (e === ABORT) return 'aborted';
        throw e;
      }
    },
    rest(end) { stopAll(); deps.bed?.(false); setRest(end); },
    destroy() { dead = true; stopAll(); deps.bed?.(false); root.replaceChildren(); L = R = null; }
  };
}
