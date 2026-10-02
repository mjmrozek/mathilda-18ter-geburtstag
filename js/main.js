/* ============================================================
   main.js — Logik für die Studio-54-Einladung
   ------------------------------------------------------------
   Ablauf beim Seitenaufruf:
     1. Nur das Sprach-Overlay ist sichtbar (falls keine Sprache
        gespeichert ist und kein ?lang=-Parameter gesetzt wurde).
     2. Der Klick auf eine Sprache startet (Nutzergeste!) das
        YouTube-Video als Vollbild-Hintergrund MIT Ton.
     3. Ca. 1,5 Sek. nach dem Start blendet das erste
        Einladungsbild sanft in die Bildmitte ein.
     4. Fallback: Kommt innerhalb von 2 Sek. kein Wiedergabe-
        Event, erscheint der Button „Musik starten".
   ============================================================ */

'use strict';

/* ============================================================
   KONSTANTEN — zentrale Anpassungen ganz oben
   ============================================================ */
const VIDEO_ID           = 'uQ9_MwZIaoc'; // Bee Gees – "More Than a Woman"
const MUSIK_LAUTSTAERKE  = 50;            // Lautstärke in Prozent
const FALLBACK_TIMEOUT_MS   = 2000;       // Wartezeit bis zum Musik-Fallback-Button
const HERO_BILD_VERZOEGERUNG_MS = 1500;   // Verzögerung bis zum Hero-Bild-Einblenden
const STORAGE_SCHLUESSEL = 'mathilda18_sprache'; // localStorage-Schlüssel für die Sprachwahl

// Google-Maps-Ziel für den Orts-Link
const MAPS_ZIEL = 'https://www.google.com/maps/search/?api=1&query=An+d.+Neuen+M%C3%BChle+22%2C+47447+Moers-Kapellen';

// RSVP: hier später einbauen


/* ============================================================
   ZUSTAND
   ============================================================ */
let player = null;            // YouTube-Player-Instanz (wird erst bei Bedarf erzeugt)
let ytApiBereit = false;      // Merker: IFrame-API geladen?
let startAusstehend = false;  // Sprach-Klick, bevor die API bereit war (Start nachholen)
let musikAktiv = false;       // Läuft gerade Ton?
let istStumm = false;         // Merker für den 🔊/🔇-Button
let musikFehlgeschlagen = false; // onError → Seite läuft ohne Musik weiter
let heroBildGezeigt = false;  // Hero-Bild schon eingeblendet?

// DOM-Referenzen (in initialisiere() gefüllt)
const dom = {};


/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', initialisiere);

function initialisiere() {
  dom.sprachOverlay   = document.getElementById('sprach-overlay');
  dom.sprachButtons   = document.querySelectorAll('.sprach-button');
  dom.soundButton     = document.getElementById('sound-button');
  dom.musikFallback   = document.getElementById('musik-fallback');
  dom.heroFigure      = document.getElementById('hero-figure');
  dom.heroBild        = document.getElementById('hero-bild');
  dom.videoContainer  = document.getElementById('video-hintergrund');
  dom.carouselSpur    = document.getElementById('carousel-spur');
  dom.carouselPunkte  = document.getElementById('carousel-punkte');

  baueSterne();
  verdrahteSprachButtons();
  verdrahteAudioButtons();
  initialisiereCarousel();
  initialisiereScrollReveal();

  // Start-Sprache festlegen: URL-Parameter ?lang=… schlägt localStorage
  const urlSprache = ladeSpracheAusUrl();
  const gespeicherteSprache = ladeSpracheAusSpeicher();

  if (urlSprache) {
    // Sprache per URL erzwungen (praktisch zum Testen) → Overlay überspringen
    wendeSpracheAn(urlSprache);
    // Kein Video-Autoplay: nur der 🔊-Button oben rechts zum Nachstarten
    dom.soundButton.hidden = false;
    aktualisiereSoundButton();
    heroBildAnzeigen();
  } else if (gespeicherteSprache) {
    // Erneuter Besuch: kein Overlay, Video NICHT automatisch starten
    wendeSpracheAn(gespeicherteSprache);
    dom.soundButton.hidden = false;
    aktualisiereSoundButton();
    heroBildAnzeigen();
  } else {
    // Erster Besuch: Sprach-Overlay zeigen, Sound-Button noch versteckt
    dom.sprachOverlay.hidden = false;
  }
}


/* ============================================================
   SPRACHSYSTEM
   ============================================================ */

// URL-Parameter ?lang=de/en/pl auslesen
function ladeSpracheAusUrl() {
  try {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param && UEBERSETZUNGEN[param]) return param;
  } catch (e) { /* URLSearchParams nicht verfügbar – ignorieren */ }
  return null;
}

