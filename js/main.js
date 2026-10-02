/* ============================================================
   main.js — Logik für die Studio-54-Einladung
   ------------------------------------------------------------
   Ablauf beim Seitenaufruf:
     1. Direkt die Einladungsseite — auf Deutsch, ohne Overlays.
     2. Festes Menü oben (nie verschwindend): 🎵 Musik-Button
        und die zwei anderen Sprach-Buttons (z. B. English/Polski).
     3. 🎵-Klick = Einwilligung UND Nutzergeste in einem Klick:
        youtube-nocookie-iframe wird SOFORT in derselben Geste
        eingesetzt (autoplay=1 → EIN Klick genügt, auch iPhone).
        Das iframe-API-Script lädt parallel und attacht sich
        später (Lautstärke-Steuerung).
     4. Fallback: klemmt der Start (besonders iPhone/Safari),
        bleibt der 🎵-Button sichtbar, bis Ton wirklich läuft.
        onError: Seite läuft ohne Musik weiter.
   ============================================================ */

'use strict';

/* ============================================================
   KONSTANTEN — zentrale Anpassungen ganz oben
   ============================================================ */
const VIDEO_ID          = 'uQ9_MwZIaoc'; // Bee Gees – "More Than a Woman"
const MUSIK_LAUTSTAERKE = 50;            // Lautstärke in Prozent
const FALLBACK_TIMEOUT_MS = 2000;        // Wartezeit bis zum Wiedergabe-Check

// Google-Maps-Ziel für den Orts-Link
const MAPS_ZIEL = 'https://www.google.com/maps/search/?api=1&query=An+d.+Neuen+M%C3%BChle+22%2C+47447+Moers-Kapellen';

// RSVP: hier später einbauen


/* ============================================================
   ZUSTAND
   ============================================================ */
let player = null;               // YouTube-Player-Instanz (attacht sich an den laufenden iframe)
let ytApiBereit = false;         // Merker: IFrame-API geladen?
let ytApiLaeuft  = false;        // Merker: API-Script wird gerade geladen (Doppelstart verhindern)
let musikFehlgeschlagen = false; // onError → Seite läuft ohne Musik weiter

// DOM-Referenzen (in initialisiere() gefüllt)
const dom = {};


/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', initialisiere);

function initialisiere() {
  dom.musikButton    = document.getElementById('musik-button');
  dom.musikHinweis   = document.getElementById('musik-hinweis');
  dom.sprachButtons  = document.querySelectorAll('.sprach-button');
  dom.videoContainer = document.getElementById('video-hintergrund');
  dom.heroBild       = document.getElementById('hero-bild');
  dom.galerieStapel  = document.getElementById('galerie-stapel');

  baueSterne();
  initialisiereGlitzerSpur();
  verdrahteSprachButtons();
  verdrahteMusikButton();
  initialisiereScrollReveal();

  // Startzustand: Deutsch (Buttons zeigen die zwei anderen Sprachen)
  aktualisiereMenu('de');
}


/* ============================================================
   SPRACHSYSTEM
   ============================================================ */

// Sprach-Buttons im Menü verdrahten: Sprache umschalten, ohne Reload
function verdrahteSprachButtons() {
  dom.sprachButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const lang = button.dataset.sprache;
      wendeSpracheAn(lang);
      aktualisiereMenu(lang);
    });
  });
}

// Menü: die gewählte Sprache ausblenden, die zwei anderen zeigen
function aktualisiereMenu(lang) {
  dom.sprachButtons.forEach((button) => {
    button.hidden = button.dataset.sprache === lang;
  });
}

// Alle Texte auf der Seite für die gewählte Sprache anwenden (ohne Reload).
// Nachträglich Texte ändern? → js/translations.js
function wendeSpracheAn(lang) {
  document.documentElement.lang = lang;

  // Textinhalte tauschen
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const text = uebersetzung(lang, el.dataset.i18n);
    if (text !== undefined) el.innerHTML = text;
  });

  // alt-Texte der Bilder tauschen
  document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
    const text = uebersetzung(lang, el.dataset.i18nAlt);
    if (text !== undefined) el.alt = text;
  });

  // aria-Labels tauschen
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const text = uebersetzung(lang, el.dataset.i18nAria);
    if (text !== undefined) el.setAttribute('aria-label', text);
  });

  // Hero-Bild passend zur Sprache wählen
  if (dom.heroBild) {
    dom.heroBild.src = 'images/einladung_1_' + lang + '.jpeg';
    dom.heroBild.alt = uebersetzung(lang, 'hero_bild_alt') || '';
  }

  // Galerie auf die gewählte Sprache eingrenzen: nur deren 2 Karten anzeigen
  aktualisiereGalerieSprache(lang);
}

