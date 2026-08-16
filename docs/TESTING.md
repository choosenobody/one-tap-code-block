# Testing Guide

## Smoke test

1. Load the unpacked extension in Chrome.
2. Confirm the extension icon appears.
3. Open Chrome DevTools console and verify there is no startup error.
4. Verify the extension version is `2.0.0`.

## Core regression checklist

### ChatGPT

- [ ] ChatGPT input: Right Alt inserts exactly three opening and three closing backticks
- [ ] ChatGPT input: inserted backticks remain intact after another keystroke
- [ ] ChatGPT input: inserted backticks remain intact after editor rerender / focus change
- [ ] ChatGPT input: cursor lands between empty code fences
- [ ] ChatGPT input: selected text is wrapped in a code block
- [ ] ChatGPT input: Shift + Right Alt inserts an empty `<source>` block
- [ ] ChatGPT input: Shift + Right Alt wraps selected text in `<source>...</source>`
- [ ] ChatGPT input: middle mouse inserts a code block
- [ ] ChatGPT input: Shift + middle mouse inserts a source block
- [ ] ChatGPT input: no duplicate insertion event is observed

### Fence collision

- [ ] Selection with no backticks uses a 3-backtick outer fence
- [ ] Selection containing ``` uses a 4-backtick outer fence
- [ ] Selection containing ````` uses a 6-backtick outer fence
- [ ] Cursor lands after the selected content and before the closing fence

### Textarea

- [ ] GitHub Issue description `textarea`: Right Alt works
- [ ] GitHub Issue description `textarea`: Shift + Right Alt works
- [ ] GitHub Issue description `textarea`: middle mouse works
- [ ] Selected text wrapping works
- [ ] Empty block insertion works
- [ ] Cursor placement is correct after insertion

## Existing behavior regression

- [ ] GitHub Issue title `input`: ignored
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

- Baidu search input is intentionally ignored.
- Telegram Web works only if its editor exposes a compatible rich-editor structure in the same document.
- Telegram Web may fail if it uses iframe, closed shadow DOM, or another non-standard editing surface.

## Optional troubleshooting

If editor detection is unclear, temporarily set this in `content.js`:

```js
const DEBUG = true;
```

Then reload the extension and inspect the console logs. V2 debug output includes the active formatting mode.
