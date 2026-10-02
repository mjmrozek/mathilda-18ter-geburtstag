/* ============================================================
   main.js — Logik für die Studio-54-Einladung
   ------------------------------------------------------------
   Ablauf beim Seitenaufruf (Zwei-Klick-Lösung, datenschutzkonform):
     1. Erst-Besuch: Nur das Sprach-Overlay ist sichtbar.
     2. Sprach-Auswahl → Musik-Consent-Screen. KEINE YouTube-Verbindung
        davor: iframe UND IFrame-API-Script werden erst nach
        ausdrücklicher Einwilligung dynamisch geladen.
     3. „Mit Musik feiern" = Einwilligung + Nutzergeste:
        youtube-nocookie.com-iframe, Start MIT Ton, danach blendet
        das Einladungsbild sanft ein. / „Ohne Musik weiter" reine
        CSS-Disco-Visuals; der Sound-Button startet später
        (jeder Klick darauf = Einwilligung).
     4. Fallback: kommt innerhalb von 2 Sek. kein Wiedergabe-Event,
        erscheint der Button „Musik starten".
     5. Wieder-Besuch: kein Overlay, Musik startet NIE automatisch.
   ============================================================ */

'use strict';

/* ============================================================
   KONSTANTEN — zentrale Anpassungen ganz oben
   ============================================================ */
const VIDEO_ID           = 'uQ9_MwZIaoc'; // Bee Gees – "More Than a Woman"
const MUSIK_LAUTSTAERKE  = 50;            // Lautstärke in Prozent
const FALLBACK_TIMEOUT_MS   = 2000;       // Wartezeit bis zum Musik-Fallback-Button
const HERO_BILD_VERZOEGERUNG_MS = 1500;   // Verzögerung bis zum Hero-Bild-Einblenden
const STORAGE_SCHLUESSEL = 'mathilda18_sprache';       // Sprachwahl
const STORAGE_CONSENT    = 'mathilda18_musicConsent';  // Musik-Einwilligung ('ja' | 'nein')

// Google-Maps-Ziel für den Orts-Link
const MAPS_ZIEL = 'https://www.google.com/maps/search/?api=1&query=An+d.+Neuen+M%C3%BChle+22%2C+47447+Moers-Kapellen';

// RSVP: hier später einbauen


/* ============================================================
   ZUSTAND
   ============================================================ */
let player = null;            // YouTube-Player-Instanz (wird erst bei Bedarf erzeugt)
let ytApiBereit = false;      // Merker: IFrame-API geladen?
let ytApiLaeuft  = false;     // Merker: API-Script wird gerade geladen (Doppelstart verhindern)
let startAusstehend = false;  // Start-Wunsch, bevor die API bereit war (Start nachholen)
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
  dom.sprachwahlButton = document.getElementById('sprachwahl-button');
  dom.musikFallback   = document.getElementById('musik-fallback');
  dom.musikConsent    = document.getElementById('musik-consent');
  dom.consentJa       = document.getElementById('consent-ja');
  dom.consentNein     = document.getElementById('consent-nein');
  dom.heroFigure      = document.getElementById('hero-figure');
  dom.heroBild        = document.getElementById('hero-bild');
  dom.videoContainer  = document.getElementById('video-hintergrund');
  dom.galerieStapel   = document.getElementById('galerie-stapel');

  baueSterne();
  verdrahteSprachButtons();
  verdrahteConsentButtons();
  verdrahteAudioButtons();
  initialisiereScrollReveal();

  // Start-Sprache festlegen: URL-Parameter ?lang=… schlägt localStorage
  const urlSprache = ladeSpracheAusUrl();
  const gespeicherteSprache = urlSprache || ladeSpracheAusSpeicher();
  const consent = ladeConsent();

  if (gespeicherteSprache && consent) {
    // Wieder-Besuch: direkt auf der Seite — KEIN Overlay, KEIN Musik-Autoplay
    wendeSpracheAn(gespeicherteSprache);
    starteSeite(true); // Hero-Bild sofort zeigen, Sound-Button zum Nachstarten offerieren
  } else if (gespeicherteSprache) {
    // Sprache bekannt, Einwilligung aber noch offen (z. B. alte Version):
    // direkt zum Consent-Screen (Sprach-Overlay wird übersprungen)
    wendeSpracheAn(gespeicherteSprache);
    zeigeConsentOverlay();
  } else {
    // Erster Besuch: Sprach-Overlay zeigen, Sound-Button noch versteckt
    dom.sprachOverlay.hidden = false;
    document.body.classList.add('overlay-offen'); // kein Scrollen über das Overlay hinweg
  }
}

