# One Tap Code Block

## What it does

This Chrome Extension inserts or wraps a Markdown fenced code block when you press **Right Alt** inside a `textarea`.

Supported field for I1.1:
- `textarea`

Intentionally ignored for I1.1:
- all single-line `input` fields
- `contenteditable`

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

## How to load locally in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select this project folder
5. If Chrome already had the extension loaded, click **Reload** after file changes

## Manual test checklist

- [ ] `textarea` no selection inserts clean fenced block
- [ ] `textarea` selected text wraps cleanly
- [ ] Opening fence starts on its own line
- [ ] Closing fence starts on its own line
- [ ] GitHub Issue title input should not trigger
- [ ] GitHub Issue description textarea should trigger
- [ ] `readonly` textarea should not trigger
- [ ] `disabled` textarea should not trigger
- [ ] Left Alt should not trigger
- [ ] Right Alt should trigger

## Known limitations

- `textarea` only for now
- Single-line `input` fields are intentionally ignored
- `contenteditable` is not supported yet
- Middle mouse is not supported yet
- No settings page yet
