'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { consumeLoginToken, createLoginLink, endSession, safeNext } from '@/lib/auth';
import { sendMagicLink, showLinkOnScreen } from '@/lib/mail';

export type LoginState = { ok: boolean; error?: string; email?: string; devLink?: string };

const Email = z.string().trim().toLowerCase().pipe(z.email());

export async function requestLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = Email.safeParse(form.get('email'));
  if (!parsed.success) return { ok: false, error: "Cette adresse e-mail n'a pas l'air valide." };
  const email = parsed.data;
  const next = safeNext(String(form.get('next') ?? ''));
  const { link, throttled } = await createLoginLink(email, next);
  if (!throttled) {
    try { await sendMagicLink(email, link); } catch (e) {
      console.error('Envoi du lien magique impossible', e);
      return { ok: false, error: "L'e-mail n'a pas pu partir. Réessaie dans un instant." };
    }
  }
  return { ok: true, email, devLink: showLinkOnScreen() ? link : undefined };
}

export async function confirmLogin(form: FormData): Promise<void> {
  const token = String(form.get('token') ?? '');
  const res = token ? await consumeLoginToken(token) : null;
  if (!res) redirect('/connexion?erreur=lien');
  const target = res.redirect ?? '/battles';
  if (!res.user.onboarded) redirect(`/combattant?next=${encodeURIComponent(target)}`);
  redirect(target);
}

export async function logout(): Promise<void> {
  await endSession();
  redirect('/');
}
