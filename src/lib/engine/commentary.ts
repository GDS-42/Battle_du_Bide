// Le commentateur du combat du soir. Deux tons : bon enfant ou trash talk.
// Règle d'or : on chambre le joueur, jamais le corps.
import type { PairingDay, SideAttack } from './types';
import { BOSS_ID } from './rules';

export type Tone = 'bon' | 'trash';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
const pick = (arr: string[], seed: string) => arr[hash(seed) % arr.length];
const pv = (n: number) => `${Math.round(n)} PV`;
const pct = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const T = {
  absent: {
    bon: ['{X} a séché la pesée… pas de coup ce soir.', "{X} n'est pas monté sur la balance : garde baissée !", 'Pas de pesée pour {X}, pas de coup. Dommage !'],
    trash: ['{X} a séché la pesée. On dirait que la balance fait peur.', 'Où est passé {X} ? Toujours caché sous la couette ?', "{X} a oublié la pesée. Le ring, c'est pas une option, hein !"]
  },
  jab: {
    bon: ['{X} envoie un jab… {N} ! Le crochet reste bloqué.', 'Petit jab de {X} : {N}. La tendance tient, crochet bloqué.', '{X} touche au jab, {N}. Ça compte !'],
    trash: ['{X} tapote : {N}. On a connu plus méchant.', 'Un jab de {X}, {N}. Ça chatouille à peine.', '{X} pique au jab, {N}. Le crochet est resté au vestiaire.']
  },
  crochet: {
    bon: ['{X} place un crochet ! Tendance −{P} %… {N} !', 'Crochet de {X}, −{P} % : {N} qui font mal !', 'Quel crochet de {X} ! −{P} %, {N} !'],
    trash: ['BAM ! Crochet de {X}, −{P} % : {N} en pleine poire !', '{X} cogne fort : −{P} %, {N}. Quelqu\'un a noté la plaque ?', 'Crochet de {X} à −{P} % : {N}. Ça, ça pique !']
  },
  super: {
    bon: ['{X} déclenche son SUPER « {S} » ! +15 PV !'],
    trash: ['SUPER ! « {S} » ! {X} ne fait pas dans la dentelle : +15 PV !']
  },
  boss: {
    bon: ['Le Bide frappe comme une horloge : 10 PV.'],
    trash: ['Le Bide ne rate jamais un soir : 10 PV, et il en redemande.']
  },
  team: {
    bon: ['Attaque combinée de {X} : +2 PV !'],
    trash: ['{X} attaque en meute : +2 PV !']
  },
  ko: {
    bon: ['K.O. ! {W} envoie {L} au tapis !', 'K.O. ! {L} est au tapis, {W} prend le round !'],
    trash: ['K.O. ! {L} est au tapis. Quelqu\'un a une éponge ?', "K.O. ! {W} vient d'éteindre {L} !"]
  },
  koBoth: {
    bon: ['Double K.O. ! Les deux combattants sont au tapis !'],
    trash: ['Double K.O. ! Tout le monde au tapis, quel carnage !']
  },
  lead: {
    bon: ['{L} mène, {A} contre {B}.', 'Au tableau : {L} devant, {A} contre {B}.'],
    trash: ['{L} mène, {A} contre {B}. Ça sent la remontada… ou pas.', '{L} devant, {A} contre {B}. Le suspense est insoutenable.']
  },
  tie: {
    bon: ['Égalité parfaite : {A} partout.'],
    trash: ['Égalité : {A} partout. Personne ne veut lâcher !']
  }
};

function line(kind: keyof typeof T, tone: Tone, seed: string, vars: Record<string, string>): string {
  let s = pick(T[kind][tone], seed);
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}

function sideLines(side: string, att: SideAttack, name: string, tone: Tone, seed: string, superName?: string): string[] {
  if (side === BOSS_ID) return [line('boss', tone, seed, {})];
  const out: string[] = [];
  const weighedAny = Object.values(att.members).some((m) => m.weighed);
  if (!weighedAny) return [line('absent', tone, seed + 'abs', { X: name })];
  if (att.crochet > 0) {
    const p = Math.max(...Object.values(att.members).map((m) => m.crochetPct));
    out.push(line('crochet', tone, seed + 'cr', { X: name, P: pct(p), N: pv(att.jab + att.crochet) }));
  } else {
    out.push(line('jab', tone, seed + 'jab', { X: name, N: pv(att.jab) }));
  }
  if (att.super > 0) out.push(line('super', tone, seed + 'sup', { X: name, S: superName || 'Le Super Coup' }));
  if (att.teamBonus > 0) out.push(line('team', tone, seed + 'team', { X: name }));
  return out;
}

export function commentary(
  p: PairingDay,
  names: Record<string, string>,
  tone: Tone,
  seed: string,
  superNames: Record<string, string | undefined> = {}
): string[] {
  if (p.idle) return [];
  const na = names[p.a] ?? '?', nb = names[p.b] ?? '?';
  const out = [
    ...sideLines(p.a, p.attacks.a, na, tone, seed + 'a', superNames[p.a]),
    ...sideLines(p.b, p.attacks.b, nb, tone, seed + 'b', superNames[p.b])
  ];
  const A = Math.max(0, Math.round(p.hpAfter.a)), B = Math.max(0, Math.round(p.hpAfter.b));
  if (p.ko === 'both') out.push(line('koBoth', tone, seed + 'ko', {}));
  else if (p.ko) {
    const loser = p.ko === 'a' ? na : nb, winner = p.ko === 'a' ? nb : na;
    out.push(line('ko', tone, seed + 'ko', { W: winner, L: loser }));
  } else if (A === B) out.push(line('tie', tone, seed + 'st', { A: pv(A) }));
  else out.push(line('lead', tone, seed + 'st', { L: A > B ? na : nb, A: pv(Math.max(A, B)), B: pv(Math.min(A, B)) }));
  return out;
}
