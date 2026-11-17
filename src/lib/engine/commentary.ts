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
const pick = (arr: readonly string[], seed: string) => arr[hash(seed) % arr.length];
const pv = (n: number) => `${Math.round(n)} PV`;
const pct = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Crochet à partir duquel le commentateur s'emballe (en PV). */
const BIG_HIT = 12;
/** Écart de PV sous lequel le duel est « serré ». */
const CLOSE_GAP = 3;
/** Séries (jours de pesée d'affilée) que le commentateur salue. */
const MILESTONES = [7, 14, 21, 30, 50, 100];

// Variables : {X} le camp qui agit, {N} ses PV, {P} la baisse en %, {S} le nom du super, {C} la série,
// {W}/{L} vainqueur et perdant, {A}/{B} les deux scores.
const T = {
  absent: {
    bon: ['{X} a séché la pesée… pas de coup ce soir.', "{X} n'est pas monté sur la balance : garde baissée !", 'Pas de pesée pour {X}, pas de coup. Dommage !', '{X} est resté dans les vestiaires ce soir.'],
    trash: ['{X} a séché la pesée. On dirait que la balance fait peur.', 'Où est passé {X} ? Toujours caché sous la couette ?', "{X} a oublié la pesée. Le ring, c'est pas une option, hein !", '{X} boude la balance. Elle ne mord pas, pourtant.']
  },
  garde: {
    bon: ['Pas de pesée pour {X}, mais sa garde encaisse : la série est sauvée.', '{X} lève sa garde : pas de coup ce soir, mais la série tient bon.'],
    trash: ['{X} sèche la pesée et se planque derrière sa garde. La série survit, de justesse.', '{X} grille une garde pour sauver sa série. Il n’en reste plus des masses.']
  },
  late: {
    bon: ['{X} s’est pesé après la cloche : pas de coup ce soir, mais la série tient.', 'Pesée tardive pour {X} : le coup attendra demain, la série continue.'],
    trash: ['{X} arrive après la cloche. Le coup reste au vestiaire, la série survit.', '{X} se pèse en retard : pas de coup ce soir. Demain, on met un réveil ?']
  },
  jab: {
    bon: ['{X} envoie un jab… {N} ! Le crochet reste bloqué.', 'Petit jab de {X} : {N}. La tendance tient, crochet bloqué.', '{X} touche au jab, {N}. Ça compte !', '{X} fait le métier : un jab propre, {N}.', 'Jab de {X}, {N}. La régularité, ça paie.'],
    trash: ['{X} tapote : {N}. On a connu plus méchant.', 'Un jab de {X}, {N}. Ça chatouille à peine.', '{X} pique au jab, {N}. Le crochet est resté au vestiaire.', '{X} sert le minimum syndical : {N}.', 'Jab timide de {X} : {N}. Le public s’impatiente.']
  },
  crochet: {
    bon: ['{X} place un crochet ! Tendance −{P} %… {N} !', 'Crochet de {X}, −{P} % : {N} qui font mal !', 'Quel crochet de {X} ! −{P} %, {N} !', '{X} trouve l’ouverture : crochet à −{P} %, {N}.', 'Ça descend pour {X} : −{P} %, et {N} dans les gants adverses.'],
    trash: ['BAM ! Crochet de {X}, −{P} % : {N} en pleine poire !', '{X} cogne fort : −{P} %, {N}. Quelqu\'un a noté la plaque ?', 'Crochet de {X} à −{P} % : {N}. Ça, ça pique !', '{X} sort le crochet : −{P} %, {N}. Sans sommation.', '{X} ne fait pas semblant : −{P} %, {N} dans les dents.']
  },
  bigCrochet: {
    bon: ['ÉNORME crochet de {X} ! −{P} %… {N} d’un coup !', '{X} sort le grand jeu : −{P} %, {N} ! Le ring en tremble.', 'Quelle soirée pour {X} : −{P} % et {N} ! On applaudit.'],
    trash: ['{X} envoie un parpaing : −{P} %, {N} ! Appelez un arbitre !', 'Carnage signé {X} : −{P} %, {N}. Ça va laisser des traces.', '{X} démonte tout : −{P} %, {N}. Quelqu’un a une serpillière ?']
  },
  super: {
    bon: ['{X} déclenche son SUPER « {S} » ! +15 PV !', 'Et voilà le SUPER de {X} : « {S} » ! +15 PV !', '« {S} » ! {X} lâche son super : +15 PV !'],
    trash: ['SUPER ! « {S} » ! {X} ne fait pas dans la dentelle : +15 PV !', '{X} sort « {S} » de sa manche : +15 PV, sans prévenir !', '« {S} » ! Le super de {X} part tout seul : +15 PV dans la musette !']
  },
  streak: {
    bon: ['{C} jours de pesée d’affilée pour {X} : chapeau !', '{X} enchaîne {C} jours sans rater une pesée. Une vraie horloge.', 'Série de {C} jours pour {X} : la régularité, c’est une arme.'],
    trash: ['{C} jours d’affilée pour {X}. La balance va finir par porter plainte.', '{X} n’a pas raté une pesée depuis {C} jours. Un peu inquiétant, non ?', 'Série de {C} jours : {X} dort sur sa balance ou quoi ?']
  },
  boss: {
    bon: ['Le Bide frappe comme la moyenne du ring : {N}.', 'Le Bide ne rate jamais un soir : {N}.', 'Fidèle au poste, Le Bide envoie {N}.'],
    trash: ['Le Bide cogne comme tes rivaux : {N}, et il en redemande.', 'Le Bide ne prend jamais de jour de repos : {N}.', 'Le Bide pointe à l’heure, comme tous les soirs : {N}.']
  },
  team: {
    bon: ['Attaque combinée de {X} : +2 PV !', 'Tout le monde s’est pesé chez {X} : +2 PV de bonus d’équipe !'],
    trash: ['{X} attaque en meute : +2 PV !', '{X} au complet sur la balance : +2 PV, et ça ricane.']
  },
  ko: {
    bon: ['K.O. ! {W} envoie {L} au tapis !', 'K.O. ! {L} est au tapis, {W} prend le round !', 'C’est fini ! K.O. de {W} sur {L} !'],
    trash: ['K.O. ! {L} est au tapis. Quelqu\'un a une éponge ?', "K.O. ! {W} vient d'éteindre {L} !", 'K.O. ! {L} compte les étoiles, {W} compte les points.']
  },
  koBoth: {
    bon: ['Double K.O. ! Les deux combattants sont au tapis !'],
    trash: ['Double K.O. ! Tout le monde au tapis, quel carnage !']
  },
  comeback: {
    bon: ['Renversement ! {L} repasse devant, {A} contre {B} !', 'Quelle remontée de {L} : {A} contre {B} !'],
    trash: ['Remontada ! {L} repasse devant, {A} contre {B}. Ça sent le roussi en face !', '{L} retourne la table : {A} contre {B} !']
  },
  close: {
    bon: ['Duel serré : {L} devant d’un souffle, {A} contre {B}.', 'Ça se joue à rien : {A} contre {B}, avantage {L}.'],
    trash: ['{L} devant d’un cheveu, {A} contre {B}. Personne ne respire.', '{A} contre {B} : {L} mène, mais ça tient à un jab.']
  },
  lead: {
    bon: ['{L} mène, {A} contre {B}.', 'Au tableau : {L} devant, {A} contre {B}.', '{L} garde la main : {A} contre {B}.', 'Avantage {L}, {A} contre {B}.'],
    trash: ['{L} mène, {A} contre {B}. Ça sent la remontada… ou pas.', '{L} devant, {A} contre {B}. Le suspense est insoutenable.', '{L} prend le large : {A} contre {B}.', '{A} contre {B} pour {L}. En face, on cherche la sortie.']
  },
  tie: {
    bon: ['Égalité parfaite : {A} partout.', '{A} partout : impossible de les départager ce soir.'],
    trash: ['Égalité : {A} partout. Personne ne veut lâcher !', '{A} partout. On dirait qu’ils se sont mis d’accord.']
  },
  quiet: {
    bon: ['Soirée calme sur le ring : personne n’a frappé.', 'Aucun coup ce soir. Les balances prennent la poussière.'],
    trash: ['Personne sur la balance ce soir. Vous jouez à quoi, au juste ?', 'Zéro coup. Même l’arbitre s’est endormi.']
  },
  roundWin: {
    bon: ['Fin du round ! {W} l’emporte, {A} contre {B}.', 'La cloche sonne : round pour {W}, {A} contre {B} !'],
    trash: ['Fin du round : {W} repart avec, {A} contre {B}. {L} repart avec ses regrets.', 'Cloche ! {W} empoche le round, {A} contre {B}.']
  },
  roundTie: {
    bon: ['Fin du round sur une égalité, {A} partout : le nombre de pesées départagera.', 'La cloche sonne à {A} partout. Ce sont les pesées qui trancheront.'],
    trash: ['Fin du round, {A} partout. On sort le compteur de pesées pour les départager.', 'Égalité à la cloche : {A} partout. Le plus assidu l’emporte.']
  },
  // K.O. « on se relève » (combats à partir de RULES.KO_REVIVE_FROM). Ces familles s'ajoutent : aucune phrase existante
  // n'est modifiée, pour que les replays déjà vus gardent leur texte.
  fresh: {
    bon: ['Nouvelle manche ! Tout le monde repart à 100 PV.', 'La cloche relance le duel : 100 PV de chaque côté.', 'On se relève et on y retourne : 100 PV partout.'],
    trash: ['Nouvelle manche ! 100 PV partout. Hier, c’est hier.', 'Tout le monde debout : 100 PV partout, et on y retourne.', 'Les compteurs reviennent à 100 PV. Certains en avaient plus besoin que d’autres.']
  },
  koPoint: {
    bon: ['K.O. ! {W} envoie {L} au tapis et marque le point.', 'K.O. ! {L} est au tapis : un point pour {W}.', 'C’est le K.O. ! {W} couche {L} et prend le point.'],
    trash: ['K.O. ! {L} est au tapis, {W} marque le point. Quelqu\'un a une éponge ?', "K.O. ! {W} vient d'éteindre {L} : un point de plus.", 'K.O. ! {L} compte les étoiles, {W} compte un point.']
  },
  resume: {
    bon: ['Reprise demain soir, 100 PV partout.', 'On remet ça demain soir : 100 PV de chaque côté.'],
    trash: ['Demain soir, tout le monde se relève à 100 PV.', 'Rendez-vous demain soir, 100 PV partout. Pas de repos pour les braves.']
  },
  tally: {
    bon: ['Aux K.O., {X} mène {A} à {B}.', 'Compteur des K.O. : {X} devant, {A} à {B}.'],
    trash: ['Aux K.O., {X} mène {A} à {B}. Ça compte double dans les têtes.', 'Compteur des K.O. : {A} à {B} pour {X}.']
  },
  tallyTie: {
    bon: ['Aux K.O. : {A} partout.', 'Compteur des K.O. : {A} partout.'],
    trash: ['Aux K.O. : {A} partout. Ça rend coup pour coup.', 'Compteur des K.O. : {A} partout. Personne ne lâche.']
  },
  roundWinKo: {
    bon: ['Fin du round ! {W} l’emporte aux K.O., {A} à {B}.', 'La cloche sonne : round pour {W}, {A} K.O. à {B} !'],
    trash: ['Fin du round : {W} repart avec, {A} K.O. à {B}. {L} repart avec ses regrets.', 'Cloche ! {W} empoche le round aux K.O., {A} à {B}.']
  }
} as const;

