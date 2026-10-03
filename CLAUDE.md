# CLAUDE.md — Mathildas 18ter Geburtstag · Studio-54-Einladung

Zusammenfassung aus MEINER (Claude-)Sicht, Stand **2026-10-03 (Trailer-Intro + Zoom-Sicherung)**. Für neue Sessions: Lies zuerst »Ablauf« und »Feste Entscheidungen« — dort steht, was NICHT leichtfertig geändert werden darf.

## Projekt

One-Page-Geburtstagseinladung im **Studio-54-Stil** (Schwarz & Gold, Glitzer, Neon-Glow, 70er-Typografie). Reines **HTML/CSS/JS — kein Framework, kein Build-Tool, kein npm**. Die einzige Extern-Abhängigkeit außer Google Fonts ist YouTube, aber **einwilligungsabhängig** (erst der 🎵-Musik-Klick baut die Verbindung — siehe »Datenschutz-Detail«).

- **Mobile-first**: Die Seite wird per **WhatsApp** versendet → alles muss am Handy funktionieren (nativ Swipe/scrollen, safe-area-insets, 100svh beachten).
- **Deploy:** **Netlify**, live unter **https://mathildas-18ter-geburtstag.netlify.app** (verifiziert, 2026-10-02).
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
index.html            — Markup; alle Sektionen + festes Menü oben + Script-Zeilen am body-Ende
                        (translations, main, intro, zoomsicherung — bewusst in dieser Reihenfolge)
css/styles.css        — komplettes Styling; Farbsystem & --video-filter in :root;
                        INTRO/TRAILER-Block am ENDE der Datei (anhang für js/intro.js)
js/translations.js    — ALLE sichtbaren Texte in de/en/pl (UEBERSETZUNGEN-Objekt)
js/main.js            — komplette Logik; Konstanten ganz oben
js/intro.js           — Trailer-Intro (komplett unabhängig, siehe unten; berühren nicht!)
js/zoomsicherung.js   — Pinch-Zoom-Robustheit (komplett unabhängiger Anhang, siehe unten; berühren nicht!)
images/einladung_1_<lang>.jpeg — Titel-Karte (Hero-Bild)
images/einladung_2_<lang>.jpeg — Details-Karte (Galerie)
         <lang> = de | en | pl  (Namen so vom Nutzer angelegt, beibehalten!)
```

## Trailer-Intro (2026-10-03, komplett unabhängiger Anhang — NICHT in bestehenden Code integrieren!)

Erbaut als isolierter Anhang: **js/intro.js** baut sich den Layer `#intro` SELBST in den body (index.html hat nur eine `<script>`-Zeile dazubekommen, styles.css einen INTRO-Block am Ende). Bestehender Code wurde NICHT angerührt — so lassen!

