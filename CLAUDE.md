# Heimplaner

Gemeinsame Haushalts-App (PWA) für den privaten Gebrauch von Mauro und Melissa.
Reines HTML/CSS/JS — kein Build-Schritt, kein Framework, kein Bundler.

## Repo & Deployment

- GitHub-Repo: `mauro251095/Heimplaner`
- Netlify: `sage-salmiakki-4ab33e.netlify.app` — das einzige Deployment.
  GitHub Pages wurde am 10.09.2026 abgeschaltet (es lieferte eine veraltete
  Kopie ohne Header — `_headers` und damit die CSP gilt nur auf Netlify).
- Netlify-Functions sind der Proxy zu Supabase (Projekt `yzgkfcdlrdaspwybpule`).
- Secrets (Supabase-Keys, Passwörter) stehen in den Netlify-Umgebungsvariablen,
  **nie** im Client-Code.
- **Produktionszweig ist `main`** — jeder Push nach `main` geht sofort live.

## Git-Workflow

- Nach einer abgeschlossenen, sinnvollen Änderung automatisch committen, mit
  klarer Commit-Nachricht.
- **Nicht** ohne ausdrückliche Zustimmung von Mauro nach `main` pushen.
- Ein Push ist ein Deploy — entsprechend behandeln.
- Commits klein und lesbar halten (eine logische Änderung pro Commit).

## Dateistruktur

Die App:

- `index.html` — Gerüst und Skript-Reihenfolge
- `tokens.css` — Farb-, Abstands- und Schrift-Tokens (Dark + Hell-Theme)
- `app.css` — das gesamte übrige Stylesheet
- `app.js` — Modal/Toast, Navigation (`VIEWS`, Schnellwahl), gemeinsame
  Bausteine (`viewHead`, `segHtml`, `navRow`, …), Theme/Farben, Haushalt
- `tasks.js` — Zeilen und Formulare für Aufgaben und Termine (keine eigene
  Ansicht; Heute/Planer/Personen benutzen sie gemeinsam)
- `heute.js` — Startansicht; `tagAbschnitteHtml()` liefert auch die Tagesansicht
- `planer.js` — Tag/Woche/Monat und Personen
- `shop.js`, `budget.js`, `meals.js` (Menüplan + Rezepte), `notes.js`,
  `birthdays.js`, `settings.js` — die übrigen Ansichten
- `icons/` — Tabler-Icons (MIT) als einzelne SVGs, selbst gehostet
- `sw.js` — Service Worker (reine Netz-Durchreiche, kein Caching)
- `manifest.json`, `icon-192.png`, `icon-512.png` — PWA-Teil
- `muster.html` — Stilübersicht aus der Entwurfsphase, keine Laufzeit-Datei

Geteilt (von der App **und** der alten Version unter `alt/` benutzt):

- `heimplaner-data.js` — Datenmodell, `esc()`, `markDeleted()`, Datums- und
  Wiederholungslogik (`advanceDateKey`, `nthWeekdayOfMonth`, …)
- `heimplaner-login.js` — Login-Gate
- `heimplaner-sync.js` — Supabase-Sync über den Netlify-Proxy
- `heimplaner-pwa.js` — Service-Worker-Registrierung, `?view=`-Deep-Link,
  Installationsbanner

Drumherum:

- `test.html` — Checks für Merge-, Tombstone-, Datums-, Escaping- und
  Importer-Logik. Im Browser öffnen oder `npm test` (headless via Playwright).
- `_headers` — CSP, Sicherheits-Header und **die Cache-Regeln pro Datei**
- `supabase-setup.sql` — Tabellendefinitionen für den Supabase-SQL-Editor
- `netlify/lib/` — gemeinsamer Code der Functions. Bewusst **nicht** unter
  `netlify/functions/`: alles dort wird ein öffentlicher Endpunkt.

KRITISCH — Reihenfolge nicht ändern: `index.html` muss mit genau diesen
Skript-Tags enden, in dieser Reihenfolge, direkt vor `</body>`:

