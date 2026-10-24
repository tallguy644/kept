// Kept Pro server (Cloudflare Worker).
//
// Pro is bought in the store apps and tied to the driver's Kept account, so it unlocks everywhere they sign in.
//   POST /pro/claim    (signed-in driver) checks a store purchase with the store, acknowledges it, and marks the
//                      account Pro in Firestore at users/{uid}/meta/pro. Drivers can't write that document themselves.
//   POST /pro/refresh  (signed-in driver) re-checks the purchases already linked to the account.
//   POST /play/ack     acknowledges a Play purchase made without an account (Pro on that device only).
//   POST /account/delete (signed-in driver) removes their Pro status, trial and linked purchases before account deletion.
//   daily cron         re-checks every linked purchase, so renewals, cancellations and refunds are picked up.
// One purchase can only ever be linked to one account (proPurchases/{hash of token}).
//
// Settings (wrangler.toml): PACKAGE_NAME, FIREBASE_PROJECT_ID, ALLOWED_ORIGINS
// Secrets: GOOGLE_SA_JSON (Play Console access), FIREBASE_SA_JSON (Firestore access; defaults to GOOGLE_SA_JSON)

const SKUS = { kept_pro_monthly: 'sub', kept_pro_yearly: 'sub', kept_pro_lifetime: 'inapp' };
const PLAY = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
const JWKS = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    };
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return reply(404, { error: 'not found' });
    const path = new URL(req.url).pathname;

    try {
      let body = {};
      try { body = await req.json(); } catch { body = {}; }

      if (path === '/play/ack') {
        const { sku, token } = body;
        if (!SKUS[sku] || !okToken(token)) return reply(400, { error: 'unknown product or token' });
        const r = await checkPlay(env, sku, token, true);
        return reply(r.valid ? 200 : 402, r);
      }

      if (path === '/account/delete') {
        // The driver is deleting their Kept account: remove the server-only records tied to it.
        const uid = await verifyIdToken(env, (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
        if (!uid) return reply(401, { error: 'sign in first' });
        for (const p of await listPurchases(env, uid)) if (p.uid === uid) await fs(env, 'DELETE', `proPurchases/${await sha256(`${p.store}:${p.token}`)}`);
        await fs(env, 'DELETE', `users/${uid}/meta/pro`);
        await fs(env, 'DELETE', `users/${uid}/meta/trial`);
        return reply(200, { deleted: true });
      }

      if (path === '/pro/claim' || path === '/pro/refresh') {
        const uid = await verifyIdToken(env, (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
        if (!uid) return reply(401, { error: 'sign in first' });

        if (path === '/pro/claim') {
          const { store, sku, token } = body;
          if (store !== 'play') return reply(501, { error: 'store not supported yet' });
          if (!SKUS[sku] || !okToken(token)) return reply(400, { error: 'unknown product or token' });
          const check = await checkPlay(env, sku, token, true);
          if (!check.valid) return reply(402, { valid: false });
          const link = await linkPurchase(env, uid, { store, sku, token });
          if (!link.ok) return reply(409, { error: 'purchase already linked to another account' });
        }
        const pro = await recompute(env, uid);
        return reply(200, pro);
      }
      return reply(404, { error: 'not found' });
    } catch (e) {
      console.error(e);
      return reply(500, { error: 'server error' });
    }
  },

  // Daily: re-check every linked purchase and update each account's Pro status.
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const uids = new Set((await listPurchases(env)).map((p) => p.uid));
      for (const uid of uids) { try { await recompute(env, uid); } catch (e) { console.error('recheck', uid, e); } }
    })());
  },
};

const okToken = (t) => typeof t === 'string' && t.length >= 10 && t.length <= 4096;

/* ---------- Google Play ---------- */
async function checkPlay(env, sku, token, acknowledge) {
  const type = SKUS[sku];
  const auth = { Authorization: `Bearer ${await googleToken(env.GOOGLE_SA_JSON, 'https://www.googleapis.com/auth/androidpublisher')}` };
  const pkg = encodeURIComponent(env.PACKAGE_NAME);
  const base = type === 'sub'
    ? `${PLAY}/${pkg}/purchases/subscriptions/${sku}/tokens/${encodeURIComponent(token)}`
    : `${PLAY}/${pkg}/purchases/products/${sku}/tokens/${encodeURIComponent(token)}`;
  const r = await fetch(base, { headers: auth });
  if (!r.ok) return { valid: false };
  const p = await r.json();
  let valid, expires = null;
  if (type === 'sub') { expires = Number(p.expiryTimeMillis) || 0; valid = expires > Date.now() && p.paymentState !== 0; }   // 0 = payment pending
  else valid = p.purchaseState === 0;                                                                                     // 0 = purchased (1 = refunded/cancelled)
  if (valid && acknowledge && p.acknowledgementState !== 1) {
    const a = await fetch(`${base}:acknowledge`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: '{}' });
    if (!a.ok) return { valid: true, acknowledged: false, expires };
  }
  return { valid, acknowledged: true, expires };
}

