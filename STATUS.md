# STATUS

Read this first. Present tense only; overwrite, don't append. Keep under ~20 lines. History lives in `worklogs/`.

**Milestone:** v1.0 Electron app feature-complete; planning v2 (Docker web app on Unraid, over Tailscale)
**Last updated:** 2026-11-17

## Works
- Collections: add folders (recursive scan), thumbnails, reorder, drag-select, bulk delete, three icon sizes
- Tags, tag include/exclude filters, text + regex search, filter-aware select all
- Practice Sets: save/update/delete/load named collection sets; last set remembered
- Timed sessions: timer, image count, prev/next/pause/end, zoom/pan, fullscreen
- Manual backups: create/restore/delete; 8-step first-run tutorial
- `npm run check`: 1 smoke test passes, lint 0 errors / 8 warnings (ran 2026-11-17)

## Broken / unfinished
- Packaged (installer/AppImage) builds likely broken: `preload.js` missing from build files, settings dir read-only — BACKLOG P3 (v2 supersedes)
- `settings.json` is ~23 MB (full image lists + base64 previews per collection), rewritten on every change — BACKLOG P2
- No real tests; only a smoke test — BACKLOG P2

## Next
- `/roadmap` to choose the v2 web-app architecture (BACKLOG P1)
- Pull pure logic out of the Electron code into testable modules; it carries over to v2

## Confidence
ran once — user has hand-tested every "Works" item from source (not the installed build). No automated coverage beyond the smoke test.
