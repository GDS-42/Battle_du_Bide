import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { currentUser } from '@/lib/auth';
import { loadBundle, roundRecapFor, sideName } from '@/lib/battles';
import { resultLabel, trendLabel } from '@/lib/engine/recap';
import { now } from '@/lib/time';

export const dynamic = 'force-dynamic';

const W = 1080, H = 1350;
const INK = '#140A22', CREME = '#FFF4E3', SOLEIL = '#FFD23D', LILAS = '#CDB8F0', VIOLET = '#2A1548';
const BANDS = ['#3A1A5E', '#6B1E6E', '#B3206F', '#E8287C', '#F25C4A', '#F7893B', '#FFB23D'];

// Le rendu d'image exige un fichier de police : Lilita One (licence OFL, voir public/fonts).
let font: Promise<Buffer> | null = null;
const lilita = () => (font ??= readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'fonts', 'lilita-one-latin-400.woff')));

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

/** Image du bilan d'un round, à partager : PV, série et tendance en %, jamais de kilos. Réservée aux membres. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const user = await currentUser();
  if (!user) return new Response('Non connecté', { status: 401 });
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Introuvable', { status: 404 });
  const bundle = await loadBundle(id);
  if (!bundle) return new Response('Introuvable', { status: 404 });
  if (!bundle.members.some((m) => m.userId === user.id)) return new Response('Interdit', { status: 403 });
  const r = roundRecapFor(bundle, user.id, Number(n), now());
  if (!r) return new Response('Introuvable', { status: 404 });

  const label = resultLabel(r);
  const me = cut(sideName(bundle, r.mySide), 14).toUpperCase(), opp = cut(sideName(bundle, r.oppSide), 14).toUpperCase();
  const stats: [string, string][] = [
    [`${r.weighIns}/${Math.max(r.days, r.weighIns)}`, 'pesées à l’heure'],
    [`×${r.combo}`, 'série'],
    [trendLabel(r.lossPct), 'tendance']
  ];
  const bar = (hp: number, reverse: boolean) => (
    <div style={{ display: 'flex', flexDirection: reverse ? 'row-reverse' : 'row', width: 400, height: 44, background: VIOLET, border: `6px solid ${CREME}` }}>
      <div style={{ width: `${Math.max(0, Math.min(100, hp))}%`, height: '100%', background: SOLEIL }} />
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', background: '#1C0E33', fontFamily: 'Lilita One', color: CREME }}>
        {BANDS.map((c, i) => (
          <div key={c} style={{ position: 'absolute', left: 0, right: 0, top: (i * 760) / BANDS.length, height: 760 / BANDS.length + 1, background: c }} />
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 760, bottom: 0, background: VIOLET, borderTop: `10px solid ${INK}` }} />

        <div style={{ display: 'flex', marginTop: 56, padding: '10px 34px', background: '#D22B3A', border: `6px solid ${INK}`, fontSize: 40, letterSpacing: 2 }}>BATTLE DU BIDE</div>
        <div style={{ display: 'flex', marginTop: 26, fontSize: 50, color: INK }}>{cut(bundle.battle.name, 30)}</div>

        <div style={{ display: 'flex', marginTop: 34, fontSize: 150, lineHeight: 1, color: INK }}>ROUND {r.round}</div>
        {/* Titre du résultat, avec une ombre dure façon affiche */}
        <div style={{ display: 'flex', position: 'relative', marginTop: 18, height: label.text.length > 12 ? 110 : 170 }}>
          <div style={{ display: 'flex', position: 'absolute', left: 8, top: 8, fontSize: label.text.length > 12 ? 92 : 150, lineHeight: 1, color: INK, whiteSpace: 'nowrap' }}>{label.text}</div>
          <div style={{ display: 'flex', fontSize: label.text.length > 12 ? 92 : 150, lineHeight: 1, color: label.color, whiteSpace: 'nowrap' }}>{label.text}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: 60, right: 60, top: 800, gap: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {bar(r.hp.me, false)}
            <div style={{ display: 'flex', fontSize: 54, color: LILAS }}>VS</div>
            {bar(r.hp.opp, true)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, fontSize: 60 }}>
              <span>{me}</span><span style={{ color: SOLEIL, fontSize: 84 }}>{r.hp.me}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, fontSize: 60 }}>
              <span style={{ color: SOLEIL, fontSize: 84 }}>{r.hp.opp}</span><span>{opp}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            {stats.map(([v, k]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 300, padding: '22px 10px', background: INK, border: `5px solid #5A2A7A`, borderRadius: 28 }}>
                <span style={{ fontSize: 66, color: SOLEIL, lineHeight: 1 }}>{v}</span>
                <span style={{ fontSize: 32, color: LILAS, marginTop: 8 }}>{k}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', position: 'absolute', bottom: 48, fontSize: 46, color: SOLEIL }}>Que le meilleur perde !</div>
      </div>
    ),
    { width: W, height: H, fonts: [{ name: 'Lilita One', data: await lilita(), weight: 400, style: 'normal' }], headers: { 'cache-control': 'private, no-store' } }
  );
}
