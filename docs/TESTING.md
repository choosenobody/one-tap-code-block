# Testing Guide

## Smoke test

1. Load the unpacked extension in Chrome.
2. Confirm the extension icon appears with the final black Alt-key mark.
3. Open Chrome DevTools console and verify there is no startup error.

## Core checks

1. GitHub Issue description `textarea`
   - Right Alt inserts a fenced code block
   - Right Alt wraps selected text cleanly
   - Middle mouse inserts/wraps cleanly
2. GitHub Issue title `input`
   - Right Alt does not trigger
   - Middle mouse does not trigger
3. ChatGPT message input
   - Right Alt inserts a fenced code block
   - Right Alt wraps selected text cleanly
   - Middle mouse inserts/wraps cleanly
4. Browser safety
   - Middle-click on a link keeps normal browser behavior
   - Middle-click on page background does nothing special
   - Middle-click on buttons/non-editable UI does nothing special
   - Normal page text selected outside an editor is not modified
5. Anti-repeat
   - Holding Right Alt inserts at most one block
   - Releasing and pressing Right Alt again inserts one new block

## Compatibility checks

- Baidu search input remains ignored
- Telegram Web works only if its editor exposes a compatible rich-editor structure in the same document
- If Telegram Web fails, inspect whether it uses iframe, closed shadow DOM, or another non-standard editing surface

## Optional troubleshooting

If editor detection is unclear, temporarily set this in `content.js`:

```js
const DEBUG = true;
```

Then reload the extension and inspect the console logs.
