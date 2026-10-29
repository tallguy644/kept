// Kept Offer Check server test: buying, gifting, linking the companion app with a one-time code, status, unlinking.
// Runs the Worker against in-memory stand-ins for Firestore, Firebase sign-in, Google auth and Google Play.
// Run with: node worker/test/offer.test.mjs
import worker from '../index.js';
import assert from 'node:assert/strict';
import { webcrypto as crypto } from 'node:crypto';

const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const PROJECT = 'kept-test';

// --- keys: one for "Firebase" ID tokens, one for the "service account"
const fbKey = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const jwk = { ...(await crypto.subtle.exportKey('jwk', fbKey.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
async function idToken(uid) {
  const now = Math.floor(Date.now() / 1000);
  const u = `${enc({ alg: 'RS256', kid: 'k1' })}.${enc({ aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`, sub: uid, iat: now, exp: now + 3600 })}`;
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', fbKey.privateKey, new TextEncoder().encode(u));
  return `${u}.${Buffer.from(sig).toString('base64url')}`;
}
const saKey = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign']);
const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', saKey.privateKey)).toString('base64');
const SA = JSON.stringify({ client_email: 'sa@test', private_key: `-----BEGIN PRIVATE KEY-----\n${pkcs8}\n-----END PRIVATE KEY-----\n` });

// --- in-memory Firestore (just the REST calls the Worker makes)
const db = new Map();   // 'users/u1/meta/pro' -> fields
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const val = (v) => Object.values(v)[0];
function fsHandle(method, url, body) {
  const u = new URL(url); let path = decodeURIComponent(u.pathname).replace(`/v1/projects/${PROJECT}/databases/(default)/documents`, '').replace(/^\//, '');
  if (path.endsWith(':runQuery')) {
    const parent = path.replace(/:runQuery$/, '').replace(/^\//, '');
    const q = body.structuredQuery, col = q.from[0].collectionId, f = q.where.fieldFilter;
    const rows = [];
    for (const [k, fields] of db) {
      const parts = k.split('/'); const p = parts.slice(0, -2).join('/');
      if (parts[parts.length - 2] !== col || p !== parent) continue;
      const have = fields[f.field.fieldPath]; if (!have) continue;
      const a = val(have), b = val(f.value);
      if (f.op === 'EQUAL' ? a === b : Number(a) > Number(b)) rows.push({ document: { name: `${FS}/${k}`, fields } });
    }
    return new Response(JSON.stringify(rows.length ? rows : [{}]));
  }
  if (method === 'GET' && u.searchParams.has('pageSize')) {
    const docs = [...db].filter(([k]) => k.startsWith(path + '/') && k.split('/').length === path.split('/').length + 1).map(([k, fields]) => ({ name: `projects/${PROJECT}/databases/(default)/documents/${k}`, fields }));
    return new Response(JSON.stringify({ documents: docs }));
  }
  if (method === 'POST') { const id = u.searchParams.get('documentId'); const k = `${path}/${id}`; if (db.has(k)) return new Response('{}', { status: 409 }); db.set(k, body.fields); return new Response('{}'); }
  if (method === 'GET') return db.has(path) ? new Response(JSON.stringify({ fields: db.get(path) })) : new Response('{}', { status: 404 });
  if (method === 'PATCH') {
    const mask = u.searchParams.getAll('updateMask.fieldPaths');
    if (mask.length) { const cur = { ...(db.get(path) || {}) }; for (const m of mask) { if (body.fields[m]) cur[m] = body.fields[m]; else delete cur[m]; } db.set(path, cur); }
    else db.set(path, body.fields);
    return new Response('{}');
  }
  if (method === 'DELETE') { db.delete(path); return new Response('{}'); }
  return new Response('{}', { status: 400 });
}

// --- fake Google Play: purchase tokens -> subscription state
const play = new Map();
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url, method = init.method || 'GET';
  if (url === 'https://oauth2.googleapis.com/token') return new Response(JSON.stringify({ access_token: 'ga', expires_in: 3600 }));
  const body = init.body ? JSON.parse(init.body) : undefined;
  if (url.startsWith('https://firestore.googleapis.com/')) return fsHandle(method, url, body);
  if (url.includes('securetoken@system.gserviceaccount.com')) return new Response(JSON.stringify({ keys: [jwk] }));
  if (url.startsWith('https://androidpublisher.googleapis.com/')) {
    if (url.endsWith(':acknowledge')) return new Response('{}');
    const token = decodeURIComponent(url.split('/tokens/')[1]);
    const p = play.get(token); return p ? new Response(JSON.stringify(p)) : new Response('{}', { status: 404 });
  }
  throw new Error('unexpected fetch ' + url);
};

const env = { FIREBASE_PROJECT_ID: PROJECT, GOOGLE_SA_JSON: SA, ALLOWED_ORIGINS: 'https://keptforgigworkers.com', PACKAGE_NAME: 'x' };
async function post(path, body, { uid, device } = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (uid) h.Authorization = 'Bearer ' + await idToken(uid);
  if (device) h.Authorization = 'Device ' + device;
  const r = await worker.fetch(new Request('https://w.test' + path, { method: 'POST', headers: h, body: JSON.stringify(body || {}) }), env, {});
  return { status: r.status, json: await r.json() };
}
let n = 0; const ok = (m) => console.log(`  ✓ ${m}`, ++n);
const TOKEN = 'offer-token-0123456789';

// 1. Offer Check is needed to pair; plain Pro is not enough
assert.equal((await post('/offer/pair', {})).status, 401);
assert.equal((await post('/offer/pair', {}, { uid: 'u1' })).status, 402);
play.set('pro-token-0123456789', { expiryTimeMillis: String(Date.now() + 30 * 864e5), paymentState: 1, acknowledgementState: 1 });
assert.equal((await post('/pro/claim', { store: 'play', sku: 'kept_pro_monthly', token: 'pro-token-0123456789' }, { uid: 'u1' })).status, 200);
assert.equal((await post('/offer/pair', {}, { uid: 'u1' })).status, 402);
ok('pairing a phone needs a signed-in account with Offer Check (Pro alone is refused)');

// 2. buying Offer Check marks the account (and includes Pro)
play.set(TOKEN, { expiryTimeMillis: String(Date.now() + 30 * 864e5), paymentState: 1, acknowledgementState: 0 });
const c = await post('/pro/claim', { store: 'play', sku: 'kept_offer_monthly', token: TOKEN }, { uid: 'u2' });
assert.equal(c.status, 200); assert.equal(c.json.active, true); assert.equal(c.json.offer, true); assert.ok(c.json.offerExpires > Date.now());
assert.equal(db.get('users/u2/meta/pro').offer.booleanValue, true);
ok('buying Offer Check unlocks Pro and Offer Check on the account');

// 3. pair: saves settings (clamped) and returns a one-time 8-character code
const pr = await post('/offer/pair', { settings: { cpm: 0.4567, target: 99, car: true } }, { uid: 'u2' });
assert.equal(pr.status, 200); assert.match(pr.json.code, /^[A-HJ-NP-Z2-9]{8}$/);
const s = db.get('users/u2/meta/offer'); assert.equal(s.cpm.doubleValue, 0.457); assert.equal(s.target.doubleValue, 5); assert.equal(s.car.booleanValue, true);
ok('pairing saves the cost per mile and profit goal (kept within sensible limits) and gives a one-time code');

// 4. link: wrong code refused; right code (any spacing/case) gives a device key once
assert.equal((await post('/offer/link', { code: 'ABCD' })).status, 400);
assert.equal((await post('/offer/link', { code: 'ZZZZZZZZ' })).status, 404);
const typed = pr.json.code.toLowerCase().replace(/^(....)/, '$1-');
const lk = await post('/offer/link', { code: typed, device: 'Pixel 8 <script>' });
assert.equal(lk.status, 200); assert.ok(lk.json.key.length >= 40); assert.equal(lk.json.active, true); assert.equal(lk.json.cpm, 0.457); assert.equal(lk.json.target, 5);
assert.equal((await post('/offer/link', { code: pr.json.code })).status, 404);
const dev = [...db].find(([k]) => k.startsWith('offerDevices/'));
assert.equal(dev[1].uid.stringValue, 'u2'); assert.equal(dev[1].name.stringValue, 'Pixel 8 script');
assert.ok(!JSON.stringify([...db]).includes(lk.json.key), 'only a hash of the key is stored');
ok('the companion app trades the code for a device key; the code works once; only a hash of the key is stored');

// 5. expired code
const pr2 = await post('/offer/pair', {}, { uid: 'u2' });
db.get(`offerPairs/${pr2.json.code}`).exp = { integerValue: String(Date.now() - 1) };
assert.equal((await post('/offer/link', { code: pr2.json.code })).status, 410);
assert.ok(!db.has(`offerPairs/${pr2.json.code}`));
ok('codes expire after 10 minutes');

// 6. status with the device key; settings update shows up
assert.equal((await post('/offer/status', {}, { device: 'x'.repeat(43) })).status, 401);
assert.equal((await post('/offer/status', {})).status, 401);
const st = await post('/offer/status', {}, { device: lk.json.key });
assert.equal(st.status, 200); assert.equal(st.json.active, true);
assert.equal((await post('/offer/settings', { settings: { cpm: 0.31, target: 0.5 } }, { uid: 'u2' })).status, 200);
const st2 = await post('/offer/status', {}, { device: lk.json.key });
assert.equal(st2.json.cpm, 0.31); assert.equal(st2.json.target, 0.5); assert.equal(st2.json.car, false);
ok('the companion app reads status and the latest cost per mile with its device key');

// 7. subscription ends: status says inactive after the daily recheck
play.set(TOKEN, { expiryTimeMillis: String(Date.now() - 1000), paymentState: 1, acknowledgementState: 1 });
await post('/pro/refresh', {}, { uid: 'u2' });
const st3 = await post('/offer/status', {}, { device: lk.json.key });
assert.equal(st3.status, 200); assert.equal(st3.json.active, false);
assert.equal((await post('/offer/pair', {}, { uid: 'u2' })).status, 402);
ok('when Offer Check ends, the companion app is told it is no longer active');

// 8. gifted Offer Check (giftOffer = true) survives rechecks
db.set('users/u3/meta/pro', { gift: { booleanValue: true }, giftUntil: { nullValue: null }, giftOffer: { booleanValue: true } });
const g = await post('/pro/refresh', {}, { uid: 'u3' });
assert.equal(g.json.offer, true); assert.equal(g.json.offerExpires, null); assert.equal(g.json.active, true);
assert.equal((await post('/offer/pair', {}, { uid: 'u3' })).status, 200);
ok('Offer Check can be gifted with giftOffer = true');

// 9. unlink: the phone itself, or every phone from Kept, or Delete account
assert.equal((await post('/offer/unlink', {}, { device: lk.json.key })).status, 200);
assert.equal((await post('/offer/status', {}, { device: lk.json.key })).status, 401);
const keys = [];
for (let i = 0; i < 2; i++) { const p = await post('/offer/pair', {}, { uid: 'u3' }); keys.push((await post('/offer/link', { code: p.json.code })).json.key); }
assert.equal((await post('/offer/unlink-all', {}, { uid: 'u3' })).status, 200);
for (const k of keys) assert.equal((await post('/offer/status', {}, { device: k })).status, 401);
const p3 = await post('/offer/pair', { settings: { cpm: 0.3, target: 0.2 } }, { uid: 'u3' }); const k3 = (await post('/offer/link', { code: p3.json.code })).json.key;
await post('/account/delete', {}, { uid: 'u3' });
assert.equal((await post('/offer/status', {}, { device: k3 })).status, 401); assert.ok(!db.has('users/u3/meta/offer'));
ok('phones can be unlinked one at a time, all at once from Kept, and Delete account removes them');

console.log(`\nAll ${n} Offer Check server checks passed.`);
