# CLAUDE.md — Mathildas 18ter Geburtstag · Studio-54-Einladung

Zusammenfassung aus MEINER (Claude-)Sicht, Stand **2026-10-02**, nach ca. 10 Änderungsrunden mit dem Nutzer. Für neue Sessions: Lies zuerst »Ablauf« und »Feste Entscheidungen« — dort steht, was NICHT leichtfertig geändert werden darf.

## Projekt

One-Page-Geburtstagseinladung im **Studio-54-Stil** (Schwarz & Gold, Glitzer, Neon-Glow, 70er-Typografie). Reines **HTML/CSS/JS — kein Framework, kein Build-Tool, kein npm**. Die einzige Extern-Abhängigkeit außer Google Fonts ist YouTube, aber **einwilligungsabhängig** (siehe Zwei-Klick-Lösung).

- **Mobile-first**: Die Seite wird per **WhatsApp** versendet → alles muss am Handy funktionieren (nativ Swipe/scrollen, safe-area-insets, 100svh beachten).
- **Deploy:** **Netlify** — läuft laut Nutzer (2026-10-02) einwandfrei. Die konkrete Netlify-Domain ist mir unbekannt → siehe offene To-Dos.
- **Repo:** https://github.com/mjmrozek/mathilda-18ter-geburtstag (öffentlich, Konto `mjmrozek`, gh-CLI eingerichtet/authentifiziert)
- **Arbeitsverhältnis mit dem Nutzer:** Deutsch. Er formuliert Anpassungen informell mündlich („der Abstand ist zu groß"); vorher verstehen, was er meint, dann klein & gezielt bauen.

## Feier-Daten (aus den 6 Einladungsbildern gelesen, widerspruchsfrei)

| Was | Wert |
|---|---|
|Wer|Mathilda (18ter Geburtstag)|
|Datum|**23. Januar 2027**|
|Uhrzeit|**ab 19:00 Uhr**|
|Ort|**An d. Neuen Mühle 22, 47447 Moers-Kapellen** (→ Google-Maps-Link im Ticket)|
|Dresscode|**Studio 54 — Seventies & Eighties**|
|RSVP-Hinweis auf Karten|„bis zum 15. Oktober" — **nur als Info-Text**, kein Modul!|

## Dateistruktur

```
index.html            — Markup; alle Sektionen + 2 Overlays + fixe Buttons
css/styles.css        — komplettes Styling; Farbsystem & --video-filter in :root
js/translations.js    — ALLE sichtbaren Texte in de/en/pl (UEBERSETZUNGEN-Objekt)
js/main.js            — komplette Logik; Konstanten ganz oben
images/einladung_1_<lang>.jpeg — Titel-Karte (Hero-Bild)
images/einladung_2_<lang>.jpeg — Details-Karte (Galerie)
         <lang> = de | en | pl  (Namen so vom Nutzer angelegt, beibehalten!)
```

## Ablauf beim Seitenaufruf (Kern-Ablauf — die Seele der Seite!)

Implementiert in `initialisiere()` (main.js, Zeile ~57):

1. **Erst-Besuch:** Nur das **Sprach-Overlay** sichtbar (Discokugel, „✦ Studio 54 Night ✦", Titel „Mathilda/18/Party" gestapelt, 3 Buttons: **Deutsch · English · Polski** — diese Labels sind bewusst so). `body.overlay-offen` sperrt das Scrollen, sonst Phantom-Scrollbar.
2. **Sprach-Klick** → Sprache speichern (`mathilda18_sprache` in localStorage), Übersetzungen anwenden (`wendeSpracheAn()`), → **Musik-Consent-Screen** (Discokugel + „Musik?" / „Music?" / „Muzyka?", Buttons **immer übereinander**): „🎉 Mit Musik feiern" (darunter IP-Hinweis + Google-Privacy-Link) / „✨ Weiter ohne Musik".
3. **„Mit Musik feiern"** = Einwilligung **+ Nutzergeste in einem Klick**: `starteMusik()` im selben Handler → iframe von **youtube-nocookie.com**, `playVideo()` mit Ton (50 %), Dauerschleife. Ca. 1,5 s danach blendet das Hero-Bild sanft ein (Glow+Scale+Fade).
4. **„Ohne Musik weiter"** → kein iframe, nur CSS-Disco-Visuals; der **„🎵 Musik starten"-Button** (fix unten mittig) bleibt sichtbar — jeder Klick darauf = Einwilligung + Start.
5. **Fallback:** klemmt der Autoplay (besonders iPhone/Safari), bleibt der Musik-Button sichtbar (2-Sek.-Check `pruefeWiedergabe()`) bis Ton läuft.
6. **`onError` des Videos:** Seite läuft ohne Musik weiter (Discokugel + Glitzer), Musik-Button verschwindet.
7. **Wieder-Besuch** (localStorage hat Sprache + Consent): **keine Overlay-Masken, KEIN Musik-Autoplay** — sofort Inhaltsseite; Musik-Button unten zum Nachstarten.

## Feste Entscheidungen (vom Nutzer — nicht ändern ohne Rückfrage!)

- **Startseiten-Titel exakt:** „Mathilda / 18 / Party" gestapelt (statisch in index.html, sprachneutral). Bestätigt 2026-10-02. NICHT „Mathilda's 18ter Geburtstag" auf der Startseite.
- **Sprach-Button-Labels:** „Deutsch", „English" (großes E, Rest klein — nicht ENGLISH!), „Polski".
- **Kein 🔊/🔇-Lautsprecher-Symbol** — ersetzt durch den bleibenden **„🎵 Musik starten"-Button fix unten mittig** (Start = Einwilligung).
- **„↩ Zurück zur Sprachauswahl"-Button** fix **oben** mittig; öffnet Overlay erneut (Musik läuft weiter, kein Reload).
- **Galerie: KEIN Karussell** — die **2 Karten der gewählten Sprache groß übereinander gestapelt** (`data-lang`-Filter in `aktualisiereGalerieSprache()`), damit der Kartentext lesbar ist.
- **RSVP: KOMPLETT WEG** (kein Formular, kein Link — Nutzer 2026-10-02). In main.js steht nur der Kommentar `// RSVP: hier später einbauen`. Der RSVP-Satz auf den Karten ist nur Info-Text.
- **Video-Behandlung:** schwarz-weiß + weichgezeichnet, damit Inhalte hervorstehen — als CSS-Variable `--video-filter` (styles.css, in `:root`), z. B. `grayscale(1) blur(6px)`; `scale(1.15)` am iframe gleicht blur-Ränder aus.
- **Abstände bewusst KOMPAKT** (mehrere Nachbesserungen!) — nicht wieder auflockern.
- **Consent-Buttons immer übereinander** (`#musik-consent .sprach-buttons { flex-direction: column; }`).
- Musik **beginnt nie ohne explizite Nutzergeste** (Konservierungsregel für iOS/Safari + Datenschutz).

## Datenschutz-Detail (Zwei-Klick-Lösung — wichtig!)

- **Keine einzige YouTube-Verbindung vor Einwilligung:** Der statische `<script src="https://www.youtube.com/iframe_api">` wurde aus index.html ENTFERNT; `ladeYoutubeApi()` injiziert das Script dynamisch erst nach „Mit Musik feiern" bzw. Musik-Button-Klick. iframe folgt danach mit `host: 'https://www.youtube-nocookie.com'` (Datenschutzmodus) — beides in `starteMusik()`.
- Einwilligung → `localStorage.mathilda18_musicConsent` = `'ja' | 'nein'` (Konstante `STORAGE_CONSENT`). Wird **nie** zum Autoplay benutzt, nur um Overlays zu überspringen.
- Footer-Credit in allen Sprachen: `footer_musik` (Bee Gees + Hinweis Datenübertragung an YouTube/Google).

## Konstanten & Textänderungen (Schnellreferenz)

**`js/main.js` ganz oben:** `VIDEO_ID` (`uQ9_MwZIaoc`, Bee Gees – More Than a Woman), `MUSIK_LAUTSTAERKE` (50) , `FALLBACK_TIMEOUT_MS` (2000), `HERO_BILD_VERZOEGERUNG_MS` (1500), `STORAGE_SCHLUESSEL`, `STORAGE_CONSENT`, `MAPS_ZIEL` (Google-Maps-Ziel — bei Adressänderung zusätzlich den `href` im Details-Ticket der index.html ändern!).

**Alle sichtbaren Texte:** `js/translations.js` — 3 Sprachblöcke (`de:`, `en:`, `pl:`), je ~40 Schlüssel. Anbindung via `data-i18n` (textContent/innerHTML), `data-i18n-alt` (alt), `data-i18n-aria` (aria-label). `wendeSpracheAn()` wechselt ohne Reload; Rückfall: Deutsch, falls Schlüssel fehlt.

**Layout-Regler:** `:root`-Variablen oben in styles.css (`--gold`, `--video-filter`, …); Sektionsrhythmus `.abschnitt { padding: 2.2rem 1.2rem; }`; Galeriebreite `.galerie { max-width: 52rem; }`.

## Stolperfallen aus der Session (vermeide wiederkehrende Fehler)

- **Vollhöhen-Grid + `place-items: center`** streckt mehrere Zeilen auf die Höhe des Screens (Standard-`align-content`) → riesige Abstände. Fix: `align-content: center`. Betroffen war das Sprach-Overlay; Hero ist jetzt bewusst Blockflow mit berechnetem `padding-top` (Platz für den fixen ↩-Button).
- iframe des Videos braucht **`pointer-events: none`**, sonst fängt ein Tap den YouTube-Player ab und Scrollen/Drücken blockiert.
- Überlagerte fixe Buttons oben (`sprachwahl-button`): Hero-`padding-top` rechnet deren Höhe mit (`max(14px, env(safe-area-inset-top)) + 4.2rem`).
- `prefers-reduced-motion` schaltet Deko-Animationen aus (Sterne/Puls/Einblendungen) — bei jeder neuen Animation mitdenken.
- Scrollbar-Sperre nur via `body.overlay-offen` (JS setzt/entfernt sie bei jedem Overly-Öffnen/Schließen).

## Deployment-Stand & Git

- **Netlify** live (Nutzer bestätigt). GitHub-Repo synchron; `main` = Deploy-Branch. Gitflow: direkt auf `main` committen + pushen (kein PR-Flow), deutsche Commit-Messages, mit `Co-Authored-By: Claude Code <noreply@anthropic.com>`.
- `.gitignore`: `.DS_Store`, `/einladung_*.jpeg` im Wurzelverzeichnis (Nutzer-Originals = Kopien der images/), `.waylog/` (Session-Protokolle — nichts für GitHub!), `*.swp`.

## Lokal testen

`npx serve .` (oder `python3 -m http.server`) — **nicht** per Doppelklick auf index.html (file:// macht YouTube/Font-Verhalten unzuverlässig). Testhelfer: `?lang=de|en|pl` erzwingt Sprache (überspringt Sprach-Overlay, testet Consent trotzdem), `localStorage.clear()` → vollständiger Erstbesuch.

## Offene To-Dos

1. **og:image / twitter:image auf absolute URL** umstellen (index.html Zeile ~20/29) — sobald die finale Netlify-Domain bekannt ist (`https://<domain>/images/einladung_1_de.jpeg`). Vorher im WhatsApp-Preview ggf. kein/fehlerhaftes Bild.
2. **Netlify-Domain in diese CLAUDE.md eintragen** (User fragen, dann Zeile »Deploy« ergänzen).
3. Kein RSVP geplant (bewusst, 2026-10-02 entschieden).