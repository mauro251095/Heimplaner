// Führt test.html headless in Chromium aus (via Playwright) und bricht mit
// Exit-Code 1 ab, falls auch nur ein Check fehlschlägt oder die Seite einen
// Laufzeitfehler wirft. Ersetzt keinen manuellen Blick in den Browser, fängt
// aber ab, wenn das vor einem Push vergessen wird (siehe .github/workflows/test.yml).
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const testFile = pathToFileURL(path.resolve('test.html')).href;

const browser = await chromium.launch();
const page = await browser.newPage();

let pageError = null;
page.on('pageerror', (err) => { pageError = err; });

await page.goto(testFile);

// test.html läuft rein synchron durch alle Checks und setzt den Titel als
// letzten Schritt (siehe Ende der Datei) — sobald der nicht mehr der
// statische Ausgangstitel ist, ist die Auswertung fertig.
await page.waitForFunction(
  () => document.title !== 'Heimplaner – Tests',
  { timeout: 15000 }
);

const title = await page.title();
const summaryText = await page.locator('#summary').innerText();
const failedRows = await page.locator('.t.fail').allInnerTexts();

await browser.close();

console.log(summaryText);

if (pageError) {
  console.error('❌ Laufzeitfehler auf der Testseite:', pageError.message);
  process.exit(1);
}
if (title.startsWith('✕')) {
  console.error(`❌ ${failedRows.length} Check(s) fehlgeschlagen:`);
  failedRows.forEach((t) => console.error('  - ' + t));
  process.exit(1);
}

console.log('✅ ' + title);
