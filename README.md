# One Tap Code Block

## What it does

This Chrome Extension inserts or wraps a Markdown fenced code block when you press **Right Alt** inside a supported editable field.

Supported fields for this prototype:
- `textarea`
- `input` with type `text`, `search`, `url`, `email`, `password`, `tel`
- `input` with no `type` attribute

Behavior:
- No selection: inserts

  ```

  ```

  and places the cursor on the empty line between the fences.
- With selection: wraps the selected text as

  ```
  selected text
  ```

  and places the cursor immediately after the selected text, before the closing fence.

## How to load locally in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select this project folder

## Manual test checklist

- [ ] `textarea` with no selection
- [ ] `textarea` with selected text
- [ ] Supported `input` with no selection
- [ ] Supported `input` with selected text
- [ ] Normal page body should not trigger
- [ ] `readonly` field should not trigger
- [ ] `disabled` field should not trigger
- [ ] Left Alt should not trigger
- [ ] Right Alt should trigger

## Known limitations

- `contenteditable` is not supported yet
- Middle mouse is not supported yet
- No settings page yet
