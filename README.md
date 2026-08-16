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

V2 changes the `contenteditable` insertion path. The extension:

1. tries a direct Range insertion (insertNode + select) first;
2. falls back to `document.execCommand('insertText', ...)` only when Range insertion is rejected.

The Range path inserts a real text node with newlines intact and avoids the silent newline-stripping bug that affects Chromium's `execCommand('insertText', ..., "\n\n")`. The native execCommand path remains available as a compatibility fallback for editors that refuse to keep manually inserted DOM.

For `textarea`, V2 uses `setRangeText()` for one-shot replacement and then dispatches the input event.

### v2.0.1 selection-wrap fix

V2.0.0 destroyed the user's selected text in some controlled/ProseMirror-class editors (e.g. ChatGPT) by calling `range.deleteContents()` and then dispatching a synthetic `InputEvent(data)` whose `data` duplicated the inserted string. The host editor's reactive reconciler rebuilt its internal state from the (stale) string and discarded the user's selected content. V2.0.1 fixes this:

- inserts fence fragments as plain text nodes anchored to the editor's DOM via two independent Range coordinates;
- preserves the user's selected DOM untouched (no `deleteContents`);
- dispatches a plain bubbling `input` event with **no `data`** so reactive reconcilers re-read from the live DOM instead of substituting a stale string.

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