function line(kind: keyof typeof T, tone: Tone, seed: string, vars: Record<string, string>): string {
  let s: string = pick(T[kind][tone], seed);
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}

function sideLines(side: string, att: SideAttack, name: string, tone: Tone, seed: string, superName?: string): string[] {
  if (side === BOSS_ID) return [line('boss', tone, seed, { N: pv(att.total) })];
  const members = Object.values(att.members);
  if (!members.some((m) => m.weighed)) {
    const kind = members.some((m) => m.late) ? 'late' : members.some((m) => m.gardeUsed) ? 'garde' : 'absent';
    return [line(kind, tone, seed + 'abs', { X: name })];
  }
  const out: string[] = [];
  if (att.crochet > 0) {
    const p = Math.max(...members.map((m) => m.crochetPct));
    out.push(line(att.crochet >= BIG_HIT ? 'bigCrochet' : 'crochet', tone, seed + 'cr', { X: name, P: pct(p), N: pv(att.jab + att.crochet) }));
  } else {
    out.push(line('jab', tone, seed + 'jab', { X: name, N: pv(att.jab) }));
  }
  if (att.super > 0) out.push(line('super', tone, seed + 'sup', { X: name, S: superName || 'Le Super Coup' }));
  if (att.teamBonus > 0) out.push(line('team', tone, seed + 'team', { X: name }));
  const streak = Math.max(0, ...members.filter((m) => m.weighed).map((m) => m.combo));
  if (MILESTONES.includes(streak)) out.push(line('streak', tone, seed + 'stk', { X: name, C: String(streak) }));
  return out;
}