// Übersetzung sicher abfragen
function uebersetzung(lang, schluessel) {
  if (UEBERSETZUNGEN[lang] && UEBERSETZUNGEN[lang][schluessel] !== undefined) {
    return UEBERSETZUNGEN[lang][schluessel];
  }
  if (UEBERSETZUNGEN.de[schluessel] !== undefined) return UEBERSETZUNGEN.de[schluessel];
  return undefined;
}


/* ============================================================
   YOUTUBE — Musik als Vollbild-Hintergrund
   ------------------------------------------------------------
   1-Klick-Start: Der iframe wird SOFORT im 🎵-Klick eingesetzt
   (Embed-URL mit autoplay=1). Nur so startet der Ton mit eben
   DIESER Nutzergeste zuverlässig — die iframe-API ist erst
   Sekunden später bereit, dann ist die Geste des Klicks schon
   „verbraucht“ (deswegen musste man sonst ZWEIMAL klicken).
   Die iframe-API lädt parallel und attacht sich danach an den
   laufenden Player, damit Lautstärke & Musik-Status steuerbar
   bleiben. Datenschutz: ERST der 🎵-Klick baut überhaupt die
   erste YouTube-Verbindung (iframe + API-Script).
   ============================================================ */

// Wird von der IFrame-API aufgerufen, sobald sie geladen ist:
// an den schon laufenden iframe „anchließen“ (attach, kein neuer Player)
window.onYouTubeIframeAPIReady = function () {
  ytApiBereit = true;
  const iframeEl = document.getElementById('yt-player-iframe');
  if (!player && iframeEl && dom.videoContainer.classList.contains('video-hintergrund--sichtbar')) {
    try {
      player = new YT.Player(iframeEl, {
        events: {
          onReady: beiPlayerBereit,
          onStateChange: beiStatuswechsel,
          onError: beiPlayerFehler,
        },
      });
    } catch (e) { /* attach nicht nötig — Musik läuft ggf. schon */ }
  }
};

// IFrame-API-Script DYNAMISCH nachladen (nur nach dem 🎵-Klick)
function ladeYoutubeApi() {
  if (ytApiBereit || ytApiLaeuft) return;
  ytApiLaeuft = true;
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.async = true;
  document.head.appendChild(script);
}

// YouTube-iframe SOFORT (synchron in der Nutzergeste!) einsetzen:
// autoplay=1 in der Embed-URL ist der Trick für den 1-Klick-Ton,
// loop+playlist für die Dauerschleife, enablejsapi für das Attach.
function baueYoutubeIframe() {
  if (document.getElementById('yt-player-iframe')) return;

  const params = new URLSearchParams({
    autoplay: '1',        // direkt abspielen (mit Ton — siehe Klick-Geste)
    mute: '0',            // MIT Ton starten
    controls: '0',        // Bedienelemente verstecken
    loop: '1',            // Dauerschleife
    playlist: VIDEO_ID,   // nötig, damit loop funktioniert
    playsinline: '1',     // mobil: inline statt im Fullscreen-Player
    rel: '0',             // keine Video-Empfehlungen am Ende
    modestbranding: '1',  // dezenteres YouTube-Branding
    iv_load_policy: '3',  // keine Karten-Anmerkungen
    disablekb: '1',       // Tastatursteuerung aus
    fs: '0',              // kein Vollscreen-Button
    enablejsapi: '1',     // nötig, damit sich die API attachen kann
    origin: window.location.origin,
  });

  const iframe = document.createElement('iframe');
  iframe.id = 'yt-player-iframe';
  iframe.title = 'Musik — Bee Gees, More Than a Woman';
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + VIDEO_ID + '?' + params.toString();
  iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');

  dom.videoContainer.appendChild(iframe);
}

// 🎵-Klick = Einwilligung + Start (der iframe geht in DIESER Geste raus)
function starteMusik() {
  if (musikFehlgeschlagen) return; // onError: ohne Musik weitermachen

  // Video-Layer langsam einblenden (schwarze Fläche → sichtbares Video)
  dom.videoContainer.classList.add('video-hintergrund--sichtbar');

  // 1. iframe sofort einsetzen → Ton startet mit dieser Geste
  baueYoutubeIframe();

  // 2. iframe-API parallel laden → attacht sich, sobald bereit
  ladeYoutubeApi();

  // 3. API schon da & Player attached (z. B. erneuter 🎵-Klick):
  //    dann direkt wieder/starten (hier gilt die FRISCHE Nutzergeste)
  if (player) {
    player.setVolume(MUSIK_LAUTSTAERKE);
    player.playVideo();
  }

  // Fallback: kommt innerhalb von 2 Sek. keine Wiedergabe, 🎵-Button sichtbar lassen
  pruefeWiedergabe();
}

