/* ============================================================
   intro.js — „Trailer"-Intro VOR der bestehenden Seite
   ------------------------------------------------------------
   Unabhängiges Eigenleben: baut sich den schwarzen #intro-Layer
   SELBST in den body (das index.html wird nur um die eine
   Script-Zeile ergänzt — kein bestehender Code wird berührt!).

   Ablauf:
     1. Schwarzer Vollbild-Layer (id="intro", z-index ganz oben)
        mit einzelnem pulsierendem goldenen Herz ♥ als Start-Button.
     2. Klick/Tap auf das Herz → Trailer (jeder Schritt ca. 2,5 s,
        Fade/Scale, über schwarzem Grund, zentriert):
          „2027" → „23.01." → „19:00" → „MATHILDA 18" (+ „★ PARTY ★")
        Herzschlag-Sound (Web Audio API, „lub-dub"-Loop) startet
        MIT dem Herz-Klick (kein Ton davor!) und pochend im
        Herzschlag-Rhythmus synchron mit den Texten.
     3. Fade-out des Layers → Seite genau wie bisher.
   SKIP: Tippen irgendwo auf den Trailer oder das „✕" oben rechts
   überspringt sofort — Sound stoppt, Seite erscheint.
   Kein Ton vor dem Herz-Klick (Web-Audio-Context entsteht erst in
   dieser Nutzergeste — auch für iOS/Safari nötig).
   ============================================================ */

'use strict';

/* ============================================================
   KONSTANTEN — Trailer-Schritte (letzter Eintrag = große Finale-
   Zweiseiten-Ansicht: Wort + Zahl + „★ PARTY ★")
   ============================================================ */
const INTRO_SEQUENCE = ['2027', '23.01.', '19:00', 'MATHILDA 18'];

const INTRO_SCHRITT_MS = 2600;   // Anzeigedauer pro Trailer-Schritt
const INTRO_FINALE_MS  = 2400;   // Anzeigedauer des Finales vor dem Fade-out
const INTRO_HERZ_RHYTHMUS = 1000; // lub-dub-Paar alle X ms (Schritt 1)
const INTRO_SCHNELLER_RHYTHMUS = 780; // Puls leicht schneller (Schritte 2/3)
const INTRO_FUNKEN_ANZAHL = 46;  // Gold-Glitzer-Funken im Finale

/* ============================================================
   ZUSTAND (lokal, kollidert mit nichts im main.js)
   ============================================================ */
let introBuehne  = null;   // Container für die Trailer-Schritte
let introHinweisElement = null; // „✕"-Skip-Button
let introTrailerLaueft  = false; // Herz schon geklickt?
let introFertig         = false; // beendet — ignorier weitere Klicks
let introAudioCtx   = null;   // Web-Audio-Context (erst nach Herz-Klick)
let introMaster     = null;   // Master-Gain (moderater Pegel)
let introHerzTimer  = null;   // Timeout des lub-dub-Loops
let introHerzPause  = INTRO_HERZ_RHYTHMUS;
let introZeitgeber  = [];     // alle setTimeout-Handles (Skip räumt auf)

/* ============================================================
   BOOT — Layer SOFORT bauen (Script liegt am Ende von body,
   kein warten aufs DOMContentLoaded → kein Aufblitzen der Seite)
   ============================================================ */
(function baueIntroLayer() {
  const layer = document.createElement('div');
  layer.id = 'intro';
  layer.setAttribute('aria-label', 'Intro — für den Trailer tippen');

  // Einziger Inhalt im Schritt 1: das pulsierende Herz (kein Text)
  const herz = document.createElement('button');
  herz.type = 'button';
  herz.className = 'intro-herz';
  herz.textContent = '♥';
  herz.setAttribute('aria-label', 'Trailer starten');
  herz.addEventListener('click', (ereignis) => {
    ereignis.stopPropagation(); // nicht als Skip-Tap gewertet
    starteTrailer();
  });

  layer.appendChild(herz);
  layer.addEventListener('click', (ereignis) => {
    // Tap irgendwo auf den Trailer = SKIP (Herz-Klick steigt oben aus)
    if (introTrailerLaueft) skippeTrailer();
  });
  document.body.appendChild(layer);
  document.body.classList.add('intro-aktiv'); // Scrollfix während des Intros
})();

/* ============================================================
   TRAILER — Herz-Klick: Sound an, ✕ rein, Schritte abspielen
   ============================================================ */
