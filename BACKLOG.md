# BACKLOG

Read when picking work. Added to by `/done`, `/sprint`, `/critique`. Delete items when done — git remembers.

Priority: `P1` blocks progress · `P2` should do soon · `P3` nice to have.
Tag: `[design]` needs a product/design call before planning · `[impl]` clear enough to plan and build (sprint-ready).

No TODO/FIXME/HACK comments exist in the code; items below come from commit messages, the build config, and reading the code.

## Now
- [ ] `P1` `[design]` v2 architecture: Docker web app on Unraid, used over Tailscale — choose the backend stack, how the NAS image library is mounted/scanned, where state lives (likely a small DB instead of one JSON file), thumbnail serving, single-user vs. auth, and how to migrate existing `settings.json` (collections, tags, practice sets). Run `/roadmap`
- [ ] `P1` `[design]` Decide what happens to the Electron app during v2: freeze, maintain, or retire

## Next
- [ ] `P2` `[impl]` Pull framework-independent logic (filtering, shuffle/session selection, settings merge, backup naming) out of `renderer.js`/`main.js` into plain modules — enables tests now and reuse in v2
- [ ] `P2` `[impl]` Add regression tests for existing core behavior. Needs logic extracted into plain modules first. Most important: (1) settings load merges defaults and survives corrupt JSON; (2) backup filename ↔ timestamp parsing and restore; (3) collection filtering (tags AND, exclude, text/regex) and session image selection/shuffle
- [ ] `P2` `[design]` Shrink `settings.json` (~23 MB for 133 collections): it stores every image path and base64 preview per collection and rewrites the whole file on each change (27 call sites). Store previews in thumbnail cache only; consider rescanning instead of persisting image lists
- [ ] `P2` `[impl]` Add `settings.json` and `settings_backups/` to `.gitignore` — commit 76f757c removed settings from git but it was never ignored; both show as untracked
- [ ] `P2` `[design]` No way to rescan a collection: image lists are captured when the folder is added, so new/deleted files aren't picked up (inferred)
- [ ] `P2` `[impl]` Make the 8 lint warnings go away (unused vars in `main.js:255`, `renderer.js` handlers)

## Later
- [ ] `P3` `[impl]` Electron packaging: add `preload.js` to `build.files` in `package.json` — the existing app.asar has no preload, so `window.electronAPI` is undefined in installed builds (inferred). Superseded by v2 unless the Electron app is kept
- [ ] `P3` `[impl]` Electron packaging, portable: settings/backups/cache write to `__dirname`, which is read-only inside app.asar. Write next to the executable instead (user chose portable), or ship only unpacked builds (inferred)
- [ ] `P3` `[design]` Collection grid spacing "still not to my liking" (commit 6822bd8)
- [ ] `P3` `[design]` Tutorial copy is "a little rough and wordy and clearly AI" (commit 93990dc) — tighten it
- [ ] `P3` `[impl]` Fill package.json placeholders: `author: "Your Name"`, `appId: com.yourname.drawing-reference`
- [ ] `P3` `[impl]` Upgrade Electron 27 (end-of-life) and Sharp 0.32; `npm audit` reports vulnerabilities
- [ ] `P3` `[impl]` "Cleanup Old Thumbnails" deletes by file access time, which Windows/NTFS often doesn't update — may never clean anything (inferred)
- [ ] `P3` `[impl]` `restore-from-backup` / `delete-backup` join a renderer-supplied filename onto the backup dir without validating it — restrict to `settings_backup_*.json` basenames
- [ ] `P3` `[design]` `renderer.js` is one 130 KB class; split into modules (would also unblock testing)
