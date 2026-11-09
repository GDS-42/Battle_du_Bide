'use server';
import { redirect } from 'next/navigation';
import { requireFighter } from '@/lib/auth';
import { WeightSchema } from '@/lib/validation';
import { recordWeighIn } from '@/lib/weighin';

export type WeighState = { error?: string };

export async function submitWeighIn(_prev: WeighState, form: FormData): Promise<WeighState> {
  const user = await requireFighter('/pesee');
  const w = WeightSchema.safeParse(form.get('weight'));
  if (!w.success) return { error: w.error.issues[0]?.message ?? 'Poids invalide' };
  const comment = String(form.get('comment') ?? '').trim().slice(0, 140) || null;
  const photo = form.get('photo');
  const res = await recordWeighIn(user, { weight: w.data, comment, photo: photo instanceof File ? photo : null });
  if (!res.ok) return { error: res.error };
  const q = new URLSearchParams();
  if (res.transformation) q.set('transfo', `${res.transformation.from}-${res.transformation.to}`);
  if (res.updated) q.set('corrige', '1');
  redirect(`/pesee/coup${q.size ? `?${q}` : ''}`);
}
