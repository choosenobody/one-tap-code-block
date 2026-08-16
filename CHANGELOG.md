# CHANGELOG

## 2.0.1
- **CRITICAL FIX — selection-wrap on ChatGPT-class editors**: v2.0.0 destroyed the user's selected text by `range.deleteContents()` then re-inserted the wrapped string with a synthetic `InputEvent(data)`. ProseMirror-style editors reconciled the manual DOM and substituted their own interpretation, dropping the user's selection. v2.0.1 inserts fence fragments as plain text nodes anchored to the editor's DOM using two independent Range coordinates; the selected content is preserved untouched.
- **No synthetic InputEvent with stale data**: v2.0.1 dispatches a plain bubbling `input` event (no `data`) after direct DOM mutation, so reactive reconcilers re-read from the live DOM instead of substituting a stale string.
- **First-Right-Alt regression fixed**: v2.0.0's first-Right-Alt on ChatGPT dropped the opening fence via ProseMirror's Markdown input rule. v2.0.1 fires the input event so the host editor reconciles correctly.
- End anchor inserted first, then start anchor; both anchors are captured as Range snapshots before any mutation, so neither insert can shift the other's coordinates.
- Headless harness extended with a controlled/ProseMirror-like editor fixture (`fixtures/chatgpt-pm.html`) and assertion matrix that reproduces the v2.0.0 failure modes on the v2.0.1 candidate.

## 2.0.0
- add Source Mode with `<source>...</source>`
- add Shift + Right Alt and Shift + middle mouse source-block triggers
- keep Right Alt and middle mouse behavior for Markdown code blocks
- prefer direct Range insertion for `contenteditable`, falling back to `document.execCommand('insertText', ...)`
- retain `document.execCommand('insertText')` as a compatibility fallback for editors that refuse manual DOM
- avoid Chromium's `execCommand('insertText')` newline-stripping bug (which on `plaintext-only` editors like ChatGPT would emit `` `````` `` for the empty-block case)
- use `setRangeText()` for textarea replacement
- automatically expand Markdown fences when selected text already contains backtick runs
- preserve selection-aware wrapping and empty-block cursor placement
- expand ChatGPT and regression testing guidance

## 0.3.1
- richer editor detection for rich text editors
- lightweight `DEBUG` helper in `content.js`
- final MVP icon assets
- release and testing documentation

## 0.3.0
- middle mouse trigger inside supported editable areas

## 0.2.0
- `contenteditable` / rich editor support

## 0.1.0
- `textarea` Right Alt MVP
