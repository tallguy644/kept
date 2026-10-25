// Kept Pro+ server test: runs the Worker against in-memory stand-ins for Firestore, Firebase sign-in, Google auth
// and Argyle. Run with: node worker/test/plus.test.mjs
import worker, { dailyTotals } from '../index.js';
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

// --- fake Argyle
const argyleUsers = new Map(); let nextUser = 1; const calls = [];
const gigs = [
  // Lyft trip on Oct 20 local (Phoenix), Uber trip same day, one Uber trip just after local midnight -> Oct 21
  { id: 'g1', employer: 'lyft', type: 'rideshare', status: 'completed', start_datetime: '2026-10-20T17:00:00Z', end_datetime: '2026-10-20T17:30:00Z', duration: 1800, distance: '10.5', distance_unit: 'miles', timezone: 'America/Phoenix', income: { currency: 'USD', pay: '15.25', tips: '3.00', bonus: '0', other: '0', total: '18.25' } },
  { id: 'g2', employer: 'Uber', type: 'rideshare', status: 'completed', start_datetime: '2026-10-20T18:00:00Z', duration: 1200, distance: '16.09', distance_unit: 'km', timezone: 'America/Phoenix', income: { pay: '12.00', tips: '0', bonus: '5.00', total: '17.00' } },
  { id: 'g3', employer: 'uber', type: 'rideshare', status: 'cancelled', start_datetime: '2026-10-21T07:30:00Z', duration: 0, distance: '0', distance_unit: 'miles', timezone: 'America/Phoenix', income: { pay: '3.75', tips: '0', total: '3.75' } },
  { id: 'g4', employer: 'doordash', type: 'delivery', status: 'completed', start_datetime: '2026-10-20T19:00:00Z', income: { pay: '8' } },
];
function argyleHandle(method, url, body) {
  calls.push(`${method} ${url.replace(/^https:\/\/[^/]+/, '')}`);
  const u = new URL(url);
  if (u.pathname === '/v2/users' && method === 'POST') { const id = `au-${nextUser++}`; argyleUsers.set(id, body); return new Response(JSON.stringify({ id, user_token: `tok-${id}` })); }
  if (u.pathname === '/v2/user-tokens' && method === 'POST') return argyleUsers.has(body.user) ? new Response(JSON.stringify({ user_token: `tok2-${body.user}` })) : new Response('{}', { status: 404 });
  if (u.pathname.startsWith('/v2/users/') && method === 'DELETE') { argyleUsers.delete(u.pathname.split('/').pop()); return new Response(null, { status: 204 }); }
  if (u.pathname === '/v2/gigs') {
    const from = Date.parse(u.searchParams.get('from_start_datetime')), to = Date.parse(u.searchParams.get('to_start_datetime'));
    const list = gigs.filter((g) => { const t = Date.parse(g.start_datetime); return t >= from && t <= to; });
    if (!u.searchParams.get('cursor')) return new Response(JSON.stringify({ results: list.slice(0, 2), next: `https://api-sandbox.argyle.com/v2/gigs?${u.searchParams}&cursor=p2`, previous: null }));
    return new Response(JSON.stringify({ results: list.slice(2), next: null, previous: null }));
  }
  return new Response('{}', { status: 404 });
}

globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url, method = init.method || 'GET';
  if (url === 'https://oauth2.googleapis.com/token') return new Response(JSON.stringify({ access_token: 'ga', expires_in: 3600 }));
  const body = init.body ? JSON.parse(init.body) : undefined;
  if (url.startsWith('https://firestore.googleapis.com/')) return fsHandle(method, url, body);
  if (url === 'https://oauth2.googleapis.com/token') return new Response(JSON.stringify({ access_token: 'ga', expires_in: 3600 }));
  if (url.includes('securetoken@system.gserviceaccount.com')) return new Response(JSON.stringify({ keys: [jwk] }));
  if (url.startsWith('https://api-sandbox.argyle.com/')) {
    assert.equal(init.headers.Authorization, 'Basic ' + btoa('kid:ksecret'));
    return argyleHandle(method, url, body);
  }
  throw new Error('unexpected fetch ' + url);
};