/* ---------- Pro status on the account ---------- */
async function linkPurchase(env, uid, p) {
  const id = await sha256(`${p.store}:${p.token}`);
  const fields = { uid: { stringValue: uid }, store: { stringValue: p.store }, sku: { stringValue: p.sku }, token: { stringValue: p.token }, linked: { timestampValue: new Date().toISOString() } };
  const created = await fs(env, 'POST', `proPurchases?documentId=${id}`, { fields });
  if (created.ok) return { ok: true };
  if (created.status !== 409) throw new Error('link failed ' + created.status);
  const existing = await (await fs(env, 'GET', `proPurchases/${id}`)).json();
  return { ok: existing.fields && existing.fields.uid && existing.fields.uid.stringValue === uid };
}
async function recompute(env, uid) {
  const mine = (await listPurchases(env, uid)).filter((p) => p.uid === uid);
  let active = false, expires = 0, sku = '', store = '';
  for (const p of mine) {
    const r = p.store === 'play' ? await checkPlay(env, p.sku, p.token, false) : { valid: false };
    if (!r.valid) continue;
    active = true;
    if (r.expires === null) { expires = null; sku = p.sku; store = p.store; break; }   // lifetime wins
    if (r.expires > expires) { expires = r.expires; sku = p.sku; store = p.store; }
  }
  const fields = {
    active: { booleanValue: active }, sku: { stringValue: sku }, store: { stringValue: store },
    expires: expires === null ? { nullValue: null } : { integerValue: String(expires || 0) },
    updated: { timestampValue: new Date().toISOString() },
  };
  const w = await fs(env, 'PATCH', `users/${uid}/meta/pro`, { fields });
  if (!w.ok) throw new Error('write failed ' + w.status);
  return { active, sku, store, expires };
}
async function listPurchases(env, uid) {
  const out = [];
  if (uid) {
    const q = { structuredQuery: { from: [{ collectionId: 'proPurchases' }], where: { fieldFilter: { field: { fieldPath: 'uid' }, op: 'EQUAL', value: { stringValue: uid } } } } };
    const rows = await (await fs(env, 'POST', ':runQuery', q, true)).json();
    for (const r of rows) if (r.document) out.push(plain(r.document.fields));
    return out;
  }
  let page = '';
  do {
    const r = await (await fs(env, 'GET', `proPurchases?pageSize=300${page ? `&pageToken=${page}` : ''}`)).json();
    for (const d of r.documents || []) out.push(plain(d.fields));
    page = r.nextPageToken || '';
  } while (page);
  return out;
}
const plain = (f) => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, Object.values(v)[0]]));

async function fs(env, method, path, body, root) {
  const base = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  const token = await googleToken(env.FIREBASE_SA_JSON || env.GOOGLE_SA_JSON, 'https://www.googleapis.com/auth/datastore');
  return fetch(root ? base + path : `${base}/${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/* ---------- Firebase sign-in check (ID token, RS256) ---------- */
let jwksCache = { at: 0, keys: [] };
async function verifyIdToken(env, jwt) {
  const parts = String(jwt || '').split('.');
  if (parts.length !== 3) return null;
  let head, claims;
  try { head = JSON.parse(b64urlText(parts[0])); claims = JSON.parse(b64urlText(parts[1])); } catch { return null; }
  if (head.alg !== 'RS256') return null;
  const now = Math.floor(Date.now() / 1000), pid = env.FIREBASE_PROJECT_ID;
  if (claims.aud !== pid || claims.iss !== `https://securetoken.google.com/${pid}` || !claims.sub || claims.exp <= now || claims.iat > now + 300) return null;
  if (Date.now() - jwksCache.at > 3600e3) {
    const r = await fetch(JWKS); if (!r.ok) return null;
    jwksCache = { at: Date.now(), keys: (await r.json()).keys || [] };
  }
  const jwk = jwksCache.keys.find((k) => k.kid === head.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  return ok ? claims.sub : null;
}

/* ---------- Google service-account access tokens ---------- */
const tokenCache = new Map();
async function googleToken(saJson, scope) {
  const cached = tokenCache.get(scope);
  if (cached && cached.exp > Date.now() + 60e3) return cached.token;
  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----|\s/g, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${b64url(new Uint8Array(sig))}`,
  });
  if (!r.ok) throw new Error('google auth failed');
  const j = await r.json();
  tokenCache.set(scope, { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 });
  return j.access_token;
}

/* ---------- helpers ---------- */
function b64url(bytes) { let s = ''; bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64urlBytes(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }
function b64urlText(s) { return new TextDecoder().decode(b64urlBytes(s)); }
async function sha256(s) { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
