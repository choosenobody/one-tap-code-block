# Release Guide

## Pre-release checks

1. Confirm all checks in `docs/TESTING.md` have been run.
2. Confirm `manifest.json` version is correct.
3. Confirm icon files exist:
   - `icons/icon16.png`
   - `icons/icon48.png`
   - `icons/icon128.png`
4. Confirm `manifest.json` references the same icon paths.
5. Confirm the unpacked extension loads cleanly in Chrome.

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

## Final sanity check

- Load the ZIP or unpacked folder in a clean Chrome profile if possible.
- Verify the extension icon renders correctly.
- Re-run a quick GitHub textarea test and a ChatGPT rich editor test.
