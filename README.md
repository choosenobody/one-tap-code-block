# One Tap Code Block

## What it does

This Chrome Extension inserts or wraps a Markdown fenced code block inside supported editable areas.

## Supported triggers

- **Right Alt**
- **Middle mouse button** inside supported editable areas only

## Supported targets

- `textarea`
- `contenteditable` / rich text editors

## Intentionally ignored

- all single-line `input` fields
- search inputs such as Baidu search
- middle-click outside editable contexts
- `contenteditable="false"` regions
- options page not supported yet
- popup not supported yet

## Behavior

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
- `contenteditable` uses conservative editor detection and only acts when the selection or caret can be confirmed inside the editor.
- Repeated `keydown` events are ignored, so holding Right Alt does not spam multiple insertions.
- Releasing Right Alt and pressing it again inserts one new block.
- After changes, the extension dispatches an `input` event so framework-driven editors can detect the update.
- `textarea` scroll position is restored after insertion to reduce jumpiness in long inputs.

## Compatibility notes

- GitHub Issue description `textarea`: supported
- ChatGPT input box: supported
- Telegram Web: may work if its editor exposes a compatible `contenteditable` or `role="textbox"` structure in the same document
- Telegram Web may still fail if its editor is hidden behind iframe, closed shadow DOM, or a non-standard caret model
- Baidu search input is intentionally ignored

## Debug mode

`content.js` includes:

```js
const DEBUG = false;
```

Set it to `true` locally if you want console logs for:
- trigger type (`AltRight` or middle mouse)
- event target tag/class/role/contenteditable info
- detected editable kind
- reason a trigger was handled or ignored

## How to load locally in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select this project folder
5. If Chrome already had the extension loaded, click **Reload** after file changes

## Manual test checklist

- [ ] GitHub Issue description `textarea` still works
- [ ] GitHub Issue title `input` still does not trigger
- [ ] ChatGPT input still works with Right Alt and middle mouse
- [ ] Baidu search box still does not trigger
- [ ] Telegram Web input works if it uses a compatible rich editor structure
- [ ] Middle-click on links, buttons, or page background keeps normal page/browser behavior
- [ ] Normal webpage selected text outside an editor is not modified
- [ ] No `console.error` or uncaught exception during normal use

## Known limitations

- Single-line `input` fields are intentionally ignored
- `contenteditable="false"` regions are intentionally ignored
- Middle-click only works inside supported editable targets
- Telegram Web may not work if its editor lives inside iframe/closed shadow DOM or uses a non-standard editing surface
- No settings page yet
- No popup yet