```html
<script src="heimplaner-login.js"></script>
<script src="heimplaner-data.js"></script>
<script src="app.js"></script>
<script src="tasks.js"></script>
<script src="heute.js"></script>
<script src="planer.js"></script>
<script src="shop.js"></script>
<script src="budget.js"></script>
<script src="meals.js"></script>
<script src="notes.js"></script>
<script src="birthdays.js"></script>
<script src="settings.js"></script>
<script src="heimplaner-sync.js"></script>
<script src="heimplaner-pwa.js"></script>
```

`app.js` definiert `showModal`/`showToast`/`render`, die die geteilten Dateien
erwarten; die Ansichts-Dateien hängen sich über `VIEWS` (in `app.js`) ein und
müssen deshalb danach kommen.

**Neue Datei hinzugefügt?** Dann an drei Stellen nachziehen: Skript-Tag hier,
eine Zeile in `_headers` (sonst greift keine Cache-Regel, siehe unten), und
ein Wort in dieser Liste.

Keine Styles zurück in einen `<style>`-Block und keine Logik in ein inline
`<script>` in `index.html`: die CSP setzt `script-src-elem 'self'` und
`style-src-elem 'self'`, beides würde schlicht nicht mehr laufen.

## Die alte Version unter `alt/`

`alt/` ist die vorherige Fassung der App (Stand der Ablösung), eingefroren als
Rückfallebene, erreichbar unter `/alt/`. Sie benutzt dieselben Daten und
dieselben geteilten Dateien (deshalb die `../`-Pfade in `alt/index.html`) und
hat bewusst **keinen** Manifest-Link mehr, damit sie niemand versehentlich als
App installiert.

Dort wird nichts mehr weiterentwickelt. Wenn die neue Version eine Weile
störungsfrei läuft, kann der Ordner ersatzlos weg.

## Auth

- `heimplaner-login.js` (Client) + Netlify-Function `auth.js` (Server)
- Zugangsdaten stehen in der Umgebungsvariable `HP_USERS`, Format:
  `mauro:pw,melissa:pw`
- Nach erfolgreichem Login liegt `{username, expiry}` 30 Tage im
  `localStorage`. Das ist **kein** geprüftes Token — es wird vom Client
  geschrieben und vom Server nie kontrolliert. Es steuert nur die Oberfläche.
- Die echte Zugangskontrolle für alle Daten ist `APP_PASSWORD` (das
  Sync-Passwort, das man in den Einstellungen einträgt), serverseitig geprüft
  von `sync.js` und `push-subscribe.js`. Nicht entfernen — es ist das
  Einzige, was die Datenbank schützt.
- `netlify/lib/throttle.js` bremst Rateversuche: 10 Fehlschläge pro IP in 15
  Minuten → 15 Minuten Sperre, Zähler in Supabase (In-Memory-Zähler sind auf
  Serverless nutzlos). Bewusst "fail open", damit eine fehlende Tabelle
  niemanden aussperrt.

## Sync

- Supabase ist die Wahrheit; die Netlify-Function proxyt alle Lese- und
  Schreibzugriffe, damit der Supabase-Key nie im Client landet.
- Schreibvorgänge werden 2 Sekunden nach der letzten lokalen Änderung gebündelt.
- Der Client fragt alle 15 Sekunden nach, **während er benutzt wird**, fällt
  nach 5 Minuten ohne `pointerdown`/`keydown` auf 60 Sekunden zurück und
  springt bei der nächsten Interaktion sofort wieder hoch. Bei verstecktem Tab
  (`document.hidden`) pausiert er ganz. Gefragt wird zuerst `sync?meta=1` — das
  liefert nur `updated_at` (~50 Bytes); der ganze Datensatz wird nur geholt,
  wenn er sich wirklich geändert hat.
