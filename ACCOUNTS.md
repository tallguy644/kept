# Kept accounts: setup guide

Accounts are built and switched **off**. The app works exactly as before until step 2 is done.

- **What drivers get:** an optional free account (Google or email + password). Their days sync across devices and survive a lost phone. Kept still works without an account. A gentle "Keep your days safe" card on Home suggests it once they have days, and asks again after two weeks if they tap "Not now".
- **Security:** each driver's days live at `users/{their id}/days`. `firestore.rules` lets only that signed-in driver read or write them. Everyone else, including other drivers, is blocked.
- **Offline:** days save on the phone first, then sync when there's signal.
- **Sign out** removes the days from that device; they stay in the account.
- **Delete account** (More → account) permanently deletes the account and its days. Google Play requires this.

## 1. Create the Firebase project (free)

1. Go to console.firebase.google.com → **Add project** → name it `Kept` → you can turn Google Analytics off.
2. **Build → Authentication → Get started → Sign-in method:** turn on **Email/Password** and **Google**. Pick a support email for Google.
3. **Authentication → Settings → Authorized domains:** add `tallguy644.github.io` (and later your own domain).
4. **Build → Firestore Database → Create database** → **production mode** → a US location (for example `us-west2`, near Arizona).
5. **Firestore → Rules:** replace everything with the contents of `firestore.rules` from this repo → **Publish**.

## 2. Connect the app

**Project settings (gear) → Your apps → Web (`</>`)** → register "Kept" → copy the `firebaseConfig` object. Paste it into `FIREBASE_CONFIG` at the top of `account.js` (or send it to Claude). This object is safe to publish; the security rules are what protect the data.

Accounts go live as soon as that's pushed.

## 3. Your own address (optional, recommended before the store launches)

1. **Build → Hosting → Get started** (you can skip the command-line steps shown).
2. **Hosting → Add custom domain** → enter your domain (for example `getkept.app`, bought from Cloudflare or Namecheap) → add the DNS records it shows at your domain seller. SSL is automatic.
3. In `account.js`, change `authDomain` in the config to your domain, so Google sign-in stays on your address inside the Play app.
4. Add your domain under **Authentication → Settings → Authorized domains**.

### Publish automatically from GitHub

`.github/workflows/firebase-hosting.yml` deploys every push to `main` to project `kept-b85c0`. It skips quietly until one repository secret exists:

- **`FIREBASE_SERVICE_ACCOUNT`**: the JSON key of the `github-deploy` service account (Google Cloud console → IAM & Admin → Service accounts → github-deploy → Keys → Add key → JSON). Roles it needs: **Firebase Hosting Admin**, **API Keys Viewer**, **Cloud Run Viewer**.
- Add it at GitHub → tallguy644/kept → Settings → Secrets and variables → Actions → New repository secret. Paste the whole JSON file, then delete the downloaded file.

### After moving

- Rebuild the **Google Play** and **Microsoft Store** packages in PWABuilder with the new address.
- Put the Play `assetlinks.json` in this repo at `.well-known/assetlinks.json`; Firebase Hosting serves it from your domain's root, so no extra repo is needed.
- Drivers using the old GitHub address: they sign in there once, their days go to their account, then they sign in at the new address and everything appears.
- Then make the GitHub Pages copy show a "Kept has moved" link.

## Costs

Firebase's free Spark plan covers 50,000 sign-ins a month, 1 GB of stored data, and 50,000 reads / 20,000 writes a day. A driver's year of days is about 100 KB, so thousands of drivers fit for free.