// Attach fertig: Lautstärke setzen; läuft der Ton schon → Button/Hinweis weg
function beiPlayerBereit(event) {
  event.target.setVolume(MUSIK_LAUTSTAERKE);
  const YT = window.YT;
  if (YT && event.target.getPlayerState() === YT.PlayerState.PLAYING) {
    dom.musikButton.hidden = true;
    dom.musikHinweis.hidden = true;
  }
}

function beiStatuswechsel(event) {
  const YT = window.YT;
  if (!YT) return;
  if (event.data === YT.PlayerState.PLAYING) {
    dom.musikButton.hidden = true;   // Musik läuft → 🎵-Button im Menü weg
    dom.musikHinweis.hidden = true;  // Hinweis gehört zum Button
  }
  // Schleife absichern: falls „loop" von YouTube ignoriert wird, von vorn starten
  if (event.data === YT.PlayerState.ENDED) {
    event.target.seekTo(0);
    event.target.playVideo();
  }
}

// onError des Videos: Seite läuft ohne Musik weiter (Sterne + Glitzer),
// 🎵-Button ausblenden (Starten hätte keinen Erfolg).
function beiPlayerFehler() {
  musikFehlgeschlagen = true;
  dom.musikButton.hidden = true;
  dom.musikHinweis.hidden = true;
}

// Prüft nach 2 Sekunden, ob wirklich Musik läuft; sonst 🎵-Button sichtbar
// lassen (klemmender Start, besonders iPhone/Safari).
function pruefeWiedergabe() {
  setTimeout(() => {
    if (musikFehlgeschlagen) return;
    const zustand = player && typeof player.getPlayerState === 'function'
      ? player.getPlayerState() : -1;
    // Zustand 1 (PLAYING) oder 3 (BUFFERING) heißt: Video ist unterwegs
    if (zustand !== 1 && zustand !== 3) {
      dom.musikButton.hidden = false;
      dom.musikHinweis.hidden = false;
    }
  }, FALLBACK_TIMEOUT_MS);
}

// 🎵-Musik-Button im Menü verdrahten (jeder Klick = Einwilligung + Start)
function verdrahteMusikButton() {
  dom.musikButton.addEventListener('click', starteMusik);
}


/* ============================================================
   STERNE / PARTIKEL — zufälliges Funkeln im Hintergrund
   ============================================================ */
function baueSterne() {
  const container = document.getElementById('sterne');

  // prefers-reduced-motion respektieren: keine animierten Partikel
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!container) return;

  // 110 Sterne, einzelne davon spürbar größer (Auge fällt drauf beim Scrollen)
  const anzahl = 110;
  for (let i = 0; i < anzahl; i++) {
    const stern = document.createElement('span');
    const gross = Math.random() < 0.15;
    const groesse = gross ? (Math.random() * 2.2 + 3) : (Math.random() * 1.6 + 1.2);
    if (gross) stern.classList.add('stern--gross');
    stern.className = 'stern';
    stern.style.width  = groesse + 'px';
    stern.style.height = groesse + 'px';
    stern.style.left   = Math.random() * 100 + '%';
    stern.style.top    = Math.random() * 100 + '%';
    stern.style.animationDuration = (Math.random() * 4 + 3) + 's';
    stern.style.animationDelay    = (Math.random() * 6) + 's';
    container.appendChild(stern);
  }
}


/* ============================================================
   GLITZER-SPUR — Goldfunken folgen Finger/Cursor (Studio-54-Wow)
   ============================================================ */
// Gedrosselt (max. 1 Startpartikel pro 15 ms, max. 150 gleichzeitig),
// damit Wischen/Scrollen trotzdem flüssig bleibt — Partikel sind billig
// (nur transform/opacity-Animation) und sterben nach ~1 s weg.
let letzteGlitzerZeit = 0;
let glitzerAnzahl    = 0;
const GLITZER_MAX     = 150;
const GLITZER_PAUSE_MS = 15;

