# Kept Windows app (Microsoft Store)

The Microsoft Store version of Kept is now a standalone Windows app. It is built with Tauri in `windows/` and is no longer a PWA running through Edge.
- It opens in its own window on the WebView2 engine that comes with Windows 11. The Edge browser and Edge's app system aren't involved.
- The window shows keptforgigworkers.com, so the app updates with the website, and after the first start it also works offline.
- Microsoft Store purchases for Kept Pro use Windows.Services.Store directly, in `windows/src-tauri/src/store.rs`, through the `window.keptWindows.billing` bridge in `windows.js`.
- Links that leave Kept, such as Store pages, email and other sites, open in the default browser or mail app.

## Build
`.github/workflows/windows.yml` runs on every push to `windows/`. It attaches two files to a `windows-v…` GitHub release:
- `Kept-for-Gig-Workers-<version>-x64.msix`: upload this to Partner Center. The Store signs it.
- `Kept-for-Gig-Workers-Windows.exe`: runs on its own, for testing. Store purchases only work in the Store install.

The package identity comes from Partner Center (Product identity) and must stay the same:
- `DesertCircuitapps.KeptforGigWorkers`
- `CN=6B8173B9-9580-45B2-A28C-1A0E632101AF`
- Application Id `App`

`MSIX_VERSION` in the workflow must go up with every Store update. The old PWA was 1.0.2.0, and the first standalone build is 1.1.0.0.

## Submit the update
1. Partner Center › Kept for Gig Workers › **Start update** › Packages.
2. Remove the old `.msixbundle` (1.0.2.0) and upload the new `.msix`.
3. **runFullTrust** (restricted capability) justification:
   - "Kept is a packaged desktop app (Win32, built with Tauri). It needs runFullTrust to run as a desktop app and show its window."
   - The PWA package already used this capability.
4. Submit for certification.

## Before you switch: things to know
- **Days saved only on the PC don't move over.** The old Edge PWA and the new app keep their storage separately. Drivers who use the Windows app without a Kept account should sign in or save a backup file (More › Back up) before updating. Signed-in days come back as soon as they sign in.
- **Google sign-in inside the app:** Google sometimes blocks sign-in in app windows. Test **Continue with Google** in the test `.exe`. Email and password sign-in always works. If Google is blocked, the fix is to sign in through the default browser (a later update).