export interface CommentaryOptions {
  /** Dernier soir du round : le bilan annonce le verdict. */
  lastDay?: boolean;
}

/**
 * Commentaire découpé : l'annonce d'une reprise s'il y en a une, les coups de A, la réplique de B, puis le bilan.
 * Tant qu'aucun K.O. n'a été marqué dans le round, le texte est exactement celui d'avant la règle « on se relève ».
 */
export function commentaryParts(
  p: PairingDay,
  names: Record<string, string>,
  tone: Tone,
  seed: string,
  superNames: Record<string, string | undefined> = {},
  opts: CommentaryOptions = {}
): { intro: string | null; a: string[]; b: string[]; end: string | null } {
  if (p.idle) return { intro: null, a: [], b: [], end: null };
  const na = names[p.a] ?? '?', nb = names[p.b] ?? '?';
  const a = sideLines(p.a, p.attacks.a, na, tone, seed + 'a', superNames[p.a]);
  const b = sideLines(p.b, p.attacks.b, nb, tone, seed + 'b', superNames[p.b]);
  const A = Math.max(0, Math.round(p.hpAfter.a)), B = Math.max(0, Math.round(p.hpAfter.b));
  const leader = A > B ? na : nb, trailer = A > B ? nb : na;
  const scores = { A: pv(Math.max(A, B)), B: pv(Math.min(A, B)) };
  // Score aux K.O. du round, ce combat compris.
  const ka = p.kos.a, kb = p.kos.b;
  const koVars = { A: String(Math.max(ka, kb)), B: String(Math.min(ka, kb)) };
  const koLeader = ka > kb ? na : nb, koTrailer = ka > kb ? nb : na;
  const tally = ka + kb === 0 ? '' : ka === kb ? line('tallyTie', tone, seed + 'tl', koVars) : line('tally', tone, seed + 'tl', { X: koLeader, ...koVars });
  const koVerdict = () => line('roundWinKo', tone, seed + 'rd', { W: koLeader, L: koTrailer, ...koVars });
  const join = (...parts: string[]) => parts.filter(Boolean).join(' ');
  const intro = p.fresh ? line('fresh', tone, seed + 'fr', {}) : null;
  let end: string;
  if (p.ko === 'both') {
    end = line('koBoth', tone, seed + 'ko', {});
    if (p.resumes) end = join(end, tally, line('resume', tone, seed + 'rs', {}));
  } else if (p.ko) {
    const loser = p.ko === 'a' ? na : nb, winner = p.ko === 'a' ? nb : na;
    const wonKos = p.ko === 'a' ? kb : ka, lostKos = p.ko === 'a' ? ka : kb;
    if (p.resumes) {
      // Le duel reprend demain : le K.O. marque un point, il ne donne pas le round.
      end = join(line('koPoint', tone, seed + 'ko', { W: winner, L: loser }), wonKos + lostKos > 1 ? tally : '', line('resume', tone, seed + 'rs', {}));
    } else if (lostKos > wonKos) {
      // K.O. du dernier soir, mais l'autre camp en a marqué davantage : le round est pour lui.
      end = join(line('koPoint', tone, seed + 'ko', { W: winner, L: loser }), koVerdict());
    } else {
      end = line('ko', tone, seed + 'ko', { W: winner, L: loser });
    }
  } else if (opts.lastDay) {
    end = ka !== kb ? koVerdict()
      : join(tally, A === B ? line('roundTie', tone, seed + 'rd', { A: pv(A) }) : line('roundWin', tone, seed + 'rd', { W: leader, L: trailer, ...scores }));
  } else if (p.attacks.a.total === 0 && p.attacks.b.total === 0) {
    end = join(line('quiet', tone, seed + 'st', {}), tally);
  } else if (A === B) {
    end = join(line('tie', tone, seed + 'st', { A: pv(A) }), tally);
  } else {
    // Renversement : le camp qui était derrière (ou à égalité) avant ce soir passe devant.
    const before = p.hpBefore.a - p.hpBefore.b, after = A - B;
    const flipped = before !== 0 && Math.sign(before) !== Math.sign(after);
    const kind = flipped ? 'comeback' : Math.abs(A - B) <= CLOSE_GAP ? 'close' : 'lead';
    end = join(line(kind, tone, seed + 'st', { L: leader, ...scores }), tally);
  }
  return { intro, a, b, end };
}

export function commentary(
  p: PairingDay,
  names: Record<string, string>,
  tone: Tone,
  seed: string,
  superNames: Record<string, string | undefined> = {},
  opts: CommentaryOptions = {}
): string[] {
  const c = commentaryParts(p, names, tone, seed, superNames, opts);
  return c.end === null ? [] : [...(c.intro ? [c.intro] : []), ...c.a, ...c.b, c.end];
}

/** Toutes les phrases du commentateur (pour les tests : aucune ne doit viser le corps). */
export const ALL_LINES: string[] = Object.values(T).flatMap((t) => [...t.bon, ...t.trash]);