function starteTrailer() {
  if (introTrailerLaueft || introFertig) return;
  introTrailerLaueft = true;

  const reduziert = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Herz sanft ausblenden, dann entfernen
  const herz = document.querySelector('.intro-herz');
  if (herz) {
    herz.classList.add('intro-herz--weg');
    introSpaeter(() => herz.remove(), reduziert ? 0 : 600);
  }

  // Skip-„✕" oben rechts (mit Safe-Area-Abstand — Pflicht!)
  const skip = document.createElement('button');
  introHinweisElement = skip;
  skip.type = 'button';
  skip.className = 'intro-skip';
  skip.textContent = '✕';
  skip.setAttribute('aria-label', 'Intro überspringen');
  skip.addEventListener('click', (ereignis) => {
    ereignis.stopPropagation();
    skippeTrailer();
  });
  document.getElementById('intro').appendChild(skip);

  // Bühne für die Schritte (zentriert über schwarzem Grund)
  introBuehne = document.createElement('div');
  introBuehne.className = 'intro-buehne';
  document.getElementById('intro').appendChild(introBuehne);

  if (!reduziert) starteHerzschlag();

  // Schritte nacheinander — Schritt-Rhythmus + Herztempo zusammen steuern
  for (let i = 0; i < INTRO_SEQUENCE.length; i++) {
    const letzter = i === INTRO_SEQUENCE.length - 1;
    const start = i * INTRO_SCHRITT_MS;

    // Schritte 2/3: Puls leicht schneller (Sound + Text zusammen)
    if (!reduziert) {
      introSpaeter(() => {
        tempoSetzen(!letzter && i >= 1 ? INTRO_SCHNELLER_RHYTHMUS : INTRO_HERZ_RHYTHMUS);
      }, start);
    }

    introSpaeter(() => zeigeSchritt(INTRO_SEQUENCE[i], letzter), start);
  }

  // Nach dem Finale: Gold-Glitzer (bereits beim Schritt selbst angefangen),
  // hier der endgültige Fade-out zur Seite
  const gesamt = INTRO_SEQUENCE.length * INTRO_SCHRITT_MS + INTRO_FINALE_MS;
  introSpaeter(beendeIntro, gesamt);
}

/* ============================================================
   SCHRITTE — ein Text über schwarzem Grund, Fade/Scale (CSS)
   ============================================================ */
function zeigeSchritt(text, letzter) {
  // alten Schritt sanft raus (CSS-Klasse), neuen anlegen
  const alt = introBuehne.querySelector('.intro-schritt');
  if (alt) {
    alt.classList.add('intro-schritt--raus');
    introSpaeter(() => alt.remove(), 500);
  }

  const schritt = document.createElement('div');
  schritt.className = 'intro-schritt';

  if (letzter) {
    // Finale-Ansicht: MATHILDA groß mit 18, darunter klein „★ PARTY ★"
    schritt.classList.add('intro-schritt--finale');
    const teile = text.trim().split(/\s+/);
    const wort  = teile.slice(0, -1).join(' ') || text;
    const zahl  = teile[teile.length - 1];

    schritt.innerHTML =
      '<span class="intro-finale-wort">' + textOhneHtml(wort) + '</span>' +
      '<span class="intro-finale-zahl">' + textOhneHtml(zahl) + '</span>' +
      '<span class="intro-finale-party">★ BIRTHDAY PARTY ★</span>';

    // Letzter kräftiger Doppel-Schlag + Gold-Glitzer-Burst zum Finale
    introSpaeter(() => {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finaleHerzschlag();
        streueIntroFunken(schritt);
      }
    }, 700);
  } else {
    schritt.textContent = text;
  }

  introBuehne.appendChild(schritt);
}

/* minimaler Text-Schutz (Konstante ist safe, aber sauber bleibt sauber) */
function textOhneHtml(wert) {
  const box = document.createElement('span');
  box.textContent = wert;
  return box.innerHTML;
}

/* ============================================================
   GOLD-GLITZER im Finale (eigene Funkenklasse — eigenständig,
   unabhängig von der Glitzer-Spur des main.js)
   ============================================================ */
function streueIntroFunken(buehne) {
  for (let i = 0; i < INTRO_FUNKEN_ANZAHL; i++) {
    const funke = document.createElement('span');
    funke.className = 'intro-funke';
    const groesse = Math.random() * 9 + 5;
    funke.style.width  = groesse + 'px';
    funke.style.height = groesse + 'px';
    // um das Finale-Textzentrum gestreut (Ellipsen-Verstreutheit)
    funke.style.left = (35 + Math.random() * 30) + '%';
    funke.style.top  = (32 + Math.random() * 36) + '%';
    funke.style.setProperty('--fx', (Math.random() * 160 - 80) + 'px');
    funke.style.setProperty('--fy', (Math.random() * 160 - 80) + 'px');
    funke.style.setProperty('--fd', (Math.random() * 360) + 'deg');
    funke.style.animationDelay = (Math.random() * 550) + 'ms';
    funke.style.animationDuration = (Math.random() * 500 + 800) + 'ms';
    funke.addEventListener('animationend', () => funke.remove());
    buehne.appendChild(funke);
  }
}

