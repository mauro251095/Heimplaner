# Heimplaner V2 — next/

**Wichtig, bevor du hier irgendetwas anfasst:** Dies ist ein bei null gestarteter
Entwurf, kein Redesign, das sich an den bestehenden Regeln in `../CLAUDE.md`
orientieren muss. Farbe, Struktur, Layout, Komponenten, Icon-Sprache — alles
ist neu verhandelbar. Wenn dir eine Entscheidung hier komisch vorkommt, weil
"der alte Heimplaner das anders macht", ist das **kein** Widerspruch, den es
aufzulösen gilt — der alte Heimplaner ist hier einfach keine Referenz mehr.

Die einzigen Dinge, die aus dem Hauptprojekt gelten, sind **technische
Notwendigkeiten**, keine Stil-Konventionen:
- Datenmodell, Sync-Mechanik und Login bleiben unverändert (siehe unten,
  "Was geteilt wird"). Das ist keine Design-Entscheidung, sondern der Grund,
  warum diese Test-Version überhaupt gefahrlos parallel existieren kann.
- Grundlegende Web-Sicherheit gilt immer, unabhängig vom Projekt: Alles aus
  `HP` (synchronisierte Partnerdaten) muss weiterhin durch `esc()` (aus
  `../heimplaner-data.js`, wird mitbenutzt), bevor es in `innerHTML` landet.
  Keine Secrets im Client-Code. CSP-Konformität: keine externen Skripte/Fonts
  ausser den bereits erlaubten (`fonts.googleapis.com`/`fonts.gstatic.com`);
  Icons sind deshalb als lokale SVG-Dateien unter `next/icons/` abgelegt,
  nicht von einem Icon-CDN geladen.

## Status

Alle elf Ansichten sind gebaut und benutzbar. `muster.html` bleibt als
Stilübersicht liegen, ist aber nicht mehr die einzige Referenz — die
Ansichten selbst sind es.

Dateien (Reihenfolge der Skript-Tags in `index.html` ist bindend):

- `app.js` — Gerüst: Modal/Toast, Navigation/VIEWS, gemeinsame Bausteine
  (`viewHead`, `segHtml`, `navRow`, `personDot`, …), Theme/Farben, Haushalt
- `tasks.js` — Formulare und Zeilen für Aufgaben und Termine (keine eigene
  Ansicht; Heute/Planer/Personen benutzen sie gemeinsam)
- `heute.js` — Startansicht/Dashboard
- `planer.js` — Tag/Woche/Monat + Personen
- `shop.js`, `budget.js`, `meals.js` (Menüplan + Rezepte), `notes.js`,
  `birthdays.js`, `settings.js`
- `sw.js` — eigener Service Worker für `/next/`. Nötig, weil das geteilte
  `heimplaner-pwa.js` `./sw.js` relativ zur Seite registriert; ohne ihn
  gäbe es unter `/next/` keine Registrierung und damit keine Push-Erinnerungen.

Noch nicht umgesetzt: eigenes Emoji-Auswahlraster (Windows-Picker via Win+.
tut es vorerst), `manifest.json`/App-Icon für `/next/`.

## Was geteilt wird (unverändert aus dem Hauptprojekt)

- `../heimplaner-data.js` — Datenmodell, `esc()`, `markDeleted()`
- `../heimplaner-sync.js` — Supabase-Sync über den Netlify-Proxy
- `../heimplaner-login.js` — Login-Gate
- `../heimplaner-pwa.js` — Service Worker, `?view=`-Deep-Link, Install-Banner

Neue Hilfsfunktionen dürfen diesen Dateien **ergänzt** werden (z.B. eine
Aggregation für die Heute-Ansicht), aber nichts Bestehendes darin darf sich
verhalten ändern — sonst wäre die alte App beim Testen mitbetroffen.

## Was neu/eigen ist

