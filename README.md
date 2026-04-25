# One Tap Code Block

One Tap Code Block is a minimal Chrome Extension that inserts or wraps Markdown fenced code blocks in supported editors.

## Supported triggers

- **Right Alt**
- **Middle mouse button** inside supported editable areas only

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

## Compatibility notes

- Telegram Web may work if its editor exposes a compatible `contenteditable` or `role="textbox"` structure in the same document.
- Telegram Web may still fail if its editor lives inside iframe, closed shadow DOM, or uses a non-standard caret model.
- Baidu search input is intentionally ignored.

## Behavior summary

- No selection: inserts

  ```

  ```

  and places the cursor on the empty line between the fences.
- With selection: wraps the selected text as a clean fenced block

  ```
  selected text
  ```

  and places the cursor after the selected text, before the newline and closing fence.
- Holding Right Alt inserts at most one block per physical press.
- Releasing and pressing Right Alt again inserts one new block.
- Middle mouse only intercepts clicks inside supported editable areas.

## Branding assets

- Runtime extension icons live in `icons/` and are referenced by `manifest.json`.
- A separate high-resolution store/display asset lives at `branding/store-icon-512.png`.
- Chrome still uses the manifest icon set for the installed extension surface, so this split is mainly for release packaging, docs, and store-facing materials.

## Debug mode

`content.js` includes:

```js
const DEBUG = false;
```

Set it to `true` locally only for troubleshooting. When enabled, it logs:
- trigger type
- event target info
- detected editable kind
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
zip -r one-tap-code-block-0.3.1.zip manifest.json content.js icons README.md CHANGELOG.md docs
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
