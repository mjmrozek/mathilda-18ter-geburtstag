/* ============================================================
   main.js — Logik für die Studio-54-Einladung
   ------------------------------------------------------------
   Ablauf beim Seitenaufruf:
     1. Direkt die Einladungsseite — auf Deutsch, ohne Overlays.
     2. Festes Menü oben (nie verschwindend): 🎵 Musik-Button
        und die zwei anderen Sprach-Buttons (z. B. English/Polski).
     3. 🎵-Klick = Einwilligung UND Nutzergeste in einem Klick:
        ERST DANN baut die Seite eine YouTube-Verbindung
        (iframe-API-Script + youtube-nocookie-iframe, dynamisch).
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
let player = null;               // YouTube-Player-Instanz (wird erst bei Bedarf erzeugt)
let ytApiBereit = false;         // Merker: IFrame-API geladen?
let ytApiLaeuft  = false;        // Merker: API-Script wird gerade geladen (Doppelstart verhindern)
let startAusstehend = false;     // Start-Wunsch, bevor die API bereit war (Start nachholen)
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
   ============================================================ */

// Wird von der IFrame-API aufgerufen, sobald sie geladen ist
window.onYouTubeIframeAPIReady = function () {
  ytApiBereit = true;
  // Falls schon ein Start gewünscht war, bevor die API fertig war:
  if (startAusstehend) {
    startAusstehend = false;
    starteMusik();
  }
};

// IFrame-API-Script DYNAMISCH nachladen — erst nach dem 🎵-Klick baut
// die Seite überhaupt die erste YouTube-Verbindung (Datenschutz:
// Datenkontakt via Script + iframe erst in diesem Moment).
function ladeYoutubeApi() {
  if (ytApiBereit || ytApiLaeuft) return;
  ytApiLaeuft = true;
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.async = true;
  document.head.appendChild(script);
}

// Player erzeugen + sofort abspielen (innerhalb der Nutzergeste!)
function starteMusik() {
  if (musikFehlgeschlagen) return; // onError: ohne Musik weitermachen

  if (!ytApiBereit) {
    startAusstehend = true; // Start nachholen, sobald die API bereit ist
    ladeYoutubeApi();
    return;
  }

  // Video-Layer langsam einblenden (schwarze Fläche → sichtbares Video)
  dom.videoContainer.classList.add('video-hintergrund--sichtbar');

  if (player) {
    // Player existiert schon (erneuter 🎵-Klick nach Pause o. ä.)
    player.setVolume(MUSIK_LAUTSTAERKE);
    player.playVideo();
    pruefeWiedergabe();
    return;
  }

  player = new YT.Player('yt-player', {
    videoId: VIDEO_ID,
    host: 'https://www.youtube-nocookie.com', // Datenschutzmodus: keine Tracking-Cookies
    playerVars: {
      autoplay: 1,          // direkt abspielen
      controls: 0,          // Bedienelemente verstecken
      loop: 1,              // Dauerschleife
      playlist: VIDEO_ID,   // nötig, damit loop mit der IFrame-API funktioniert
      playsinline: 1,       // mobil: inline statt im Fullscreen-Player
      rel: 0,               // keine Video-Empfehlungen am Ende
      modestbranding: 1,    // dezenteres YouTube-Branding
      iv_load_policy: 3,    // keine Karten-Anmerkungen
      disablekb: 1,         // Tastatursteuerung aus
      fs: 0,                // kein Vollscreen-Button
      mute: 0,              // MIT Ton starten
    },
    events: {
      onReady: beiPlayerBereit,
      onStateChange: beiStatuswechsel,
      onError: beiPlayerFehler,
    },
  });

  // Fallback: kommt innerhalb von 2 Sek. keine Wiedergabe, 🎵-Button sichtbar lassen
  pruefeWiedergabe();
}

function beiPlayerBereit(event) {
  event.target.setVolume(MUSIK_LAUTSTAERKE);
  event.target.playVideo();
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

// onError des Videos: Seite läuft ohne Musik weiter (Discokugel + Glitzer),
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

  const anzahl = 60;
  for (let i = 0; i < anzahl; i++) {
    const stern = document.createElement('span');
    const groesse = Math.random() * 2 + 1;
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