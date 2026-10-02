/* ============================================================
   translations.js – alle sichtbaren Texte in de / en / pl
   ------------------------------------------------------------
   Texte nachträglich ändern: Einfach unten im jeweiligen
   Sprachblock die Zeichenkette anpassen.
   Die Zuordnung zu den Stellen auf der Seite läuft über
   data-i18n="schlüssel"-Attribute in der index.html.
   ============================================================ */

'use strict';

const UEBERSETZUNGEN = {

  /* ---------------------------------------------------------- */
  /* DEUTSCH                                                     */
  /* ---------------------------------------------------------- */
  de: {
    // Festes Menü oben
    // (Buttons "Deutsch/English/Polski" stehen statisch in der index.html)
    musik_button: '🎵 Musik',
    menu_aria: 'Musik und Sprache',
    musik_hinweis: 'Musik: Bee Gees – „More Than a Woman“ (YouTube). Beim Abspielen werden Daten wie deine IP-Adresse an YouTube/Google übertragen.',
    datenschutz_link: 'Datenschutzerklärung',

    // Hero
    hero_titel: 'Studio 54 Night',
    hero_untertitel: 'Eine Nacht voller Glitzer & Disco',
    hero_hinweis: 'Nach unten scrollen für alle Details',
    hero_bild_alt: 'Einladung zum 18. Geburtstag von Mathilda im Studio-54-Stil',

    // Details-Abschnitt
    details_ueberschrift: 'Die Details',
    label_datum: 'Datum',
    value_datum: '23. Januar 2027',
    label_uhrzeit: 'Uhrzeit',
    value_uhrzeit: 'Ab 19:00 Uhr',
    label_ort: 'Ort',
    value_ort: 'An d. Neuen Mühle 22',
    value_ort_zusatz: '47447 Moers-Kapellen',
    maps_linktext: 'In Google Maps öffnen',
    label_dresscode: 'Dresscode',
    value_dresscode: 'Studio 54 — Seventies & Eighties',
    dresscode_hinweis: 'Bei Fragen zum Dresscode kannst du dich jederzeit gerne bei mir melden.',
    rsvp_ueberschrift: 'RSVP bis zum 15. Oktober',
    rsvp_text: 'Bitte gib mir bis dahin Bescheid, ob du dabei bist. Falls du eine Begleitperson / ein Plus-One mitbringen möchtest, gib mir bitte ebenfalls vorher Bescheid.',
    unterkunft_hinweis: 'Bei Fragen zu einer Unterkunft oder falls du von weiter weg kommst, kannst du dich jederzeit gerne bei mir melden.',
    schlusssatz: 'Ich freue mich darauf, mit euch eine ganz besondere Nacht zu feiern!',

    // Galerie
    galerie_ueberschrift: 'Die Einladungen',
    galerie_alt_de_titel: 'Goldene Ticketkarte: Mathilda’s 18ter Geburtstag – Studio 54',
    galerie_alt_de_details: 'Einladungskarte auf Deutsch mit Datum, Uhrzeit, Ort und Dresscode',
    galerie_alt_en_titel: 'Golden ticket card: Mathilda’s 18th Birthday – Studio 54',
    galerie_alt_en_details: 'Invitation card in English with date, time, venue and dresscode',
    galerie_alt_pl_titel: 'Złoty bilet: 18. Urodziny Mathildy – Studio 54',
    galerie_alt_pl_details: 'Karta zaproszenia po polsku z datą, godziną, miejscem i dresscode’em',

    // Footer
    footer_text: 'Mit Liebe &amp; Glitzer gebastelt — Studio 54 Night · 23.01.2027 · Moers-Kapellen',
    footer_musik: 'Musik: Bee Gees – More Than a Woman (YouTube) · Beim Abspielen: Datenübertragung an YouTube/Google',
  },

  /* ---------------------------------------------------------- */
  /* ENGLISH                                                     */
  /* ---------------------------------------------------------- */
  en: {
    // Fixed top menu (language buttons are static in index.html)
    musik_button: '🎵 Music',
    menu_aria: 'Music and language',
    musik_hinweis: 'Music: Bee Gees – “More Than a Woman” (YouTube). While playing, data such as your IP address is transmitted to YouTube/Google.',
    datenschutz_link: 'Privacy policy',

    // Hero
    hero_titel: 'Studio 54 Night',
    hero_untertitel: 'A night full of glitter & disco',
    hero_hinweis: 'Scroll down for all the details',
    hero_bild_alt: 'Invitation to Mathilda’s 18th birthday in Studio 54 style',

    // Details section
    details_ueberschrift: 'The details',
    label_datum: 'Date',
    value_datum: 'January 23, 2027',
    label_uhrzeit: 'Time',
    value_uhrzeit: 'From 7:00 PM',
    label_ort: 'Venue',
    value_ort: 'An d. Neuen Mühle 22',
    value_ort_zusatz: '47447 Moers-Kapellen',
    maps_linktext: 'Open in Google Maps',
    label_dresscode: 'Dresscode',
    value_dresscode: 'Studio 54 — Seventies & Eighties',
    dresscode_hinweis: 'If you have any questions about the dresscode, please feel free to contact me.',
    rsvp_ueberschrift: 'RSVP by October 15th',
    rsvp_text: 'Please let me know by then if you can make it. If you would like to bring a plus-one, please let me know in advance.',
    unterkunft_hinweis: 'If you need accommodation or are coming from further away, please feel free to contact me.',
    schlusssatz: 'I’m looking forward to celebrating this special night with you!',

    // Gallery
    galerie_ueberschrift: 'The invitations',
    galerie_alt_de_titel: 'Golden ticket card: Mathilda’s 18th Birthday – Studio 54 (German)',
    galerie_alt_de_details: 'Invitation card in German with date, time, venue and dresscode',
    galerie_alt_en_titel: 'Golden ticket card: Mathilda’s 18th Birthday – Studio 54',
    galerie_alt_en_details: 'Invitation card in English with date, time, venue and dresscode',
    galerie_alt_pl_titel: 'Golden ticket card: Mathilda’s 18th Birthday – Studio 54 (Polish)',
    galerie_alt_pl_details: 'Invitation card in Polish with date, time, venue and dresscode',

    // Footer
    footer_text: 'Made with love &amp; glitter — Studio 54 Night · 23.01.2027 · Moers-Kapellen',
    footer_musik: 'Music: Bee Gees – More Than a Woman (YouTube) · While playing: data is transferred to YouTube/Google',
  },

  /* ---------------------------------------------------------- */
  /* POLSKI                                                      */
  /* ---------------------------------------------------------- */
  pl: {
    // Stałe menu u góry (przyciski języków żyją statycznie w index.html)
    musik_button: '🎵 Muzyka',
    menu_aria: 'Muzyka i język',
    musik_hinweis: 'Muzyka: Bee Gees – „More Than a Woman” (YouTube). Podczas odtwarzania dane, takie jak Twój adres IP, są przesyłane do YouTube/Google.',
    datenschutz_link: 'Polityka prywatności',

    // Hero
    hero_titel: 'Noc Studio 54',
    hero_untertitel: 'Noc pełna brokatu i disco',
    hero_hinweis: 'Przewiń w dół, aby zobaczyć wszystkie szczegóły',
    hero_bild_alt: 'Zaproszenie na 18. urodziny Mathildy w stylu Studio 54',

    // Sekcja szczegółów
    details_ueberschrift: 'Szczegóły',
    label_datum: 'Data',
    value_datum: '23 stycznia 2027',
    label_uhrzeit: 'Godzina',
    value_uhrzeit: 'Od godz. 19:00',
    label_ort: 'Miejsce',
    value_ort: 'An d. Neuen Mühle 22',
    value_ort_zusatz: '47447 Moers-Kapellen',
    maps_linktext: 'Otwórz w Google Maps',
    label_dresscode: 'Dresscode',
    value_dresscode: 'Studio 54 — Seventies & Eighties',
    dresscode_hinweis: 'Jeśli masz pytania dotyczące dresscode’u, to skontaktuj się ze mną.',
    rsvp_ueberschrift: 'Potwierdź do 15 października',
    rsvp_text: 'Daj mi znać do tego dnia, czy będziesz ze mną. Jeśli chcesz zabrać ze sobą osobę towarzyszącą / plus-one, również daj mi wcześniej znać.',
    unterkunft_hinweis: 'Jeśli potrzebujesz zakwaterowania lub przyjeżdżasz z dalszej odległości, skontaktuj się ze mną.',
    schlusssatz: 'Nie mogę się doczekać, aby wspólnie z Tobą świętować tę wyjątkową noc!',

    // Galeria
    galerie_ueberschrift: 'Zaproszenia',
    galerie_alt_de_titel: 'Złoty bilet: 18. Urodziny Mathildy – Studio 54 (niem.)',
    galerie_alt_de_details: 'Karta zaproszenia po niemiecku z datą, godziną, miejscem i dresscode’em',
    galerie_alt_en_titel: 'Złoty bilet: 18. Urodziny Mathildy – Studio 54 (ang.)',
    galerie_alt_en_details: 'Karta zaproszenia po angielsku z datą, godziną, miejscem i dresscode’em',
    galerie_alt_pl_titel: 'Złoty bilet: 18. Urodziny Mathildy – Studio 54',
    galerie_alt_pl_details: 'Karta zaproszenia po polsku z datą, godziną, miejscem i dresscode’em',

    // Stopka
    footer_text: 'Zrobione z miłością i brokatem — Studio 54 Night · 23.01.2027 · Moers-Kapellen',
    footer_musik: 'Muzyka: Bee Gees – More Than a Woman (YouTube) · Podczas odtwarzania: transfer danych do YouTube/Google',
  },
};