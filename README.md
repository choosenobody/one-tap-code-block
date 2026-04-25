# One Tap Code Block

## What it does

This Chrome Extension inserts or wraps a Markdown fenced code block when you press **Right Alt** inside a supported editable area.

Supported targets for I2:
- `textarea`
- `contenteditable="true"`
- `contenteditable="plaintext-only"`

Intentionally ignored for I2:
- all single-line `input` fields
- `contenteditable="false"`
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
- Repeated `keydown` events are ignored, so holding Right Alt does not spam multiple insertions.
- After changes, the extension dispatches an `input` event so framework-driven editors can detect the update.
- `textarea` scroll position is restored after insertion to reduce jumpiness in long inputs.

## How to load locally in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select this project folder
5. If Chrome already had the extension loaded, click **Reload** after file changes

## Manual test checklist

- [ ] `textarea` no selection inserts clean fenced block
- [ ] `textarea` selected text wraps cleanly
- [ ] GitHub Issue title input should not trigger
- [ ] GitHub Issue description textarea should trigger
- [ ] Holding Right Alt should not repeatedly insert blocks
- [ ] Long `textarea` should not jump unexpectedly after insertion
- [ ] ChatGPT-style `contenteditable` with no selection inserts fenced block
- [ ] `contenteditable` selected text wraps cleanly
- [ ] Selection outside the editor should not trigger wrapping inside the editor
- [ ] `contenteditable="false"` should not trigger
- [ ] Left Alt should not trigger
- [ ] Right Alt should trigger

## Known limitations

- Single-line `input` fields are intentionally ignored
- Middle mouse is not supported yet
- No settings page yet
