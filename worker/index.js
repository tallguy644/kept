// Kept Pro: Google Play purchase acknowledgment (Cloudflare Worker).
// Google refunds any purchase that isn't acknowledged within 3 days, so the app sends each new
// purchase here. This checks it with Google and acknowledges it. Nothing about the user is stored.
//
// Settings (wrangler.toml / Cloudflare dashboard):
//   PACKAGE_NAME     - Android package name of the Play app
//   ALLOWED_ORIGIN   - https://tallguy644.github.io
//   GOOGLE_SA_JSON   - secret: the Google Cloud service-account key (JSON) with Play Console access

const SKUS = {
  kept_pro_monthly: 'sub',
  kept_pro_yearly: 'sub',
  kept_pro_lifetime: 'inapp',
};
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);
    if (req.method !== 'POST' || url.pathname !== '/play/ack') return reply(404, { error: 'not found' });

    let body;
    try { body = await req.json(); } catch { return reply(400, { error: 'bad json' }); }
    const { sku, token } = body || {};
    const type = SKUS[sku];
    if (!type || typeof token !== 'string' || token.length < 10 || token.length > 4096) {
      return reply(400, { error: 'unknown product or token' });
    }

    try {
      const access = await googleToken(env);
      const pkg = encodeURIComponent(env.PACKAGE_NAME);
      const base = type === 'sub'
        ? `${API}/${pkg}/purchases/subscriptions/${sku}/tokens/${encodeURIComponent(token)}`
        : `${API}/${pkg}/purchases/products/${sku}/tokens/${encodeURIComponent(token)}`;
      const auth = { Authorization: `Bearer ${access}` };

      // 1. Check the purchase is real and paid.
      const check = await fetch(base, { headers: auth });
      if (!check.ok) return reply(402, { valid: false });
      const p = await check.json();
      const paid = type === 'sub'
        ? Number(p.expiryTimeMillis) > Date.now() && p.paymentState !== 0   // 0 = payment pending
        : p.purchaseState === 0;                                            // 0 = purchased
      if (!paid) return reply(402, { valid: false });

      // 2. Acknowledge it if that hasn't happened yet (1 = already acknowledged).
      if (p.acknowledgementState !== 1) {
        const ack = await fetch(`${base}:acknowledge`, {
          method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: '{}',
        });
        if (!ack.ok) return reply(502, { valid: true, acknowledged: false });
      }
      return reply(200, { valid: true, acknowledged: true });
    } catch (e) {
      return reply(500, { error: 'server error' });
    }
  },
};

// Signs a short-lived JWT with the service-account key and trades it for a Google access token.
async function googleToken(env) {
  const sa = JSON.parse(env.GOOGLE_SA_JSON);
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  })}`;
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----|\s/g, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${b64url(new Uint8Array(sig))}`,
  });
  if (!r.ok) throw new Error('google auth failed');
  return (await r.json()).access_token;
}

function b64url(bytes) {
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
