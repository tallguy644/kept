# GPS mileage tracking (free, Android app, v12 / 2.0.0)

**How it works:**
1. The driver taps **Start driving** on Home (`mileage.js`).
2. `MileageService.java` runs as a foreground service of type location, with an ongoing notification ("Kept is tracking your miles · 12.3 mi") that has an **End driving** button.
3. The service counts GPS distance and skips:
   - fixes less accurate than 35 m
   - jitter under 12 m (or under the fix's own accuracy)
   - jumps faster than about 150 mph
4. When the drive ends, from the app or the notification, its miles go into that day's entry. A new day is created if none exists, and the miles are synced and backed up like typed miles.

**Privacy:**
- Only the running distance is stored, and it stays on the phone until it's added to the day.
- No routes or places are kept, and nothing is sent anywhere.
- Kept never asks for background ("all the time") location. The build fails if `ACCESS_BACKGROUND_LOCATION` ever appears.
- The privacy policy section is `privacy.html#location`.

**Google Play (before the v12 release is reviewed):**
- **App content › Foreground service permissions:**
  - Declare **Location** for the foreground service, and describe it as "Tracks miles driven for the driver's mileage log while they have started a drive. Started and stopped by the user; shows an ongoing notification."
  - Add a short video: tap Start driving, show the notification, switch apps, tap End driving, then show the miles on the day.
- **Data safety:**
  - Location is used only on the device to calculate miles and is not collected or shared. Only the miles total is saved with the driver's days, which may be synced to their account.
  - So under data types, **Location is not "collected"**. Miles are part of the app activity that's already declared.
- The listing now says "mileage tracker". See `store/ASO.md`.

**Test on a phone:**
1. Install the v12 APK and tap Start driving.
2. Allow location, choosing **precise** (approximate isn't enough for GPS miles), and allow notifications.
3. Drive, switch to another app, and check that the notification miles go up.
4. Tap End driving, either in the notification or in Kept, and check that Home shows a toast and the miles appear on today's entry.