// Nach der Consent-Entscheidung: Buttons einsetzen + Hero-Bild einblenden.
// Die Musik startet NICHT hier (kein Autoplay!), sondern nur durch den
// Consent-Klick oder durch den späteren Sound-Button.
function starteSeite(heroSofort) {
  dom.soundButton.hidden = false;
  dom.sprachwahlButton.hidden = false;
  aktualisiereSoundButton();
  if (heroSofort) heroBildAnzeigen(); else heroBildVerzoegertZeigen();
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

// Sprach-Buttons verdrahten: Sprache speichern + zum Musik-Consent-Screen.
// (Die Musik startet hier bewusst NICHT mehr — Erst-Einwilligung kommt im
// nächsten Schritt: „Mit Musik feiern" / „Ohne Musik weiter".)
function verdrahteSprachButtons() {
  dom.sprachButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const lang = button.dataset.sprache;
      speichereSprache(lang);
      sprachOverlayVerstecken();
      wendeSpracheAn(lang);
      zeigeConsentOverlay();
    });
  });
}

// Musik-Einwilligung aus dem localStorage lesen: 'ja', 'nein' oder null
function ladeConsent() {
  try {
    const wert = localStorage.getItem(STORAGE_CONSENT);
    if (wert === 'ja' || wert === 'nein') return wert;
  } catch (e) { /* Speicher blockiert – ignorieren */ }
  return null;
}

// Musik-Einwilligung speichern ('ja' | 'nein')
function speichereConsent(wert) {
  try { localStorage.setItem(STORAGE_CONSENT, wert); } catch (e) { /* ignorieren */ }
}

// Consent-Screen zeigen (Scrollsperre an; Texte sind via data-i18n schon passend)
function zeigeConsentOverlay() {
  document.body.classList.add('overlay-offen');
  dom.musikConsent.hidden = false;
  dom.musikConsent.classList.remove('sprach-overlay--ausblenden');
}

// Consent-Screen schließen: Scroll wieder freigeben, Buttons einsetzen
function schliesseConsent(heroSofort) {
  document.body.classList.remove('overlay-offen');
  dom.musikConsent.classList.add('sprach-overlay--ausblenden');
  setTimeout(() => { dom.musikConsent.hidden = true; }, 600);
  starteSeite(heroSofort);
}

// Die zwei Consent-Buttons verdrahten
function verdrahteConsentButtons() {
  dom.consentJa.addEventListener('click', () => {
    // EINWILLIGUNG + NUTZERGESTE in einem Klick:
    speichereConsent('ja');
    schliesseConsent(false);     // Hero-Bild blendet nach dem Start sanft ein
    starteMusik();               // direkt im Klick-Handler → Player mit Ton
  });

  dom.consentNein.addEventListener('click', () => {
    // Ohne Musik weiterlaufen; Sound-Button kann später starten = Einwilligung
    speichereConsent('nein');
    schliesseConsent(false);
  });
}

// Overlay ausblenden; Hero-Inhalt wird sichtbar, Scrollen wieder frei
function sprachOverlayVerstecken() {
  document.body.classList.remove('overlay-offen');
  dom.sprachOverlay.classList.add('sprach-overlay--ausblenden');
  setTimeout(() => { dom.sprachOverlay.hidden = true; }, 600);
}

// Overlay wieder zeigen („↩ Zurück zur Sprachauswahl“);
// die Musik läuft dabei einfach weiter
function zeigeSprachAuswahl() {
  document.body.classList.add('overlay-offen');
  dom.sprachOverlay.hidden = false;
  dom.sprachOverlay.classList.remove('sprach-overlay--ausblenden');
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
  // Falls schon ein Start gewünscht war, bevor die API fertig war:
  if (startAusstehend) {
    startAusstehend = false;
    starteMusik();
  }
};

// IFrame-API-Script DYNAMISCH nachladen — erst nach musikalischer
// Einwilligung baut die Seite überhaupt die erste YouTube-Verbindung
// (Datenkontakt via Script + iframe erst in diesem Moment).
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
    // Player existiert schon (z. B. über den Sound-Button erneut gestartet)
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
    if (!player) {
      // Jeder Start über diesen Button = musikalische Einwilligung
      speichereConsent('ja');
      istStumm = false;
      aktualisiereSoundButton();   // Sofort-Feedback: Icon springt auf 🔊
      starteMusik();               // falls der Start klemmt, greift der
      return;                      // Fallback-Check nach 2 Sek.
    }
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

  // „↩ Zurück zur Sprachauswahl“ → Overlay erneut öffnen (ohne Reload)
  dom.sprachwahlButton.addEventListener('click', zeigeSprachAuswahl);
}

// Icon + aria-Label des Sound-Buttons aktualisieren.
// Durchgestrichen (🔇), solange KEINE Musik läuft oder stumm geschaltet ist;
// offener Lautsprecher (🔊), sobald Ton zu hören ist.
function aktualisiereSoundButton() {
  if (!dom.soundButton || dom.soundButton.hidden) return;
  const lauft = !!player && !istStumm && !musikFehlgeschlagen;
  const icon = lauft ? '🔊' : '🔇';
  if (dom.soundButton.textContent !== icon) dom.soundButton.textContent = icon;
  const lang = document.documentElement.lang || 'de';
  dom.soundButton.setAttribute('aria-label',
    uebersetzung(lang, lauft ? 'sound_aus_aria' : 'sound_an_aria') || '');
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