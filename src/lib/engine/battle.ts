// Moteur de battle : fonction pure et déterministe.
// À partir des pesées et des supers déclenchés, recalcule toute la battle jour par jour.
import { addDays, dayDiff } from '../time';
import { BOSS_ID, RULES } from './rules';
import type {
  BattleState, DayFight, EngineBattle, EngineInput, EngineWeighIn, PairingDay, PlayerAttack,
  PlayerDay, PlayerSummary, RoundPairingResult, RoundResult, Side, SideAttack, Standing
} from './types';

const r1 = (n: number) => Math.round(n * 10) / 10;

export function battleEndDate(b: Pick<EngineBattle, 'startDate' | 'rounds'>): string {
  return addDays(b.startDate, b.rounds * 7 - 1);
}

export function buildSides(b: EngineBattle): Side[] {
  let sides: Side[];
  if (b.format === 'equipes') {
    const teams = new Map<number, string[]>();
    for (const m of b.members) {
      const t = m.team ?? 1;
      if (!teams.has(t)) teams.set(t, []);
      teams.get(t)!.push(m.userId);
    }
    sides = [...teams.keys()].sort((x, y) => x - y).map((t) => ({ id: `team-${t}`, members: teams.get(t)!, isBoss: false }));
  } else {
    sides = b.members.map((m) => ({ id: m.userId, members: [m.userId], isBoss: false }));
  }
  if (sides.length === 1 || (sides.length > 2 && sides.length % 2 === 1)) {
    sides.push({ id: BOSS_ID, members: [], isBoss: true });
  }
  return sides;
}

/** Appariements d'un round (méthode du cercle : chacun rencontre tout le monde avant de recommencer). */
export function roundPairings(ids: string[], roundIndex: number): [string, string][] {
  const n = ids.length;
  if (n < 2) return [];
  if (n === 2) return [[ids[0], ids[1]]];
  const rest = ids.slice(1);
  const turns = roundIndex % (n - 1);
  for (let i = 0; i < turns; i++) rest.unshift(rest.pop()!);
  const line = [ids[0], ...rest];
  const pairs: [string, string][] = [];
  for (let i = 0; i < n / 2; i++) pairs.push([line[i], line[n - 1 - i]]);
  return pairs;
}

function emptyAttack(): PlayerAttack {
  return { weighed: false, flagged: false, jab: 0, crochet: 0, crochetPct: 0, super: 0, total: 0, blocked: false, gardeUsed: false };
}

/** Une pesée par jour : la première. */
export function firstPerDay(weighIns: EngineWeighIn[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of weighIns) if (!m.has(w.date)) m.set(w.date, w.weight);
  return m;
}

export interface PlayerSim {
  startWeight: number | null;
  days: PlayerDay[];
  bestCombo: number;
  supers: number;
}

