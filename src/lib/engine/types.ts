export type Format = 'duel' | 'tournoi' | 'equipes';

export interface EngineMember {
  userId: string;
  team?: number | null;
}

export interface EngineWeighIn {
  userId: string;
  /** Date locale 'YYYY-MM-DD' (une seule pesée retenue par jour : la première). */
  date: string;
  weight: number;
}

export interface EngineSuper {
  userId: string;
  date: string;
}

export interface EngineBattle {
  format: Format;
  /** Jour du premier combat (n'importe quel jour de la semaine) ; un round dure 7 jours à partir de là. */
  startDate: string;
  /** Nombre de rounds (semaines). */
  rounds: number;
  members: EngineMember[];
}

export interface EngineInput {
  battle: EngineBattle;
  weighIns: EngineWeighIn[];
  supers: EngineSuper[];
}

/** Ce qu'un joueur charge comme coup un soir donné. */
export interface PlayerAttack {
  weighed: boolean;
  flagged: boolean;
  jab: number;
  crochet: number;
  /** Baisse de tendance qui a provoqué le crochet, en % du poids de départ. */
  crochetPct: number;
  super: number;
  total: number;
  /** Pesé, mais la tendance n'a pas battu le plus bas du round. */
  blocked: boolean;
  gardeUsed: boolean;
}

export interface PlayerDay {
  date: string;
  weight: number | null;
  trend: number | null;
  combo: number;
  garde: number;
  gauge: number;
  attack: PlayerAttack;
}

export interface SideAttack {
  total: number;
  jab: number;
  crochet: number;
  super: number;
  teamBonus: number;
  members: Record<string, PlayerAttack>;
}

export interface PairingDay {
  a: string;
  b: string;
  hpBefore: { a: number; b: number };
  attacks: { a: SideAttack; b: SideAttack };
  hpAfter: { a: number; b: number };
  /** Côté mis KO ce soir-là. */
  ko: 'a' | 'b' | 'both' | null;
  /** Le duel était déjà terminé (KO un soir précédent) : pas d'échange. */
  idle: boolean;
}

export interface DayFight {
  date: string;
  roundIndex: number;
  dayIndex: number;
  pairings: PairingDay[];
}

export interface RoundPairingResult {
  a: string;
  b: string;
  hp: { a: number; b: number };
  winner: string | null;
  ko: boolean;
  koDate: string | null;
  weighIns: { a: number; b: number };
  damage: { a: number; b: number };
  complete: boolean;
}

export interface RoundResult {
  index: number;
  startDate: string;
  endDate: string;
  pairings: RoundPairingResult[];
}

export interface Standing {
  sideId: string;
  wins: number;
  losses: number;
  draws: number;
  kos: number;
  damageDealt: number;
  damageTaken: number;
}

export interface PlayerSummary {
  userId: string;
  startWeight: number | null;
  trend: number | null;
  lastWeight: number | null;
  /** Perte de tendance en % du poids de départ (positif = perte). */
  lossPct: number;
  combo: number;
  bestCombo: number;
  garde: number;
  gauge: number;
  weighIns: number;
  supers: number;
  damage: number;
  series: { date: string; weight: number | null; trend: number | null }[];
}

export interface Side {
  id: string;
  members: string[];
  isBoss: boolean;
}

export interface BattleState {
  sides: Side[];
  days: DayFight[];
  rounds: RoundResult[];
  standings: Standing[];
  players: Record<string, PlayerSummary>;
  /** Dernière date simulée. */
  until: string | null;
  finished: boolean;
  champion: string | null;
}
