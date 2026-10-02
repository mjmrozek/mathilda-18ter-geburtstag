# CLAUDE.md — Mathildas 18ter Geburtstag · Studio-54-Einladung

Zusammenfassung aus MEINER (Claude-)Sicht, Stand **2026-10-02 (Umstellung „einfacher Ablauf")**. Für neue Sessions: Lies zuerst »Ablauf« und »Feste Entscheidungen« — dort steht, was NICHT leichtfertig geändert werden darf.

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
index.html            — Markup; alle Sektionen + festes Menü oben
css/styles.css        — komplettes Styling; Farbsystem & --video-filter in :root
js/translations.js    — ALLE sichtbaren Texte in de/en/pl (UEBERSETZUNGEN-Objekt)
js/main.js            — komplette Logik; Konstanten ganz oben
images/einladung_1_<lang>.jpeg — Titel-Karte (Hero-Bild)
images/einladung_2_<lang>.jpeg — Details-Karte (Galerie)
         <lang> = de | en | pl  (Namen so vom Nutzer angelegt, beibehalten!)
```

## Ablauf beim Seitenaufruf (Kern-Ablauf — die Seele der Seite! EINFACHER ABLAUF, Nutzer-Entscheidung 2026-10-02)

Implementiert in `initialisiere()` (main.js):

1. **Jeder Aufruf:** sofort die **Einladungsseite auf Deutsch** — keine Sprach-Overlay-, keine Consent-Maske mehr (alte Overlays wurden komplett entfernt).
2. **Festes Mini-Menü oben** (`.kopf`, fix, **nie weg**): 🎵-Musik-Button + die **zwei anderen** Sprach-Buttons (auf Deutsch → *English · Polski*, auf Englisch → *Deutsch · Polski*, auf Polnisch → *Deutsch · English*; geschaltet von `aktualisiereMenu()`). Sprach-Buttons stehen ALLE 3 statisch in der index.html, JS blendet nur die aktive aus.
3. Unter dem 🎵-Button (Teil der fixen Leiste) der **IP/YouTube-Hinweis** + Google-Privacy-Link — zusammen mit dem Button ausblenden, sobald Musik läuft (bzw. bei onError).
4. **🎵-Klick = Einwilligung UND Nutzergeste in einem Klick:** `starteMusik()` im selben Handler → `ladeYoutubeApi()` injiziert das iframe-API-Script, iframe von **youtube-nocookie.com**, `playVideo()` mit Ton (50 %), Dauerschleife. Klemmt der Start, bleibt der 🎵-Button sichtbar (2-Sek.-Check `pruefeWiedergabe()`); `onError` → Seite läuft ohne Musik weiter, Button verschwindet.
5. **Sprachwechsel** per Menü-Knopf → `wendeSpracheAn()` tauscht alle Texte, Hero-Bild (`einladung_1_<lang>.jpeg`) und Galerie ohne Reload.
6. **Kein localStorage mehr** — Sprache/Einwilligung werden nicht gespeichert; die Seite startet IMMER auf Deutsch.

## Feste Entscheidungen (vom Nutzer — nicht ändern ohne Rückfrage!)

- **Einfacher Ablauf (2026-10-02, Nutzer):** kein Sprach-Overlay, kein Consent-Screen, kein localStorage. Aufruf → **direkt Einladungsseite auf Deutsch**. Vorher gab es Overlays (Sprachauswahl + Musik-Consent) — bewusst durch den Nutzer ersetzt, NICHT zurückbauen.
- **Festes Menü oben, das NIE verschwindet:** 🎵 Musik-Button + die zwei anderen Sprach-Buttons. Nicht fixieren an eine Position mit „auto-hide" o. ä.
- **Sprach-Button-Labels:** „Deutsch", „English" (großes E, Rest klein — nicht ENGLISH!), „Polski". Menü zeigt immer nur die zwei NICHT gewählten.
- **Musik-Button mit IP-Zusatz:** neben/am 🎵-Button steht der Hinweis (IP-Übertragung an YouTube/Google) + Google-Privacy-Link — der muss sichtbar bleiben, solange der 🎵-Button sichtbar ist.
- **RSVP: KOMPLETT WEG als Modul** (Nutzer 2026-10-02). Der RSVP-Satz auf den Karten (Galerie-Bild 2) ist nur Info-Text.
- **Galerie: KEIN Karussell** — die **2 Karten der gewählten Sprache groß übereinander gestapelt** (`data-lang`-Filter in `aktualisiereGalerieSprache()`), damit der Kartentext lesbar ist.
- **Video-Behandlung:** schwarz-weiß + weichgezeichnet, damit Inhalte hervorstehen — als CSS-Variable `--video-filter` (styles.css, in `:root`), z. B. `grayscale(1) blur(6px)`; `scale(1.15)` am iframe gleicht blur-Ränder aus.
- Musik **beginnt nie ohne explizite Nutzergeste** (Konservierungsregel für iOS/Safari + Datenschutz) — der 🎵-Klick ist diese Geste.

## Datenschutz-Detail (Zwei-Klick-Lösung — wichtig!)

- **Keine einzige YouTube-Verbindung vor Einwilligung:** Der statische `<script src="https://www.youtube.com/iframe_api">` ist NICHT in der index.html; `ladeYoutubeApi()` injiziert das Script dynamisch erst nach dem 🎵-Klick. iframe folgt danach mit `host: 'https://www.youtube-nocookie.com'` (Datenschutzmodus) — beides in `starteMusik()`.
- Einwilligung ist der 🎵-Klick selbst; die IP-Hinweis-Zeile (`.kopf-hinweis`, `musik_hinweis` + `datenschutz_link`) steht dauerhaft neben/unter dem 🎵-Button. Kein localStorage mehr nötig.
- Footer-Credit in allen Sprachen: `footer_musik` (Bee Gees + Hinweis Datenübertragung an YouTube/Google).

## Konstanten & Textänderungen (Schnellreferenz)

**`js/main.js` ganz oben:** `VIDEO_ID` (`uQ9_MwZIaoc`, Bee Gees – More Than a Woman), `MUSIK_LAUTSTAERKE` (50), `FALLBACK_TIMEOUT_MS` (2000), `MAPS_ZIEL` (Google-Maps-Ziel — bei Adressänderung zusätzlich den `href` im Details-Ticket der index.html ändern!).

**Alle sichtbaren Texte:** `js/translations.js` — 3 Sprachblöcke (`de:`, `en:`, `pl:`). Anbindung via `data-i18n` (textContent/innerHTML), `data-i18n-alt` (alt), `data-i18n-aria` (aria-label). `wendeSpracheAn()` wechselt ohne Reload; Rückfall: Deutsch, falls Schlüssel fehlt. Menü-Keys: `musik_button`, `menu_aria`, `musik_hinweis`, `datenschutz_link`.

**Layout-Regler:** `:root`-Variablen oben in styles.css (`--gold`, `--video-filter`, …); Menü-Leiste `.kopf`; Sektionsrhythmus `.abschnitt { padding: 2.2rem 1.2rem; }`; Galeriebreite `.galerie { max-width: 52rem; }`.

## Stolperfallen aus der Session (vermeide wiederkehrende Fehler)

- iframe des Videos braucht **`pointer-events: none`**, sonst fängt ein Tap den YouTube-Player ab und Scrollen/Drücken blockiert.
- Fixe Menüleiste oben (`.kopf`): Hero-`padding-top` rechnet ihre Höhe MIT (aktuell `max(14px, env(safe-area-inset-top)) + 5.6rem`) — größerer IP-Hinweis → padding nachziehen. `.kopf` selbst hat `pointer-events: none` (Buttons wieder auf `auto`), damit man unter der Leiste noch scrollen kann.
- `prefers-reduced-motion` schaltet Deko-Animationen aus (Sterne/Puls/Hero-Einblendung) — bei jeder neuen Animation mitdenken.
- Ehemaliges Problem: das Sprach-Overlay wurde entfernt — also auch kein `body.overlay-offen`/Scrollbar-Sperre mehr im CSS/JS (altes Muster nicht wieder einbauen).

## Deployment-Stand & Git

- **Netlify** live: **https://mathildas-18ter-geburtstag.netlify.app** (Deploy-Branch `main` = automatisches Deploy bei jedem Push). GitHub-Repo synchron; `main` = Deploy-Branch. Gitflow: direkt auf `main` committen + pushen (kein PR-Flow), deutsche Commit-Messages, mit `Co-Authored-By: Claude Code <noreply@anthropic.com>`.
- `.gitignore`: `.DS_Store`, `/einladung_*.jpeg` im Wurzelverzeichnis (Nutzer-Originals = Kopien der images/), `.waylog/` (Session-Protokolle — nichts für GitHub!), `*.swp`.

## Lokal testen

`npx serve .` (oder `python3 -m http.server`) — **nicht** per Doppelklick auf index.html (file:// macht YouTube/Font-Verhalten unzuverlässig). Keine Testhelfer mehr nötig: Seite startet immer auf Deutsch, Musik nur per 🎵-Klick.

## Offene To-Dos

1. **og:image / twitter:image auf absolute URL** umstellen (index.html ~Zeile 20/29) — Netlify-Domain ist **https://mathildas-18ter-geburtstag.netlify.app**, also `https://mathildas-18ter-geburtstag.netlify.app/images/einladung_1_de.jpeg` eintragen (WhatsApp-Preview braucht absolute URL).
2. Kein RSVP geplant (bewusst, 2026-10-02 entschieden).