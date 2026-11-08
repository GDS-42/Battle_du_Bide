'use client';
import { useActionState } from 'react';
import { requestLink, type LoginState } from '@/app/actions/auth';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLink, { ok: false });
  if (state.ok) {
    return (
      <div className="card flex flex-col gap-3 p-5">
        <h2 className="font-display text-[24px] text-soleil">Vérifie ta boîte mail</h2>
        <p className="text-[15px]">Un lien de connexion part vers <b>{state.email}</b>. Il est valable 20 minutes.</p>
        {state.devLink ? (
          <div className="rounded-xl border-2 border-dashed border-soleil p-3 text-sm">
            <div className="label mb-1">Mode test : pas de serveur mail configuré</div>
            <a href={state.devLink} className="break-all font-bold text-soleil underline">Ouvrir le lien de connexion</a>
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-2">
        <span className="label">Ton e-mail</span>
        <input className="field" type="email" name="email" required autoComplete="email" inputMode="email" placeholder="toi@exemple.fr" />
      </label>
      {state.error ? <p role="alert" className="text-sm text-[#FF8FA3]">{state.error}</p> : null}
      <button className="btn btn-soleil w-full" disabled={pending}>{pending ? 'Envoi…' : 'RECEVOIR MON LIEN'}</button>
    </form>
  );
}
