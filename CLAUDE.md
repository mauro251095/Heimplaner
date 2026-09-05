# Heimplaner

Shared household management PWA, built for personal use by Mauro and Melissa (partner). Vanilla HTML/CSS/JS — no build step, no framework, no bundler.

## Repo & Deployment

- GitHub repo: `mauro251095/Heimplaner`, deployed via GitHub Pages
- Also deployed on Netlify: `sage-salmiakki-4ab33e.netlify.app`
- Netlify serverless functions proxy to Supabase (project ref `yzgkfcdlrdaspwybpule`) for real-time sync
- Secrets (Supabase keys, auth passwords) live in Netlify environment variables — never hardcode keys in client-side JS
- **Production branch is `main`** — Netlify auto-deploys on every push to `main`

## Git-Workflow

- After a completed, meaningful change, commit automatically with a clear, descriptive commit message
- Do **not** push to `main` without explicit confirmation from Mauro — always ask first
- Since Netlify auto-deploys from `main`, a push goes live immediately — treat it accordingly
- Keep commits scoped and readable (one logical change per commit where practical)

## File Structure

Five files, each with a defined responsibility:

- `index.html` — markup and shell
- `heimplaner-login.js` — login screen + auth handling
- `heimplaner-data.js` — data model / local state
- `heimplaner-app.js` — UI logic, rendering, event handling
- `heimplaner-sync.js` — Supabase sync via Netlify function proxy

CRITICAL — do not reorder: `index.html` must always end with exactly these four script tags, in this order, directly before `</body>`:

```html
<script src="heimplaner-login.js"></script>
<script src="heimplaner-data.js"></script>
<script src="heimplaner-app.js"></script>
<script src="heimplaner-sync.js"></script>
```

If you add a new JS file, decide deliberately where in this order it belongs (it almost certainly depends on `heimplaner-data.js` loading first) — don't just append it.

## Auth

- `heimplaner-login.js` (client) + Netlify function `auth.js` (server)
- Credentials stored as `HP_USERS` env var, format: `mauro:pw,melissa:pw`
- On successful login, a token is persisted in `localStorage` for 30 days
- Shared `APP_PASSWORD` also gates access alongside per-user credentials

## Sync

- Supabase is the source of truth; Netlify function proxies all reads/writes so the Supabase key never reaches the client
- Writes are debounced 2 seconds after the last local change before syncing
- Client polls every 15 seconds to pick up changes made on the other partner's device
- When touching sync logic, preserve this debounce/poll timing unless explicitly asked to change it — it's tuned to avoid hammering Supabase while still feeling "live" between two devices
- Deletions use tombstones (`HP.deleted[type][id] = timestamp`, set via `markDeleted()` in `heimplaner-data.js`) so a poll/merge never resurrects an item deleted on the other device. Every delete function must call `markDeleted()` before removing the item from its array. Sync-relevant arrays (events, notes, birthdays, shop, savedShopItems, customRecipes, budgetEntries, tasks) are merged by ID in `heimplaner-sync.js` (`mergeArrayById`/`mergeTaskLists`), not blindly overwritten — on an ID conflict remote wins (matches prior full-overwrite behavior), but tombstoned IDs are always excluded and new local-only items are preserved.

## UI Conventions

- Color scheme is meaningful, not decorative — keep it consistent:
  - `#6C8EFF` (blue) = Mauro
  - `#FF7EB3` (pink) = Melissa
  - `#4ECDC4` (teal) = shared/both
- Sidebar buttons navigate between views — they do not trigger rename. Renaming is via a ✏️ icon that appears on hover
- Shopping list tiles show no emoji
- New task creation includes day/time selection inline (not a separate step/modal)

## Features

Weekly planner, shopping list, meal planner with an editable recipe library (currently 34 recipes, incl. mealprep and bettybossi.ch imports), monthly calendar, pinboard, and an AI assistant with voice input.

Recipes live in `HP.customRecipes` (synced, editable via pencil icon) — the old hardcoded `RECIPES` array in `heimplaner-data.js` is migrated into `customRecipes` once on load and now serves only as that migration seed. A copy-paste importer for bettybossi.ch recipes (`parseBettyBossiRecipe` in `heimplaner-app.js`) parses pasted recipe text client-side (no network calls) into the same format, with a preview/correction step before saving.

## Working Style

- No build tooling — test changes by opening `index.html` directly or via a simple static server; don't introduce a bundler/framework without asking first
- When changing shared data shapes (in `heimplaner-data.js`), check `heimplaner-sync.js` for how that shape is serialized to/from Supabase — a mismatch breaks cross-device sync silently
- Keep changes scoped to the relevant file(s); this is a small app and cross-cutting refactors should be called out explicitly before doing them
