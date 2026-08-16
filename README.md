# One Tap Code Block

One Tap Code Block is a minimal Chrome Extension for quickly structuring text in AI chat boxes and other supported editors.

V2 supports two formatting modes:

- **Code Block Mode**: Markdown fenced blocks
- **Source Mode**: semantic `<source>...</source>` blocks for material you want an AI to analyze

## Triggers

| Trigger | Result |
|---|---|
| **Right Alt** | Code Block Mode |
| **Shift + Right Alt** | Source Mode |
| **Middle mouse button** | Code Block Mode |
| **Shift + Middle mouse button** | Source Mode |

Middle mouse triggers are intercepted only inside supported editable areas.

## Supported editing contexts

- `textarea`
- `contenteditable` / rich text editors

## Intentionally ignored

- single-line `input` fields
- search boxes
- title fields
- non-editable page content
- middle-click outside supported editable areas

## Known working targets

- GitHub Issue description `textarea`
- ChatGPT message input

## Behavior

### Code Block Mode

With no selection, the extension inserts:

````text
```

```
````

and places the cursor on the empty line between the fences.

With selected text:

````text
```
selected text
```
````

The selected content is replaced by a plain-text fenced block and the cursor lands after the selected text, before the closing fence.

If the selected text already contains a run of three or more backticks, the outer fence automatically grows to one backtick longer than the longest inner run. This avoids nested fence collisions.

### Source Mode

With no selection:

```xml
<source>

</source>
```

With selected text:

```xml
<source>
selected text
</source>
```

This mode is intended for articles, financial excerpts, research output, quoted opinions, or other source material that should be clearly separated from the user's instruction.

## ChatGPT / rich editor compatibility

V2 changes the `contenteditable` insertion path.

The extension now:

1. tries a browser-native editing transaction with `document.execCommand('insertText', ...)`;
2. lets the editor receive the native insertion behavior instead of mutating its DOM first;
3. falls back to direct Range insertion only when the native path is unavailable.

This is designed to be more resilient with modern controlled/rich editors such as ChatGPT, where direct DOM mutation can be overwritten during editor state reconciliation.

For `textarea`, V2 uses `setRangeText()` for one-shot replacement and then dispatches the input event.

## Compatibility notes

- Telegram Web may work if its editor exposes a compatible `contenteditable` or `role="textbox"` structure in the same document.
- Telegram Web may still fail if its editor lives inside iframe, closed shadow DOM, or uses a non-standard caret model.
- Baidu search input is intentionally ignored.
- `document.execCommand()` is deprecated as a general web API, but Chromium still supports `insertText`; V2 retains a Range-based fallback for editors where the native transaction is unavailable.

## Debug mode

`content.js` includes:

```js
const DEBUG = false;
```

Set it to `true` locally only for troubleshooting. When enabled, it logs:

- trigger type
- event target info
- detected editable kind
- active formatting mode
- reason a trigger was handled or ignored

## Load unpacked locally

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select this project folder

## Update locally

```powershell
cd D:\OneTap\one-tap-code-block
git pull origin main
```

Then reload the extension in `chrome://extensions`.

## Manual packaging as ZIP

Package only the extension files you need:

- `manifest.json`
- `content.js`
- `icons/`
- `README.md` (optional for distribution)
- `CHANGELOG.md` / `docs/` (optional for tester docs)

Do **not** include:

- `.git/`
- local temp files
- editor settings or OS junk files

Example from the project root:

```bash
zip -r one-tap-code-block-2.0.0.zip manifest.json content.js icons README.md CHANGELOG.md docs
```

## Privacy

See `PRIVACY.md`.

## Early tester feedback

- Feedback guide: `docs/FEEDBACK.md`
- GitHub bug report template: `.github/ISSUE_TEMPLATE/bug_report.md`
- GitHub feature request template: `.github/ISSUE_TEMPLATE/feature_request.md`
- GitHub general feedback template: `.github/ISSUE_TEMPLATE/general_feedback.md`

## Testing

See `docs/TESTING.md` for the tester checklist.
