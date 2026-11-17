# HUMAN

For the person, not for Claude. Claude maintains this (via `/done` and `/explain`) but never needs it for work.

Rules for this file: plain English. No code. No file paths. No jargon that isn't defined in the glossary below. If a section needs code to explain, it belongs somewhere else. When something here sounds wrong to the human, that's usually a real bug or an unintended design — say so in the next session.

## What this project does, in one paragraph
It's a practice tool for drawing. You tell it where your reference photos live, and it turns each folder into a "collection" with a little preview picture. You label collections with tags, pick which ones you're in the mood for (or load a saved combination), set how long each image stays up and how many images you want, and press start. The app then shows random pictures from your picks, one at a time, with a big countdown, so you can do quick timed sketches without hunting for references.

## How it works, from the user's side

### Adding folders
When you add one or more folders, the app looks through each folder and every folder inside it for pictures. It remembers the full list of pictures it found and makes a small preview from the first one. Previews are saved, so the next time you open the app they show up right away. Note: the list of pictures is taken when you add the folder. If you add photos to the folder later, the app doesn't notice them.

### Tags and filtering
Right-click a collection to give it tags from one shared list of tags. The filter bar can show only collections with all the tags you chose, hide collections with certain tags, or search by name (with an advanced pattern mode). "Select all" and "Deselect all" only affect what you can currently see. A second pair of buttons affects everything.

### Practice sets
A practice set is a saved list of which collections are switched on, so you can jump back to, say, "hands" or "animals" in one click. The app remembers the last one you used.

### A session
When you start, the app gathers every picture from the collections you switched on, shuffles them, and shows them one by one. The menu disappears and only small floating buttons remain: back, next, pause, and end. The timer turns yellow near the end and red in the last ten seconds, then moves on by itself. You can zoom with the mouse wheel and drag to move around, and the zoom stays the same from picture to picture. When the session ends, you go straight back to the main screen with no pop-up.

### Backups
Everything the app remembers (collections, tags, practice sets, settings) lives in one settings file. From the Tools menu you can save a dated copy of it, roll back to an earlier copy, or delete old copies. Nothing is backed up automatically.

### Where this is heading
The plan is to turn this from a desktop program into a small website that runs on your home NAS. You'd open it in any browser, from anywhere, through your private network connection, and it would read the reference photos stored on the NAS.

## Things that are more fragile than they look
- The installed version (from the build) probably doesn't work right now. The build leaves out one needed piece and tries to save settings in a place it isn't allowed to write. Running from source works.
- The settings file has grown very large (about 23 MB) because it stores every picture's location and preview, and the app rewrites all of it on every small change.
- If the settings file gets corrupted, the app quietly starts fresh with defaults. Your only way back is a backup you made yourself.

## Glossary
- **Collection** — one folder of reference images (including its subfolders) as the app sees it.
- **Tag** — a label you attach to collections for filtering.
- **Practice set** — a saved choice of which collections are on.
- **Session** — one timed run through random images.
- **Thumbnail / preview** — the small picture shown on a collection's tile.
