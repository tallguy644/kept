# Kept Offer Check (planned)

Status: **planned** — build as an update after Kept is in production on Google Play
(about Nov 8, 2026) and the Pro server is on its own Cloudflare account (after Nov 2, 2026).

## What it is
A separate Android companion app, "Kept Offer Check". When an Uber or Lyft ride offer
comes in, it reads the fare and miles and shows a popup over the offer: profit per mile
after the driver's own car costs (from Kept's My car screen), green or red.

## Decision: Option 1 — an upgrade sold in the main Kept app
- The companion app is free to download. It does nothing until the driver signs in with a
  Kept account that has the upgrade.
- The upgrade is sold inside Kept with Play Billing as a new tier (repurpose Pro+ as
  "Pro + Offer Check", or add a separate subscription).
- The Pro server (worker/) records the upgrade on the account (users/{uid}/meta/pro, a new
  `offercheck` flag or tier). The companion app reads it after sign-in.
- Why: if Google rejects or pulls the companion app, the subscribers and the money stay in
  the main Kept app, and the Kept listing is never at risk.

## Build checklist
1. Pro server: add the new SKU(s) to the claim and refresh routes, and store the entitlement on the account.
2. Kept app: add the product in Play Console, add the upgrade card in pro.js, and show it in More.
3. Companion app: create a new Capacitor or native Android project with its own package name
   (e.g. com.desertcircuitapps.keptoffercheck), Firebase sign-in, and an entitlement check.
4. Offer reading: an AccessibilityService limited to the Uber Driver and Lyft Driver packages.
   It is read-only (no auto-tapping) and uses no screen capture.
5. Popup: SYSTEM_ALERT_WINDOW overlay showing the fare, total miles, $/mi after car costs, and a verdict.
   Car costs sync from the Kept account (prefs.car).
6. Play policy: in-app prominent disclosure and consent before turning the service on, the
   Accessibility declaration in Play Console, a demo video, and a privacy policy section.
7. Upkeep: test against current Uber and Lyft offer screens and plan for quick fixes when they change.

## Risks to tell drivers
- Uber and Lyft may treat third-party offer readers as against their terms. Drivers use it at their own risk.
- The feature can stop working until updated when Uber or Lyft redesigns its offer card.
