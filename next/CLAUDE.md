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
- **Schnellwahl am unteren Rand (nur Handy)**: fünf Plätze — Heute, Einkauf,
  Budget, Pinnwand, Mehr (`MOBILE_NAV` in `app.js`). "Mehr" öffnet die
  Schublade mit allen elf Ansichten und ist **der einzige** Weg dorthin: die
  Topbar hat auf dem Handy bewusst keinen Hamburger mehr, zwei Einstiege in
  dasselbe Menü an zwei Ecken des Bildschirms waren einer zu viel.
  Symbole sind auch hier die lokalen SVGs, **kein Emoji**: Emoji zeichnet
  jedes Betriebssystem in seiner eigenen Schrift, in der alten App sah die
  Leiste auf iPhone und Android deshalb verschieden aus.
- **`#app` misst `100dvh`, nicht `100vh`** (`app.css`). iOS rechnet `100vh`
  gegen den Layout-Viewport, also inklusive der Fläche hinter der
  eingeklappten Browserleiste — die Schnellwahl (`position:fixed;bottom:0`)
  sitzt dann in einem Bereich, den man nicht sieht, wirkt zu weit oben und
  lässt darunter einen schwarzen Streifen. Genau das war auf dem iPhone zu
  sehen, auf Android nicht. Nicht zurückdrehen.
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
- **Listen statt Kacheln** – gilt für alle elf Ansichten: eine Fläche je
  Ansicht (`.list-page`, `.wide` für die Raster im Planer), darauf Zeilen mit
  Haarlinie und kleine Abschnitts-Überschriften (`.section-label`).
  Eingesenkte Elemente (Suchfeld, Emoji-Kachel, Erfassungszeile) nehmen
  `--bg`. Karten-Blöcke (`.card`) gibt es nur noch in Dialogen.
- **Heute und Planer→Tag sind dieselbe Ansicht**: `tagAbschnitteHtml(key)` in
  `heute.js` baut Termine, Aufgaben, Haushalt, Menü für ein beliebiges Datum;
  "Heute" setzt nur Datumszeile und Begrüssung davor, der Planer die
  Datums-Pfeile und den Wochenstreifen. Zwei getrennte Fassungen desselben
  Tages laufen über die Zeit auseinander. Die **Kennzahl-Kacheln erscheinen
  nur am heutigen Tag** (`kennzahlKachelnHtml`) — offene Artikel, Budget
  dieses Monats und nächster Geburtstag sind der Stand von jetzt und wären
  an einem anderen Tag eine falsche Auskunft.
- **Haushaltsaufgaben können an einen Wochentag im Monat gebunden werden**
  ("letzter Samstag", `recur.weekday` + `recur.nth`). Nach reinem Datum
  trifft "jedes Jahr im Oktober" jedes Jahr einen anderen Wochentag —
  irgendwann einen Dienstag, an dem nie Zeit ist. Gerechnet wird das im
  geteilten `heimplaner-data.js` (`advanceDateKey`/`nthWeekdayOfMonth`), hier
  fehlte nur die Eingabe. `saveChore()` zieht schon die **erste** Fälligkeit
  auf den gewählten Wochentag, sonst stimmt der Rhythmus erst ab dem zweiten
  Mal. Bei wöchentlichen Intervallen ist die Auswahl ausgeblendet: dort legt
  das Datum den Wochentag ohnehin fest.
- **Zutaten aus Rezepten sind in der Einkaufsliste filterbar**: Chips über
  der Liste, eine je Gericht (`taskName`, gesetzt beim Übernehmen aus dem
  Menüplan), Klick filtert **an Ort und Stelle** statt ein Fenster zu öffnen —
  beim Einkaufen zählt ein Handgriff. Die Kategorie-Gruppierung bleibt dabei
  bestehen: Chips filtern nach Gericht, Abschnitte gruppieren nach Kategorie,
  zwei Dimensionen (gleiches Prinzip wie Tag-Chips + Kategorien bei den
  Rezepten). Verschwindet das Gericht von der Liste, fällt der Filter still
  weg, statt eine leere Liste ohne sichtbare Ursache zu zeigen.
