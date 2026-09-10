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

Diskussionsgrundlage / Fundament. Noch keine der elf Ansichten ist als
funktionierende Seite gebaut — aktuell existieren nur Design-Tokens
(`tokens.css`) und eine Muster-/Stilübersicht (`muster.html`), die zeigt,
worauf alles Weitere aufbaut.

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
  selbst gehostet, nicht als Icon-Font/CDN-Referenz.
- **Monatsansicht**: Raster zeigt nur Punkte für datumsgebundene Dinge
  (Termine, Geburtstage, als wichtig markierte Aufgaben) — mehrere pro Tag,
  nicht nur einer. Wiederkehrende Wochenroutine erscheint NICHT im Raster,
  sondern einmalig darunter in einem kompakten 7-Spalten-Wochenmuster-Streifen.
  Abhaken einzelner Tage bleibt Sache von Heute/Tag-Ansicht.
- **Sidebar-Reihenfolge (Desktop) / Hauptnavigation**: Heute, Planer,
  Personen, Haushalt, Einkaufsliste, Budget, Menüplan, Rezepte, Pinnwand,
  Geburtstage, Einstellungen.
- **Noch offen**: Farbwerte fürs Hell-Theme (bisher nur Dark-Mode-Mockups
  vorhanden); ob/wie "heute" im Kalender und "erledigt" bei Aufgaben farblich
  markiert werden (bewusst noch nicht auf Grün festgelegt); App-Icon-Bild
  wurde geliefert, noch nicht in `manifest.json`/Icon-Grössen umgesetzt;
  Kalender-Abo-Import (ICS) — einmaliger Import oder laufendes Abo ist noch
  nicht geklärt, das ist der einzige Punkt mit Backend-Auswirkung.

## Nächste Schritte (nicht ohne Rückfrage weitermachen)

Reihenfolge, aber jeder Schritt erst nach Bestätigung: kleine/mechanische
Ansichten zuerst (Haushalt, Einkaufsliste, Geburtstage, Pinnwand,
Einstellungen), dann Budget, dann die grossen Brocken (Planer mit
Tag/Woche/Monat, Heute-Dashboard), ICS-Import zuletzt.
