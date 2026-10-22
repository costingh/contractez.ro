/**
 * Surse vizibile la finalul articolelor și în JSON-LD (`citation`), pe slug-ul articolului.
 *
 * Doar referințe cu autoritate: legislație și instituții publice, distribuitori, organisme
 * profesionale, documentația oficială a platformelor comparate și, pentru cifrele de preț,
 * presa sau retailerii care sunt chiar sursa datelor. Nu includem concurenți (marketplace-uri
 * de meseriași sau anunțuri). Lista completă, cu articolele citate, rămâne în comentariul
 * `{/* SURSE ... *\/}` de la începutul fiecărui `.mdx`.
 *
 * `accessed` = data la care am verificat că linkul se deschide și duce la documentul corect.
 */

export type Source = {
  /** Titlul documentului sau al paginii, cum apare la sursă. */
  title: string;
  /** Instituția sau publicația care l-a emis. */
  publisher: string;
  url: string;
  /** Data verificării, ISO (YYYY-MM-DD). */
  accessed: string;
};

export const postSources: Record<string, Source[]> = {
  "cat-costa-renovare-baie": [
    {
      title: "Cât costă o baie de la zero în 2026: ghid complet cu prețuri reale",
      publisher: "HORNBACH România",
      url: "https://www.hornbach.ro/proiecte/cat-costa-o-baie-de-la-zero-in-2026/",
      accessed: "2026-10-22",
    },
    {
      title: "Legea nr. 50/1991 privind autorizarea executării lucrărilor de construcții (republicată, actualizată)",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/184771",
      accessed: "2026-10-22",
    },
    {
      title:
        "Regulamentul pentru autorizarea electricienilor în domeniul instalațiilor electrice, aprobat prin Ordinul ANRE nr. 66/2023 (formă actualizată)",
      publisher: "ANRE",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/288046",
      accessed: "2026-10-22",
    },
  ],
  "platforme-freelancing-romania": [
    {
      title: "Learn about the Freelancer Service Fee",
      publisher: "Upwork Help Center",
      url: "https://support.upwork.com/hc/en-us/articles/211062538-Learn-about-the-Freelancer-Service-Fee",
      accessed: "2026-10-22",
    },
    {
      title: "How Fiverr works for freelancers",
      publisher: "Fiverr Help Center",
      url: "https://help.fiverr.com/hc/en-us/articles/34069565843985-How-Fiverr-works-for-freelancers",
      accessed: "2026-10-22",
    },
    {
      title: "Freelancer Fees and Charges",
      publisher: "Freelancer.com",
      url: "https://www.freelancer.com/feesandcharges",
      accessed: "2026-10-22",
    },
    {
      title: "How do the Malt service fees work for freelancers?",
      publisher: "Malt Help Center",
      url: "https://help.malt.com/hc/en-150/articles/29539691425938-How-does-the-Malt-commission-work-for-freelancers",
      accessed: "2026-10-22",
    },
    {
      title: "Remote Freelance Jobs With Top Global Clients",
      publisher: "Toptal",
      url: "https://www.toptal.com/freelance-jobs",
      accessed: "2026-10-22",
    },
    {
      title: "Marketplace de Servicii Profesionale",
      publisher: "UpTask România",
      url: "https://uptask.ro/",
      accessed: "2026-10-22",
    },
  ],
  "traducere-autorizata-vs-legalizata": [
    {
      title: "Traducători/Interpreți autorizați – România",
      publisher: "Portalul european e-Justiție, Comisia Europeană",
      url: "https://e-justice.europa.eu/topics/find-legal-professional/legal-translators-interpreters/ro_ro",
      accessed: "2026-10-22",
    },
    {
      title:
        "Legea nr. 178/1997 pentru autorizarea și plata interpreților și traducătorilor folosiți de organele de urmărire penală, de instanțele judecătorești, birourile notarilor publici, avocați și executori judecătorești (actualizată)",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/116205",
      accessed: "2026-10-22",
    },
    {
      title:
        "Normele din 19 ianuarie 2024 privind tarifele de onorarii minimale pentru serviciile prestate de notarii publici (aprobate prin Ordinul ministrului justiției nr. 177/C/2024)",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/278491",
      accessed: "2026-10-22",
    },
    {
      title: "Apostilare, supralegalizare",
      publisher: "Uniunea Națională a Notarilor Publici din România",
      url: "https://www.uniuneanotarilor.ro/?p=4.3",
      accessed: "2026-10-22",
    },
    {
      title:
        "APOSTILA – Emiterea apostilei pentru actele oficiale administrative (serviciu furnizat de Instituțiile Prefectului)",
      publisher: "Ministerul Afacerilor Interne",
      url: "https://hub.mai.gov.ro/serviciu/view?id=50",
      accessed: "2026-10-22",
    },
  ],
  "verificare-iscir-revizie-centrala-termica": [
    {
      title:
        "Prescripția tehnică PT A1-2010 „Aparate de încălzit alimentate cu combustibil solid, lichid sau gazos cu puteri nominale ≤ 400 kW”",
      publisher: "ISCIR",
      url: "https://iscir.ro/wp-content/uploads/2026/08/PT-A1-2010.pdf",
      accessed: "2026-10-22",
    },
    {
      title:
        "Ordinul nr. 1.167/2026 pentru aprobarea Prescripției tehnice PT CR 2-2025 „Autorizarea/Admiterea funcționării și verificarea tehnică în utilizare a instalațiilor/echipamentelor din domeniul reglementat de ISCIR” (Monitorul Oficial nr. 666/2026)",
      publisher: "ISCIR",
      url: "https://iscir.ro/wp-content/uploads/2026/08/Monitorul-Oficial-Partea-I-nr.-666.pdf",
      accessed: "2026-10-22",
    },
    {
      title:
        "Procedura privind verificările și reviziile tehnice ale instalațiilor de utilizare a gazelor naturale, aprobată prin Ordinul ANRE nr. 179/2015 (formă actualizată)",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/269180",
      accessed: "2026-10-22",
    },
    {
      title: "Legea energiei electrice și a gazelor naturale nr. 123/2012",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/139677",
      accessed: "2026-10-22",
    },
    {
      title:
        "Legea nr. 64/2008 privind funcționarea în condiții de siguranță a instalațiilor sub presiune, instalațiilor de ridicat și a aparatelor consumatoare de combustibil (republicată)",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/90716",
      accessed: "2026-10-22",
    },
  ],
  "model-contract-renovare-avans-mesterias": [
    {
      title: "Codul civil din 17 iulie 2009 (republicat, actualizat), Capitolul VI „Contractul de antrepriză”",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/175630",
      accessed: "2026-10-22",
    },
    {
      title: "Codul de procedură civilă din 1 iulie 2010 (republicat), Cartea a VI-a, Titlul X „Procedura cu privire la cererile de valoare redusă”",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/140271",
      accessed: "2026-10-22",
    },
    {
      title: "Legea energiei electrice și a gazelor naturale nr. 123/2012",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/139677",
      accessed: "2026-10-22",
    },
    {
      title:
        "Legea nr. 64/2008 privind funcționarea în condiții de siguranță a instalațiilor sub presiune, instalațiilor de ridicat și a aparatelor consumatoare de combustibil (republicată)",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/90716",
      accessed: "2026-10-22",
    },
    {
      title: "Acces date prin SMS la 1300 (informații publice despre agenții economici)",
      publisher: "ANAF",
      url: "https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/SMS.htm",
      accessed: "2026-10-22",
    },
    {
      title: "Portal ONRC – servicii online",
      publisher: "Oficiul Național al Registrului Comerțului",
      url: "https://myportal.onrc.ro/",
      accessed: "2026-10-22",
    },
  ],
  "cadastru-intabulare-acte-necesare-cost": [
    {
      title: "Legea cadastrului și a publicității imobiliare nr. 7/1996 (republicată, actualizată)",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/213719",
      accessed: "2026-10-22",
    },
    {
      title:
        "Ordinul ANCPI nr. 600/2023 pentru aprobarea Regulamentului de recepție și înscriere în evidențele de cadastru și carte funciară",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/264801",
      accessed: "2026-10-22",
    },
    {
      title:
        "Ordinul ANCPI nr. 16/2019 privind aprobarea tarifelor pentru serviciile furnizate de Agenția Națională de Cadastru și Publicitate Imobiliară și instituțiile sale subordonate",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/209916",
      accessed: "2026-10-22",
    },
    {
      title: "Ordinul ANCPI nr. 441/2025 pentru modificarea și completarea Ordinului nr. 16/2019 privind aprobarea tarifelor",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/296004",
      accessed: "2026-10-22",
    },
    {
      title:
        "Ordinul ANCPI nr. 1.622/2025 pentru modificarea anexei la Ordinul nr. 1.764/2019 privind aprobarea termenelor de eliberare a documentelor",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/301467",
      accessed: "2026-10-22",
    },
    {
      title: "Aplicația e-Terra este repornită etapizat începând de astăzi",
      publisher: "Guvernul României",
      url: "https://gov.ro/ro/media/comunicate/aplicatia-e-terra-este-repornita-etapizat-incepand-de-astazi",
      accessed: "2026-10-22",
    },
  ],
  "cat-costa-o-mutare": [
    {
      title: "Cât costă să te muți în 2025. Bugetul necesar pentru transport și mobilare a crescut semnificativ",
      publisher: "Capital",
      url: "https://www.capital.ro/cat-costa-sa-te-muti-in-2025-bugetul-necesar-pentru-transport-si-mobilare-a-crescut-semnificativ.html",
      accessed: "2026-10-22",
    },
    {
      title: "Cât te costă să te muți în 2025. Ghid complet de costuri și servicii",
      publisher: "Evenimentul Zilei",
      url: "https://evz.ro/cat-te-costa-sa-te-muti-in-2025-ghid-complet-de-costuri-si-servicii.html",
      accessed: "2026-10-22",
    },
    {
      title: "Ghid complet: Cum te muți în Brașov fără stres și fără surprize la plată",
      publisher: "Zile și Nopți",
      url: "https://zilesinopti.ro/2026/05/22/te-muti-in-brasov-fara-surprize-la-plata/",
      accessed: "2026-10-22",
    },
  ],
  "cat-costa-refacere-instalatie-electrica-apartament": [
    {
      title:
        "Regulamentul pentru autorizarea electricienilor în domeniul instalațiilor electrice, aprobat prin Ordinul ANRE nr. 66/2023 (formă actualizată)",
      publisher: "ANRE",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/288046",
      accessed: "2026-10-22",
    },
    {
      title:
        "Regulamentul pentru atestarea operatorilor economici care proiectează, execută și verifică instalații electrice, aprobat prin Ordinul ANRE nr. 134/2021",
      publisher: "ANRE",
      url: "https://legislatie.just.ro/Public/DetaliiDocumentAfis/249816",
      accessed: "2026-10-22",
    },
    {
      title: "Portal ANRE – liste publice „Autorizații electricieni” și „Atestate operatori”",
      publisher: "ANRE",
      url: "https://spv.anre.ro/",
      accessed: "2026-10-22",
    },
    {
      title: "Ghid informativ DEER – racordarea la rețeaua electrică",
      publisher: "Distribuție Energie Electrică Romania",
      url: "https://www.distributie-energie.ro/wp-content/uploads/2023/12/Ghid_informativ-DEER.pdf",
      accessed: "2026-10-22",
    },
    {
      title: "Legea energiei electrice și a gazelor naturale nr. 123/2012",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/139677",
      accessed: "2026-10-22",
    },
  ],
  "cat-costa-montaj-centrala-termica": [
    {
      title:
        "Normele tehnice pentru proiectarea, executarea și exploatarea sistemelor de alimentare cu gaze naturale (NTPEE-2018), aprobate prin Ordinul ANRE nr. 89/2018",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/201310",
      accessed: "2026-10-22",
    },
    {
      title:
        "Procedura privind proiectarea, verificarea proiectului tehnic, execuția, recepția tehnică și punerea în funcțiune a instalației de utilizare a gazelor naturale, aprobată prin Ordinul ANRE nr. 156/2020",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/229665",
      accessed: "2026-10-22",
    },
    {
      title:
        "Prescripția tehnică PT A1-2010 „Aparate de încălzit alimentate cu combustibil solid, lichid sau gazos cu puteri nominale ≤ 400 kW”",
      publisher: "ISCIR",
      url: "https://iscir.ro/wp-content/uploads/2026/08/PT-A1-2010.pdf",
      accessed: "2026-10-22",
    },
    {
      title:
        "Regulamentul (UE) nr. 813/2013 al Comisiei privind cerințele în materie de proiectare ecologică pentru instalațiile de încălzire cu funcție de încălzire și instalațiile de încălzire cu funcție dublă",
      publisher: "EUR-Lex, Uniunea Europeană",
      url: "https://eur-lex.europa.eu/legal-content/RO/TXT/?uri=CELEX:32013R0813",
      accessed: "2026-10-22",
    },
    {
      title:
        "Cât costă instalarea unei centrale termice. Costul total în 2026 pentru românii care vor să scape de caloriferele reci iarna",
      publisher: "Capital",
      url: "https://www.capital.ro/cat-costa-instalarea-unei-centrale-termice-costul-total-in-2026-pentru-romanii-care-vor-sa-scape-de-caloriferele-reci-iarna.html",
      accessed: "2026-10-22",
    },
  ],
  "cum-verifici-un-mester-inainte-sa-l-angajezi": [
    {
      title: "Acces date prin SMS la 1300 (informații publice despre agenții economici)",
      publisher: "ANAF",
      url: "https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/SMS.htm",
      accessed: "2026-10-22",
    },
    {
      title: "Servicii WEB sincron (registrul plătitorilor de TVA și al contribuabililor inactivi/reactivați)",
      publisher: "ANAF",
      url: "https://static.anaf.ro/static/10/Anaf/Informatii_R/Servicii_web/servicii_sincron.html",
      accessed: "2026-10-22",
    },
    {
      title: "Codul de procedură fiscală din 20 iulie 2015 (actualizat), art. 92 „Registrul contribuabililor/plătitorilor inactivi/reactivați”",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/172697",
      accessed: "2026-10-22",
    },
    {
      title: "Registrele comerțului în țările UE – România",
      publisher: "Portalul european e-Justiție, Comisia Europeană",
      url: "https://e-justice.europa.eu/topics/registers-business-insolvency-land/business-registers-eu-countries/ro_ro",
      accessed: "2026-10-22",
    },
    {
      title: "Portal ANRE – liste publice „Autorizații electricieni” și „Atestate operatori”",
      publisher: "ANRE",
      url: "https://spv.anre.ro/",
      accessed: "2026-10-22",
    },
    {
      title: "Persoane Juridice Autorizate",
      publisher: "ISCIR",
      url: "https://iscir.ro/persoane-juridice-autorizate",
      accessed: "2026-10-22",
    },
  ],
  "pret-fotograf-nunta-2027": [
    {
      title:
        "Tendințe 2026: Jumătate din fotografii și cameramanii de nuntă români se așteaptă să vândă pachete care vor costa între 1.100 și 1.500 EUR (studiu)",
      publisher: "StartupCafe",
      url: "https://startupcafe.ro/tendinte-2026-fotografi-cameramani-nunta-romani-vanzare-pachete-cost-intre-1100-1500-euro-studiu-92257",
      accessed: "2026-10-22",
    },
    {
      title: "EXCLUSIV. Cum arată cererea pentru servicii foto-video de nuntă în 2026. Stiluri clasice, bugete și tendințe",
      publisher: "Capital",
      url: "https://www.capital.ro/exclusiv-cum-arata-cererea-pentru-servicii-foto-video-de-nunta-in-2026-stiluri-clasice-bugete-si-tendinte.html",
      accessed: "2026-10-22",
    },
    {
      title: "Cât va costa în 2026 pachetul standard de fotografii de nuntă",
      publisher: "Revista Biz",
      url: "https://www.revistabiz.ro/cat-va-costa-in-2026-pachetul-standard-de-fotografii-de-nunta/",
      accessed: "2026-10-22",
    },
    {
      title: "Codul civil din 17 iulie 2009 (republicat, actualizat), art. 1.544 „Arvuna confirmatorie” și art. 1.545 „Arvuna penalizatoare”",
      publisher: "Portal Legislativ, Ministerul Justiției",
      url: "https://legislatie.just.ro/Public/DetaliiDocument/175630",
      accessed: "2026-10-22",
    },
  ],
  "pret-manopera-gresie-faianta-mp": [
    {
      title: "Servicii de montaj pentru gresie și faianță în București și împrejurimi",
      publisher: "HORNBACH România",
      url: "https://www.hornbach.ro/servicii/montaj-gresie-si-faianta-bucuresti/",
      accessed: "2026-10-22",
    },
    {
      title: "Servicii de montaj pentru gresie și faianță în Brașov și împrejurimi",
      publisher: "HORNBACH România",
      url: "https://www.hornbach.ro/servicii/montaj-gresie-si-faianta-brasov/",
      accessed: "2026-10-22",
    },
    {
      title: "CERESIT CE 89 ULTRAEPOXY PREMIUM",
      publisher: "Ceresit (Henkel România)",
      url: "https://www.ceresit.ro/produse/solutii-pentru-placari/produs.html/ceresit-ce-89/SAP_0201SQC013O0.html",
      accessed: "2026-10-22",
    },
  ],
};
