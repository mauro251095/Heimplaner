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
- `heimplaner-pwa.js` — service worker registration, `?view=` deep link, install banner
- `heimplaner.css` — all styles (extracted from `index.html`; the CSP depends on it staying a separate file)
- `test.html` — 70 checks for merge, tombstone, date and escaping logic. Open it in a browser before pushing.
- `supabase-setup.sql` — table definitions to run in the Supabase SQL editor
- `_headers` — CSP and security headers
- `netlify/lib/` — shared code for the functions. Deliberately **not** inside `netlify/functions/`: files there each become a public endpoint.

CRITICAL — do not reorder: `index.html` must always end with exactly these five script tags, in this order, directly before `</body>`:

```html
<script src="heimplaner-login.js"></script>
<script src="heimplaner-data.js"></script>
<script src="heimplaner-app.js"></script>
<script src="heimplaner-sync.js"></script>
<script src="heimplaner-pwa.js"></script>
```

If you add a new JS file, decide deliberately where in this order it belongs (it almost certainly depends on `heimplaner-data.js` loading first) — don't just append it.

Do **not** put styles back into a `<style>` block or logic into an inline `<script>` in `index.html`: the CSP sets `script-src-elem 'self'` and `style-src-elem 'self'`, so both would simply stop working.

## Auth

- `heimplaner-login.js` (client) + Netlify function `auth.js` (server)
- Credentials stored as `HP_USERS` env var, format: `mauro:pw,melissa:pw`
- On successful login, `{username, expiry}` is persisted in `localStorage` for 30 days. This is **not** a validated token — it is client-written and never checked by the server. It gates the UI only.
- The actual access control for all data is `APP_PASSWORD` (the sync password the user types in the sync dialog), checked server-side by `sync.js` and `push-subscribe.js`. Do not remove it — it is the only thing protecting the database.
- `netlify/lib/throttle.js` brakes brute-force attempts: 10 failures per IP in 15 minutes → 15-minute block, counters in Supabase (in-memory counters are useless on serverless). Fail-open by design, so a missing table never locks you out.

## Sync

- Supabase is the source of truth; Netlify function proxies all reads/writes so the Supabase key never reaches the client
- Writes are debounced 2 seconds after the last local change before syncing
- Client polls every 15 seconds **while in use**, backing off to 60 seconds after 5 minutes without a `pointerdown`/`keydown`, and snapping straight back on the next interaction. Polling pauses entirely while the app is hidden (`document.hidden`). The poll first asks `sync?meta=1`, which returns only `updated_at` (~50 bytes), and fetches the full record only when it actually changed.
- **These intervals are a Netlify-quota decision, not a feel decision.** The free tier bills credits and cuts the site off when they run out — including the login, which also runs through a function. A visible-but-idle desktop tab used to poll 5760 times a day on its own. Don't tighten them back without checking Netlify → Usage first.
- `push-check.mjs` runs every 5 minutes (`*/5 4-22 * * *`) and reads only `tasks`, `events`, `birthdays` and `taskExceptions` — not the whole record. It falls back to the full fetch if the narrow query fails, so reminders can never silently stop.
- Night pause 23:05–06:00 Zurich. It is enforced **twice on purpose**: the cron's UTC hour range is what actually saves Netlify invocations (an early `return` inside a function still costs a full invocation), and `istNachtruhe()` trims the edges precisely, because a UTC schedule cannot follow daylight saving.
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

Weekly planner, shopping list, meal planner with an editable recipe library (currently 34 recipes, incl. mealprep and bettybossi.ch imports), monthly calendar, pinboard, budget tracking, birthdays, and web-push reminders.

There is **no AI assistant and no voice input** — the remnants were removed (they had been unreachable: no UI elements, and the referenced `sendAiMessage()` no longer existed). Don't reintroduce either without asking.

Recipes live in `HP.customRecipes` (synced, editable via pencil icon) — the old hardcoded `RECIPES` array in `heimplaner-data.js` is migrated into `customRecipes` once on load and now serves only as that migration seed. A copy-paste importer for bettybossi.ch recipes (`parseBettyBossiRecipe` in `heimplaner-app.js`) parses pasted recipe text client-side (no network calls) into the same format, with a preview/correction step before saving.

## Working Style

- No build tooling — test changes by opening `index.html` directly or via a simple static server; don't introduce a bundler/framework without asking first
- When changing shared data shapes (in `heimplaner-data.js`), check `heimplaner-sync.js` for how that shape is serialized to/from Supabase — a mismatch breaks cross-device sync silently
- Keep changes scoped to the relevant file(s); this is a small app and cross-cutting refactors should be called out explicitly before doing them

## Security

- **The GitHub repo is public.** Never commit secrets, and assume the function URLs and the whole auth scheme are known to anyone.
- Anything from `HP` (user text, synced partner data, imported bettybossi.ch recipes) must go through `esc()` from `heimplaner-data.js` before it lands in `innerHTML` — including inside `value="…"` and `onclick="…('X')"` attributes. Use `textContent` where only text is shown.
- `_headers` holds the CSP and security headers. A strict `script-src`/`style-src` is currently impossible because of the inline `onclick` handlers and the inline `<style>` block; `connect-src 'self'` is what actually limits the damage of an injection.
- `netlify/functions/sync.js` and `push-subscribe.js` are gated by `APP_PASSWORD` (the sync password the user types), **not** by the login. The login token in `localStorage` is client-written and unvalidated — it gates the UI only, not data access.