const env = { FIREBASE_PROJECT_ID: PROJECT, GOOGLE_SA_JSON: SA, ALLOWED_ORIGINS: 'https://keptforgigworkers.com', PACKAGE_NAME: 'x',
  ARGYLE_SANDBOX: 'true', ARGYLE_KEY_ID: 'kid', ARGYLE_KEY_SECRET: 'ksecret', ARGYLE_WEBHOOK_SECRET: 'whsec', PLUS_IMPORT_DAYS: '3650', DEFAULT_TZ: 'America/Phoenix' };
const waits = []; const ctx = { waitUntil: (p) => waits.push(p) };
async function post(path, body, uid, headers = {}) {
  const raw = JSON.stringify(body || {});
  const h = { 'Content-Type': 'application/json', Origin: 'https://keptforgigworkers.com', ...headers };
  if (uid) h.Authorization = 'Bearer ' + await idToken(uid);
  const r = await worker.fetch(new Request('https://w.test' + path, { method: 'POST', headers: h, body: raw }), env, ctx);
  await Promise.all(waits.splice(0));
  return { status: r.status, json: await r.json() };
}
async function sign(raw) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('whsec'), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  return Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw))).toString('hex');
}
async function webhook(ev, badSig) {
  const raw = JSON.stringify(ev);
  const r = await worker.fetch(new Request('https://w.test/plus/webhook', { method: 'POST', headers: { 'X-Argyle-Signature': badSig ? 'abc' : await sign(raw) }, body: raw }), env, ctx);
  await Promise.all(waits.splice(0));
  return r.status;
}
let n = 0; const ok = (m) => console.log(`  ✓ ${m}`, ++n);

// 1. dailyTotals
const t = dailyTotals(gigs, 'America/Phoenix');
assert.deepEqual(Object.keys(t).sort(), ['2026-10-20', '2026-10-21']);
assert.deepEqual(t['2026-10-20'].l, { pay: 15.25, tips: 3, bonus: 0, rides: 1, secs: 1800, miles: 10.5 });
assert.deepEqual(t['2026-10-20'].u, { pay: 12, tips: 0, bonus: 5, rides: 1, secs: 1200, miles: 10 });
assert.equal(t['2026-10-21'].u.rides, 0); assert.equal(t['2026-10-21'].u.pay, 3.75);   // cancelled: fee counts, not a ride
ok('trips add up into local days, km become miles, DoorDash ignored, cancelled trips are not rides');

// 2. Pro+ required
assert.equal((await post('/plus/link', {}, 'u1')).status, 402);
db.set('users/u1/meta/pro', { active: { booleanValue: true }, tier: { stringValue: '' }, expires: { nullValue: null } });
assert.equal((await post('/plus/link', {}, 'u1')).status, 402);
assert.equal((await post('/plus/link', {})).status, 401);
ok('linking needs a signed-in Pro+ account (plain Pro is refused)');

// 3. link creates an Argyle user once, then reuses it
db.set('users/u1/meta/pro', { active: { booleanValue: true }, tier: { stringValue: 'plus' }, expires: { integerValue: String(Date.now() + 864e5) } });
const l1 = await post('/plus/link', {}, 'u1');
assert.equal(l1.status, 200); assert.equal(l1.json.userToken, 'tok-au-1'); assert.equal(l1.json.sandbox, true);
assert.equal(val(db.get('argyleUsers/au-1').uid), 'u1'); assert.equal(argyleUsers.get('au-1').external_id, 'u1');
const l2 = await post('/plus/link', {}, 'u1');
assert.equal(l2.json.userToken, 'tok2-au-1'); assert.equal(argyleUsers.size, 1);
ok('first connect creates the Argyle user; later connects get a fresh token for the same user');

