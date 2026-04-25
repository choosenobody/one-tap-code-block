# One Tap Code Block

## What it does

This Chrome Extension inserts or wraps a Markdown fenced code block when you press **Right Alt** inside a supported editable area.

Supported targets for I2:
- `textarea`
- `contenteditable` editors

Intentionally ignored for I2:
- all single-line `input` fields
- middle mouse

Behavior:
- No selection: inserts

  ```

  ```

  and places the cursor on the empty line between the fences.
- With selection: wraps the selected text as a clean fenced block

  ```
  selected text
  ```

  and places the cursor after the selected text, before the newline and closing fence.
- When wrapping text next to prose, the extension adds surrounding newlines when needed so the fenced block starts and ends cleanly on its own lines.
- For `contenteditable`, boundary formatting mirrors the `textarea` path using conservative surrounding-text checks.
- Repeated `keydown` events are ignored, so holding Right Alt does not spam multiple insertions.
- Releasing Right Alt and pressing it again inserts one new block.
- After changes, the extension dispatches an `input` event so framework-driven editors can detect the update.
- `textarea` scroll position is restored after insertion to reduce jumpiness in long inputs.

## How to load locally in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select this project folder
5. If Chrome already had the extension loaded, click **Reload** after file changes

## Manual test checklist

- [ ] Existing GitHub Issue description `textarea` still works
- [ ] GitHub Issue title `input` still does not trigger
- [ ] Holding Right Alt in `textarea` inserts at most one code block
- [ ] Release Right Alt, then press it again: inserts one new block
- [ ] ChatGPT message box: Right Alt inserts fenced code block
- [ ] ChatGPT message box with selected text: Right Alt wraps selected text
- [ ] GitHub `contenteditable` comment/editor, if available: Right Alt inserts or wraps
- [ ] Normal webpage selected text outside an editor is not modified
- [ ] Left Alt does not trigger
- [ ] No `console.error` or uncaught exception during normal use

## Known limitations

- Single-line `input` fields are intentionally ignored
- `contenteditable="false"` regions are intentionally ignored
- Middle mouse is not supported yet
- No settings page yet