/** Simule un joueur du lundi de départ jusqu'à `until` (inclus). */
export function simulatePlayer(
  userId: string,
  input: Pick<EngineInput, 'weighIns' | 'supers'>,
  startDate: string,
  until: string
): PlayerSim {
  const mine = input.weighIns.filter((w) => w.userId === userId).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const byDay = firstPerDay(mine);
  const supers = new Set(input.supers.filter((s) => s.userId === userId).map((s) => s.date));

  const warm = [...byDay.entries()].filter(([d]) => d < startDate).map(([, w]) => w);
  const last3 = warm.slice(-3);
  let startWeight: number | null = last3.length ? last3.reduce((s, x) => s + x, 0) / last3.length : null;
  let trend: number | null = startWeight;
  let lastAccepted: number | null = warm.length ? warm[warm.length - 1] : null;
  let pending: number | null = null;
  let combo = 0, garde = 0, gauge = 0, bestCombo = 0, supersUsed = 0;
  let roundLow: number | null = null;
  const days: PlayerDay[] = [];

  const total = dayDiff(startDate, until);
  for (let i = 0; i <= total; i++) {
    const d = addDays(startDate, i);
    if (i % 7 === 0) roundLow = trend;
    const w = byDay.get(d);
    const att = emptyAttack();
    if (w !== undefined) {
      att.weighed = true;
      let accepted: boolean;
      if (startWeight === null || trend === null) {
        startWeight = w; trend = w; lastAccepted = w; roundLow = roundLow ?? w; accepted = true;
      } else {
        const ref = lastAccepted ?? trend;
        if (Math.abs(w - ref) / ref <= RULES.ANOMALY) accepted = true;
        else if (pending !== null && Math.abs(w - pending) / pending <= RULES.CONFIRM) accepted = true;
        else { accepted = false; pending = w; }
        if (accepted) {
          trend = trend + RULES.ALPHA * (w - trend);
          lastAccepted = w;
          pending = null;
        }
      }
      att.flagged = !accepted;
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      if (combo % RULES.GARDE_EVERY === 0 && garde < RULES.GARDE_MAX) garde += 1;
      gauge = Math.min(RULES.SUPER_MAX, gauge + 1);
      att.jab = combo >= RULES.COMBO_TIER_2 ? RULES.JAB[2] : combo >= RULES.COMBO_TIER_1 ? RULES.JAB[1] : RULES.JAB[0];
      if (accepted && roundLow !== null && trend < roundLow - 1e-9) {
        const pct = ((roundLow - trend) / startWeight) * 100;
        att.crochetPct = Math.round(pct * 100) / 100;
        att.crochet = r1(RULES.CROCHET_PER_PCT * pct);
        roundLow = trend;
      } else {
        att.blocked = true;
      }
      if (supers.has(d) && gauge >= RULES.SUPER_MAX) {
        att.super = RULES.SUPER_DAMAGE;
        gauge = 0;
        supersUsed += 1;
      }
      att.total = r1(att.jab + att.crochet + att.super);
    } else if (combo > 0 && garde > 0) {
      garde -= 1;
      att.gardeUsed = true;
    } else {
      combo = 0;
    }
    days.push({ date: d, weight: w ?? null, trend: trend === null ? null : Math.round(trend * 100) / 100, combo, garde, gauge, attack: att });
  }
  return { startWeight, days, bestCombo, supers: supersUsed };
}

function sideAttack(side: Side, dayIdx: number, sims: Map<string, PlayerSim>, format: EngineBattle['format']): SideAttack {
  if (side.isBoss) {
    return { total: RULES.BOSS_DAILY, jab: RULES.BOSS_DAILY, crochet: 0, super: 0, teamBonus: 0, members: {} };
  }
  const members: Record<string, PlayerAttack> = {};
  let sum = 0, jab = 0, crochet = 0, sup = 0, allWeighed = side.members.length > 0;
  for (const uid of side.members) {
    const a = sims.get(uid)?.days[dayIdx]?.attack ?? emptyAttack();
    members[uid] = a;
    sum += a.total; jab += a.jab; crochet += a.crochet; sup += a.super;
    if (!a.weighed) allWeighed = false;
  }
  const n = Math.max(1, side.members.length);
  const teamBonus = format === 'equipes' && side.members.length > 1 && allWeighed ? RULES.TEAM_BONUS : 0;
  return { total: r1(sum / n + teamBonus), jab: r1(jab / n), crochet: r1(crochet / n), super: r1(sup / n), teamBonus, members };
}

function sideWeighIns(side: Side, dayIdx: number, sims: Map<string, PlayerSim>): number {
  return side.members.reduce((s, uid) => s + (sims.get(uid)?.days[dayIdx]?.attack.weighed ? 1 : 0), 0);
}

