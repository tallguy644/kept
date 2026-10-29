# Kept Offer Check

Status: **built and switched off.** Launch it as an update after Kept is in production on Google Play
and the Pro server is live on its own Cloudflare account.

## What it is
- A separate, free Android companion app, **Kept Offer Check** (`com.desertcircuitapps.keptoffercheck`).
- When an Uber or Lyft ride offer comes in, it reads the fare, pickup miles, trip miles and minutes.
- It shows a popup over the offer, which the driver taps to close:
  - green **Worth it**, amber **Below your goal**, or red **Losing money**
  - the profit after car costs, $/mi and $/hr
- It uses the driver's cost per mile from Kept: gas and repairs over the last 90 days plus depreciation from **My car**. The driver can set their own number and a profit goal.

## How it's sold (Option 1)
- The upgrade is bought **inside Kept** (Google Play only): `kept_offer_monthly` ($9.99) and `kept_offer_yearly` ($79.99). It includes everything in Pro.
- The Pro server records it on the Kept account in `users/{uid}/meta/pro`, fields `offer` and `offerExpires`.
- In Kept: **More › Offer Check › Set up on this phone**.
  - Kept gets a one-time 8-character code (valid for 10 minutes) and opens the companion app with it.
  - If the app isn't installed, Kept opens its Play page instead. The code is also shown so it can be typed in.
- The companion app swaps the code for a device key. It never signs in and never sees the driver's account or logged days.
- It checks the status every few hours, with 7 days of grace while offline. When the subscription ends, the popups stop.
- **Gift it:** in Firestore, set `users/{uid}/meta/pro` → `gift = true`, `giftOffer = true`, and optionally `giftUntil` (milliseconds).

## Where the code is
| Part | Files |
|---|---|
| Pro server | `worker/index.js` (`/offer/*` routes and the `offer` fields in recompute), test `worker/test/offer.test.mjs` |
| Kept screen | `offer.js` (7 languages), the `PRO.offer` settings and switch in `pro.js`, `keptCarCostPerMile()` in `car.js` |
| Kept native | `openOfferCheck` in `app/native/java/KeptNativePlugin.java` (Kept v10 / 1.8.0) |
| Companion app | `offercheck/` (plain Android, no libraries), offer reader test `offercheck/test/ParserTest.java` |
| Build | `.github/workflows/offercheck.yml`. Signed with the same upload key as Kept and attached to a GitHub release. The server address is read from `workerUrl` in `pro.js`. |
| Privacy | `privacy.html#offer-check` |

Preview the Kept screen on the website:
- `?pro=offer` shows the plans.
- `?pro=offeron` shows the screen as if Offer Check is active.

## Launch checklist
1. **Pro server live** on the new Cloudflare account, with `workerUrl` set in `pro.js`. The next companion app build picks it up by itself. Until then, the app says "coming soon".
2. **New app in Play Console:**
   - Create **Kept Offer Check** with package `com.desertcircuitapps.keptoffercheck`. Upload the `.aab` from the latest `offercheck-v1-*` GitHub release.
   - Store listing, with the privacy policy at `https://keptforgigworkers.com/privacy.html#offer-check`.
   - Data safety: no data collected or shared. Offer text is processed only on the device. The only thing sent to the server is the one-time link code and the device key.
   - **App content › Sensitive app permissions › Accessibility API** declaration:
     - Say it is not an accessibility tool.
     - Explain that it reads only Uber Driver and Lyft Driver offer text to show a profit popup, and that it does not perform actions.
     - Attach a short video showing the in-app disclosure, turning the service on, and a popup.
3. **Closed testing again:** a new app on a personal developer account needs **12 testers for 14 days** before production. The same Kept testers can opt in.
4. **In Kept's Play Console**, create the subscriptions `kept_offer_monthly` and `kept_offer_yearly` (base plans, auto-renewing).
5. **Switch on:** set `PRO.offer.enabled: true` in `pro.js` (Pro itself must be launched too). Ship Kept v10 or later.
6. **Real-offer test:**
   - Drive with it on and check the popups.
   - If an offer is read wrong, use **Last offer read › Copy what Kept read** and send the text, so the reader can be tuned. Uber and Lyft change their screens from time to time.

## Risks to tell drivers (shown in both apps)
- Uber and Lyft aren't part of Kept. Apps that read ride offers may be against their terms, and drivers use Offer Check at their own risk.
- The reader can stop working until it's updated when Uber or Lyft redesigns its offer card.
- Google can reject or pull the companion app over the Accessibility API. Because it's a separate app, the main Kept app and its subscribers aren't affected.
