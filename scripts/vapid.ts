// Génère une paire de clés VAPID pour les notifications push : npm run vapid
import { generateVAPIDKeys } from 'web-push';

const k = generateVAPIDKeys();
console.log(`VAPID_PUBLIC_KEY=${k.publicKey}\nVAPID_PRIVATE_KEY=${k.privateKey}\nVAPID_SUBJECT=mailto:toi@example.com`);