- **Diese Intervalle sind eine Netlify-Kontingent-Entscheidung, kein
  Gefühl.** Das Gratis-Kontingent schaltet die Seite ab, wenn es aufgebraucht
  ist — inklusive Login, der ebenfalls über eine Function läuft. Ein
  sichtbarer, unbenutzter Desktop-Tab kam früher allein auf 5760 Anfragen pro
  Tag. Nicht wieder enger stellen, ohne vorher in Netlify → Usage zu schauen.
- `push-check.mjs` läuft alle 5 Minuten (`*/5 4-22 * * *`) und liest nur
  `tasks`, `events`, `birthdays` und `taskExceptions` — nicht den ganzen
  Datensatz. Schlägt die schmale Abfrage fehl, holt es doch alles, damit
  Erinnerungen nie stillschweigend ausbleiben.
- Nachtruhe 23:05–06:00 Zürich, **absichtlich doppelt** abgesichert: die
  UTC-Stunden im Cron sparen die Aufrufe (ein frühes `return` in der Function
  kostet trotzdem einen vollen Aufruf), und `istNachtruhe()` schneidet die
  Ränder genau, weil ein UTC-Zeitplan der Sommerzeit nicht folgen kann.
- Beim Anfassen der Sync-Logik dieses Timing erhalten, sofern nicht
  ausdrücklich anders gewünscht.
- Löschungen laufen über Tombstones (`HP.deleted[typ][id] = zeitstempel`, via
  `markDeleted()` in `heimplaner-data.js`), damit ein Merge nichts
  wiederbelebt, was auf dem anderen Gerät gelöscht wurde. Jede Lösch-Funktion
  muss `markDeleted()` aufrufen, bevor der Eintrag aus seinem Array fliegt.
  Die sync-relevanten Arrays (events, notes, birthdays, shop, savedShopItems,
  customRecipes, budgetEntries, tasks) werden in `heimplaner-sync.js` per ID
  gemerged (`mergeArrayById`/`mergeTaskLists`), nicht blind überschrieben.

## Design-Entscheidungen

- **Akzentfarbe Grün** (`--accent`) für alles, was die App tut oder anbietet:
  aktiver Tab, Segment-Zustand, Toggle an, Budget-Balken solange im Rahmen.
- **Budget-Balken wechseln auf Rot** (`--danger`), sobald eine Kategorie **90 %
  oder mehr** ihres Limits erreicht — bewusst eine Vorwarnung, kein
  Zu-spät-Alarm.
- **Personenfarben sind wählbar, nicht fix.** Jede Person wählt eine Farbe aus
  der Palette in `tokens.css`. Code und Texte dürfen deshalb nie "blau =
  Mauro" annehmen, sondern immer "die aktuell gewählte Farbe dieser Person".
- **Icons**: Tabler Icons (MIT) als einzelne SVGs unter `icons/`, selbst
  gehostet, nicht per CDN. Gilt für Navigation und Bedienelemente — dort kein
  Emoji.
- **Emoji bleiben** für selbst gewählte Inhalte (`task.emoji`, `e.emoji`,
  Rezept-Icon). Eingabe ist ein reines Textfeld ohne eigenes Auswahlraster
  (Windows: Win+., iPhone: Emoji-Tastatur); ein eigenes Raster wäre Feinschliff,
  keine Baustelle mit Priorität.
- **Listen statt Kacheln** in allen elf Ansichten: eine Fläche je Ansicht
  (`.list-page`, `.wide` für die Raster im Planer), darin Zeilen mit Haarlinie
  und kleine Abschnitts-Überschriften (`.section-label`). Eingesenkte Elemente
  (Suchfeld, Erfassungszeile) nehmen `--bg`. Karten (`.card`) gibt es nur noch
  in Dialogen.
- **Eine Zeilenform für alles**: `entryRowHtml()` in `tasks.js` baut Häkchen,
  Personenpunkt, Zeitspalte und Text. Die **feste Zeitspalte** ist der Grund,
  warum die Listen ruhig wirken — die Namen beginnen alle an derselben Kante.
  Wer mehr Platz braucht (Datum statt Uhrzeit), setzt `zeitBreit`.
