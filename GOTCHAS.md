# GOTCHAS

Read when something environmental is misbehaving and you're about to start debugging. Things that burned us once. Terse.

- Never use `alert()`/`confirm()` in the renderer: after one closes, text inputs stop accepting focus (Electron focus bug). Use the custom modal. (commit e4bf610)
- Don't run `npm start` yourself — the user launches the app.
- Packaged builds only include files listed in `package.json` → `build.files`. New source files must be added there.
- `settings.json` is ~23 MB on the user's machine; don't `cat` it or load it into context. Inspect with a script.
- Changing thumbnail size/quality without bumping `THUMBNAIL_VERSION` in `main.js` serves stale cached thumbnails.
- `main.js` requires `electron` at load, so it can't be `require`d from plain Node tests.
- `CLAUDE.md` is in `.gitignore` — edits to it aren't versioned.
- Repo is on a Windows drive under WSL (`/mnt/g`): git warns about LF→CRLF; file watching and npm installs are slow.
