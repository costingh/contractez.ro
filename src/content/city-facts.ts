/** Date locale verificate pentru paginile pe oraș. Surse în comentariul de la fiecare oraș. */
export type CityFacts = { neighborhoods: string[]; gasDistributor: string | null; ocpi: string; ocpiAddress: string | null };

/*
 * Surse comune:
 * - Aria Distrigaz Sud Rețele (20 de județe + București): comunicatele de presă distrigazsud-retele.ro (2025).
 * - Aria Delgaz Grid gaze (20 de județe din nord și vest): forbes.ro/?p=442678 (23.04.2025).
 * - Adrese OCPI: ANCPI, „DATE CONTACT OCPI_BCPI_BRP” (20.02.2026),
 *   https://www.ancpi.ro/wp-content/uploads/2026/02/DATE-CONTACT_OCPI_BCPI_BRP.pdf (citit din arhiva web.archive.org,
 *   pentru că ancpi.ro afișa doar un anunț de incident în oct. 2026).
 */
export const cityFacts: Record<string, CityFacts> = {
  // surse: ro.wikipedia.org/wiki/Lista_cartierelor_din_București; gaze: economica.net/?p=964076 (sistare Sector 2), comunicat Distrigaz 09.11.2025 (Sector 3); OCPI: PDF ANCPI
  bucuresti: {
    neighborhoods: ["Sectorul 1", "Sectorul 2", "Sectorul 3", "Sectorul 4", "Sectorul 5", "Sectorul 6", "Titan", "Drumul Taberei", "Berceni", "Militari", "Floreasca", "Colentina", "Pantelimon", "Rahova"],
    gasDistributor: "Distrigaz Sud Rețele",
    ocpi: "OCPI București",
    ocpiAddress: "Bd. Expoziției nr. 1A, sector 1, București",
  },
  // surse: ro.wikipedia.org/wiki/Lista_cartierelor_din_Cluj-Napoca; gaze: actualdecluj.ro (lucrări Delgaz pe str. Piezișa, 2026); OCPI: PDF ANCPI
  "cluj-napoca": {
    neighborhoods: ["Mănăștur", "Gheorgheni", "Mărăști", "Grigorescu", "Zorilor", "Bună Ziua", "Între Lacuri", "Someșeni", "Gruia", "Andrei Mureșanu"],
    gasDistributor: "Delgaz Grid",
    ocpi: "OCPI Cluj",
    ocpiAddress: "Str. Alexandru Vaida Voevod nr. 53, Cluj-Napoca",
  },
  // surse: ro.wikipedia.org/wiki/Timișoara (cartiere); gaze: ziuadevest.ro (Delgaz Grid sistează gazul pe străzi din municipiul Timișoara, oct. 2026); OCPI: PDF ANCPI
  timisoara: {
    neighborhoods: ["Cetate", "Fabric", "Elisabetin", "Iosefin", "Mehala", "Fratelia", "Freidorf", "Circumvalațiunii", "Complexul Studențesc", "Soarelui"],
    gasDistributor: "Delgaz Grid",
    ocpi: "OCPI Timiș",
    ocpiAddress: "Str. Armoniei nr. 1/C, Timișoara",
  },
  // surse: ro.wikipedia.org/wiki/Iași (cartiere); gaze: bzi.ro (Delgaz înlocuiește conducte pe străzi din Iași); OCPI: PDF ANCPI
  iasi: {
    neighborhoods: ["Copou", "Țicău", "Tătărași", "Nicolina", "Păcurari", "Canta", "Dacia", "Alexandru cel Bun", "Galata", "Podu Roș"],
    gasDistributor: "Delgaz Grid",
    ocpi: "OCPI Iași",
    ocpiAddress: "Str. Costache Negri nr. 48, Iași",
  },
  // surse: ro.wikipedia.org/wiki/Constanța (împărțire administrativă); gaze: cugetliber.ro (Distrigaz Sud Rețele, ~500 clienți din municipiul Constanța, str. Ionel Perlea); OCPI: PDF ANCPI
  constanta: {
    neighborhoods: ["Tomis I", "Tomis II", "Tomis III", "Tomis Nord", "Faleză Nord", "Km 4-5", "Inel I", "Coiciu", "Palazu Mare", "Viile Noi"],
    gasDistributor: "Distrigaz Sud Rețele",
    ocpi: "OCPI Constanța",
    ocpiAddress: "Str. Mihai Viteazu nr. 2B, Constanța",
  },
  // surse: ro.wikipedia.org/wiki/Brașov (subunități); gaze: comunicat Distrigaz 23.09.2024 (str. Cernatului, municipiul Brașov); OCPI: PDF ANCPI
  brasov: {
    neighborhoods: ["Centrul Vechi", "Șchei", "Centrul Civic", "Astra", "Răcădău", "Tractorul", "Noua", "Bartolomeu", "Craiter", "Triaj"],
    gasDistributor: "Distrigaz Sud Rețele",
    ocpi: "OCPI Brașov",
    ocpiAddress: "Str. Zizinului nr. 46, Corp A, Brașov",
  },
  // surse: ro.wikipedia.org/wiki/Lista_cartierelor_din_Craiova; gaze: comunicat Distrigaz 09.05.2025 (Craiova, jud. Dolj); OCPI: PDF ANCPI
  craiova: {
    neighborhoods: ["Centru", "Craiovița Nouă", "Brazda lui Novac", "Rovine", "Valea Roșie", "Lăpuș-Argeș", "1 Mai", "Sărari", "Siloz", "Bariera Vâlcii"],
    gasDistributor: "Distrigaz Sud Rețele",
    ocpi: "OCPI Dolj",
    ocpiAddress: "Str. C.S. Nicolăescu Plopșor nr. 4, Craiova",
  },
  // surse: ro.wikipedia.org/wiki/Galați (cartierele componente); gaze: agerpres.ro 25.04.2026 (Distrigaz Sud Rețele, municipiul Galați); OCPI: PDF ANCPI
  galati: {
    neighborhoods: ["Țiglina", "Mazepa", "Micro 19", "Dimitrie Cantemir", "Aurel Vlaicu", "I.C. Frimu", "Bariera Traian", "Aeroport", "Centrul Vechi", "Valea Cătușei"],
    gasDistributor: "Distrigaz Sud Rețele",
    ocpi: "OCPI Galați",
    ocpiAddress: "Str. Domnească nr. 244, Galați",
  },
  // surse: ro.wikipedia.org/wiki/Ploiești (cartiere); gaze: observatorulph.ro 24.12.2025 (Distrigaz Sud Rețele, bloc din Ploiești); OCPI: PDF ANCPI
  ploiesti: {
    neighborhoods: ["Malu Roșu", "Vest", "9 Mai", "Mihai Bravu", "Republicii", "Nord", "Bereasca", "Cantacuzino", "Mimiu", "Albert"],
    gasDistributor: "Distrigaz Sud Rețele",
    ocpi: "OCPI Prahova",
    ocpiAddress: "Str. Unirii nr. 2, Ploiești",
  },
  // surse: ro.wikipedia.org/wiki/Oradea (cartiere); gaze: distrigazvest.ro/companie („unicul distribuitor de gaze naturale în municipiul Oradea”), NU Delgaz Grid; OCPI: PDF ANCPI
  oradea: {
    neighborhoods: ["Rogerius", "Nufărul", "Ioșia", "Velența", "Olosig", "Subcetate", "Orașul Nou", "Dimitrie Cantemir", "Decebal-Dacia", "Episcopia Bihor"],
    gasDistributor: "Distrigaz Vest",
    ocpi: "OCPI Bihor",
    ocpiAddress: "Calea Armatei Române nr. 1/A, Oradea",
  },
  // surse: ro.wikipedia.org/wiki/Sibiu; gaze: tribuna.ro (Delgaz întrerupe gazul pe străzi din Sibiu, 08.2025); OCPI: PDF ANCPI
  sibiu: {
    neighborhoods: ["Centrul Istoric", "Josefin", "Terezian", "Lupeni", "Vasile Aaron", "Hipodrom", "Valea Aurie", "Ștrand", "Turnișor", "Țiglari"],
    gasDistributor: "Delgaz Grid",
    ocpi: "OCPI Sibiu",
    ocpiAddress: "Calea Dumbrăvii nr. 34, Sibiu",
  },
  // surse: ro.wikipedia.org/wiki/Arad (cartierele Aradului); gaze: delgaz.ro/investitii-modernizare-retea-gaz-municipiul-arad; OCPI: PDF ANCPI
  arad: {
    neighborhoods: ["Centru", "Aradul Nou", "Gai", "Micălaca", "Grădiște", "Bujac", "Pârneava", "Subcetate", "Confecții", "Sânnicolau Mic"],
    gasDistributor: "Delgaz Grid",
    ocpi: "OCPI Arad",
    ocpiAddress: "Splaiul General Gheorghe Magheru nr. 13, Arad",
  },
  // surse: ro.wikipedia.org/wiki/Pitești; gaze: comunicat Distrigaz 25.06.2025 (str. Schitului, Pitești); OCPI: PDF ANCPI
  pitesti: {
    neighborhoods: ["Centru", "Trivale", "Găvana", "Prundu", "Războieni", "Calea București", "Craiovei", "Banat", "Tudor Vladimirescu", "Negru Vodă"],
    gasDistributor: "Distrigaz Sud Rețele",
    ocpi: "OCPI Argeș",
    ocpiAddress: "Str. Maior Gheorghe Șonțu nr. 8A, Pitești",
  },
  // surse: ro.wikipedia.org/wiki/Listă_de_cartiere_din_Bacău; gaze: delgaz.ro/investitie-modernizare-sistem-distributie-gn-bacau; OCPI: PDF ANCPI
  bacau: {
    neighborhoods: ["Centru", "Gherăiești", "Șerbănești", "Mioriței", "George Bacovia", "Bistrița-Lac", "CFR", "Cornișa", "Tache", "Izvoare"],
    gasDistributor: "Delgaz Grid",
    ocpi: "OCPI Bacău",
    ocpiAddress: "Str. Ioniță Sandu Sturza nr. 78, Bacău",
  },
  // surse: ro.wikipedia.org/wiki/Brăila; gaze: monitorulbr.ro/avaria-de-gaze-rezolvata-deocamdata (echipă Distrigaz, cartierul Viziru); OCPI: PDF ANCPI
  braila: {
    neighborhoods: ["Centru", "Hipodrom", "Viziru", "Radu Negru", "Obor", "Brăilița", "Chercea", "Lacu Dulce", "Dorobanților", "Progresul"],
    gasDistributor: "Distrigaz Sud Rețele",
    ocpi: "OCPI Brăila",
    ocpiAddress: "Str. Justiției nr. 1, Brăila",
  },
  // surse: ro.wikipedia.org/wiki/Târgu_Mureș (locuire); gaze: zi-de-zi.ro 20.05.2026 (Delgaz, sistare în Târgu Mureș); OCPI: PDF ANCPI (fără număr de stradă în sursă)
  "targu-mures": {
    neighborhoods: ["Tudor Vladimirescu", "Dâmbul Pietros", "Unirii", "Cornișa", "Libertății", "Aleea Carpați", "Livezeni", "Valea Rece", "Mureșeni", "Centru"],
    gasDistributor: "Delgaz Grid",
    ocpi: "OCPI Mureș",
    ocpiAddress: "Str. Căprioarei, Târgu Mureș",
  },
  // surse: ro.wikipedia.org/wiki/Baia_Mare (cartiere); gaze: vasiledale.ro 24.08.2026 (Delgaz Grid, străzi din municipiul Baia Mare); OCPI: PDF ANCPI
  "baia-mare": {
    neighborhoods: ["Săsar", "Valea Roșie", "Vasile Alecsandri", "Republicii", "Progresul", "Gării", "Ferneziu", "Firiza", "Decebal", "Traian"],
    gasDistributor: "Delgaz Grid",
    ocpi: "OCPI Maramureș",
    ocpiAddress: "Str. Cosmonauților nr. 3, Baia Mare",
  },
  // surse: ro.wikipedia.org/wiki/Buzău (după Strategia municipiului 2014–2020); gaze: hotnews.ro/?p=2152367 (Distrigaz, bloc pe Aleea Industriilor, Buzău); OCPI: PDF ANCPI
  buzau: {
    neighborhoods: ["Centru", "Micro 14", "Micro 12", "Dorobanți", "Simileasca", "Nicolae Bălcescu", "Mihai Viteazul", "Broșteni", "Marghiloman", "Poștă"],
    gasDistributor: "Distrigaz Sud Rețele",
    ocpi: "OCPI Buzău",
    ocpiAddress: "Bd. Nicolae Bălcescu nr. 48, Buzău",
  },
  // surse: ro.wikipedia.org/wiki/Suceava (cartiere); gaze: monitorulsv.ro (sistarea gazelor pe străzi din municipiul Suceava); OCPI: PDF ANCPI
  suceava: {
    neighborhoods: ["Burdujeni", "Cuza Vodă", "George Enescu", "Obcini", "Zamca", "Mărășești", "Areni", "Centru", "Ițcani", "Hărbărie"],
    gasDistributor: "Delgaz Grid",
    ocpi: "OCPI Suceava",
    ocpiAddress: "Bd. 1 Decembrie 1918 nr. 3, Suceava",
  },
  // surse: ro.wikipedia.org/wiki/Satu_Mare (istoric, cartiere de locuințe); gaze: presasm.ro (Delgaz Grid, scurgere în centrul municipiului); OCPI: PDF ANCPI
  "satu-mare": {
    neighborhoods: ["Micro 14", "Cartierul 15", "Micro 16", "Micro 17", "Soarelui", "Carpați I", "Carpați II", "Solidaritatea"],
    gasDistributor: "Delgaz Grid",
    ocpi: "OCPI Satu Mare",
    ocpiAddress: "Str. Martirilor Deportați nr. 52, Satu Mare",
  },
};
