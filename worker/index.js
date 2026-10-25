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
// Kept Pro+ (automatic Uber and Lyft sync through Argyle; switched off in the app until launch, see PLUS.md):
//   POST /plus/link       (Pro+ driver) creates or reuses their Argyle user and returns a one-hour token for Argyle's sign-in
//   POST /plus/webhook    (Argyle) new/changed/removed trips: re-adds up the affected days into users/{uid}/syncDays/{date}
//   POST /plus/days       (Pro+ driver) daily totals changed since the driver's last pull
//   POST /plus/disconnect (driver) deletes their Argyle user (and its connected accounts and data) and the synced totals
//   daily cron            also disconnects Argyle for anyone whose Pro+ ended more than 7 days ago, so it stops costing money
// Only daily totals are stored (earnings, tips, bonus, rides, trip time, trip miles per app); no trip addresses or routes.
//
// Settings (wrangler.toml): PACKAGE_NAME, FIREBASE_PROJECT_ID, ALLOWED_ORIGINS, ARGYLE_SANDBOX, PLUS_IMPORT_DAYS, DEFAULT_TZ
// Secrets: GOOGLE_SA_JSON (Play Console access), FIREBASE_SA_JSON (Firestore access; defaults to GOOGLE_SA_JSON),
//          ARGYLE_KEY_ID + ARGYLE_KEY_SECRET (Argyle API key), ARGYLE_WEBHOOK_SECRET (the secret set on the Argyle webhook)

const SKUS = { kept_pro_monthly: 'sub', kept_pro_yearly: 'sub', kept_pro_lifetime: 'inapp', kept_plus_monthly: 'sub', kept_plus_yearly: 'sub' };
const PLUS_SKUS = ['kept_plus_monthly', 'kept_plus_yearly'];   // Pro+ includes everything in Pro
const PLAY = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
const JWKS = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export default {
  async fetch(req, env, ctx) {
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
      const raw = await req.text();
      let body = {};
      try { body = JSON.parse(raw || '{}'); } catch { body = {}; }

      if (path === '/plus/webhook') {
        if (!(await argyleSigned(env, raw, req.headers.get('X-Argyle-Signature')))) return reply(401, { error: 'bad signature' });
        const work = handleArgyleEvent(env, body);
        if (ctx && ctx.waitUntil) ctx.waitUntil(work.catch((e) => console.error('argyle event', e))); else await work;
        return reply(200, { ok: true });   // Argyle wants an answer within 10 seconds; the adding up continues in the background
      }

      if (path.startsWith('/plus/')) {
        const uid = await verifyIdToken(env, (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
        if (!uid) return reply(401, { error: 'sign in first' });
        if (path === '/plus/disconnect') { await plusDisconnect(env, uid); return reply(200, { disconnected: true }); }
        if (!(await hasPlus(env, uid))) return reply(402, { error: 'Pro+ needed' });
        if (path === '/plus/link') return reply(200, await plusLink(env, uid));
        if (path === '/plus/days') return reply(200, await plusDays(env, uid, Number(body.since) || 0));
        return reply(404, { error: 'not found' });
      }

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
        try { await plusDisconnect(env, uid); } catch (e) { console.error('plus cleanup', e); }
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
      if (env.ARGYLE_KEY_ID) { try { await plusCleanup(env); } catch (e) { console.error('plus cleanup', e); } }
    })());
  },
};

const okToken = (t) => typeof t === 'string' && t.length >= 10 && t.length <= 4096;

/* ---------- Kept Pro+: Uber and Lyft sync through Argyle ---------- */
const ARGYLE = (env) => (String(env.ARGYLE_SANDBOX) === 'false' ? 'https://api.argyle.com' : 'https://api-sandbox.argyle.com');
async function argyle(env, method, pathOrUrl, body) {
  const url = /^https:\/\//.test(pathOrUrl) ? pathOrUrl : ARGYLE(env) + pathOrUrl;
  if (!url.startsWith(ARGYLE(env) + '/')) throw new Error('unexpected Argyle address');
  return fetch(url, {
    method, body: body ? JSON.stringify(body) : undefined,
    headers: { Authorization: 'Basic ' + btoa(`${env.ARGYLE_KEY_ID}:${env.ARGYLE_KEY_SECRET}`), 'Content-Type': 'application/json' },
  });
}
async function argyleSigned(env, raw, sig) {
  if (!env.ARGYLE_WEBHOOK_SECRET || !sig) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.ARGYLE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  const a = String(sig).trim().toLowerCase();
  if (a.length !== hex.length) return false;
  let diff = 0; for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ a.charCodeAt(i);   // timing-safe
  return diff === 0;
}
async function getDoc(env, path) { const r = await fs(env, 'GET', path); return r.ok ? plain((await r.json()).fields) : null; }

