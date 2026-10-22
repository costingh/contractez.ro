/** Autorități locale verificate pentru paginile categorie × oraș. Surse în comentarii. */
export type CityAuthorities = {
  courtOfAppeal: string;
  iscir: { name: string; address: string | null };
  anre?: { name: string; address: string | null };
};

/*
 * Surse comune (verificate 22.10.2026):
 * - Curți de apel: Legea nr. 304/2022 privind organizarea judiciară, Anexa nr. 1 lit. C („Curțile de apel ... circumscripțiile
 *   acestora”), forma consolidată https://legislatie.just.ro/Public/DetaliiDocument/261410 (actualizată la 17.07.2025).
 * - Traducători și interpreți autorizați: baza de date a Ministerului Justiției, filtrabilă după curtea de apel, conform
 *   portalului e-Justice (e-justice.europa.eu/topics/find-legal-professional/legal-translators-interpreters/ro_ro?member=1).
 *   just.ro blochează accesul automat (Cloudflare 403), deci URL-ul e preluat de pe e-Justice, nu deschis direct.
 * - ISCIR: paginile iscir.ro/inspectii-teritoriale/it-<oraș> („Județe arondate IT ISCIR ...” + „Adresa”), actualizate 2024–2025.
 * - ANRE: anre.ro/contact/ listează 9 inspecții teritoriale (Arad, Brașov, Cluj, Constanța, Craiova, Galați, Iași, Sibiu,
 *   Târgu Mureș) cu adrese, dar NU publică județele arondate, deci câmpul `anre` este omis peste tot.
 */
export const translatorListsUrl = "https://www.just.ro/beta-interpreti-traducatori-rezultate/";
export const iscirContactsUrl = "https://iscir.ro/inspectii-teritoriale";

