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


-- ── 3. Aufräumen der Fehlversuchsbremse ───────────────────────
-- auth_throttle bekommt eine Zeile pro angreifender IP. Über IPv6 lassen sich
-- davon beliebig viele erzeugen, bis der 500-MB-Gratisspeicher voll ist.
-- Das ist nicht nur ein Speicherproblem: guardPassword() ist bewusst
-- fail-open, die Bremse verschwindet also genau dann, wenn Supabase klemmt –
-- und dann sind unbegrenzt viele Passwortversuche möglich.
--
-- Abgelaufene Zeilen werden nicht mehr gebraucht: Fenster und Sperre sind je
-- 15 Minuten, alles Ältere ist bedeutungslos.

-- Variante A – von Hand, gelegentlich:
--   delete from auth_throttle
--   where window_start < now() - interval '1 day'
--     and (blocked_until is null or blocked_until < now());

-- Variante B – automatisch mit pg_cron (Dashboard → Database → Extensions).
-- Läuft stündlich.
--
-- select cron.schedule(
--   'heimplaner-purge-throttle',
--   '7 * * * *',
--   $$ delete from auth_throttle
--      where window_start < now() - interval '1 day'
--        and (blocked_until is null or blocked_until < now()) $$
-- );


-- ── 4. Row Level Security auf den Datentabellen ───────────────
-- ACHTUNG – REIHENFOLGE. Dieser Abschnitt macht den Datenbestand nur dann
-- sicherer, wenn die Netlify-Functions vorher auf den service_role-Key
-- umgestellt wurden. Der service_role-Key umgeht RLS bewusst; der anon-Key
-- nicht.
--
-- Wird RLS eingeschaltet, WÄHREND die Functions noch den anon-Key benutzen,
-- bricht der Sync LAUTLOS ab: Lesen liefert eine leere Liste statt eines
-- Fehlers (genau der Fehler, der oben bei auth_throttle schon einmal drin
-- war), und Schreiben wird abgewiesen.
--
-- Richtige Reihenfolge:
--   1. Netlify → Environment variables → SUPABASE_KEY auf den
--      service_role-Key ändern, neu deployen
--   2. In der App prüfen, dass Sync weiterhin grün ist
--   3. ERST DANN die vier Zeilen unten ausführen
--
-- Warum überhaupt: Der anon-Key ist bei Supabase als öffentlicher Wert
-- konzipiert, RLS ist die eigentlich vorgesehene Schranke. Solange RLS aus
-- ist, bedeutet jeder Leak dieses Keys sofortigen Vollzugriff auf alles –
-- unter Umgehung von Netlify, APP_PASSWORD und der Fehlversuchsbremse.
-- Mit RLS ohne Policy ist ein geleakter anon-Key wertlos.
--
-- alter table heimplaner_sync     enable row level security;
-- alter table push_subscriptions  enable row level security;
-- alter table push_sent_log       enable row level security;
--
-- Und die Notlösung von oben wieder zurücknehmen, die dem anon-Key noch
-- alles erlaubt (mit service_role nicht mehr nötig):
-- drop policy if exists "heimplaner_throttle_access" on auth_throttle;


-- ── 5. Kontrolle ──────────────────────────────────────────────
-- Grösse der beteiligten Tabellen ansehen:
--   select relname, pg_size_pretty(pg_total_relation_size(relid)) as groesse
--   from pg_catalog.pg_statio_user_tables
--   where relname in ('heimplaner_sync', 'push_sent_log', 'push_subscriptions', 'auth_throttle')
--   order by pg_total_relation_size(relid) desc;
