'use client';
import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { sendTaunt } from '@/app/actions/battle';
import { TAUNT_MAX } from '@/lib/taunts';

/** Message libre dans le fil du ring, avec quelques suggestions courtes qui préremplissent le champ. */
export function TauntBox({ battleId, suggestions }: { battleId: string; suggestions: readonly string[] }) {
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const send = async (form: FormData) => {
    await sendTaunt(form);
    setText('');
  };
  return (
    <div className="flex flex-col gap-2">
      <form action={send} className="flex gap-2">
        <input type="hidden" name="battleId" value={battleId} />
        <input
          ref={input}
          className="field min-w-0 flex-1"
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={TAUNT_MAX}
          placeholder="Chambre tes rivaux…"
          aria-label="Ton message pour le fil du ring"
          autoComplete="off"
          enterKeyHint="send"
        />
        <Send disabled={!text.trim()} />
      </form>
      <div className="flex flex-wrap gap-1.5" aria-label="Suggestions">
        {suggestions.map((s) => (
          <button key={s} type="button" className="pill min-h-9 px-3 text-[13px]" onClick={() => { setText(s); input.current?.focus(); }}>{s}</button>
        ))}
      </div>
    </div>
  );
}

function Send({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button className="btn btn-soleil min-h-12 shrink-0 px-4 text-base" disabled={disabled || pending}>{pending ? '…' : 'Envoyer'}</button>;
}
