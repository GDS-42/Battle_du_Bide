// Garde anti-SSRF : le serveur envoie des requêtes vers l'« endpoint » fourni par le navigateur.
// On n'accepte que les services push des navigateurs, en HTTPS sur le port standard.

/** Hôtes exacts : Chrome, Edge, Opera, Android (FCM), Firefox (Mozilla), Safari et iOS (Apple). */
const HOSTS = new Set(['fcm.googleapis.com', 'android.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com']);
/** Sous-domaines : Windows Push Notification Services (Edge) et Apple. */
const SUFFIXES = ['.notify.windows.com', '.push.apple.com'];

export function isAllowedPushEndpoint(raw: unknown): boolean {
  if (typeof raw !== 'string' || raw.length > 2048) return false;
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'https:' || u.username || u.password || u.port !== '') return false;
  const host = u.hostname.toLowerCase();
  return HOSTS.has(host) || SUFFIXES.some((s) => host.endsWith(s));
}

/** Clés d'abonnement : base64url, longueurs bornées. */
export const PUSH_KEY_RE = /^[A-Za-z0-9_-]+={0,2}$/;
