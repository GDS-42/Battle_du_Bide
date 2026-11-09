import 'server-only';
import nodemailer from 'nodemailer';

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

export function mailConfigured(): boolean {
  return !!process.env.SMTP_URL;
}

/** En dev (ou si SHOW_MAGIC_LINK=1) le lien est affiché à l'écran : pratique pour tester sans serveur mail. */
export function showLinkOnScreen(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.SHOW_MAGIC_LINK === '1';
}

export async function sendMagicLink(to: string, link: string): Promise<boolean> {
  if (!mailConfigured()) {
    console.info(`[lien magique] ${to} → ${link}`);
    return false;
  }
  transport ??= nodemailer.createTransport(process.env.SMTP_URL);
  const from = process.env.MAIL_FROM || 'Battle du Bide <ring@localhost>';
  await transport.sendMail({
    from,
    to,
    subject: 'Ton lien pour monter sur le ring 🥊',
    text: `Salut !\n\nVoici ton lien de connexion à Battle du Bide (valable 20 minutes) :\n${link}\n\nSi tu n'as rien demandé, ignore ce message.\n\nQue le meilleur perde !`,
    html: `<div style="font-family:Arial,sans-serif;background:#1C0E33;color:#FFF4E3;padding:28px;border-radius:16px">
      <h1 style="color:#FFD23D;margin:0 0 12px">Battle du Bide</h1>
      <p>Voici ton lien pour monter sur le ring (valable 20 minutes) :</p>
      <p><a href="${link}" style="display:inline-block;background:#FFD23D;color:#140A22;padding:14px 22px;border-radius:12px;font-weight:bold;text-decoration:none">Me connecter</a></p>
      <p style="color:#CDB8F0;font-size:13px">Si tu n'as rien demandé, ignore ce message.<br>Que le meilleur perde !</p></div>`
  });
  return true;
}