/** Simule toute la battle jusqu'à `until` inclus (en pratique : la dernière soirée révélée). */
export function simulateBattle(input: EngineInput, until: string | null): BattleState {
  const b = input.battle;
  const sides = buildSides(b);
  const end = battleEndDate(b);
  const last = until === null || until < b.startDate ? null : (until > end ? end : until);

  const sims = new Map<string, PlayerSim>();
  const players: Record<string, PlayerSummary> = {};
  for (const m of b.members) {
    const sim = simulatePlayer(m.userId, input, b.startDate, last ?? addDays(b.startDate, -1));
    sims.set(m.userId, sim);
    const lastDay = sim.days[sim.days.length - 1];
    const trend = lastDay?.trend ?? sim.startWeight;
    const weighs = sim.days.filter((d) => d.attack.weighed);
    players[m.userId] = {
      userId: m.userId,
      startWeight: sim.startWeight,
      trend,
      lastWeight: weighs.length ? weighs[weighs.length - 1].weight : null,
      lossPct: sim.startWeight && trend ? Math.round(((sim.startWeight - trend) / sim.startWeight) * 10000) / 100 : 0,
      combo: lastDay?.combo ?? 0,
      bestCombo: sim.bestCombo,
      garde: lastDay?.garde ?? 0,
      gauge: lastDay?.gauge ?? 0,
      weighIns: weighs.length,
      supers: sim.supers,
      damage: r1(sim.days.reduce((s, d) => s + d.attack.total, 0)),
      series: sim.days.map((d) => ({ date: d.date, weight: d.weight, trend: d.trend }))
    };
  }

  const days: DayFight[] = [];
  const rounds: RoundResult[] = [];
  const ids = sides.map((s) => s.id);
  const sideById = new Map(sides.map((s) => [s.id, s]));

  if (last !== null) {
    for (let r = 0; r < b.rounds; r++) {
      const rStart = addDays(b.startDate, r * 7);
      if (rStart > last) break;
      const pairs = roundPairings(ids, r).map(([a, c]) => ({
        a, b: c, hpA: RULES.HP as number, hpB: RULES.HP as number, done: false, ko: false, koDate: null as string | null,
        winner: null as string | null, wA: 0, wB: 0, dA: 0, dB: 0, played: 0
      }));
      for (let i = 0; i < 7; i++) {
        const d = addDays(rStart, i);
        if (d > last) break;
        const dayIdx = r * 7 + i;
        const fight: DayFight = { date: d, roundIndex: r, dayIndex: i, pairings: [] };
        for (const p of pairs) {
          const sa = sideById.get(p.a)!, sb = sideById.get(p.b)!;
          const attA = sideAttack(sa, dayIdx, sims, b.format);
          const attB = sideAttack(sb, dayIdx, sims, b.format);
          const before = { a: p.hpA, b: p.hpB };
          let ko: PairingDay['ko'] = null;
          if (!p.done) {
            p.hpA = r1(p.hpA - attB.total);
            p.hpB = r1(p.hpB - attA.total);
            p.wA += sideWeighIns(sa, dayIdx, sims);
            p.wB += sideWeighIns(sb, dayIdx, sims);
            p.dA = r1(p.dA + attA.total);
            p.dB = r1(p.dB + attB.total);
            p.played += 1;
            if (p.hpA <= 0 || p.hpB <= 0) {
              ko = p.hpA <= 0 && p.hpB <= 0 ? 'both' : p.hpA <= 0 ? 'a' : 'b';
              p.done = true; p.ko = true; p.koDate = d;
              if (p.hpA !== p.hpB) p.winner = p.hpA > p.hpB ? p.a : p.b;
              else if (attA.total !== attB.total) p.winner = attA.total > attB.total ? p.a : p.b;
            }
          }
          fight.pairings.push({
            a: p.a, b: p.b, hpBefore: before, attacks: { a: attA, b: attB },
            hpAfter: { a: p.hpA, b: p.hpB }, ko, idle: before.a === p.hpA && before.b === p.hpB && p.done && ko === null
          });
        }
        days.push(fight);
      }
      const complete = addDays(rStart, 6) <= last;
      rounds.push({
        index: r, startDate: rStart, endDate: addDays(rStart, 6),
        pairings: pairs.map((p): RoundPairingResult => {
          let winner = p.winner;
          if (!p.ko && complete) {
            if (p.hpA !== p.hpB) winner = p.hpA > p.hpB ? p.a : p.b;
            else if (p.wA !== p.wB) winner = p.wA > p.wB ? p.a : p.b;
          }
          return {
            a: p.a, b: p.b, hp: { a: p.hpA, b: p.hpB }, winner: p.ko || complete ? winner : null,
            ko: p.ko, koDate: p.koDate, weighIns: { a: p.wA, b: p.wB }, damage: { a: p.dA, b: p.dB }, complete: p.ko || complete
          };
        })
      });
    }
  }

  const st = new Map<string, Standing>();
  for (const s of sides) if (!s.isBoss) st.set(s.id, { sideId: s.id, wins: 0, losses: 0, draws: 0, kos: 0, damageDealt: 0, damageTaken: 0 });
  for (const r of rounds) {
    for (const p of r.pairings) {
      const A = st.get(p.a), B = st.get(p.b);
      if (A) { A.damageDealt = r1(A.damageDealt + p.damage.a); A.damageTaken = r1(A.damageTaken + p.damage.b); }
      if (B) { B.damageDealt = r1(B.damageDealt + p.damage.b); B.damageTaken = r1(B.damageTaken + p.damage.a); }
      if (!p.complete) continue;
      if (p.winner === null) { if (A) A.draws++; if (B) B.draws++; continue; }
      const W = st.get(p.winner), L = st.get(p.winner === p.a ? p.b : p.a);
      if (W) { W.wins++; if (p.ko) W.kos++; }
      if (L) L.losses++;
    }
  }
  const standings = [...st.values()].sort((x, y) => y.wins - x.wins || y.damageDealt - x.damageDealt);
  const finished = last !== null && last >= end;
  let champion: string | null = null;
  if (finished && standings.length) {
    const [s1, s2] = standings;
    if (!s2 || s1.wins > s2.wins || (s1.wins === s2.wins && s1.damageDealt > s2.damageDealt)) champion = s1.sideId;
  }
  return { sides, days, rounds, standings, players, until: last, finished, champion };
}

