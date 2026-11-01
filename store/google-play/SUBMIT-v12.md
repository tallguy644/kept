# Google Play submission: Kept v12 (2.0.0)

Everything is in **Downloads › Kept Google Play submission v12**:
- `Kept-for-Gig-Workers-v12.aab`: upload this
- `Kept-for-Gig-Workers-v12.apk`: install it on your phone to try it first
- `screenshots/`: 6 new phone screenshots, 1080×1920
- `listing.txt` and `listing-translations.txt`: store text
- `release-notes-v12.txt`: "What's new" in 7 languages

v12 includes everything from v9, v10 and v11, so if those were never sent, just send v12.

## Tested before building (48 automated checks, all passing)
- **Free GPS mileage:** Start driving, live miles, and End driving adding the miles to the day. A drive ended from the notification goes to its own date. Location denied shows help text. It's hidden on the website and in the Windows app.
- **My car:** the cost per mile card on Insights.
- **Navigation and setup:** the app tour after the welcome slides, and its replay from More.
- **More page:**
  - Appearance (light/dark) on More
  - Send feedback (email with app details), Rate on Google Play, and the Share menu (text, email, WhatsApp, Facebook, X, copy link, phone share sheet)
  - The Android back button closing Share and leaving Feedback
- **Sign-in:** show/hide password.
- **Pro and backup:** Google Drive backup free; Taxes still locked until Pro launches; Offer Check still hidden.
- **Regression:** Log Day still saves, every screen opens with no script errors, and Spanish text appears where it should.
- **v12 APK checks:**
  - package `com.desertcircuitapps.kept`, versionCode 12, signed with the Kept upload key
  - mileage service and permissions present
  - no background location
- **Fixed during testing:** on 360-pixel-wide phones, the "You kept" amount on Home was cut off.
- **Can only be tested on a real phone:** GPS while driving. Install the APK and do a short drive first. Steps are in `MILEAGE.md`.

## Steps in Play Console
### 1. App content › Foreground service permissions (new, required for v12)
- Choose **Location**.
- Use case: *"Mileage tracking. The driver taps Start driving to count the miles they drive for their mileage log. Tracking runs only until they tap End driving, and an ongoing notification shows the miles while it runs. Only the total distance is kept."*
- Video link: record your phone screen in one take, about 30 seconds, then upload it to YouTube as **Unlisted** and paste the link. In the recording:
  1. Open Kept and tap **Start driving** (allow location).
  2. Pull down to show the "Kept is tracking your miles" notification.
  3. Switch to another app.
  4. Tap **End driving** in the notification.
  5. Open Kept and show the miles added to today.

### 2. App content › Data safety
- Location is only used on the phone to work out miles, and is never sent anywhere, so **Location stays "not collected"**.
- If Play asks why the app uses location, answer **App functionality: mileage tracking**.
- No other changes are needed.

### 3. Store listing (Grow users › Store presence › Main store listing)
1. **App name, short description and full description:** paste from `listing.txt`.
2. **Phone screenshots:** remove the old ones and upload the 6 in `screenshots/` in order.
3. **Translations:** Manage translations › Add your own, using `listing-translations.txt`. Add these **before** the release notes, because Play only accepts release notes for languages the listing has. Otherwise, keep just the `<en-US>` block of the release notes.

### 4. Release
1. Go to **Test and release › Testing › Closed testing**, your current track, which keeps the 14-day clock going. Click **Create new release**.
2. Upload `Kept-for-Gig-Workers-v12.aab`. Release name: `12 (2.0.0)`.
3. Release notes: paste `release-notes-v12.txt`.
4. Click **Next**, then **Save**. Check that there are no errors, and fix any warnings about the foreground service declaration in step 1.
5. Go to **Publishing overview › Send changes for review**. You click this one.
