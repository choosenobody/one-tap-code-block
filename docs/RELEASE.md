# Release Guide

## Pre-release checks

1. Confirm all checks in `docs/TESTING.md` have been run.
2. Confirm `manifest.json` version is correct.
3. Confirm icon files exist:
   - `icons/icon16.png`
   - `icons/icon48.png`
   - `icons/icon128.png`
4. Confirm `manifest.json` references the same icon paths.
5. Confirm `branding/store-icon-512.png` exists for release/store-facing materials.
6. Confirm the unpacked extension loads cleanly in Chrome.

## Package as ZIP

From the project root:

```bash
zip -r one-tap-code-block-0.3.1.zip manifest.json content.js icons README.md CHANGELOG.md docs
```

Do not include:
- `.git/`
- local temp files
- editor settings
- OS junk files

Optional release asset outside the extension ZIP:
- `branding/store-icon-512.png`

## Final sanity check

- Load the ZIP or unpacked folder in a clean Chrome profile if possible.
- Verify the extension icon renders correctly.
- Re-run a quick GitHub textarea test and a ChatGPT rich editor test.

## Chrome Web Store assets

Generated assets live under `branding/chrome-web-store/`:

- Screenshots
  - `branding/chrome-web-store/screenshots/screenshot-github-1280x800.png`
  - `branding/chrome-web-store/screenshots/screenshot-chatgpt-1280x800.png`
  - `branding/chrome-web-store/screenshots/screenshot-triggers-1280x800.png`
- Small promo tile
  - `branding/chrome-web-store/small-promo-tile-440x280.png`
- Marquee promo tile
  - `branding/chrome-web-store/marquee-promo-tile-1400x560.png`

These exports are RGB PNGs with no alpha.

