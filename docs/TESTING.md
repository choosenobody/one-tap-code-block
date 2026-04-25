# Testing Guide

## Smoke test

1. Load the unpacked extension in Chrome.
2. Confirm the extension icon appears with the final black Alt-key mark.
3. Open Chrome DevTools console and verify there is no startup error.

## Manual testing checklist

- [ ] GitHub Issue description `textarea`: Right Alt works
- [ ] GitHub Issue description `textarea`: middle mouse works
- [ ] GitHub Issue title `input`: ignored
- [ ] ChatGPT input: Right Alt works
- [ ] ChatGPT input: middle mouse works
- [ ] Selected text wrapping works in `textarea`
- [ ] Selected text wrapping works in `contenteditable`
- [ ] Holding Right Alt does not spam multiple blocks
- [ ] Release Right Alt and press again inserts once again
- [ ] Middle-click link preserves normal browser behavior
- [ ] Middle-click page background does nothing
- [ ] Middle-click button/non-editable UI does nothing
- [ ] Baidu search input ignored
- [ ] Telegram Web optional compatibility test
- [ ] Normal webpage selected text outside editor is not modified
- [ ] Browser console has no errors

## Compatibility notes

- Baidu search input is intentionally ignored
- Telegram Web works only if its editor exposes a compatible rich-editor structure in the same document
- Telegram Web may fail if it uses iframe, closed shadow DOM, or another non-standard editing surface

## Optional troubleshooting

If editor detection is unclear, temporarily set this in `content.js`:

```js
const DEBUG = true;
```

Then reload the extension and inspect the console logs.
