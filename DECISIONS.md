# DECISIONS

Read before changing architecture, naming, dependencies, or conventions. One line per decision. Newest at bottom. Don't reopen these without saying "this reverses decision X because…".

Format: `YYYY-MM-DD — <decision> — <why, one clause>`

- 2025-09-24 — Electron desktop app — needs direct filesystem access and recursive folder scanning, cross-platform (inferred)
- 2025-09-24 — Vanilla JS/HTML/CSS, no UI framework or bundler — keep it simple (inferred)
- 2025-09-24 — All state in one `settings.json` next to the app, not in user data dir — portable install; confirmed by user 2026-11-17 (packaged builds must stay portable/unpacked)
- 2025-09-25 — Sharp for thumbnails, 200x150 WebP q50, memory LRU (500) + disk cache — full-size thumbnails were slow; "much better now" (commit f0c2d58)
- 2025-09-25 — One global tag bank shared by all collections (commit 99757e8)
- 2025-09-26 — Custom modal system instead of `alert()`/`confirm()` — native alert broke text inputs afterwards (commit e4bf610)
- 2025-09-26 — `settings.json` not tracked in git — it's personal data (commit 76f757c)
- 2025-09-26 — Manual backups only, no automatic backups (inferred)
- 2025-09-27 — Right-click only opens the tag menu; it never changes selection (commit 9f11c98)
- 2026-11-17 — Direction: replace Electron with a Docker-hosted web app on the user's Unraid NAS, used over Tailscale — use references anywhere, and Electron is heavier than needed. Stack not chosen yet
- 2026-11-17 — Node built-in `node:test` as test runner — zero extra dependencies, Node 22 already present
- 2026-11-17 — ESLint 9 recommended for lint; no typecheck step — plain JS codebase, adding TS/checkJs would be a migration, not a check