export const cityAuthorities: Record<string, CityAuthorities> = {
  // surse: Legea 304/2022 anexa 1 lit. C (București); iscir.ro/inspectii-teritoriale/it-bucuresti (București, Ilfov, Călărași, Giurgiu, Teleorman)
  bucuresti: {
    courtOfAppeal: "Curtea de Apel București",
    iscir: { name: "ISCIR – Inspecția Teritorială București", address: "Str. Sf. Elefterie nr. 47-49, sector 5, București" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Cluj); iscir.ro/inspectii-teritoriale/it-cluj (Cluj, Sălaj, Bistrița-Năsăud, Maramureș)
  "cluj-napoca": {
    courtOfAppeal: "Curtea de Apel Cluj",
    iscir: { name: "ISCIR – Inspecția Teritorială Cluj-Napoca", address: "Str. Plevnei nr. 117, clădirea C1, etaj 1, Cluj-Napoca" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Timiș); iscir.ro/inspectii-teritoriale/it-timisoara (Timiș, Caraș-Severin, Arad, Hunedoara)
  timisoara: {
    courtOfAppeal: "Curtea de Apel Timișoara",
    iscir: { name: "ISCIR – Inspecția Teritorială Timișoara", address: "Str. Salcâmilor nr. 8, et. 2, Timișoara" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Iași); iscir.ro/inspectii-teritoriale/it-iasi (Iași, Suceava, Botoșani, Vaslui)
  iasi: {
    courtOfAppeal: "Curtea de Apel Iași",
    iscir: { name: "ISCIR – Inspecția Teritorială Iași", address: "Aleea Grigore Ghica Vodă nr. 30, Iași" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Constanța); iscir.ro/inspectii-teritoriale/it-constanta (Constanța, Tulcea)
  constanta: {
    courtOfAppeal: "Curtea de Apel Constanța",
    iscir: { name: "ISCIR – Inspecția Teritorială Constanța", address: "Str. Călărași nr. 1, Constanța" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Brașov); iscir.ro/inspectii-teritoriale/it-brasov (Brașov, Covasna, Harghita)
  brasov: {
    courtOfAppeal: "Curtea de Apel Brașov",
    iscir: { name: "ISCIR – Inspecția Teritorială Brașov", address: "Str. Târnavei nr. 9, Brașov" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Dolj); iscir.ro/inspectii-teritoriale/it-craiova (Dolj, Gorj, Mehedinți, Olt)
  craiova: {
    courtOfAppeal: "Curtea de Apel Craiova",
    iscir: { name: "ISCIR – Inspecția Teritorială Craiova", address: "Calea Unirii nr. 40, Craiova" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Galați); iscir.ro/inspectii-teritoriale/it-bacau (Bacău, Neamț, Vrancea, Brăila, Galați; are punct de lucru în Galați, fără adresă publicată)
  galati: {
    courtOfAppeal: "Curtea de Apel Galați",
    iscir: { name: "ISCIR – Inspecția Teritorială Bacău", address: "Str. Erou Gheorghe Nechita nr. 2, Bacău" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Prahova); iscir.ro/inspectii-teritoriale/it-ploiesti (Prahova, Buzău, Ialomița)
  ploiesti: {
    courtOfAppeal: "Curtea de Apel Ploiești",
    iscir: { name: "ISCIR – Inspecția Teritorială Ploiești", address: "Bd. Republicii nr. 17B, bloc A, Ploiești" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Bihor); iscir.ro/inspectii-teritoriale/it-oradea (Bihor, Satu Mare)
  oradea: {
    courtOfAppeal: "Curtea de Apel Oradea",
    iscir: { name: "ISCIR – Inspecția Teritorială Oradea", address: "Str. Mihai Eminescu nr. 17, Oradea" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Sibiu → Alba Iulia); iscir.ro/inspectii-teritoriale/it-sibiu (Sibiu, Alba, Mureș)
  sibiu: {
    courtOfAppeal: "Curtea de Apel Alba Iulia",
    iscir: { name: "ISCIR – Inspecția Teritorială Sibiu", address: "Str. Dorului nr. 19, Sibiu" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Arad → Timișoara); iscir.ro/inspectii-teritoriale/it-timisoara (Timiș, Caraș-Severin, Arad, Hunedoara)
  arad: {
    courtOfAppeal: "Curtea de Apel Timișoara",
    iscir: { name: "ISCIR – Inspecția Teritorială Timișoara", address: "Str. Salcâmilor nr. 8, et. 2, Timișoara" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Argeș); iscir.ro/inspectii-teritoriale/it-pitesti (Argeș, Dâmbovița, Vâlcea)
  pitesti: {
    courtOfAppeal: "Curtea de Apel Pitești",
    iscir: { name: "ISCIR – Inspecția Teritorială Pitești", address: "Str. Mihai Eminescu nr. 11, clădirea C1, Pitești" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Bacău); iscir.ro/inspectii-teritoriale/it-bacau (Bacău, Neamț, Vrancea, Brăila, Galați)
  bacau: {
    courtOfAppeal: "Curtea de Apel Bacău",
    iscir: { name: "ISCIR – Inspecția Teritorială Bacău", address: "Str. Erou Gheorghe Nechita nr. 2, Bacău" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Brăila → Galați); iscir.ro/inspectii-teritoriale/it-bacau (Bacău, Neamț, Vrancea, Brăila, Galați)
  braila: {
    courtOfAppeal: "Curtea de Apel Galați",
    iscir: { name: "ISCIR – Inspecția Teritorială Bacău", address: "Str. Erou Gheorghe Nechita nr. 2, Bacău" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Mureș); iscir.ro/inspectii-teritoriale/it-sibiu (Sibiu, Alba, Mureș; are telefon pentru Târgu Mureș, fără adresă publicată)
  "targu-mures": {
    courtOfAppeal: "Curtea de Apel Târgu Mureș",
    iscir: { name: "ISCIR – Inspecția Teritorială Sibiu", address: "Str. Dorului nr. 19, Sibiu" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Maramureș → Cluj); iscir.ro/inspectii-teritoriale/it-cluj (Cluj, Sălaj, Bistrița-Năsăud, Maramureș)
  "baia-mare": {
    courtOfAppeal: "Curtea de Apel Cluj",
    iscir: { name: "ISCIR – Inspecția Teritorială Cluj-Napoca", address: "Str. Plevnei nr. 117, clădirea C1, etaj 1, Cluj-Napoca" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Buzău → Ploiești); iscir.ro/inspectii-teritoriale/it-ploiesti (Prahova, Buzău, Ialomița)
  buzau: {
    courtOfAppeal: "Curtea de Apel Ploiești",
    iscir: { name: "ISCIR – Inspecția Teritorială Ploiești", address: "Bd. Republicii nr. 17B, bloc A, Ploiești" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Suceava); iscir.ro/inspectii-teritoriale/it-iasi (Iași, Suceava, Botoșani, Vaslui)
  suceava: {
    courtOfAppeal: "Curtea de Apel Suceava",
    iscir: { name: "ISCIR – Inspecția Teritorială Iași", address: "Aleea Grigore Ghica Vodă nr. 30, Iași" },
  },
  // surse: Legea 304/2022 anexa 1 lit. C (Satu Mare → Oradea); iscir.ro/inspectii-teritoriale/it-oradea (Bihor, Satu Mare)
  "satu-mare": {
    courtOfAppeal: "Curtea de Apel Oradea",
    iscir: { name: "ISCIR – Inspecția Teritorială Oradea", address: "Str. Mihai Eminescu nr. 17, Oradea" },
  },
};
