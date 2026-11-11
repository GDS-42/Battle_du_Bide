import { sql } from 'drizzle-orm';
import {
  boolean, date, doublePrecision, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid
} from 'drizzle-orm/pg-core';
import type { FighterConfig } from '../fighter/types';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  nickname: text('nickname'),
  superMove: text('super_move'),
  entrance: text('entrance'),
  heightCm: integer('height_cm'),
  presetKey: text('preset_key'),
  fighter: jsonb('fighter').$type<FighterConfig>(),
  weighTime: text('weigh_time').notNull().default('07:30'),
  timezone: text('timezone').notNull().default('Europe/Paris'),
  notifyOn: boolean('notify_on').notNull().default(true),
  onboarded: boolean('onboarded').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const loginTokens = pgTable('login_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  email: text('email').notNull(),
  redirect: text('redirect'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [index('login_tokens_email_idx').on(t.email)]);

export const sessions = pgTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const battles = pgTable('battles', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  format: text('format').$type<'duel' | 'tournoi' | 'equipes'>().notNull(),
  rounds: integer('rounds').notNull(),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  fightTime: text('fight_time').notNull().default('21:00'),
  timezone: text('timezone').notNull().default('Europe/Paris'),
  stakeText: text('stake_text'),
  potAmount: integer('pot_amount'),
  potMode: text('pot_mode').$type<'winner' | 'objectif'>(),
  potObjective: doublePrecision('pot_objective').notNull().default(5),
  carryOver: integer('carry_over').notNull().default(0),
  privacy: text('privacy').$type<'pudique' | 'transparent'>().notNull().default('pudique'),
  tone: text('tone').$type<'bon' | 'trash'>().notNull().default('bon'),
  photoProof: boolean('photo_proof').notNull().default(false),
  teamNames: jsonb('team_names').$type<Record<string, string>>(),
  maxPlayers: integer('max_players').notNull().default(2),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rematchOf: uuid('rematch_of'),
  /** Vrai dès que le premier combat a eu lieu avec au moins deux camps (voir settleStart). */
  started: boolean('started').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const battleMembers = pgTable('battle_members', {
  battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  team: integer('team'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true })
}, (t) => [primaryKey({ columns: [t.battleId, t.userId] }), index('members_user_idx').on(t.userId)]);

export const weighIns = pgTable('weighins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date', { mode: 'string' }).notNull(),
  weight: doublePrecision('weight').notNull(),
  comment: text('comment'),
  photoPath: text('photo_path'),
  word: text('word'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  editableUntil: timestamp('editable_until', { withTimezone: true }).notNull()
}, (t) => [uniqueIndex('weighins_user_date_idx').on(t.userId, t.date)]);

export const supers = pgTable('supers', {
  battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [primaryKey({ columns: [t.battleId, t.userId, t.date] })]);

export const feed = pgTable('feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  kind: text('kind').$type<'taunt' | 'nudge' | 'join' | 'comment' | 'super' | 'transformation' | 'system'>().notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [index('feed_battle_idx').on(t.battleId, t.createdAt)]);

export const reactions = pgTable('reactions', {
  battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  target: text('target').notNull(),
  emoji: text('emoji').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [primaryKey({ columns: [t.battleId, t.userId, t.target, t.emoji] })]);

export const nudges = pgTable('nudges', {
  battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
  fromUser: uuid('from_user').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toUser: uuid('to_user').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date', { mode: 'string' }).notNull()
}, (t) => [primaryKey({ columns: [t.battleId, t.fromUser, t.toUser, t.date] })]);

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const notifLog = pgTable('notif_log', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().default(sql`now()`)
}, (t) => [primaryKey({ columns: [t.userId, t.key] })]);

export type User = typeof users.$inferSelect;
export type Battle = typeof battles.$inferSelect;
export type Member = typeof battleMembers.$inferSelect;
export type WeighIn = typeof weighIns.$inferSelect;
export type FeedItem = typeof feed.$inferSelect;