Alles andere: alle Render-Dateien, das komplette CSS, `index.html` für diese
Version. Läuft im selben Netlify-Deploy unter `/next/` (relative
`/.netlify/functions/...`-Aufrufe funktionieren dadurch unverändert, keine
CORS-Änderung nötig) — aber solange nicht explizit gepusht wird, passiert auf
Netlify gar nichts; alle Vorschau-/Testschritte laufen über einen rein
lokalen Server.

## Entschiedene Design-Regeln (Stand dieses Dokuments)

- **Akzentfarbe Grün** (`--accent`) für alles, was die App tut/anbietet:
  FAB, aktiver Tab/Segmented-Control-Zustand, Toggle-An, Fortschrittsbalken
  im Budget solange im Rahmen.
- **Budget-Balken wechseln auf Rot** (`--danger`), sobald eine Kategorie
  **90 % oder mehr** ihres Limits erreicht hat (nicht erst bei
  Überschreitung) — bewusst eine Vorwarnung, kein Zu-spät-Alarm. Anpassbar.
- **Personenfarben sind wählbar, nicht fix.** Mauro/Melissa/Gemeinsam wählen
  je eine Farbe aus einer vorgegebenen Palette (`tokens.css`,
  `--person-palette-*`); keine Farbe ist fest einer Person zugeordnet.
  UI-Text/Code sollte deshalb nie "blau = Mauro" annehmen, sondern immer
  "die aktuell gewählte Farbe dieser Person".
- **Icons**: Tabler Icons (MIT-Lizenz), als einzelne SVGs unter `next/icons/`
  selbst gehostet, nicht als Icon-Font/CDN-Referenz. Gilt für Navigation/
  Chrome (Sidebar, Buttons) — dort kein Emoji mehr.
- **Emoji bleiben** für nutzergewählte Inhalte (Aufgaben-/Termin-/Rezept-Icon
  wie bisher `e.emoji`/`task.emoji`) — bewusste Entscheidung, kein
  Widerspruch zur Tabler-Umstellung oben, weil es dabei um Chrome/Navigation
  geht, nicht um persönlich gewählte Inhalte. Eingabe aktuell reines
  Textfeld ohne eigenes Auswahl-Raster (Windows-Emoji-Picker via Win+. tut's
  vorerst); ein eigenes Emoji-Raster wie im alten Heimplaner ist ein
  mögliches späteres Polish-Item, keine Baustelle mit Priorität.
- **Monatsansicht**: Das Raster zeigt datumsgebundene Dinge (Termine,
  Geburtstage, Haushaltsfälligkeiten, als wichtig markierte Aufgaben) — auf
  Desktop als Textzeilen mit Uhrzeit, **nach Uhrzeit sortiert**, ohne Uhrzeit
  ans Ende, ab dem vierten Eintrag als "+n". Auf dem Handy ist eine Zelle rund
  50px breit, dort dieselben Einträge als farbige Punkte (`monatsEintraege()`
  liefert beides, `monatsPunkte()` leitet sich davon ab — die zwei Darstellungen
  dürfen nicht auseinanderlaufen). Wiederkehrende Wochenroutine erscheint NICHT
  im Raster, sondern darunter im 7-Spalten-Wochenmuster-Streifen. Abhaken
  einzelner Tage bleibt Sache von Heute/Tag-Ansicht.
- **Termine heben sich in der Wochenspalte leicht ab** (`--item-ev-bg`,
  dickerer Farbbalken, etwas kräftigere Schrift) — bewusst keine eigene Farbe:
  die Farbe gehört dort der Person, nicht dem Eintragstyp.
- **Reihenfolge in der Personenansicht**: Heute anstehend → Nächste Termine →
  Alle Aufgaben. Termine stehen über den Aufgaben, weil sie den Tag fixieren.
- **Termine aus der Notiz** werden über das normale Termin-Formular angelegt
  und bearbeitet (Knopf "Neuer Termin" / "Termin bearbeiten"), nicht über
  eigene Felder in der Notiz: sonst gäbe es zwei Formulare für dieselbe Sache,
  und Uhrzeit/Erinnerung müssten dort nachgebaut werden. Der Rückweg läuft
  über `terminRueckweg` (dritter Parameter von `openEventForm`), der
  Notiz-Entwurf über den zweiten Parameter von `openNoteForm` — sonst wäre
  der getippte Text nach dem Umweg weg.