- **Zwei Umschalter-Formen, bewusst**: `segHtml()` für Modi derselben Ansicht
  (Tag/Woche/Monat), `utabs()` für den Personenwechsel — dort trägt der
  Unterstrich die Personenfarbe und sagt gleich mit, wessen Zahlen man sieht.
- **Erfassen klappt auf, statt dauernd dazustehen** (`.addrow` →
  `.inline-form`): gelesen und abgehakt wird häufiger als erfasst.
- **"Erledigt" ist das Akzentgrün**, vollflächig gefüllt (`.check.done`,
  `.wcheck.done`), dazu durchgestrichener, gedämpfter Text.
- **"Heute" ist dasselbe Grün, aber nie gefüllt** — Rahmen plus getönte Fläche
  (`--accent-bg`), damit es nicht mit "erledigt" verwechselbar ist. Sichtbar an
  genau fünf Stellen: Monatsraster, Wochenspalte im Planer und im Menüplan,
  Chip in der Tagesansicht, Wochenbalken in der Personenansicht.
- **Hell-Theme** in `tokens.css` (`body.light`-Override), umgeschaltet per
  Klasse, nicht nur über `prefers-color-scheme` — die Einstellungen haben einen
  manuellen Schalter.
- **Beide Themes folgen demselben Prinzip wie iOS**: die Grundfläche ist der
  dunkelste (bzw. im Hellen der gedämpfteste) Ton, und was darüber liegt, wird
  **heller** — dunkel `#1B1A18` → `#272623`, hell `#F1EEE7` → `#FBF9F5`.
  Eingesenkte Elemente (Suchfeld, Erfassungszeile, Chip) nehmen deshalb
  `--bg`, Karten und Leisten `--surface`. Kein reines Schwarz und kein reines
  Weiss: der Farbton bleibt in beiden Themes warm, das ist die Handschrift
  dieser App und nicht Apples kühles Grau. `theme-color` in `index.html` und
  die Farben in `manifest.json` müssen mit `--bg` (dunkel) mitziehen.
- **Heute und Planer→Tag sind dieselbe Ansicht**: `tagAbschnitteHtml(key)` in
  `heute.js` baut Termine, Aufgaben, Haushalt und Menü für ein beliebiges
  Datum; "Heute" setzt nur Datumszeile und Begrüssung davor, der Planer die
  Datums-Pfeile und den Wochenstreifen. Zwei getrennte Fassungen desselben
  Tages laufen über die Zeit auseinander. Die **Kennzahl-Kacheln erscheinen nur
  am heutigen Tag** — offene Artikel, Budget dieses Monats und nächster
  Geburtstag sind der Stand von jetzt und wären an einem anderen Tag eine
  falsche Auskunft.
- **Monatsansicht**: Das Raster zeigt datumsgebundene Dinge (Termine,
  Geburtstage, Haushaltsfälligkeiten, als wichtig markierte Aufgaben) — auf
  Desktop als Textzeilen mit Uhrzeit, nach Uhrzeit sortiert, ab dem vierten
  Eintrag als "+n". Auf dem Handy ist eine Zelle rund 50px breit, dort dieselben
  Einträge als farbige Punkte (`monatsEintraege()` liefert beides,
  `monatsPunkte()` leitet sich davon ab — die zwei Darstellungen dürfen nicht
  auseinanderlaufen). Die wiederkehrende Wochenroutine steht **nicht** im
  Raster, sondern darunter im 7-Spalten-Streifen.
- **Reihenfolge in der Personenansicht**: Heute anstehend → Nächste Termine →
  Alle Aufgaben. Termine stehen oben, weil sie den Tag fixieren.