// Gespeicherte Sprache aus dem localStorage lesen (fehlerfest verpackt)
function ladeSpracheAusSpeicher() {
  try {
    const wert = localStorage.getItem(STORAGE_SCHLUESSEL);
    if (wert && UEBERSETZUNGEN[wert]) return wert;
  } catch (e) { /* Speicher blockiert (z. B. Privater Modus) – ignorieren */ }
  return null;
}

// Sprache im localStorage speichern
function speichereSprache(lang) {
  try { localStorage.setItem(STORAGE_SCHLUESSEL, lang); } catch (e) { /* ignorieren */ }
}

// Sprach-Buttons verdrahten — der Klick startet DIREKT die Musik (Nutzergeste!)
function verdrahteSprachButtons() {
  dom.sprachButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const lang = button.dataset.sprache;
      speichereSprache(lang);
      sprachOverlayVerstecken();
      wendeSpracheAn(lang);
      dom.soundButton.hidden = false;   // Sound-Button ab jetzt fix oben rechts
      aktualisiereSoundButton();
      starteMusik(); // playVideo() direkt im Klick-Handler → Browser erlaubt Ton
      heroBildVerzoegertZeigen();
    });
  });
}

// Overlay ausblenden; Hero-Inhalt wird sichtbar
function sprachOverlayVerstecken() {
  dom.sprachOverlay.classList.add('sprach-overlay--ausblenden');
  setTimeout(() => { dom.sprachOverlay.hidden = true; }, 600);
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

  aktualisiereSoundButton();
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
  // Falls schon auf eine Sprache geklickt wurde, bevor die API fertig war:
  if (startAusstehend) {
    startAusstehend = false;
    starteMusik();
  }
};