/** Coup chargé d'un joueur pour un jour donné (aperçu immédiat après la pesée). */
export function playerDayPreview(input: EngineInput, userId: string, date: string): PlayerDay | null {
  if (date < input.battle.startDate) return null;
  const end = battleEndDate(input.battle);
  if (date > end) return null;
  const sim = simulatePlayer(userId, input, input.battle.startDate, date);
  return sim.days[sim.days.length - 1] ?? null;
}

/**
 * Défense de ceinture : le champion la garde tant que sa tendance reste à ±1 % de son niveau
 * de fin de battle et qu'il continue à se peser (5 jours sur 7).
 */
export function beltHeld(userId: string, input: EngineInput, today: string): boolean {
  const end = battleEndDate(input.battle);
  if (today <= end) return true;
  const sim = simulatePlayer(userId, input, input.battle.startDate, today);
  const endIdx = dayDiff(input.battle.startDate, end);
  const endTrend = sim.days[endIdx]?.trend;
  const nowTrend = sim.days[sim.days.length - 1]?.trend;
  if (!endTrend || !nowTrend) return false;
  if (Math.abs(nowTrend - endTrend) / endTrend > RULES.BELT_TOLERANCE) return false;
  const since = dayDiff(end, today);
  const window = Math.min(7, since);
  const recent = sim.days.slice(-window).filter((d) => d.attack.weighed).length;
  const required = Math.min(RULES.BELT_MIN_WEIGHINS, Math.max(0, window - 2));
  return recent >= required;
}
