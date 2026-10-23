# Kept Pro: launch checklist

Pro is built and switched **off**. Nothing changes for anyone until step 5.

- **Free:** logging days, totals, Lyft vs Uber, Customize, saving a backup file, Restore backup, Restore from Drive
- **Pro:** Taxes report, Google Drive auto-backup + Google Sheet, Export to Excel / Sheets
- **Trial:** 30 days for everyone, starting the first time they open Kept after launch
- **Prices:** $1.99/month, $14.99/year, $24.99 lifetime. Sold only in the Google Play and Microsoft Store apps.

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

## 3. Google Play confirmation server (required for Play)

Google refunds purchases not acknowledged within 3 days. `worker/` does this.

1. Google Cloud: create a service account and download its JSON key. Play Console → Users and permissions: invite that account's email with "View financial data" and "Manage orders and subscriptions".
2. Cloudflare (free account): in `worker/wrangler.toml` set `PACKAGE_NAME`, then run:
   ```
   cd worker
   npx wrangler deploy
   npx wrangler secret put GOOGLE_SA_JSON     # paste the whole JSON key
   ```
3. Copy the Worker address (`https://kept-pro.<you>.workers.dev`).

## 4. Fill in `pro.js` settings

`ackUrl` (the Worker address), `playUrl`, `msStoreUrl`, `playPackage`.

## 5. Launch

Set `enabled: true` in `pro.js` and push. Test a purchase with a Play license-tester account and a Microsoft Store test account first.