/* ============================================================
   HERZSCHLAG-SOUND — Web Audio API, „lub-dub"-Loop
   (entsteht erst im Herz-Klick → Nutzergeste → kein Ton davor)
   ============================================================ */
function starteHerzschlag() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return; // ohne API: Trailer läuft still weiter

  introAudioCtx = new Ctx();
  introMaster = introAudioCtx.createGain();
  introMaster.gain.value = 0.32; // moderater Pegel
  introMaster.connect(introAudioCtx.destination);

  // iOS/Safari: Context entsteht hier IN der Nutzergeste — falls er
  // dennoch als „suspended" ankommt, jetzt aus der Geste heraus hochfahren
  if (introAudioCtx.state === 'suspended') {
    introAudioCtx.resume().catch(() => { /* still weiter laufen lassen */ });
  }

  herzDoppelschlag();
}

// Ein lub-dub-Paar: zwei dumpfe Töne kurz hintereinander; danach Looptimer
function herzDoppelschlag() {
  if (!introAudioCtx || introFertig) return;
  const zeit = introAudioCtx.currentTime + 0.02;
  introSchlag(zeit, 0.9);        // lub (kräftiger)
  introSchlag(zeit + 0.22, 0.65); // dub (leichter)
  introHerzTimer = setTimeout(herzDoppelschlag, introHerzPause);
}

// Einzelner dumpfer Herz-Ton: Sinus kurz runterziehend + Hüllkurve
function introSchlag(zeit, staerke) {
  const osc = introAudioCtx.createOscillator();
  const gain = introAudioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(58, zeit);
  osc.frequency.exponentialRampToValueAtTime(36, zeit + 0.16);
  gain.gain.setValueAtTime(0.0001, zeit);
  gain.gain.exponentialRampToValueAtTime(staerke, zeit + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, zeit + 0.2);
  osc.connect(gain);
  gain.connect(introMaster);
  osc.start(zeit);
  osc.stop(zeit + 0.26);
}

// Tempo umschalten (Puls wird leicht schneller) — Sound & CSS sync
function tempoSetzen(pause) {
  introHerzPause = pause;
  document.documentElement.style.setProperty('--intro-hz', pause + 'ms');
}

// Letzter kräftiger Doppel-Doppelschlag zum Finale (Loop pausiert dafür)
function finaleHerzschlag() {
  if (!introAudioCtx) return;
  clearTimeout(introHerzTimer);
  const zeit = introAudioCtx.currentTime + 0.02;
  for (const versatz of [0, 0.5]) {
    introSchlag(zeit + versatz, 1);         // lub — ganz kräftig
    introSchlag(zeit + versatz + 0.22, 0.8); // dub
  }
}

/* ============================================================
   ENDE — Sound stoppen, Layer ausblenden, Scrollfix lösen
   ============================================================ */
function skippeTrailer() { beendeIntro(); }

function beendeIntro() {
  if (introFertig) return;
  introFertig = true;

  // alle ausstehenden Zeitgeber abschalten (Sound-Loop, Schritte …)
  for (const handle of introZeitgeber) clearTimeout(handle);
  introZeitgeber = [];
  clearTimeout(introHerzTimer);

  // Sound stoppen (sauber: Pegel wegradieren, Context schließen)
  if (introAudioCtx) {
    try {
      introMaster.gain.cancelScheduledValues(introAudioCtx.currentTime);
      introMaster.gain.setValueAtTime(introMaster.gain.value, introAudioCtx.currentTime);
      introMaster.gain.linearRampToValueAtTime(0.0001, introAudioCtx.currentTime + 0.08);
      setTimeout(() => { try { introAudioCtx.close(); } catch (e) { /* egal */ } }, 150);
      setTimeout(() => { introAudioCtx = null; introMaster = null; }, 200);
    } catch (e) { /* Sound ist optional — Seite läuft weiter */ }
  }

  const layer = document.getElementById('intro');
  if (!layer) {
    document.body.classList.remove('intro-aktiv');
    return;
  }
  layer.classList.add('intro--weg'); // CSS-Fade-out .8 s
  setTimeout(() => {
    layer.remove();
    document.body.classList.remove('intro-aktiv');
  }, 900);
}

/* Hilfs-Timeout, das Skip/Ende mit in die Aufräumliste nimmt */
function introSpaeter(funktion, ms) {
  if (ms <= 0) { funktion(); return; }
  const handle = setTimeout(() => {
    if (introFertig) return; // nach Skip nichts mehr nachfunken
    funktion();
  }, ms);
  introZeitgeber.push(handle);
}