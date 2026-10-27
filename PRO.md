# Kept Pro: launch checklist

> Kept **Pro+** (Pro plus automatic Uber and Lyft sync) is built and switched off too: see [PLUS.md](PLUS.md).

Pro is built and switched **off**. Until launch (`lockBeforeLaunch: true` in `pro.js`), the Pro features (Taxes report, Compare and Trends tabs, Google Drive backup) are **locked for everyone** and More shows a "Kept Pro is coming soon, with a 7-day free trial" note. No trial clock runs yet; gifted Pro still unlocks. At step 5 the trial starts for everyone.

- **Free:** logging days, totals, Lyft vs Uber on Home, Export to Excel / Sheets, Customize, saving a backup file, Restore backup, Restore from Drive
- **Pro:** Taxes report, Insights Compare and Trends tabs, Google Drive auto-backup + Google Sheet
- **Trial:** 7 days for everyone, starting the first time they open Kept after launch
- **Prices:** $1.99/month, $14.99/year, $24.99 lifetime. Sold only in the Google Play and Microsoft Store apps.
- **Tied to the Kept account:** buy once in the app, and Pro unlocks on every device and on keptforgigworkers.com wherever the driver signs in. The Pro server checks each purchase with the store and marks the account Pro (`users/{uid}/meta/pro`, which drivers can't write). One purchase links to one account only. The free trial also follows the account (`users/{uid}/meta/trial`, stamped once by the server clock), so reinstalling or a new device doesn't restart it.
- **Without an account,** a purchase still works on that device, and links to the account automatically the first time they sign in.
- **Microsoft Store:** purchases work on that device; linking them to accounts needs Microsoft's purchase-check service set up later (the server answers "not supported yet" until then).

**Preview anytime:** add `?pro=preview` (trial running) or `?pro=expired` (trial over) to the site address.

## 1. Google Play products (Play Console → Kept → Monetize)

- **Subscriptions:** `kept_pro_monthly` (base plan, auto-renewing monthly, $1.99) and `kept_pro_yearly` (base plan, yearly, $14.99)
- **In-app products:** `kept_pro_lifetime` (one-time, $24.99)
- Turn on Play Billing in the Trusted Web Activity build (Bubblewrap / PWABuilder Android: "Play Billing" option)

## 2. Microsoft Store add-ons (Partner Center → Kept for Gig Workers → Add-ons)

- `kept_pro_monthly`: Subscription, 1 month, $1.99
- `kept_pro_yearly`: Subscription, 1 year, $14.99
- `kept_pro_lifetime`: Durable, no expiry, $24.99

Use these exact product IDs. The app looks for them by name.

## 3. Pro server (required)

`worker/` is a small free Cloudflare Worker. It checks Google Play purchases, acknowledges them (Google refunds unacknowledged purchases after 3 days), links them to Kept accounts, and re-checks every linked purchase daily so renewals, cancellations and refunds are picked up.

1. **Play access:** Google Cloud → create a service account → JSON key. Play Console → Users and permissions → invite its email with "View financial data" and "Manage orders and subscriptions".
2. **Firestore access:** in Google Cloud project `kept-b85c0`, give a service account the **Cloud Datastore User** role (it can be the same one, or a second one).
3. **Deploy** (free Cloudflare account): `worker/wrangler.toml` already has the package name, project and allowed addresses.
   ```
   cd worker
   npx wrangler deploy
   npx wrangler secret put GOOGLE_SA_JSON      # Play access key
   npx wrangler secret put FIREBASE_SA_JSON    # Firestore key (skip if the first one has the role)
   ```
4. Done: the Pro server is deployed by GitHub Actions (.github/workflows/deploy-pro-server.yml) at https://kept-pro.earring-atelier.workers.dev. Secrets CLOUDFLARE_API_TOKEN and GOOGLE_SA_JSON live in the GitHub repo.

## 4. Fill in `pro.js` settings

`workerUrl` (the Worker address), `playUrl`, `msStoreUrl`.

## 5. Launch

Set `enabled: true` in `pro.js` and push. Test a purchase with a Play license-tester account and a Microsoft Store test account first.

## Gift Pro to someone

1. Firebase console → **Authentication → Users**: find the person's email and copy their **User UID**.
2. **Firestore Database → Data**: open (or create) the path `users` → *their UID* → `meta` → document `pro`, and set these fields:
   - `active` (boolean) = `true`
   - `gift` (boolean) = `true`
   - `giftUntil` (null) = `null` for Pro for life, or (number) = the end date in milliseconds for a time-limited gift
   - `expires` = the same as `giftUntil`
3. It turns on immediately on every device they're signed in on. The daily recheck keeps gifted Pro (and ends a time-limited gift on its date). To take it back, set `active` and `gift` to `false`.