async function hasPlus(env, uid) {
  const p = await getDoc(env, `users/${uid}/meta/pro`);
  return !!(p && p.active === true && p.tier === 'plus' && (p.expires == null || Number(p.expires) > Date.now()));
}
async function plusLink(env, uid) {
  const sandbox = String(env.ARGYLE_SANDBOX) !== 'false';
  const meta = await getDoc(env, `users/${uid}/meta/argyle`);
  if (meta && meta.user) {
    const r = await argyle(env, 'POST', '/v2/user-tokens', { user: meta.user });
    if (r.ok) return { userToken: (await r.json()).user_token, sandbox };
    if (r.status !== 404) throw new Error('argyle token ' + r.status);   // 404: Argyle user gone, make a new one below
  }
  const r = await argyle(env, 'POST', '/v2/users', { external_id: uid });
  if (!r.ok) throw new Error('argyle user ' + r.status);
  const u = await r.json();
  const now = new Date().toISOString();
  await fs(env, 'PATCH', `users/${uid}/meta/argyle`, { fields: { user: { stringValue: u.id }, created: { timestampValue: now } } });
  await fs(env, 'PATCH', `argyleUsers/${u.id}`, { fields: { uid: { stringValue: uid }, created: { timestampValue: now } } });
  return { userToken: u.user_token, sandbox };
}
async function plusDays(env, uid, since) {
  const q = { structuredQuery: { from: [{ collectionId: 'syncDays' }], where: { fieldFilter: { field: { fieldPath: 'updated' }, op: 'GREATER_THAN', value: { integerValue: String(since) } } }, limit: 1000 } };
  const rows = await (await fs(env, 'POST', `/users/${uid}:runQuery`, q, true)).json();
  const days = []; let cursor = since;
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r.document) continue;
    const f = r.document.fields || {};
    const side = (m) => Object.fromEntries(Object.entries((m && m.mapValue && m.mapValue.fields) || {}).map(([k, v]) => [k, Number(Object.values(v)[0]) || 0]));
    const updated = Number(f.updated && f.updated.integerValue) || 0;
    cursor = Math.max(cursor, updated);
    days.push({ date: f.date && f.date.stringValue, l: side(f.l), u: side(f.u) });
  }
  const meta = await getDoc(env, `users/${uid}/meta/argyle`);
  return { days, cursor, connected: !!(meta && meta.user) };
}
async function plusDisconnect(env, uid) {
  const meta = await getDoc(env, `users/${uid}/meta/argyle`);
  if (meta && meta.user && env.ARGYLE_KEY_ID) {
    const r = await argyle(env, 'DELETE', `/v2/users/${meta.user}`);   // removes their connected Uber/Lyft accounts and data at Argyle
    if (!r.ok && r.status !== 404) throw new Error('argyle delete ' + r.status);
    await fs(env, 'DELETE', `argyleUsers/${meta.user}`);
  }
  await fs(env, 'DELETE', `users/${uid}/meta/argyle`);
  let page = '';
  do {
    const r = await (await fs(env, 'GET', `users/${uid}/syncDays?pageSize=300${page ? `&pageToken=${page}` : ''}`)).json();
    for (const d of r.documents || []) await fetch(`https://firestore.googleapis.com/v1/${d.name}`, { method: 'DELETE', headers: { Authorization: `Bearer ${await googleToken(env.FIREBASE_SA_JSON || env.GOOGLE_SA_JSON, 'https://www.googleapis.com/auth/datastore')}` } });
    page = r.nextPageToken || '';
  } while (page);
}
// Daily: anyone whose Pro+ ended more than 7 days ago is disconnected from Argyle (stops the per-driver cost).
async function plusCleanup(env) {
  let page = '';
  do {
    const r = await (await fs(env, 'GET', `argyleUsers?pageSize=300${page ? `&pageToken=${page}` : ''}`)).json();
    for (const d of r.documents || []) {
      const uid = plain(d.fields).uid; if (!uid) continue;
      const meta = await getDoc(env, `users/${uid}/meta/argyle`) || {};
      if (await hasPlus(env, uid)) { if (meta.lapsed) await fs(env, 'PATCH', `users/${uid}/meta/argyle?updateMask.fieldPaths=lapsed`, { fields: {} }); continue; }
      const lapsed = Number(meta.lapsed) || 0;
      if (!lapsed) await fs(env, 'PATCH', `users/${uid}/meta/argyle?updateMask.fieldPaths=lapsed`, { fields: { lapsed: { integerValue: String(Date.now()) } } });
      else if (Date.now() - lapsed > 7 * 864e5) await plusDisconnect(env, uid);
    }
    page = r.nextPageToken || '';
  } while (page);
}