// Player erzeugen + sofort abspielen (innerhalb der Nutzergeste!)
function starteMusik() {
  if (musikFehlgeschlagen) return; // onError: ohne Musik weitermachen

  if (!ytApiBereit) {
    startAusstehend = true; // Start nachholen, sobald die API bereit ist
    return;
  }

  // Video-Layer langsam einblenden (schwarze Fläche → sichtbares Video)
  dom.videoContainer.classList.add('video-hintergrund--sichtbar');

  if (player) {
    // Player existiert schon (z. B. über den Sound-Button erneut gestartet)
    player.setVolume(MUSIK_LAUTSTAERKE);
    player.playVideo();
    pruefeWiedergabe();
    return;
  }

  player = new YT.Player('yt-player', {
    videoId: VIDEO_ID,
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

  // Fallback: kommt innerhalb von 2 Sek. keine Wiedergabe, Helper-Button zeigen
  pruefeWiedergabe();
}

// (Warten auf die API übernimmt onYouTubeIframeAPIReady per Callback)

function beiPlayerBereit(event) {
  event.target.setVolume(MUSIK_LAUTSTAERKE);
  event.target.playVideo();
}

function beiStatuswechsel(event) {
  const YT = window.YT;
  if (!YT) return;
  if (event.data === YT.PlayerState.PLAYING) {
    musikAktiv = true;
    istStumm = false;
    dom.musikFallback.hidden = true;   // Fallback-Button nicht mehr nötig
    aktualisiereSoundButton();
  }
  // Schleife absichern: falls „loop" von YouTube ignoriert wird, von vorn starten
  if (event.data === YT.PlayerState.ENDED) {
    event.target.seekTo(0);
    event.target.playVideo();
  }
}

// onError des Videos: Seite läuft ohne Musik weiter (Discokugel + Glitzer),
// Sound-Button und Fallback-Button ausblenden.
function beiPlayerFehler() {
  musikFehlgeschlagen = true;
  if (dom.musikFallback) dom.musikFallback.hidden = true;
  if (dom.soundButton) dom.soundButton.hidden = true;
}

// Prüft nach 2 Sekunden, ob wirklich Musik läuft; sonst Fallback-Button zeigen
function pruefeWiedergabe() {
  setTimeout(() => {
    if (musikFehlgeschlagen) return;
    const zustand = player && typeof player.getPlayerState === 'function'
      ? player.getPlayerState() : -1;
    // Zustand 1 (PLAYING) oder 3 (BUFFERING) heißt: Video ist unterwegs
    if (zustand !== 1 && zustand !== 3) {
      dom.musikFallback.hidden = false;
      dom.soundButton.hidden = false;
    }
  }, FALLBACK_TIMEOUT_MS);
}

// 🔊/🔇-Button oben rechts:
//   – startet die Musik, wenn sie (noch) nicht läuft (z. B. erneuter Besuch)
//   – schaltet ansonsten Ton an/aus
function verdrahteAudioButtons() {
  dom.soundButton.addEventListener('click', () => {
    if (!player) { starteMusik(); return; }
    if (istStumm) {
      player.unMute();
      player.setVolume(MUSIK_LAUTSTAERKE);
      istStumm = false;
    } else {
      player.mute();
      istStumm = true;
    }
    aktualisiereSoundButton();
  });

  dom.musikFallback.addEventListener('click', () => {
    dom.musikFallback.hidden = true;
    starteMusik();
  });
}

// Icon + aria-Label des Sound-Buttons aktualisieren
function aktualisiereSoundButton() {
  if (!dom.soundButton || dom.soundButton.hidden) return;
  const lang = document.documentElement.lang || 'de';
  dom.soundButton.textContent = istStumm ? '🔇' : '🔊';
  dom.soundButton.setAttribute('aria-label',
    uebersetzung(lang, istStumm ? 'sound_an_aria' : 'sound_aus_aria') || '');
}


/* ============================================================
   HERO-BILD — ca. 1,5 Sek. nach dem Start sanft einblenden
   ============================================================ */
function heroBildVerzoegertZeigen() {
  if (heroBildGezeigt) return;
  heroBildGezeigt = true;
  setTimeout(() => heroBildAnzeigen(), HERO_BILD_VERZOEGERUNG_MS);
}

// Bild einblenden: Glow + Scale + Fade (CSS-Animation .hero__bild--einblenden)
function heroBildAnzeigen() {
  if (!dom.heroFigure) return;
  if (dom.heroFigure.hidden) dom.heroFigure.hidden = false;
  requestAnimationFrame(() => {
    dom.heroFigure.classList.add('hero__bildeinbettung--sichtbar');
    dom.heroBild.classList.add('hero__bild--einblenden');
  });
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
   CAROUSEL — horizontales Scrollen (Swipe auf Mobil) + Punkte.
   Sichtbar sind nur die 2 Karten der gewählten Sprache
   (Filter in aktualisiereGalerieSprache()).
   ============================================================ */
function initialisiereCarousel() {
  // Navigations-Punkte erzeugen (einmalig für alle sichtbaren Karten)
  baueCarouselPunkte();

  // Aktiven Punkt beim Scrollen bestimmen (entprellt)
  let scrollTimeout = null;
  dom.carouselSpur.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(aktualisiereCarouselPunkte, 80);
  });
}

// Galerie auf die gewählte Sprache eingrenzen: Karten anderer
// Sprachen ausblenden, Punkte neu aufbauen, scroll zurück zum Anfang.
function aktualisiereGalerieSprache(lang) {
  dom.carouselSpur.querySelectorAll('.carousel__karte').forEach((karte) => {
    karte.hidden = karte.dataset.lang !== lang;
  });
  dom.carouselSpur.scrollTo({ left: 0 });
  baueCarouselPunkte();
}

// Navigations-Punkte für alle aktuell sichtbaren Karten neu erzeugen
function baueCarouselPunkte() {
  dom.carouselPunkte.innerHTML = '';
  const sichtbareKarten = sichtbareCarouselKarten();

  sichtbareKarten.forEach((karte, index) => {
    const punkt = document.createElement('button');
    punkt.type = 'button';
    punkt.className = 'carousel__punkt';
    punkt.setAttribute('aria-label', 'Karte ' + (index + 1));
    punkt.addEventListener('click', () => {
      dom.carouselSpur.scrollTo({ left: karte.offsetLeft - dom.carouselSpur.offsetLeft, behavior: 'smooth' });
    });
    dom.carouselPunkte.appendChild(punkt);
  });

  aktualisiereCarouselPunkte();
}

// Helfer: nur nicht-ausgeblendete Karten
function sichtbareCarouselKarten() {
  return Array.from(dom.carouselSpur.querySelectorAll('.carousel__karte'))
    .filter((karte) => !karte.hidden);
}

function aktualisiereCarouselPunkte() {
  const spur = dom.carouselSpur;
  const karten = sichtbareCarouselKarten();
  let punkte = Array.from(dom.carouselPunkte.querySelectorAll('.carousel__punkt'));

  if (!karten.length || punkte.length !== karten.length) {
    baueCarouselPunkte();
    punkte = Array.from(dom.carouselPunkte.querySelectorAll('.carousel__punkt'));
  }

  // Karte, deren Mitte am nächsten an der viewport-Mitte liegt, gilt als aktiv
  const mitte = spur.scrollLeft + spur.clientWidth / 2;
  let aktiv = 0;
  let kleinsterAbstand = Infinity;

  karten.forEach((karte, index) => {
    const zentrum = karte.offsetLeft - spur.offsetLeft + karte.offsetWidth / 2;
    const abstand = Math.abs(zentrum - mitte);
    if (abstand < kleinsterAbstand) {
      kleinsterAbstand = abstand;
      aktiv = index;
    }
  });

  punkte.forEach((punkt, index) => {
    punkt.classList.toggle('carousel__punkt--aktiv', index === aktiv);
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