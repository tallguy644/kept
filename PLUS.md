# Kept Pro+: launch checklist

Pro+ is **built and switched off**. It is everything in Kept Pro, plus **automatic Uber and Lyft sync**: the driver connects
their Uber and Lyft accounts once (through Argyle; Kept never sees the passwords), and their days fill in on their own:
earnings, tips, bonuses, rides, time on trips and trip miles. Gas, tolls, maintenance and deposits stay manual.

Nothing about Pro+ shows to drivers until `plus.enabled` is `true` in `pro.js`. Launch Kept Pro first (see `PRO.md`).

**Preview anytime:** `?pro=plusoffer` shows the Pro+ plans on the Pro screen; `?pro=plus&plus=demo` acts as if Pro+ is
active and fills in sample synced days (nothing is sent anywhere).

## How it works

```
Driver taps "Connect Uber & Lyft" (More → Automatic sync)
  → app asks the Kept server for a one-hour Argyle token          POST /plus/link   (Pro+ only)
  → Argyle's secure sign-in opens; driver signs in to Uber / Lyft
Argyle collects the trips and calls the Kept server               POST /plus/webhook (signed by Argyle)
  → server adds the trips up per day → users/{uid}/syncDays/{date}  (daily totals only, no addresses)
App pulls new daily totals (at start, on return, every 15 min)    POST /plus/days
  → merges them into the driver's days
```

**Merging is safe:** a field is only filled in if it's empty or still holds the last value Uber/Lyft sent. Anything the
driver typed or corrected is never overwritten, and edits keep working with later syncs. Synced days show a "Synced" tag.

**Costs stop automatically:** the server refuses sync for anyone without active Pro+, and the daily job deletes the
Argyle user (and its connected accounts) 7 days after a driver's Pro+ ends. "Disconnect" and "Delete account" delete it
right away. Days already synced stay in the driver's Kept.

## 1. Argyle

1. Sign a contract with Argyle (sales@argyle.com / argyle.com). Ask for **gig / rideshare data (Uber and Lyft), ongoing
   refresh**, priced per connected driver per month. Set the Pro+ price so Argyle's cost is under about a third of it.
2. Argyle Console → **API keys**: copy the key ID and secret (sandbox first, production later).
3. Argyle Console → **Webhooks**: add `https://<your worker>/plus/webhook` with a secret, subscribed to
   `gigs.added`, `gigs.updated`, `gigs.removed`, `gigs.partially_synced`, `gigs.fully_synced`.
4. Optional: look up the Argyle **item IDs** for Uber Driver and Lyft Driver and put them in `pro.js` → `plus.items`, so
   Argyle's sign-in goes straight to those two.
5. Confirm with Argyle that `POST /v2/user-tokens` (new token for an existing user) is enabled on your account. The
   server uses it every time a driver reconnects. (Their docs list user tokens; this is the one thing to double-check.)

## 2. Store products (same product IDs in both stores)

- Google Play → Monetize → Subscriptions: `kept_plus_monthly` ($7.99/month), `kept_plus_yearly` ($69.99/year)
- Microsoft Partner Center → Add-ons: `kept_plus_monthly` (1 month), `kept_plus_yearly` (1 year)
- Put both Pro and Pro+ subscriptions in the **same subscription group** in Play Console if you want Google to handle
  upgrades/downgrades; until then the app tells drivers to cancel Pro after upgrading so they aren't charged twice.
- A free trial on Pro+ costs real money per driver (Argyle charges for every connection). Keep it short or skip it.
- Note: the Google Play app is now a Capacitor app, so in-app purchases (Pro and Pro+) need native Play Billing added
  before either can be sold there (see PRO.md). Pro+ product IDs are already in the app's product list.

## 3. Server (the same Cloudflare Worker as Pro, in `worker/`)

```
cd worker
npx wrangler secret put ARGYLE_KEY_ID
npx wrangler secret put ARGYLE_KEY_SECRET
npx wrangler secret put ARGYLE_WEBHOOK_SECRET
npx wrangler deploy
```

Settings in `worker/wrangler.toml`: `ARGYLE_SANDBOX` (`"true"` until production keys are set), `PLUS_IMPORT_DAYS` (history
brought in on first connect, default 90), `DEFAULT_TZ` (time zone for trips that don't say theirs).

Test: `node worker/test/plus.test.mjs` (runs the whole flow against stand-ins; no keys needed).

## 4. Turn it on

1. In `pro.js` → `plus`: set `sandbox: false` (after production keys) and `enabled: true`.
2. Update the privacy policy (text below), the Google Play **Data safety** form (financial info: "other financial info",
   collected, shared with a service provider, for app functionality) and the store listings.
3. Push. Test with a Play license tester: buy Pro+, connect a sandbox Uber account, watch days fill in.

## Gift Pro+

Same as gifting Pro (PRO.md), plus set `tier` (string) = `plus` and `giftTier` (string) = `plus` on `users/{uid}/meta/pro`.

## Privacy policy text to add at launch

> **Kept Pro+ automatic sync.** If you subscribe to Kept Pro+ and choose to connect your Uber or Lyft account, the
> connection is made through Argyle Systems, Inc. You sign in to Uber or Lyft on Argyle's secure screen; Kept never sees
> or stores your Uber or Lyft password. Argyle shares your trip earnings, tips, bonuses, trip times and trip distances
> with Kept. Kept's server adds them up into daily totals, saves those totals with your Kept account, and adds them to
> your days in the app. Kept does not store trip addresses or routes. You can disconnect at any time in More → Automatic
> sync; this deletes your connection at Argyle and the synced totals on Kept's server (days already in your app stay
> until you delete them). If your Pro+ subscription ends, the connection is deleted automatically after 7 days. Argyle's
> own privacy policy applies to the data Argyle collects: https://argyle.com/legal/privacy-policy
