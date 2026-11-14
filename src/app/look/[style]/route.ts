import { NextResponse } from 'next/server';
import { appUrl, safeNext } from '@/lib/auth';
import { LOOK_COOKIE } from '@/lib/look';

export const dynamic = 'force-dynamic';

/**
 * Lien d'essai du look « BD », pour l'appareil qui l'ouvre seulement :
 * /look/bd allume les combattants dessinés, /look/svg les éteint, /look/auto rend la main au réglage général.
 * Rien n'est écrit en base : c'est un simple cookie.
 */
export async function GET(req: Request, { params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  const next = safeNext(new URL(req.url).searchParams.get('next')) ?? '/';
  const res = NextResponse.redirect(new URL(next, appUrl()));
  if (style === 'bd' || style === 'svg') {
    res.cookies.set(LOOK_COOKIE, style, { path: '/', maxAge: 60 * 60 * 24 * 90, sameSite: 'lax', httpOnly: true, secure: appUrl().startsWith('https') });
  } else {
    res.cookies.delete(LOOK_COOKIE);
  }
  return res;
}