function initialisiereGlitzerSpur() {
  // prefers-reduced-motion respektieren: keine Partikel-Werfer
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const spur = document.createElement('div');
  spur.className = 'glitzer-spur';
  spur.setAttribute('aria-hidden', 'true');
  document.body.appendChild(spur);
  dom.glitzerSpur = spur;

  // Tap/Touchstart: kleiner Burst um die Berührung (Wow auch ohne Wischen)
  document.addEventListener('touchstart', (ereignis) => {
    const touche = ereignis.touches[0];
    if (touche) glitzerBurst(touche.clientX, touche.clientY, 8, 90);
  }, { passive: true });

  document.addEventListener('touchmove', (ereignis) => {
    const touche = ereignis.touches[0];
    if (touche) baueGlitzer(touche.clientX, touche.clientY);
  }, { passive: true });

  document.addEventListener('mousemove', (ereignis) => {
    baueGlitzer(ereignis.clientX, ereignis.clientY);
  }, { passive: true });

  // Ambient-Funken: alle ~2,2 s glitzernt es von selbst irgendwo —
  // damit zwischen zwei Swipes nicht Funkstille herrscht.
  setInterval(() => {
    glitzerBurst(
      Math.random() * window.innerWidth,
      Math.random() * window.innerHeight,
      Math.random() * 4 + 3,
      70
    );
  }, 2200);
}

function baueGlitzer(x, y) {
  if (glitzerAnzahl >= GLITZER_MAX) return;
  const jetz = Date.now();
  if (jetz - letzteGlitzerZeit < GLITZER_PAUSE_MS) return;
  letzteGlitzerZeit = jetz;

  // Hauptfunke + 1-3 Begleitfunken (dichte, breite Spur)
  baueFunke(x, y, Math.random() * 6 + 6);
  if (Math.random() < 0.9) baueFunke(x + rndOff(), y + rndOff(), Math.random() * 5 + 4);
  if (Math.random() < 0.7) baueFunke(x + rndOff(), y + rndOff(), Math.random() * 5 + 4);
  if (Math.random() < 0.4) baueFunke(x + rndOff(), y + rndOff(), Math.random() * 5 + 4);
}

// Zufalls-Versatz im Umkreis (für Begleitfunken rund um die Spur)
function rndOff() {
  return Math.random() * 56 - 28;
}

// Mehrere Funken auf einmal im Umkreis von `radius` px um (x, y) —
// für Tap-Bursts und zufällige Ambient-Funker.
function glitzerBurst(x, y, anzahl, radius) {
  for (let i = 0; i < anzahl; i++) {
    baueFunke(
      x + Math.random() * radius - radius / 2,
      y + Math.random() * radius - radius / 2,
      Math.random() * 6 + 4
    );
  }
}

function baueFunke(x, y, groesse) {
  if (glitzerAnzahl >= GLITZER_MAX) return;
  glitzerAnzahl++;

  const funke = document.createElement('span');
  funke.className = 'glitzer';
  if (Math.random() < 0.4) funke.classList.add('glitzer--weiss');

  funke.style.width  = groesse + 'px';
  funke.style.height = groesse + 'px';
  funke.style.left = x + 'px';
  funke.style.top  = y + 'px';

  // Flug-Richtung/Dauer als CSS-Variablen (Zufallsdrift + Blitzen)
  funke.style.setProperty('--dx', (Math.random() * 36 - 18) + 'px');
  funke.style.setProperty('--dy', (Math.random() * 36 - 18) + 'px');
  funke.style.setProperty('--dreh', (Math.random() * 360) + 'deg');
  funke.style.animationDuration = (Math.random() * 500 + 700) + 'ms';

  funke.addEventListener('animationend', () => {
    funke.remove();
    glitzerAnzahl--;
  });

  dom.glitzerSpur.appendChild(funke);
}


/* ============================================================
   GALERIE — die 2 Einladungsbilder der gewählten Sprache,
   groß übereinander gestapelt (kein Karussell).
   ============================================================ */
// Karten anderer Sprachen ausblenden (wird aus wendeSpracheAn() gerufen)
function aktualisiereGalerieSprache(lang) {
  dom.galerieStapel.querySelectorAll('.galerie__karte').forEach((karte) => {
    karte.hidden = karte.dataset.lang !== lang;
  });
}


/* ============================================================
   SCROLL-REVEAL — Abschnitte sanft einblenden (IntersectionObserver)
   ============================================================ */
function initialisiereScrollReveal() {
  const elemente = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    // Fallback: alle Elemente sofort sichtbar schalten
    elemente.forEach((el) => el.classList.add('reveal--sichtbar'));
    return;
  }
  const beobachter = new IntersectionObserver((eintraege) => {
    eintraege.forEach((eintrag) => {
      if (eintrag.isIntersecting) {
        eintrag.target.classList.add('reveal--sichtbar');
        beobachter.unobserve(eintrag.target);
      }
    });
  }, { threshold: 0.15 });

  elemente.forEach((el) => beobachter.observe(el));
}