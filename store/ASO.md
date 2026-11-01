# Kept: app store optimization (ASO)

Ready-to-paste listings:
- Google Play: `google-play/listing.txt`, plus `google-play/listing-translations.txt` for 6 more languages
- Microsoft Store: `microsoft/listing.txt`

## How the stores rank text
- **Google Play** reads the title (strongest), the short description and the full description, and gives extra weight to the start of the description and its section headings. Clear, relevant wording beats repeating keywords. The listing also has to match what the app actually does, or installs turn into uninstalls and bad reviews, and those pull rankings down.
- **Microsoft Store** reads the name, short description, description, product features and up to 7 keywords. Only the first 270 characters of the short description show without "more".

## Keywords drivers use, and where they go
| Search phrase | Title | Short desc. | Description headings / body |
|---|---|---|---|
| rideshare (driver, earnings, tracker) | | ✓ "Rideshare" | ✓ first sentence, "Made for gig drivers" |
| earnings tracker / earnings log | ✓ "Earnings Log" | ✓ "earnings" | ✓ first sentence |
| Uber driver, Lyft driver | | ✓ | ✓ throughout (with the "not affiliated" line) |
| mileage tracker, mileage log, GPS miles | ✓ "Mileage" | ✓ "mileage tracker" | ✓ "Free GPS mileage tracker", "Mileage log and tax-time totals" |
| gas, expenses, car costs | | ✓ "gas" | ✓ |
| cost per mile | | | ✓ own section (Android only, so Play only) |
| gig worker taxes, IRS mileage deduction, quarterly estimates | | | ✓ |
| what you keep / profit | | ✓ | ✓ (Kept's own hook) |

**Mileage tracker is now in.** Kept v12 adds real GPS mileage tracking, so "mileage tracker" is in the title and short description. It's one of the most-searched terms for driver apps.

**Left out on purpose:**
- DoorDash, Instacart and similar. Kept is built for Uber and Lyft, and naming others would mislead.
- "Best", "#1" and "free" in the title. Google Play doesn't allow ranking claims in titles, and "free" in the title adds nothing.
- Uber and Lyft in the title. Brand names in the title are the most likely thing to get a listing rejected. They're used descriptively in the short description and description, with the not-affiliated line.

**These keywords come from competitor listings and driver wording, not measured search volumes.** No ASO keyword tool was used. After 4 weeks live, check **Play Console › Grow users › Store performance** to see which searches bring installs, and adjust.

## Title change
"Kept for Gig Workers" becomes **"Kept: Mileage & Earnings Log"** on Google Play. Since v12 it covers the two biggest searches, "mileage" and "earnings", and "rideshare" leads the short description. Few people search for "gig workers". Kept stays the brand: the icon, the app's home screen and the website don't change.

Alternatives (all 30 characters or fewer):
- "Kept: Rideshare Earnings Log"
- "Kept: Rideshare Mileage & Pay"

The Microsoft Store keeps its reserved name, because changing it means reserving a new name. GPS mileage is Android only, so the Windows listing doesn't mention it.

## Translated listings (big, easy win)
Kept itself is in 7 languages, but the Play listing was English only. Translated titles and short descriptions (`listing-translations.txt`) let Kept show up when drivers search in Spanish, Portuguese and so on. Spanish also has a full description, since there are many Spanish-speaking rideshare drivers in the US.

## Next steps that move rankings (beyond text)
1. **Screenshots with captions.** Put a short benefit line on each one, such as "See what you really keep", "Uber vs Lyft per hour" and "Your real cost per mile". The first 2–3 screenshots decide most installs. Make translated sets later.
2. **Ask for ratings at the right moment.** Use Google Play's in-app review prompt after a driver logs their 7th day, when they're getting value. Ratings and review count are among the strongest ranking signals.
3. **Store listing experiments.** In Play Console › Store listing experiments, test the title or short description against the current one, starting after launch.
4. **Promo text and What's new.** Name the newest feature in every update, such as "Free Google Drive backup" or "App tour". Recent updates help rankings.
5. **Reply to every review in the first months.** It lifts ratings and shows the app is cared for.