- **Status, Blockiert-Grund und Kommentar liegen in denselben Töpfen wie in der
  alten Version** — `HP.taskStatus[tid][dateKey]` / `HP.eventStatus[id]`,
  `HP.taskNotes[tid]` / `HP.eventNotes[id]` (Grund),
  `HP.taskComments[tid][dateKey]` (pro Tag!) / `HP.eventComments[id]`. Genau
  deshalb sieht `alt/` dasselbe. Aus den früheren vier Zuständen sind **drei**
  geworden: "In Arbeit" ist weg, Offen/Blockiert/Erledigt bleiben. Bei
  "Blockiert" erscheint das Grund-Feld samt "Zur Einkaufsliste" — der Grund ist
  fast immer das, was fehlt, und steht deshalb schon als Artikelname im Formular.
- **Ein einzelnes Vorkommen lässt sich auf einen anderen Tag verschieben** —
  ohne die Serie anzufassen. Dafür gibt es zwei gegenläufige Maps in
  `heimplaner-data.js`: `taskExceptions[id][datum]` (fällt aus, gab es schon)
  und `taskExtras[id][datum]` (findet zusätzlich statt). **Verschieben ist
  beides zusammen**, deshalb braucht es dafür keine dritte Datenstruktur und
  Rückgängig ist schlicht das Entfernen der zwei Einträge. Die Ausnahme wird
  in `taskOccursOn()` **zuerst** geprüft: ein verschobenes und dann doch
  gestrichenes Vorkommen bleibt sonst sichtbar. Der Status bleibt am alten
  Datum liegen — er gilt pro Tag, und beim Rückgängigmachen soll er stimmen.
  Der Fall dahinter: ein getauschter freier Tag. Deshalb gibt es in der
  Tagesansicht zusätzlich "Aufgaben auf einen anderen Tag verschieben", das
  **nur die Aufgaben einer Person** mitnimmt — gemeinsame betreffen beide.
- **Die Termin-Notiz schreibt nach `HP.eventComments`**, nicht ins Feld
  `e.note` am Termin selbst. `e.note` wird nirgends angezeigt und nur noch als
  Rückfall **gelesen**, damit ein dort liegender Text nicht stillschweigend
  verschwindet.
- **Zeilen zeigen nur an, dass es etwas gibt**, nicht was: rotes "blockiert",
  Notizbuch-Symbol für einen Kommentar, Pinnadel für eine verknüpfte
  Pinnwand-Notiz.
- **Der Weg zwischen Termin und Notiz geht in beide Richtungen**: die Notiz
  verlinkt den Termin (`note.linkedEventId`), der Termin findet die Notiz über
  `notizZuTermin()` — **kein zweites Feld am Termin**, sonst laufen die zwei
  Seiten derselben Beziehung beim Löschen auseinander.
- **Termine aus der Notiz** werden über das normale Termin-Formular angelegt
  und bearbeitet, nicht über eigene Felder in der Notiz: sonst gäbe es zwei
  Formulare für dieselbe Sache. Der Rückweg läuft über `terminRueckweg`
  (dritter Parameter von `openEventForm`), der Notiz-Entwurf über den zweiten
  Parameter von `openNoteForm` — sonst wäre der getippte Text nach dem Umweg weg.
- **Haushaltsaufgaben können an einen Wochentag im Monat gebunden werden**
  ("letzter Samstag", `recur.weekday` + `recur.nth`). Nach reinem Datum trifft
  "jedes Jahr im Oktober" jedes Jahr einen anderen Wochentag. `saveChore()`
  zieht schon die **erste** Fälligkeit auf den gewählten Wochentag, sonst
  stimmt der Rhythmus erst ab dem zweiten Mal. Bei wöchentlichen Intervallen
  ist die Auswahl ausgeblendet — dort legt das Datum den Wochentag ohnehin fest.
- **Menüplan**: Raster (3 Mahlzeiten × 7 Tage) zum Eintragen, Liste darunter nur
  mit dem, was belegt ist. Alle 21 Slots als Zeilen wären 21-mal "eintragen".