- **Ablauf:** schwarzer Layer (z-index 999) mit pulsierendem goldenen Herz ♥ (Start-Button, kein Text) → Klick startet Web-Audio-Herzschlag („lub-dub"-Loop, entsteht ERST im Klick — Nutzergeste!) → Trailer-Schritte je ~2,6 s: „2027" → „23.01." → „19:00" → Finale „MATHILDA 18" + „★ BIRTHDAY PARTY ★" mit kräftigem Doppel-Herzschlag + Gold-Glitzer-Burst → Fade-out zur normalen Seite.
- **SKIP: NUR über das „✕" oben rechts** (Nutzer-Entscheidung!). Kein Tippen-irgendwo-Skip — versehentliche Taps während des Trailers tun absichtlich nichts.
- **Erscheint bei JEDEM Aufruf** (kein Speichern).
- **Schrift = Monoton** (Seiten-Titel-Schrift). „Fett" läuft über Größe + `-webkit-text-stroke` + Glow — Monoton hat nur eine Strich-Stärke, font-weight bringt nichts!
- Texte als Konstante `INTRO_SEQUENCE` oben in intro.js. Herzschlag-Tempo & Text-Puls synchron über `--intro-hz` (JS schaltet beides zusammen).
- `prefers-reduced-motion`: still, ohne Puls/Funken, Texte statisch.

## Ablauf beim Seitenaufruf (Kern-Ablauf — die Seele der Seite! EINFACHER ABLAUF, Nutzer-Entscheidung 2026-10-02)

Implementiert in `initialisiere()` (main.js):

0. **VORGESCHALTET (intro.js, unabhängig):** Schwarzes Trailer-Intro (Herz ♥ → Trailer → Fade-out). Skip nur über „✕" oben rechts. Danach genau Punkt 1.
1. **Jeder Aufruf:** sofort die **Einladungsseite auf Deutsch** — keine Sprach-Overlay-, keine Consent-Maske mehr (alte Overlays wurden komplett entfernt).
2. **Festes Mini-Menü oben** (`.kopf`, fix, **nie weg**): 🎵-Musik-Button + die **zwei anderen** Sprach-Buttons (auf Deutsch → *English · Polski*, auf Englisch → *Deutsch · Polski*, auf Polnisch → *Deutsch · English*; geschaltet von `aktualisiereMenu()`). Sprach-Buttons stehen ALLE 3 statisch in der index.html, JS blendet nur die aktive aus.
3. Unter dem 🎵-Button (Teil der fixen Leiste) der **IP/YouTube-Hinweis** + Google-Privacy-Link — zusammen mit dem Button ausblenden, sobald Musik läuft (bzw. bei onError).
4. **🎵-Klick = Einwilligung UND Nutzergeste in einem Klick:** `starteMusik()` setzt im selben Handler den **iframe SOFORT synchron** (Embed-URL mit `autoplay=1&mute=0`, youtube-nocookie.com, `enablejsapi=1&origin=...`) — nur so startet der Ton mit dieser EINEN Geste zuverlässig (Sonst-Fehler: 2 Klicks nötig, weil die API erst nach dem Klick bereit war). Parallel lädt `ladeYoutubeApi()` das iframe-API-Script und „attacht" sich per `new YT.Player(iframeEl)` an den laufenden iframe (Lautstärke 50 %, Status-Events). Klemmt der Start, bleibt der 🎵-Button sichtbar (2-Sek.-Check `pruefeWiedergabe()`); `onError` → Seite läuft ohne Musik weiter, Button verschwindet.
5. **Sprachwechsel** per Menü-Knopf → `wendeSpracheAn()` tauscht alle Texte, Hero-Bild (`einladung_1_<lang>.jpeg`) und Galerie ohne Reload.
6. **Kein localStorage mehr** — Sprache/Einwilligung werden nicht gespeichert; die Seite startet IMMER auf Deutsch.

## Feste Entscheidungen (vom Nutzer — nicht ändern ohne Rückfrage!)

- **Einfacher Ablauf (2026-10-02, Nutzer):** kein Sprach-Overlay, kein Consent-Screen, kein localStorage. Aufruf → **direkt Einladungsseite auf Deutsch**. Vorher gab es Overlays (Sprachauswahl + Musik-Consent) — bewusst durch den Nutzer ersetzt, NICHT zurückbauen.
- **Festes Menü oben, das NIE verschwindet:** 🎵 Musik-Button + die zwei anderen Sprach-Buttons. Nicht fixieren an eine Position mit „auto-hide" o. ä.
- **Sprach-Button-Labels:** „Deutsch", „English" (großes E, Rest klein — nicht ENGLISH!), „Polski". Menü zeigt immer nur die zwei NICHT gewählten.
- **Musik-Button mit IP-Zusatz:** neben/am 🎵-Button steht der Hinweis (IP-Übertragung an YouTube/Google) + Google-Privacy-Link — der muss sichtbar bleiben, solange der 🎵-Button sichtbar ist.
- **Hero-Bild sofort sichtbar** beim Seitenaufruf (kein verzögertes Einblenden — die alte 1,5-s-Verzögerung ist bewusst entfernt).
- **Abstände bewusst KOMPAKT** (mehrere Nachbesserungen!) — nicht wieder auflockern.
- **RSVP: KOMPLETT WEG als Modul** (Nutzer 2026-10-02). Der RSVP-Satz auf den Karten (Galerie-Bild 2) ist nur Info-Text.
- **Galerie: KEIN Karussell** — die **2 Karten der gewählten Sprache groß übereinander gestapelt** (`data-lang`-Filter in `aktualisiereGalerieSprache()`), damit der Kartentext lesbar ist.
- **Video-Behandlung:** schwarz-weiß + weichgezeichnet, damit Inhalte hervorstehen — als CSS-Variable `--video-filter` (styles.css, in `:root`), z. B. `grayscale(1) blur(6px)`; `scale(1.15)` am iframe gleicht blur-Ränder aus.
- Musik **beginnt nie ohne explizite Nutzergeste** (Konservierungsregel für iOS/Safari + Datenschutz) — der 🎵-Klick ist diese Geste.
- **Trailer-Intro (2026-10-03):** erscheint bei jedem Aufruf, Skip **NUR über „✕" oben rechts** — kein Tipp-irgendwo-Skip (Nutzer ausdrücklich!). Intro-Code als isolierter Anhang halten (intro.js + CSS-Block am Ende), bestehende Dateien nicht umbauen. Schrift Monoton, Texte groß/fett/lesbar, Finale „★ BIRTHDAY PARTY ★".  
  **Finale = ESKALATION (2026-10-03, Nutzer-Wunsch „viel bunter, dramatischer, Konfetti"):** beim Finale-Schritt (nach ~700 ms) → Doppel-Herzschlag **+ Sound-Boom** (Bass-Drop + Bandpass-Konfetti-Rauschen, reine Web-Audio-Synthese, kein Sample) **+ weissgoldener Vollbild-Blitz** (`.intro-bumm`, z1001, pointer-events:none → ✕ bleibt klickbar) **+ Gold-Funken + 3 Konfetti-Wellen** im Abstand 0/600/1200 ms (`streueKonfetti(buehne, stufe)`, Menge 42/60/85, Weite steigt, Schraub-Rotation + 3D-Flip). „★ BIRTHDAY PARTY ★" → laufendes Regenbogen-Gradient (background-clip:text), „MATHILDA"/„18" → Punch-Einflug, 18 → Regenbogen-Halo. Alles NUR im intro.js/INTRO-CSS-Block; `prefers-reduced-motion` überspringt die ganze Eskalation (Guard + CSS).
- **Standard-Pinch-Zoom bleibt erlaubt + ZOOM-SICHERUNG (2026-10-03, Nutzer: „Seite verschwindet beim Zoom komplett"):** KEIN eigenes Zoom-Feature, kein `user-scalable=no`, keine Lightbox. Der Browser-Zoom (zwei Finger) macht einfach weiter. `js/zoomsicherung.js` (isolierter Anhang nach intro.js-Muster) hört auf `visualViewport` und setzt ab Skala ~1,1 `body.seite-gezoomt` → CSS-Block am ENDE von styles.css blendet nur die Deko-Ebenen (`.sterne`, `.glitzer-spur`, `.video-hintergrund`, `.video-abdunkelung`) sanft aus; zurück auf ~1× → alles wieder an. **Menüleiste `.kopf` bleibt unangetastet (fixe „nie weg"-Entscheidung), Intro außen vor (`body.intro-aktiv`-Guard), Desktop = null Effekt.** Nicht wieder entfernen, auch nicht „optimieren" auf Touch-Events!
- **Musik-Pill „Klicke mich!"** (de/en/pl) mit **Wachs-Effekt** (jeder Klick macht sie größer, `--wuchs` bis Stufe 6) und **Supernova**, sobald der Ton wirklich läuft (Blitz + 2 Schockwellen-Ringe + 44 Regenbogen-Funken, dann Button + IP-Hinweis endgültig weg). Nicht zurückbauen — Nutzer wollte Anreiz-Gestaltung!
- **Hintergrund-Sterne sind 4-strahlige Funkensterne** mit Regenbogen-Mischung (55 % bunt / 45 % Gold) — bewusst deutlich sichtbar (Nutzer-Wunsch „deutlicher, mit Strahlen, Regenbogenfarben").
- **Video-Filter REIN Schwarz-Weiß:** `--video-filter: grayscale(1) blur(2px)` — grayscale < 1 lässt Restfarbe durch und passt nicht zur Farbpalette (Nutzer 2026-10-03).

## Datenschutz-Detail (🎵-Klick = Einwilligung — wichtig!)

- **Keine einzige YouTube-Verbindung vor Einwilligung:** Der statische `<script src="https://www.youtube.com/iframe_api">` ist NICHT in der index.html. `starteMusik()` setzt beim 🎵-Klick den **iframe direkt manuell** (`/embed/<ID>?autoplay=1&mute=0` → youtube-nocookie.com, Datenschutzmodus) und lädt das API-Script parallel erst dann — beides nur nach dem Klick. WICHTIG bewahrt: der iframe-URL braucht `enablejsapi=1&origin=<origin>`, damit die API sich attachen kann.
- **1-Klick-Ton:** Der iframe MUSS synchron in der Klick-Geste eingesetzt werden (autoplay=1). Nicht wieder auf das alte Muster (API erst laden → Player bauen → playVideo) zurückstellen — daraus resultierte der Doppelklick-Bug.
- Einwilligung ist der 🎵-Klick selbst; die IP-Hinweis-Zeile (`.kopf-hinweis`, `musik_hinweis` + `datenschutz_link`) steht dauerhaft neben/unter dem 🎵-Button. Kein localStorage mehr nötig.
- Footer-Credit in allen Sprachen: `footer_musik` (Bee Gees + Hinweis Datenübertragung an YouTube/Google).

## Konstanten & Textänderungen (Schnellreferenz)

**`js/main.js` ganz oben:** `VIDEO_ID` (`uQ9_MwZIaoc`, Bee Gees – More Than a Woman), `MUSIK_LAUTSTAERKE` (50), `FALLBACK_TIMEOUT_MS` (2000), `MAPS_ZIEL` (Google-Maps-Ziel — bei Adressänderung zusätzlich den `href` im Details-Ticket der index.html ändern!), `REGENBOGEN_TONES` (Hue-Liste für Sterne/Nova-Funken).

**`js/intro.js` ganz oben:** `INTRO_SEQUENCE` („2027", „23.01.", „19:00", „MATHILDA 18"), Timings (`INTRO_SCHRITT_MS` 2600, `INTRO_FINALE_MS` 3200 — länger als ein Schritt, damit die Finale-Eskalation Luft hat), `INTRO_FUNKEN_ANZAHL` (46), `INTRO_KONFETTI_PRO_STUFE` ([0, 42, 60, 85] — 3 aufsteigende Konfetti-Wellen), `INTRO_KONFETTI_FARBEN` (Regenbogen + Gold).

**Alle sichtbaren Texte:** `js/translations.js` — 3 Sprachblöcke (`de:`, `en:`, `pl:`). Anbindung via `data-i18n` (textContent/innerHTML), `data-i18n-alt` (alt), `data-i18n-aria` (aria-label). `wendeSpracheAn()` wechselt ohne Reload; Rückfall: Deutsch, falls Schlüssel fehlt. Menü-Keys: `musik_button`, `menu_aria`, `musik_hinweis`, `datenschutz_link`.

**Layout-Regler:** `:root`-Variablen oben in styles.css (`--gold`, `--video-filter`, …); Menü-Leiste `.kopf`; Sektionsrhythmus `.abschnitt { padding: 2.2rem 1.2rem; }`; Galeriebreite `.galerie { max-width: 52rem; }`.

## Stolperfallen aus der Session (vermeide wiederkehrende Fehler)

- iframe des Videos braucht **`pointer-events: none`**, sonst fängt ein Tap den YouTube-Player ab und Scrollen/Drücken blockiert.
- Fixe Menüleiste oben (`.kopf`): Hero-`padding-top` rechnet ihre Höhe MIT (aktuell `max(14px, env(safe-area-inset-top)) + 5.6rem`) — größerer IP-Hinweis → padding nachziehen. `.kopf` selbst hat `pointer-events: none` (Buttons wieder auf `auto`), damit man unter der Leiste noch scrollen kann.
- `prefers-reduced-motion` schaltet Deko-Animationen aus (Sterne/Puls/Hero-Einblendung) — bei jeder neuen Animation mitdenken; intro.js/Sterne/Nova haben eigene Guards + media-query-Regeln.
- Sterne/Nova-Funken: clip-path sitzt auf `::before`, drop-shadow-Filter auf dem Elternteil — **nicht auf dasselbe Element legen**, sonst schneidet der clip-path den Glow ab. (Die alte `.glitzer`-Klasse der Glitzer-Spur hat das Problem noch — die Nova-Varianz `.glitzer--nova` übersteuert das.)
- Supernova nur über Play-Status-Events (PLAYING) auslösen und via `novaGelaufen`-Merker genau einmal — `pruefeWiedergabe()` hat einen Guard, dass der Button während der Nova nicht zurückommt.
- Trailer-Intro: keines der alten Muster anfassen (kein Sprach-/Consent-Overlay!) — intro.js ist bewusst eigenständig, Skip-Logik NUR am „✕".
- Ehemaliges Problem: das Sprach-Overlay wurde entfernt — also auch kein `body.overlay-offen`/Scrollbar-Sperre mehr im CSS/JS (altes Muster nicht wieder einbauen). Scrollfix läuft aktuell über `body.intro-aktiv` (intro.js setzt/entfernt es).

## Deployment-Stand & Git

- **Netlify** live: **https://mathildas-18ter-geburtstag.netlify.app** (Deploy-Branch `main` = automatisches Deploy bei jedem Push). GitHub-Repo synchron; `main` = Deploy-Branch. **AB 2026-10-02: Der Nutzer committet und pusht SELBST — Claude ändert nur Dateien, niemals git commit/push.** (Alte Regel „direkt auf main committen" ist ungültig.)
- `.gitignore`: `.DS_Store`, `/einladung_*.jpeg` im Wurzelverzeichnis (Nutzer-Originals = Kopien der images/), `.waylog/` (Session-Protokolle — nichts für GitHub!), `*.swp`.

## Lokal testen

`npx serve .` (oder `python3 -m http.server`) — **nicht** per Doppelklick auf index.html (file:// macht YouTube/Font-Verhalten unzuverlässig). Keine Testhelfer mehr nötig: Seite startet immer auf Deutsch, Musik nur per 🎵-Klick. Beim Testansehen kommt zuerst das **Trailer-Intro** (Herz starten oder ✕ überspringen) — Normalverhalten!

## Erledigt, nur zur Erinnerung

- **og:image / twitter:image auf absolute URL** umgestellt (index.html): `https://mathildas-18ter-geburtstag.netlify.app/images/einladung_1_de.jpeg` — nötig für die zuverlässige WhatsApp-Vorschau.
- **Ein-Klick-Musikstart** (3. Session-Runde 2026-10-02): YouTube-iframe wird synchron in der 🎵-Klick-Geste eingesetzt, API attacht sich parallel — Doppelklick-Bug behoben.
- **2026-10-03:** Hintergrund-Sterne → 4-strahlige Regenbogen-Funkensterne; 🎵-Pill → „Klicke mich!“ mit Wachs-Effekt + Supernova beim echten Play; Video-Filter → `grayscale(1)` (rein S/W); **Trailer-Intro komplett neu dazu** (`js/intro.js` + INTRO-CSS-Block + eine Script-Zeile); **Zoom-Sicherung neu dazu** (`js/zoomsicherung.js` + ZOOM-SICHERUNG-CSS-Block am Ende — gegen „Seite verschwindet beim Pinch-Zoom“, Nutzer-Bericht); **Finale-Eskalation im Intro** (Sound-Boom + Blitz + 3 Konfetti-Wellen + Regenbogen-Finale-Text, alles in intro.js/INTRO-CSS-Block).

## Offene To-Dos

- Kein RSVP geplant (bewusst, 2026-10-02 entschieden) — main.js hält die Kommentarmarke `// RSVP: hier später einbauen`.
- WhatsApp-Vorschau einmal an der Live-Domain prüfen (Bild + Titel), nachdem Netlify deployt hat.