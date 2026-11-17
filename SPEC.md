# SPEC

Read when scoping a feature or unsure whether something is in scope.

## What it is
A desktop app for timed drawing practice. You point it at folders of reference photos, organize them into tagged collections and saved practice sets, then run sessions that show random images one at a time on a countdown.

## Who it's for
The author, first: today on a Windows desktop; next, from any device via a browser, with the app self-hosted on their Unraid NAS and reached over Tailscale (VPN and NAS already set up). Other artists are secondary (inferred).

## Core flows
1. Add folders (multi-select, recursive) → each becomes a collection with a first-image thumbnail
2. Organize: tag collections (right-click, global tag bank, bulk add/remove), reorder by drag, choose icon size, bulk delete
3. Filter: tags with include/exclude (AND), text search, optional regex; select all / deselect all respect the filter, plus "select all regardless" buttons
4. Practice sets: save the current selection under a name, update, delete, reload; the last set is remembered
5. Session: set timer (5–3600 s) and image count (1–1000) → random images from enabled collections; prev/next/pause/end, zoom/pan/double-click reset, fullscreen; timer turns yellow at 30 s and red at 10 s; returns to the menu quietly at the end
6. Safety: create/restore/delete manual backups of settings from the Tools menu
7. First run: 8-step spotlight tutorial (replayable from the Tools menu)

## Milestones
Updated by `/roadmap`. The current milestone lives in `STATUS.md`, not here.
- **Done:** 2025-09-24 — collections, thumbnails, sessions, reorder, icon sizes (inferred)
- **Done:** 2025-09-25 — tags, tag filtering, thumbnail caching (inferred)
- **Done:** 2025-09-26 — backups, custom modals, practice sets, text filtering (inferred)
- **Done:** 2025-09-27/28 — tutorial, input polish, remember last set/icon size (inferred)
- **Next:** v2 — move off Electron to a self-hosted web app: Docker container on Unraid, browser UI, reference library on the NAS, reached over Tailscale. Architecture TODO (`/roadmap`).

## Non-goals
The most important section. Things we are deliberately not building. When a session drifts toward one of these, stop and say so.
- In-app drawing or sketching — it shows references only
- Editing images (crop, filters, changing source files)
- TODO: more? (e.g. public internet exposure beyond Tailscale, multi-user accounts)

## Constraints
- No cloud services; images come from the user's own storage (local disk today, NAS in v2) (inferred)
- Must handle libraries with thousands of images (inferred)
- Electron app: settings stay next to the app (portable), confirmed 2026-11-17
- v2: runs as a Docker container on Unraid; access over Tailscale