- **Die JSON-Momentaufnahme bleibt** (Einstellungen → Sicherung). Supabase ist
  kein Backup, sondern eine Live-Kopie: eine versehentliche Löschung ist dort
  nach dem nächsten Sync ebenfalls weg (genau dafür gibt es Tombstones). Die
  Datei ist der einzige Weg zurück zu einem früheren Stand.
- **Sidebar-Reihenfolge (Desktop) / Hauptnavigation**: Heute, Planer,
  Personen, Haushalt, Einkaufsliste, Budget, Menüplan, Rezepte, Pinnwand,
  Geburtstage, Einstellungen.
- **Hell-Theme** ist in `tokens.css` umgesetzt (`body.light`-Override) — warme
  Grundhaltung wie im Dark-Theme, nur invertiert (Fläche heller als
  Hintergrund statt dunkler), Akzentgrün auf den helleren, kräftigeren Wert
  `#4C9A5A` aus dem ursprünglichen Vorschlagsdokument gesetzt. Umschaltung
  per Klasse (`body.light`), nicht nur `prefers-color-scheme` — die Mockups
  zeigen einen manuellen Schalter in den Einstellungen. In `muster.html` per
  Knopf oben rechts direkt vergleichbar.
- **Konto-Anzeige**: nur Name + kleiner Status-Punkt (Farbe vom Sync-Status,
  siehe `.acct-dot` in app.js), keine ausgeschriebene Sync-Leiste mehr. Der
  bisherige "Sync"-Button (einziger Weg, das Sync-Passwort einzugeben) hat
  dadurch kein UI mehr - zieht in die Einstellungen-Ansicht, sobald die
  gebaut wird.
- **"Erledigt" ist das Akzentgrün** (`--accent`), vollflächig gefüllt: das
  runde Häkchen in Listenzeilen (`.check.done`), das eckige in der
  Wochenspalte (`.wcheck.done`), dazu durchgestrichener, gedämpfter Text.
- **"Heute" ist dasselbe Grün, aber nie gefüllt** — Rahmen plus getönte
  Fläche (`--accent-bg`), damit es nicht mit "erledigt" verwechselbar ist.
  Sichtbar an genau fünf Stellen: Monatsraster (Tageszelle, `.mcell.is-today`),
  Wochenspalte im Planer und im Menüplan (`.day-col.is-today`), Tagesansicht
  (Chip "Heute" über der Liste), Wochenbalken in der Personenansicht
  (`.pw-day.is-today`) — und implizit die Heute-Ansicht selbst.
- **Kalender-Import ist ein einmaliger, ersetzender Import** (kein Abo):
  importierte Termine landen als normale Einträge in `HP.events` mit
  `icsImport:true`. Ein neuer Import löscht die zuvor importierten (inkl.
  Tombstone) und legt sie mit **neuen IDs** frisch an — von Hand erfasste
  Termine bleiben unberührt, und nichts verdoppelt sich. Die neuen IDs sind
  keine Kosmetik: eine wiederverwendete ID würde beim nächsten Sync-Merge
  über ihren eigenen Tombstone sofort wieder verschwinden.
  Serien (RRULE) werden bis 12 Monate im Voraus ausgerollt, Deckel bei 500
  Terminen bzw. 200 Vorkommen je Serie, damit der synchronisierte Datensatz
  nicht explodiert.
- **Noch offen**: App-Icon-Bild wurde geliefert, aber noch nicht in
  `manifest.json`/Icon-Grössen umgesetzt.

## Nächste Schritte

Die elf Ansichten stehen. Was jetzt ansteht, ist Feinschliff im echten
Gebrauch — und `manifest.json`/App-Icon, falls `/next/` auch als
installierbare PWA getestet werden soll.