- **Chips filtern nach Tag, die Liste gruppiert nach Kategorie** — zwei
  Dimensionen. Gezeigt werden die acht häufigsten Tags; Herkunfts-Tags
  (`eigenes`, `importiert`, `bettybossi`) sind ausgenommen, sie sagen nichts
  über das Essen. Dasselbe Muster in der Einkaufsliste: Chips filtern nach
  Gericht (`taskName`), die Abschnitte gruppieren nach Kategorie. Verschwindet
  ein Gericht von der Liste, fällt der Filter still weg.
- **"Zuletzt gekocht" kommt aus dem Menüplan** (`zuletztGekocht()`, nur
  Einträge bis heute — geplant ist nicht gekocht) und ersetzt in der Zeile die
  Portionenangabe.
- **Zutatensuche vergleicht am Wortanfang**, sonst findet "Lauch" jede
  "Knoblauchzehe". Weil deutsche Komposita damit durchfallen, lockert die Suche
  auf "enthält", **wenn sonst gar nichts gefunden würde** — mit sichtbarem
  Hinweis.
- **Detail rechts statt im Dialog**, sobald über 1100px Platz ist (`.split` +
  `.detail-page`). Darunter blendet CSS die Spalte aus, und `openRezeptDetail()`
  merkt das an `offsetParent === null` und öffnet wieder den Dialog. Beide Wege
  rendern dasselbe `rezeptDetailHtml()`.
- **Kalender-Import ist ein einmaliger, ersetzender Import** (kein Abo):
  importierte Termine landen als normale Einträge in `HP.events` mit
  `icsImport:true`. Ein neuer Import löscht die zuvor importierten (inkl.
  Tombstone) und legt sie mit **neuen IDs** an — von Hand erfasste Termine
  bleiben unberührt. Die neuen IDs sind keine Kosmetik: eine wiederverwendete
  ID verschwände beim nächsten Merge sofort über ihren eigenen Tombstone.
  Serien (RRULE) werden 12 Monate im Voraus ausgerollt, Deckel bei 500 Terminen
  bzw. 200 Vorkommen je Serie.
- **Die JSON-Momentaufnahme bleibt** (Einstellungen → Sicherung). Supabase ist
  kein Backup, sondern eine Live-Kopie: eine versehentliche Löschung ist dort
  nach dem nächsten Sync ebenfalls weg. Die Datei ist der einzige Weg zurück zu
  einem früheren Stand.
- **Auf dem Handy gibt es keine Kopfzeile.** Sie sagte nichts, was nicht schon
  dastand: die Ansicht nennt die Schnellwahl unten, die Überschrift steht in
  der Ansicht selbst, Benutzer und Sync-Status stehen in den Einstellungen.
  **Die `.topbar` bleibt aber im DOM und wird nur per CSS ausgeblendet**:
  `initSync()` in der geteilten `heimplaner-sync.js` sucht `.topbar` und bricht
  ohne sie sofort ab — dann läuft auch `connectSync()` nicht mehr, und es gäbe
  gar keinen Sync. Den Platz für die Statusleiste übernimmt `#view-root`.
- **Konto-Anzeige** (Desktop): nur Name und kleiner Status-Punkt (Farbe vom
  Sync-Status, `.acct-dot` in `app.js`), keine ausgeschriebene Sync-Leiste. Das
  Sync-Passwort trägt man in den Einstellungen ein.
- **Sidebar-Reihenfolge (Desktop)**: Heute, Planer, Personen, Haushalt,
  Einkaufsliste, Budget, Menüplan, Rezepte, Pinnwand, Geburtstage,
  Einstellungen.
- **Schnellwahl am unteren Rand (nur Handy)**: fünf Plätze — Heute, Einkauf,
  Budget, Pinnwand, Mehr (`MOBILE_NAV` in `app.js`). "Mehr" öffnet die
  Schublade mit allen elf Ansichten und ist **der einzige** Weg dorthin: die
  Topbar hat auf dem Handy bewusst keinen Hamburger, zwei Einstiege in dasselbe
  Menü an zwei Ecken des Bildschirms waren einer zu viel.
