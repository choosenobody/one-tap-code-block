# CHANGELOG

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
