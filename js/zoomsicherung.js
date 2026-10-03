/* ============================================================
   zoomsicherung.js — Robustheit beim Browser-Pinch-Zoom
   (2026-10-03, isolierter Anhang nach dem intro.js-Muster:
   keine einzige Zeile Bestandscode wird angerührt.)

   Problem: iOS/WebKit (Safari AND alle In-App-Browser, z. B.
   WhatsApp!) zoomt mit zwei Fingern nur den sichtbaren Ausschnitt.
   Alle Elemente mit position: fixed (Menüleiste, Video-Hintergrund,
   Sterne, Goldfunken-Spur) wachsen NICHT mit — die für die
   1×-Ansicht gebaute Szenerie „fällt zusammen“/verdeckt den
   gezoomten Einladungsinhalt.

   Lösung: KEIN eigenes Zoom-Feature. Der Browser-Zoom bleibt
   einfach erlaubt — sobald der Besucher HINEINZOOMT, blenden wir
   nur die dekorativen fixen Ebenen sanft aus (CSS-Klasse
   body.seite-gezoomt → Regeln am ENDE von styles.css). Beim
   Zurückzoomen auf 1× kommen sie sanft wieder.

   Robust für alle Geräte:
   - Desktop/Laptop: visualViewport.scale ändert sich nie →
     Script feuert nie, null Effekt.
   - Ohne visualViewport-Unterstützung (sehr alte Geräte):
     Script beendet sich sofort, Standardverhalten unverändert.
   - Intro außen vor: solange body.intro-aktiv gesetzt ist
     (Trailer läuft), passiert hier nichts.

   Konfiguration ganz unten (Grenzen für Ein-/Zurückzoom).
   ============================================================ */

(() => {
  'use strict';

  if (!window.visualViewport || !document.body) return;

  const ZOOM_GRENZE_AN     = 1.1;  // ab dieser Skala gilt: „eingezoomt“
  const ZOOM_GRENZE_ZURUECK = 1.03; // etwas darunter → zurück (Hysterese,
                                    // verhindert Flackern an der Grenze)

  let eingezoomt = false;

  function pruefeZoom() {
    // Intro läuft? → nichts tun (Trailer hat sein eigenes Verhalten)
    if (document.body.classList.contains('intro-aktiv')) return;

    const zoom = window.visualViewport.scale;

    if (!eingezoomt && zoom > ZOOM_GRENZE_AN) {
      eingezoomt = true;
      document.body.classList.add('seite-gezoomt');
    } else if (eingezoomt && zoom <= ZOOM_GRENZE_ZURUECK) {
      eingezoomt = false;
      document.body.classList.remove('seite-gezoomt');
    }
  }

  window.visualViewport.addEventListener('resize', pruefeZoom);
  window.visualViewport.addEventListener('scroll', pruefeZoom);
  pruefeZoom(); // Startzustand (theoretisch 1× — schadet nicht)
})();