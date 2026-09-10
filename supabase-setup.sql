-- ═══════════════════════════════════════════════
-- Heimplaner – Supabase-Setup
-- Auszuführen im Supabase-Dashboard unter "SQL Editor".
-- Alles idempotent: mehrfaches Ausführen schadet nicht.
-- ═══════════════════════════════════════════════


-- ── 1. Fehlversuchsbremse (A3) ────────────────────────────────
-- Zählt Fehlversuche beim APP_PASSWORD pro IP und sperrt nach 10
-- Fehlversuchen in 15 Minuten für 15 Minuten.
-- Wird von netlify/lib/throttle.js gelesen und geschrieben.
--
-- Ohne diese Tabelle bleibt die App voll funktionsfähig: throttle.js ist
-- bewusst fail-open und prüft dann nur noch das Passwort – wie bisher.

create table if not exists auth_throttle (
  ip            text primary key,
  fails         integer     not null default 0,
  window_start  timestamptz not null default now(),
  blocked_until timestamptz
);

-- ACHTUNG, hier steckte ein Fehler drin (korrigiert am 08.09.2026):
-- Ursprünglich stand hier nur "enable row level security" mit der Annahme,
-- die Functions liefen mit dem service_role-Key. Sie laufen aber mit dem
-- anon-Key. RLS ohne Policy sperrt den aus — und zwar lautlos: das Lesen
-- liefert eine leere Liste statt eines Fehlers, das Schreiben wird
-- abgewiesen. Die Bremse hätte nie gezählt und nie gesperrt.
--
-- RLS bleibt eingeschaltet, damit die Tabelle sofort geschützt ist, falls
-- später auf den service_role-Key gewechselt wird (der umgeht RLS und
-- bräuchte dann keine Policy). Bis dahin erlaubt die Policy den Zugriff,
-- den die Function braucht.
--
-- Der eigentliche Schutz dieser Datenbank ist derzeit, dass der Key den
-- Server nie verlässt — nicht RLS. Siehe Hinweis am Ende der Datei.
alter table auth_throttle enable row level security;

drop policy if exists "heimplaner_throttle_access" on auth_throttle;
create policy "heimplaner_throttle_access" on auth_throttle
  for all using (true) with check (true);


-- ── 2. Aufräumen des Dedup-Logs der Push-Function (D10) ───────
-- push-check.mjs merkt sich jede verschickte Erinnerung in push_sent_log,
-- um bei überlappenden Zeitfenstern nichts doppelt zu senden. Ohne
-- Aufbewahrungsfrist wächst diese Tabelle unbegrenzt – ausgerechnet an der
-- Stelle, die jede Minute läuft.
--
-- Ein Tag Aufbewahrung genügt bei weitem: das Rückblickfenster der Function
-- beträgt 5 Minuten.

-- Spalte für den Zeitstempel ergänzen, falls noch nicht vorhanden.
alter table push_sent_log add column if not exists sent_at timestamptz not null default now();

create index if not exists push_sent_log_sent_at_idx on push_sent_log (sent_at);

-- Variante A – ohne Zusatzmodul: einmal pro Woche von Hand ausführen,
-- oder als wiederkehrende Abfrage einplanen.
--   delete from push_sent_log where sent_at < now() - interval '1 day';

-- Variante B – automatisch, falls die Erweiterung pg_cron verfügbar ist
-- (Supabase-Dashboard → Database → Extensions → pg_cron aktivieren).
-- Läuft dann täglich um 03:15 UTC.
--
-- select cron.schedule(
--   'heimplaner-purge-push-log',
--   '15 3 * * *',
--   $$ delete from push_sent_log where sent_at < now() - interval '1 day' $$
-- );


-- ── 3. Kontrolle ──────────────────────────────────────────────
-- Grösse der beteiligten Tabellen ansehen:
--   select relname, pg_size_pretty(pg_total_relation_size(relid)) as groesse
--   from pg_catalog.pg_statio_user_tables
--   where relname in ('heimplaner_sync', 'push_sent_log', 'push_subscriptions', 'auth_throttle')
--   order by pg_total_relation_size(relid) desc;
