import webpush from "web-push";

// Configure once per server process. VAPID keys identify this app
// to the browser push services (FCM for Chrome/Edge/Android,
// Mozilla's service for Firefox, Apple's for Safari/iOS 16.4+) —
// generate a pair with `npx web-push generate-vapid-keys` and put
// them in .env.local (see PUSH_ALERTS_SETUP.md).
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@surakshamine.example";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!publicKey || !privateKey) {
    throw new Error(
      "Push notifications are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env.local (see PUSH_ALERTS_SETUP.md)."
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface StoredPushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

export interface AlertPayload {
  title: string;
  body: string;
  severity: "low" | "medium" | "high" | "critical";
  url?: string;
  tag?: string;
}

export interface SendResult {
  subscriptionId: string;
  ok: boolean;
  expired: boolean;
  error?: string;
}

// Sends one push message to one stored subscription. Returns
// whether it succeeded and whether the subscription is dead
// (404/410 — the browser unsubscribed or the endpoint expired)
// so the caller can prune it from the database.
export async function sendPushToSubscription(
  sub: StoredPushSubscription,
  payload: AlertPayload
): Promise<SendResult> {
  ensureConfigured();

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth_key },
      },
      JSON.stringify(payload)
    );
    return { subscriptionId: sub.id, ok: true, expired: false };
  } catch (err) {
    const webPushErr = err as { statusCode?: number; body?: string; message?: string };
    const statusCode = webPushErr?.statusCode;
    const expired = statusCode === 404 || statusCode === 410;
    return {
      subscriptionId: sub.id,
      ok: false,
      expired,
      error: webPushErr?.body || webPushErr?.message || "Unknown push error",
    };
  }
}