// Argyle tells us trips were added, changed or removed in a time window: re-add up every day in that window.
const GIG_EVENTS = ['gigs.added', 'gigs.updated', 'gigs.removed', 'gigs.partially_synced', 'gigs.fully_synced'];
async function handleArgyleEvent(env, ev) {
  if (!ev || !GIG_EVENTS.includes(ev.event) || !ev.data || !ev.data.user) return;
  const link = await getDoc(env, `argyleUsers/${ev.data.user}`);
  if (!link || !link.uid) return;   // not a Kept driver (or already disconnected)
  const d = ev.data, now = Date.now();
  const oldest = now - (Number(env.PLUS_IMPORT_DAYS) || 90) * 864e5;   // first sync brings in at most this many days of history
  let from = Date.parse(d.added_from || d.updated_from || d.removed_from || d.available_from || '') || now - 14 * 864e5;
  let to = Date.parse(d.added_to || d.updated_to || d.removed_to || d.available_to || '') || now;
  from = Math.max(from, oldest); to = Math.min(Math.max(to, from), now + 864e5);
  await resyncWindow(env, link.uid, ev.data.user, from, to, ev.event === 'gigs.removed');
}
async function resyncWindow(env, uid, argyleUser, from, to, writeEmpty) {
  // Fetch two extra days each side so every local date we rewrite is complete in any US time zone.
  const qFrom = new Date(from - 2 * 864e5).toISOString(), qTo = new Date(to + 2 * 864e5).toISOString();
  let url = `/v2/gigs?user=${encodeURIComponent(argyleUser)}&from_start_datetime=${encodeURIComponent(qFrom)}&to_start_datetime=${encodeURIComponent(qTo)}&limit=200`;
  const gigs = [];
  for (let pages = 0; url && pages < 100; pages++) {
    const r = await argyle(env, 'GET', url);
    if (!r.ok) throw new Error('argyle gigs ' + r.status);
    const j = await r.json();
    gigs.push(...(j.results || []));
    url = j.next || '';
  }
  const days = dailyTotals(gigs, env.DEFAULT_TZ || 'America/Phoenix');
  const first = isoDay(from - 864e5), last = isoDay(to + 864e5);   // dates fully covered by what we fetched
  const stamp = Date.now();
  const dates = new Set(Object.keys(days).filter((k) => k >= first && k <= last));
  if (writeEmpty) for (let t = Date.parse(first); isoDay(t) <= last; t += 864e5) dates.add(isoDay(t));
  for (const date of dates) {
    const v = days[date] || { l: emptySide(), u: emptySide() };
    const map = (o) => ({ mapValue: { fields: Object.fromEntries(Object.entries(o).map(([k, n]) => [k, { doubleValue: n }])) } });
    await fs(env, 'PATCH', `users/${uid}/syncDays/${date}`, { fields: { date: { stringValue: date }, l: map(v.l), u: map(v.u), updated: { integerValue: String(stamp) } } });
  }
}
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
const emptySide = () => ({ pay: 0, tips: 0, bonus: 0, rides: 0, secs: 0, miles: 0 });
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
// Adds up Argyle gigs into Kept days: { 'YYYY-MM-DD': { l: {...}, u: {...} } }, by each trip's local start date.
export function dailyTotals(gigs, defaultTz) {
  const out = {};
  for (const g of gigs || []) {
    const emp = String(g.employer || '').toLowerCase();
    const side = emp.includes('lyft') ? 'l' : emp.includes('uber') ? 'u' : null;
    if (!side || !g.start_datetime) continue;
    if (g.type && !/ride|rideshare|trip|services|delivery/i.test(String(g.type))) continue;
    let date;
    try { date = new Intl.DateTimeFormat('en-CA', { timeZone: g.timezone || defaultTz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(g.start_datetime)); }
    catch { date = new Intl.DateTimeFormat('en-CA', { timeZone: defaultTz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(g.start_datetime)); }
    const day = out[date] || (out[date] = { l: emptySide(), u: emptySide() });
    const s = day[side], inc = g.income || {};
    const tips = num(inc.tips), bonus = num(inc.bonus);
    const pay = inc.pay != null ? num(inc.pay) + num(inc.other) : Math.max(0, num(inc.total) - tips - bonus);
    s.pay += pay; s.tips += tips; s.bonus += bonus;
    const done = !g.status || String(g.status).toLowerCase() === 'completed';
    if (done) s.rides += 1;
    let secs = num(g.duration);
    if (!secs && g.end_datetime) secs = Math.max(0, (Date.parse(g.end_datetime) - Date.parse(g.start_datetime)) / 1000);
    s.secs += secs;
    const dist = num(g.distance);
    s.miles += /^k/i.test(String(g.distance_unit || '')) ? dist * 0.621371 : dist;
  }
  for (const d of Object.values(out)) for (const s of [d.l, d.u]) for (const k of Object.keys(s)) s[k] = Math.round(s[k] * 100) / 100;
  return out;
}

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
  let active = false, expires = 0, sku = '', store = '', plusUntil = 0;
  for (const p of mine) {
    const r = p.store === 'play' ? await checkPlay(env, p.sku, p.token, false) : { valid: false };
    if (!r.valid) continue;
    active = true;
    if (PLUS_SKUS.includes(p.sku)) plusUntil = Math.max(plusUntil, r.expires || 0);
    if (r.expires === null) { expires = null; sku = p.sku; store = p.store; break; }   // lifetime wins
    if (r.expires > expires) { expires = r.expires; sku = p.sku; store = p.store; }
  }
  // Gifted Pro (set by the owner in the Firebase console: gift = true, optional giftUntil in ms) is kept on every recheck.
  const cur = await fs(env, 'GET', `users/${uid}/meta/pro`);
  const old = cur.ok ? plain((await cur.json()).fields) : {};
  const gift = old.gift === true, giftUntil = old.giftUntil != null ? Number(old.giftUntil) : null;
  const giftPlus = gift && old.giftTier === 'plus' && (giftUntil === null || giftUntil > Date.now());   // gift Pro+ with giftTier = "plus"
  const tier = active && plusUntil > Date.now() || giftPlus ? 'plus' : '';
  if (gift && (giftUntil === null || giftUntil > Date.now()) && expires !== null) {
    active = true;
    if (giftUntil === null) { expires = null; sku = sku || 'gift'; store = store || 'gift'; }
    else if (giftUntil > expires) { expires = giftUntil; sku = sku || 'gift'; store = store || 'gift'; }
  }
  const fields = {
    ...(gift ? { gift: { booleanValue: true }, giftUntil: giftUntil === null ? { nullValue: null } : { integerValue: String(giftUntil) } } : {}),
    ...(gift && old.giftTier ? { giftTier: { stringValue: String(old.giftTier) } } : {}),
    active: { booleanValue: active }, tier: { stringValue: tier }, sku: { stringValue: sku }, store: { stringValue: store },
    expires: expires === null ? { nullValue: null } : { integerValue: String(expires || 0) },
    updated: { timestampValue: new Date().toISOString() },
  };
  const w = await fs(env, 'PATCH', `users/${uid}/meta/pro`, { fields });
  if (!w.ok) throw new Error('write failed ' + w.status);
  return { active, sku, store, expires, tier };
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
