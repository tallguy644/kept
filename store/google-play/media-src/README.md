# Play screenshots and promo video: how they're made
Real app screens with sample data, captured by Playwright from a local server (`python3 -m http.server 8765` in the repo root).
- `seed.js`: sample days, car and mocked native mileage plugin
- `raw.js` → `raw/` 8 phone screens (360×720 @3x); `compose.py` → captioned 1080×1920 images in `final/`
- `rec.js`: records the walkthrough as 720×1440 screencast frames (CSS zoom 2 for sharpness); `video.py` → `Kept-promo-video.mp4` (1920×1080, ~33 s, no audio)
Output: `../v12-screenshots-v2/` and `../Kept-promo-video.mp4`.
