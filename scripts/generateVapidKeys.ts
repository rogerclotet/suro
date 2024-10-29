import { generateVAPIDKeys } from "web-push";

const vapidKeys = generateVAPIDKeys();

const envData = `
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
NEXT_PUBLIC_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`;

console.log(envData);