// 4. webhook: signature checked, days written
assert.equal(await webhook({ event: 'gigs.added', data: { user: 'au-1', account: 'a1', added_from: '2026-10-20T00:00:00Z', added_to: '2026-10-21T23:59:59Z' } }, true), 401);
assert.equal(await webhook({ event: 'gigs.added', data: { user: 'au-1', account: 'a1', added_from: '2026-10-20T00:00:00Z', added_to: '2026-10-21T23:59:59Z' } }), 200);
assert.ok(calls.some((c) => c.includes('cursor=p2')), 'follows pagination');
const d20 = db.get('users/u1/syncDays/2026-10-20');
assert.equal(val(d20.l.mapValue.fields.pay), 15.25); assert.equal(val(d20.u.mapValue.fields.bonus), 5);
assert.equal(await webhook({ event: 'gigs.added', data: { user: 'au-unknown', added_from: '2026-10-20T00:00:00Z' } }), 200);
ok('webhooks need Argyle\'s signature; trips (all pages) become daily totals; unknown users are ignored');

// 5. /plus/days returns changes since the cursor
const p1 = await post('/plus/days', { since: 0 }, 'u1');
assert.equal(p1.status, 200); assert.equal(p1.json.connected, true);
const day = p1.json.days.find((x) => x.date === '2026-10-20');
assert.deepEqual(day.l, { pay: 15.25, tips: 3, bonus: 0, rides: 1, secs: 1800, miles: 10.5 });
const p2 = await post('/plus/days', { since: p1.json.cursor }, 'u1');
assert.equal(p2.json.days.length, 0);
ok('the app gets each day\'s totals, and only what changed since its last pull');

// 6. removed trips: days are rewritten (to zero if nothing is left)
gigs.splice(0, 2);
assert.equal(await webhook({ event: 'gigs.removed', data: { user: 'au-1', removed_from: '2026-10-20T00:00:00Z', removed_to: '2026-10-20T23:59:59Z' } }), 200);
assert.equal(val(db.get('users/u1/syncDays/2026-10-20').l.mapValue.fields.pay), 0);
const p3 = await post('/plus/days', { since: p1.json.cursor }, 'u1');
assert.ok(p3.json.days.some((x) => x.date === '2026-10-20' && x.l.pay === 0));
ok('removed trips come off the day');

// 7. lapsed Pro+: refused, then disconnected by the daily job after 7 days
db.set('users/u1/meta/pro', { active: { booleanValue: true }, tier: { stringValue: '' }, expires: { nullValue: null } });
assert.equal((await post('/plus/days', { since: 0 }, 'u1')).status, 402);
const cron = []; await worker.scheduled({}, env, { waitUntil: (p) => cron.push(p) }); await Promise.all(cron);
assert.ok(Number(val(db.get('users/u1/meta/argyle').lapsed)) > 0); assert.equal(argyleUsers.size, 1);
db.get('users/u1/meta/argyle').lapsed = { integerValue: String(Date.now() - 8 * 864e5) };
const cron2 = []; await worker.scheduled({}, env, { waitUntil: (p) => cron2.push(p) }); await Promise.all(cron2);
assert.equal(argyleUsers.size, 0); assert.ok(!db.has('users/u1/meta/argyle')); assert.ok(![...db.keys()].some((k) => k.startsWith('users/u1/syncDays/')));
ok('after Pro+ ends, sync stops; 7 days later the Argyle user and synced totals are deleted');

// 8. disconnect and account deletion clean up
db.set('users/u2/meta/pro', { active: { booleanValue: true }, tier: { stringValue: 'plus' }, expires: { nullValue: null } });
await post('/plus/link', {}, 'u2'); assert.equal(argyleUsers.size, 1);
const dis = await post('/plus/disconnect', {}, 'u2');
assert.equal(dis.status, 200); assert.equal(argyleUsers.size, 0); assert.ok(!db.has('users/u2/meta/argyle'));
await post('/plus/link', {}, 'u2'); assert.equal(argyleUsers.size, 1);
await post('/account/delete', {}, 'u2'); assert.equal(argyleUsers.size, 0);
ok('Disconnect and Delete account remove the Argyle user');

console.log(`\nAll ${n} Pro+ server checks passed.`);