- **Dort stehen Emoji statt der SVG-Symbole** (🏠 🛒 💰 📌 ☰, wie in der alten
  App) — auf Probe, im echten Gebrauch zu beurteilen. Die Ausnahme zur
  Icon-Regel oben hat einen Preis: ein Emoji bringt seine Farben mit und lässt
  sich nicht einfärben, deshalb trägt hier die getönte Fläche plus die
  Beschriftung den aktiven Zustand, nicht das Symbol selbst. `.bn-emoji` hat
  feste Masse, sonst wandert die Höhe der Leiste von Gerät zu Gerät. Die
  Schublade dahinter benutzt weiterhin die SVG-Symbole.
- **`#app` misst `100dvh`, nicht `100vh`** (`app.css`), und der Viewport-Tag in
  `index.html` hat **kein** `viewport-fit=cover`. Beides zielt auf dieselbe
  Stelle: sonst läuft die Seite auf dem iPhone unter die Home-Leiste, die
  Schnellwahl sitzt scheinbar zu weit oben und darunter bleibt ein schwarzer
  Streifen. Nicht zurückdrehen.

## Features

Heute-Übersicht, Wochen- und Monatsplaner, Personenansicht, Haushaltsaufgaben
mit Wiederholung, Einkaufsliste mit Favoriten, Budget mit Limits und
Jahresstatistik, Menüplan, Rezeptbibliothek (inkl. Copy-Paste-Import von
bettybossi.ch), Pinnwand, Geburtstage, ICS-Kalenderimport und Web-Push-
Erinnerungen.

Rezepte liegen in `HP.customRecipes` (synchronisiert, bearbeitbar) — das alte
fest verdrahtete `RECIPES`-Array in `heimplaner-data.js` wird einmalig beim
Laden übernommen und dient nur noch als Saat für diese Migration.

Es gibt **keinen KI-Assistenten und keine Spracheingabe**. Beides wurde
entfernt; nicht ohne Rückfrage wieder einführen.

## Arbeitsweise

- Kein Build-Werkzeug — zum Testen `index.html` über einen einfachen statischen
  Server öffnen. Keinen Bundler und kein Framework einführen ohne Rückfrage.
- Bei Änderungen an gemeinsamen Datenformen (in `heimplaner-data.js`) immer
  `heimplaner-sync.js` mitlesen: eine Abweichung bricht den Sync zwischen den
  Geräten stillschweigend.
- Änderungen auf die betroffenen Dateien beschränken; übergreifende Umbauten
  vorher ansagen.
- Vor einem Push `npm test` laufen lassen (GitHub Actions tut es ebenfalls).

## Sicherheit

- **Das GitHub-Repo ist öffentlich.** Nie Secrets committen, und davon
  ausgehen, dass die Function-URLs und das ganze Auth-Schema bekannt sind.
- Alles aus `HP` (eigener Text, synchronisierte Partnerdaten, importierte
  Rezepte) muss durch `esc()` aus `heimplaner-data.js`, bevor es in `innerHTML`
  landet — auch innerhalb von `value="…"` und `onclick="…('X')"`. Wo nur Text
  angezeigt wird, `textContent` benutzen.
- `_headers` hält CSP und Sicherheits-Header. Ein strenges `script-src`/
  `style-src` ist wegen der inline `onclick`-Handler nicht möglich;
  `connect-src 'self'` begrenzt den Schaden einer Einschleusung.
- `netlify/functions/sync.js` und `push-subscribe.js` hängen an `APP_PASSWORD`,
  **nicht** am Login. Das Login-Token im `localStorage` ist client-geschrieben
  und ungeprüft — es steuert nur die Oberfläche, nicht den Datenzugriff.