- **Der Weg zwischen Termin und Notiz geht in beide Richtungen**: die Notiz
  verlinkt den Termin (`note.linkedEventId`), der Termin findet die Notiz
  über `notizZuTermin()` — **kein zweites Feld am Termin**, sonst laufen die
  zwei Seiten derselben Beziehung beim Löschen auseinander. Im Termin-Formular
  steht dafür der Knopf "Notiz auf der Pinnwand öffnen" (übernimmt das offene
  Fenster), Terminzeilen mit Notiz tragen ein kleines Notizbuch-Symbol.
- **Eine Zeilenform für alles**: `entryRowHtml()` in `tasks.js` baut
  Häkchen, Personenpunkt, Zeitspalte und Text. Die **feste Zeitspalte** ist
  der Grund, warum die Listen ruhig wirken – die Namen beginnen alle an
  derselben Kante. Wer die Zeitspalte für etwas Längeres braucht (Datum in
  "Nächste Termine"), setzt `zeitBreit`.
- **Zwei Umschalter-Formen, bewusst**: `segHtml()` für Modi derselben Ansicht
  (Tag/Woche/Monat), `utabs()` für den Personenwechsel – dort trägt der
  Unterstrich die Personenfarbe und sagt gleich mit, wessen Zahlen man sieht.
- **Erfassen klappt auf, statt dauernd dazustehen** (`.addrow` →
  `.inline-form`, in Einkaufsliste und Budget): gelesen und abgehakt wird
  häufiger als erfasst.
- **Menüplan**: Raster (3 Mahlzeiten × 7 Tage) zum Eintragen, Liste darunter
  nur mit dem, was belegt ist. Alle 21 Slots als Zeilen wären 21-mal
  "eintragen".
- **Chips filtern nach Tag, die Liste gruppiert nach Kategorie** — zwei
  Dimensionen. Beides nach Kategorie wäre dieselbe Achse doppelt. Gezeigt
  werden die acht häufigsten Tags; Herkunfts-Tags (`eigenes`, `importiert`,
  `bettybossi`) sind ausgenommen, sie sagen nichts über das Essen.
- **"Zuletzt gekocht" kommt aus dem Menüplan** (`zuletztGekocht()`, nur
  Einträge bis heute — geplant ist nicht gekocht) und ersetzt in der Zeile die
  Portionenangabe. Sortierung wahlweise A–Z (gruppiert) oder "lange nicht
  gekocht" (durchgehende Liste, nie Gekochtes zuerst — eine Gruppierung würde
  die Rangfolge zerreissen).
- **Zutatensuche vergleicht am Wortanfang**, sonst findet "Lauch" jede
  "Knoblauchzehe". Weil deutsche Komposita damit durchfallen ("spinat" findet
  kein "Blattspinat"), lockert die Suche auf "enthält", **wenn sonst gar
  nichts gefunden würde** — mit sichtbarem Hinweis darüber.
- **Detail rechts statt im Dialog**, sobald über 1100px Platz ist
  (`.split` + `.detail-page`). Darunter blendet CSS die Spalte aus, und
  `openRezeptDetail()` merkt das an `offsetParent === null` und öffnet wieder
  den Dialog. Beide Wege rendern dasselbe `rezeptDetailHtml()`.
- **Noch offen**: App-Icon-Bild wurde geliefert, aber noch nicht in
  `manifest.json`/Icon-Grössen umgesetzt. Die 36px-Kachel in der Rezeptliste
  ist im Mockup ein Platzhalter für ein Foto — aktuell steht das Emoji darin.

## Nächste Schritte

Die elf Ansichten stehen. Was jetzt ansteht, ist Feinschliff im echten
Gebrauch — und `manifest.json`/App-Icon, falls `/next/` auch als
installierbare PWA getestet werden soll.
