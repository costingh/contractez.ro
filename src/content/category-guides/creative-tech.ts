import type { CategoryGuides } from "./types";

export const creativeTechGuides: CategoryGuides = {
  "it-programare": {
    seoTitle: "Programatori și servicii IT: prețuri și oferte verificate",
    metaDescription:
      "Găsește programatori pentru site-uri, magazine online, aplicații și suport IT. Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Categoria IT & Programare acoperă tot ce ține de partea tehnică a unei afaceri: site-uri de prezentare, magazine online, aplicații mobile, backend și API-uri, automatizări cu AI, infrastructură cloud, suport IT și testare. Ai nevoie de ea când pornești un proiect nou, când un sistem existent nu mai face față sau când vrei să automatizezi munca repetitivă.",
      "Pe Contractez descrii proiectul cu propriile cuvinte, iar platforma te ajută să îl structurezi într-o cerere clară. Postarea este gratuită și primești cel mult 5 oferte, doar de la prestatori compatibili cu ce ai nevoie. Prestatorii sunt verificați prin email, telefon și, dacă au firmă, în registrul ANAF. Prețul și plata le stabilești direct cu prestatorul ales.",
    ],
    prices: [
      { item: "Site de prezentare (5–8 pagini)", range: "2.500–8.000 lei" },
      { item: "Magazin online WooCommerce sau Shopify", range: "5.000–20.000 lei" },
      { item: "Aplicație mobilă MVP (iOS și Android)", range: "de la 25.000 lei" },
      { item: "Automatizare simplă (Make, Zapier, n8n)", range: "500–3.000 lei" },
      { item: "Programator freelance", range: "80–250 lei/oră" },
    ],
    faq: [
      {
        q: "Cât costă un site făcut de un programator freelance?",
        a: "Un site de prezentare pe WordPress pornește de obicei de la 2.500 lei, iar un site personalizat sau un magazin online ajunge frecvent la 5.000–20.000 lei. Prețul depinde de numărul de pagini, de design și de integrări. Cere o ofertă scrisă cu lista de livrabile ca să poți compara corect.",
      },
      {
        q: "Lucrez cu un freelancer sau cu o agenție?",
        a: "Un freelancer este potrivit pentru proiecte bine definite și bugete mai mici, iar o agenție ajută când ai nevoie de mai multe roluri (design, programare, testare) în paralel. Contează mai mult portofoliul și proiectele similare decât forma de organizare. Pe Contractez poți primi oferte de la ambele tipuri de prestatori.",
      },
      {
        q: "Cum protejez codul și datele proiectului?",
        a: "Stabilește în contract că sursele și drepturile asupra codului îți aparțin după plată și că primești acces la repository, hosting și domeniu pe numele tău. Pentru date sensibile, poți semna și un acord de confidențialitate înainte să oferi acces.",
      },
    ],
  },

  "dezvoltare-web": {
    seoTitle: "Dezvoltare web la comandă: prețuri și oferte verificate",
    metaDescription:
      "Programatori web pentru aplicații și site-uri personalizate în React, Next.js, PHP sau Laravel. Postezi gratuit, primești oferte verificate.",
    intro: [
      "Dezvoltarea web la comandă înseamnă aplicații și site-uri construite pe nevoile tale, nu pe un șablon: portaluri cu cont de utilizator, platforme de rezervări, dashboard-uri interne sau integrări cu alte sisteme. Ai nevoie de un programator web când un CMS standard nu mai acoperă logica afacerii, când vrei să refaci un site vechi sau să adaugi funcții noi unui proiect existent.",
      "Pe Contractez scrii ce vrei să construiești, chiar dacă nu cunoști termenii tehnici, iar platforma te ajută să transformi ideea într-o cerere structurată. Proiectul ajunge doar la programatori compatibili și primești cel mult 5 oferte, cu posibilitatea să extinzi selecția. Postarea e gratuită, iar datele tale de contact rămân ascunse până alegi tu prestatorul.",
    ],
    prices: [
      { item: "Landing page personalizat (cod, fără CMS)", range: "1.500–4.000 lei" },
      { item: "Aplicație web simplă cu login și panou de administrare", range: "8.000–25.000 lei" },
      { item: "Platformă web complexă (rezervări, abonamente, multi-utilizator)", range: "de la 30.000 lei" },
      { item: "Integrare cu un API extern (plăți, curierat, ERP)", range: "1.000–5.000 lei", note: "per integrare" },
      { item: "Modificări și bug-uri pe un proiect existent", range: "80–250 lei/oră" },
    ],
    priceFactors: [
      "Numărul de funcții și complexitatea logicii (roluri, plăți, notificări)",
      "Tehnologia aleasă și starea codului existent, dacă e un proiect preluat",
      "Designul: primit gata în Figma sau realizat de programator",
      "Termenul de livrare și nevoia de mentenanță după lansare",
    ],
    checklist: [
      "Cere link-uri live către proiecte similare și întreabă exact ce parte a lucrat prestatorul",
      "Cere o estimare scrisă împărțită pe etape, cu livrabile clare pentru fiecare plată",
      "Stabilește din start că primești codul sursă și acces la repository pe numele tău",
      "Întreabă cum se face testarea și cât timp oferă garanție pentru bug-uri",
      "Verifică dacă poate emite factură, mai ales dacă plătești din firmă",
    ],
    faq: [
      {
        q: "Cât costă o aplicație web la comandă?",
        a: "O aplicație web simplă, cu autentificare și panou de administrare, costă de regulă 8.000–25.000 lei. Platformele cu plăți, abonamente sau multe tipuri de utilizatori pornesc de la circa 30.000 lei. O specificație clară reduce diferențele mari dintre oferte.",
      },
      {
        q: "Cât durează dezvoltarea unui proiect web?",
        a: "Un landing page personalizat se poate livra în 1–2 săptămâni, iar o aplicație web de complexitate medie durează de obicei 1–3 luni. Termenul crește dacă cerințele se schimbă pe parcurs, așa că merită să stabilești o primă versiune minimă și să adaugi funcții după lansare.",
      },
      {
        q: "Ce tehnologie să aleg: React, PHP sau WordPress?",
        a: "Pentru site-uri de conținut, WordPress este adesea suficient și ușor de administrat. Pentru aplicații cu multă interacțiune, React sau Next.js sunt alegeri frecvente, iar Laravel (PHP) e potrivit pentru backend-uri clasice. Lasă programatorul să recomande, dar cere-i să explice de ce și cât de ușor găsești pe altcineva care să preia proiectul.",
      },
      {
        q: "Am nevoie de un caiet de sarcini înainte să cer oferte?",
        a: "Nu e obligatoriu, dar o descriere a funcțiilor principale, câteva exemple de site-uri care îți plac și bugetul aproximativ te ajută să primești oferte comparabile. Pe Contractez poți descrie proiectul cu cuvintele tale, iar platforma te ajută să îl structurezi.",
      },
    ],
  },

  "site-prezentare": {
    seoTitle: "Site de prezentare: cât costă și cum alegi web designerul",
    metaDescription:
      "Site de prezentare pe WordPress, Webflow sau Wix pentru firma ta. Postezi proiectul gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Un site de prezentare arată cine ești, ce servicii oferi și cum te pot contacta clienții: pagini de tip Despre, Servicii, Portofoliu, Contact și, uneori, un blog. Ai nevoie de el când îți lansezi firma, când site-ul vechi nu mai arată bine pe telefon sau când vrei un landing page pentru o campanie anume.",
      "Pe Contractez descrii ce fel de site vrei și ce pagini ar trebui să aibă, iar platforma te ajută să structurezi cererea. Proiectul este trimis doar prestatorilor compatibili și primești maximum 5 oferte, pe care le poți extinde dacă vrei mai multe variante. Postarea e gratuită, iar prețul și plata le negociezi direct cu prestatorul ales.",
    ],
    prices: [
      { item: "Landing page pe o singură pagină", range: "800–2.500 lei" },
      { item: "Site de prezentare WordPress (5–8 pagini)", range: "2.500–7.500 lei" },
      { item: "Site cu design personalizat și animații", range: "6.000–12.000 lei" },
      { item: "Refacere site vechi (design nou, conținut preluat)", range: "2.000–6.000 lei" },
      { item: "Mentenanță lunară (actualizări, backup)", range: "150–400 lei/lună" },
    ],
    priceFactors: [
      "Numărul de pagini și dacă textele și pozele sunt gata",
      "Design pe șablon sau design realizat de la zero",
      "Funcții extra: formulare, rezervări, multilingv, blog",
      "Optimizarea de bază pentru SEO și viteza de încărcare",
    ],
    checklist: [
      "Uită-te la 2–3 site-uri din portofoliu pe telefon, nu doar pe desktop",
      "Cere în oferta scrisă ce include prețul: pagini, texte, poze, domeniu, hosting",
      "Asigură-te că domeniul și hostingul sunt înregistrate pe numele tău",
      "Întreabă dacă primești o scurtă instruire ca să poți modifica singur textele",
      "Cere factură și stabilește plata în tranșe legate de etape",
    ],
    faq: [
      {
        q: "Cât costă un site de prezentare?",
        a: "Un site de prezentare pe WordPress, cu 5–8 pagini, costă de obicei 2.500–7.500 lei. Un landing page simplu pornește de la circa 800 lei, iar un design complet personalizat poate trece de 10.000 lei. Domeniul și hostingul se plătesc separat, anual.",
      },
      {
        q: "Cât durează realizarea unui site de prezentare?",
        a: "Între 2 și 6 săptămâni, în funcție de numărul de pagini și de cât de repede trimiți textele și fotografiile. Cele mai multe întârzieri vin din conținutul care nu e gata, așa că pregătește-l din timp.",
      },
      {
        q: "WordPress, Webflow sau Wix: ce să aleg?",
        a: "WordPress oferă multă flexibilitate și mulți prestatori care îl cunosc. Webflow este potrivit pentru design personalizat fără cod complicat, iar Wix e simplu de administrat, dar mai greu de mutat în altă parte. Alege platforma pe care o poți întreține ușor după lansare.",
      },
      {
        q: "Cât costă întreținerea unui site după lansare?",
        a: "Domeniul .ro costă în jur de 30–75 lei pe an, iar hostingul pentru un site mic circa 100–500 lei pe an. Dacă vrei ca cineva să facă actualizări și backup, un pachet de mentenanță pornește de la circa 150 lei pe lună.",
      },
    ],
  },

  "magazin-online": {
    seoTitle: "Magazin online: cât costă și cum alegi dezvoltatorul",
    metaDescription:
      "Magazin online pe WooCommerce, Shopify sau PrestaShop, cu plăți și curierat integrate. Postezi gratuit și primești oferte verificate.",
    intro: [
      "Realizarea unui magazin online include catalogul de produse, coșul de cumpărături, plata cu cardul, integrarea cu firmele de curierat, facturarea și paginile legale obligatorii. Ai nevoie de acest serviciu când vrei să vinzi online pentru prima dată, când muți magazinul pe o altă platformă sau când volumul de comenzi cere automatizări noi.",
      "Pe Contractez descrii ce vinzi, câte produse ai și ce integrări îți trebuie, iar platforma te ajută să ordonezi cererea. Primești cel mult 5 oferte de la dezvoltatori compatibili, verificați prin email, telefon și, când au firmă, în registrul ANAF. Datele tale de contact rămân ascunse până alegi, iar plata o stabilești direct cu prestatorul.",
    ],
    prices: [
      { item: "Magazin WooCommerce pe temă existentă (până la 100 de produse)", range: "4.000–10.000 lei" },
      { item: "Magazin Shopify configurat complet", range: "3.500–9.000 lei", note: "fără abonamentul lunar Shopify" },
      { item: "Magazin cu design personalizat și integrări multiple", range: "12.000–30.000 lei" },
      { item: "Integrare procesator de plăți sau curier", range: "500–2.000 lei", note: "per integrare" },
      { item: "Import produse și migrare de pe altă platformă", range: "1.000–5.000 lei" },
    ],
    priceFactors: [
      "Numărul de produse și variante (mărimi, culori)",
      "Integrările: plăți, curierat, facturare, ERP sau stocuri",
      "Design pe temă existentă sau realizat de la zero",
      "Cine încarcă produsele: tu sau prestatorul",
    ],
    checklist: [
      "Testează în portofoliu un magazin făcut de prestator, inclusiv procesul de comandă",
      "Cere în oferta scrisă lista exactă de integrări și pagini legale incluse",
      "Întreabă cine se ocupă de actualizări și cât costă mentenanța după lansare",
      "Verifică dacă prestatorul are experiență cu procesatorul de plăți și curierii pe care îi folosești",
      "Cere factură și păstrează accesul de administrator pe numele tău",
    ],
    faq: [
      {
        q: "Cât costă un magazin online?",
        a: "Un magazin WooCommerce sau Shopify pe o temă existentă costă de obicei 4.000–10.000 lei. Dacă vrei design personalizat, multe integrări sau un catalog mare, prețul ajunge la 12.000–30.000 lei. Separat plătești hostingul sau abonamentul platformei și comisioanele procesatorului de plăți.",
      },
      {
        q: "WooCommerce sau Shopify?",
        a: "WooCommerce rulează pe WordPress, nu are abonament lunar și îți dă control complet, dar are nevoie de hosting și întreținere. Shopify are abonament lunar, însă se ocupă de hosting și actualizări. Pentru magazine mici, ambele variante funcționează bine, iar diferența ține de buget și de cât vrei să administrezi singur.",
      },
      {
        q: "Cât durează să fac un magazin online?",
        a: "Un magazin pe temă existentă poate fi gata în 3–6 săptămâni. Un proiect cu design personalizat și integrări cu ERP sau stocuri durează de obicei 2–4 luni. Încărcarea produselor și a pozelor e adesea etapa care ia cel mai mult timp.",
      },
      {
        q: "Am nevoie de firmă ca să deschid un magazin online?",
        a: "Pentru a vinde produse în mod regulat ai nevoie de o formă legală, de exemplu PFA sau SRL, și de paginile obligatorii: termeni și condiții, politica de confidențialitate, informații despre retur și link-urile către ANPC. Un dezvoltator cu experiență îți poate pregăti structura acestor pagini, dar conținutul juridic e bine să îl verifici cu un specialist.",
      },
    ],
  },

  "aplicatii-mobile": {
    seoTitle: "Aplicații mobile la comandă: prețuri și oferte verificate",
    metaDescription:
      "Aplicații mobile iOS și Android în Flutter, React Native, Swift sau Kotlin. Postezi proiectul gratuit și primești oferte verificate.",
    intro: [
      "Dezvoltarea de aplicații mobile acoperă aplicații pentru iOS și Android: de la un MVP pentru validarea unei idei, până la aplicații pentru clienții unei afaceri, cu cont, notificări, plăți sau rezervări. Ai nevoie de acest serviciu când lansezi un produs digital, când vrei o aplicație de fidelizare sau când trebuie să actualizezi o aplicație existentă.",
      "Pe Contractez descrii ideea în cuvintele tale, iar platforma te ajută să o structurezi într-o cerere pe care programatorii o pot estima. Proiectul ajunge doar la prestatori compatibili, iar tu primești maximum 5 oferte, cu opțiunea de a extinde selecția. Postarea nu costă nimic, iar prețul și modul de plată le stabilești direct cu cei aleși.",
    ],
    prices: [
      { item: "Prototip interactiv (design Figma, fără cod)", range: "2.000–6.000 lei" },
      { item: "MVP cross-platform (Flutter sau React Native)", range: "20.000–60.000 lei" },
      { item: "Aplicație completă cu backend și panou de administrare", range: "de la 60.000 lei" },
      { item: "Publicare în App Store și Google Play", range: "500–1.500 lei", note: "fără taxele de cont de developer" },
      { item: "Actualizări și mentenanță", range: "100–250 lei/oră" },
    ],
    priceFactors: [
      "Numărul de ecrane și funcții (login, plăți, hărți, notificări)",
      "Aplicație nativă separată pe iOS și Android sau cross-platform",
      "Backend-ul: există deja sau trebuie construit",
      "Designul UI/UX inclus sau primit gata",
    ],
    checklist: [
      "Cere link-uri către aplicații publicate în App Store sau Google Play",
      "Cere o estimare scrisă pe etape: design, dezvoltare, testare, publicare",
      "Stabilește ca aplicația să fie publicată din contul tău de developer",
      "Întreabă cum se fac actualizările după lansare și cât costă",
      "Verifică dacă prestatorul emite factură și cere un contract cu cedarea drepturilor asupra codului",
    ],
    faq: [
      {
        q: "Cât costă o aplicație mobilă?",
        a: "Un MVP cross-platform, cu funcțiile de bază, costă de regulă 20.000–60.000 lei. O aplicație completă, cu backend propriu, plăți și panou de administrare, pornește de la circa 60.000 lei. Prețul depinde mult de numărul de ecrane și de integrări.",
      },
      {
        q: "Cât durează să dezvolt o aplicație mobilă?",
        a: "Un MVP se poate lansa în 2–4 luni, iar o aplicație complexă durează 4–8 luni sau mai mult. Mai adaugă câteva zile pentru aprobarea în App Store, unde aplicația trece printr-o verificare înainte de publicare.",
      },
      {
        q: "Aplicație nativă sau cross-platform?",
        a: "Flutter și React Native permit un singur cod pentru iOS și Android, deci costuri mai mici și lansare mai rapidă. Aplicațiile native (Swift, Kotlin) sunt utile când ai nevoie de performanță ridicată sau de funcții speciale ale telefonului. Pentru majoritatea aplicațiilor de business, varianta cross-platform e suficientă.",
      },
      {
        q: "Ce costuri am după lansarea aplicației?",
        a: "Contul de developer Apple costă 99 de dolari pe an, iar cel Google Play are o taxă unică de 25 de dolari. La acestea se adaugă serverul sau serviciile cloud pentru backend și actualizările periodice cerute de noile versiuni de iOS și Android.",
      },
    ],
  },

  "backend-api": {
    seoTitle: "Programator backend și API: prețuri și oferte verificate",
    metaDescription:
      "Programatori backend în Python, Java, .NET sau Go pentru API-uri, baze de date și integrări. Postezi gratuit, primești oferte verificate.",
    intro: [
      "Serviciile de backend și API se ocupă de partea care nu se vede a unei aplicații: logica de business, bazele de date, autentificarea, integrările cu alte sisteme și performanța sub încărcare. Ai nevoie de un programator backend când construiești o aplicație nouă, când conectezi sisteme care nu comunică între ele sau când o bază de date a devenit prea lentă.",
      "Pe Contractez descrii sistemul și problema pe care vrei să o rezolvi, iar platforma te ajută să o structurezi. Cererea ajunge doar la programatori compatibili, verificați prin email, telefon și, dacă au firmă, în registrul ANAF. Primești cel mult 5 oferte și poți extinde selecția. Postarea e gratuită, iar plata o convii direct cu prestatorul.",
    ],
    prices: [
      { item: "API REST simplu (câteva resurse, autentificare)", range: "4.000–12.000 lei" },
      { item: "Integrare între două sisteme (ERP, CRM, magazin)", range: "2.000–8.000 lei" },
      { item: "Proiectare și optimizare bază de date", range: "1.500–6.000 lei" },
      { item: "Backend complet pentru aplicație web sau mobilă", range: "de la 15.000 lei" },
      { item: "Programator backend senior", range: "120–300 lei/oră" },
    ],
    priceFactors: [
      "Volumul de date și numărul de utilizatori simultani",
      "Numărul de integrări externe și calitatea documentației lor",
      "Cerințele de securitate și de conformitate GDPR",
      "Starea codului existent, dacă e un sistem preluat",
    ],
    checklist: [
      "Cere exemple de API-uri sau sisteme similare și întreabă ce rol a avut prestatorul",
      "Cere documentația API-ului ca livrabil (de exemplu OpenAPI/Swagger)",
      "Stabilește în estimarea scrisă cum se face testarea și ce acoperire au testele",
      "Asigură-te că accesul la servere și baze de date rămâne pe contul tău",
      "Verifică dacă poate emite factură și semnează un acord de confidențialitate pentru date sensibile",
    ],
    faq: [
      {
        q: "Cât costă dezvoltarea unui API?",
        a: "Un API REST simplu, cu câteva resurse și autentificare, costă de obicei 4.000–12.000 lei. Un backend complet pentru o aplicație, cu roluri, plăți și integrări, pornește de la circa 15.000 lei. Documentația și testele automate ar trebui incluse în preț.",
      },
      {
        q: "Ce limbaj să aleg pentru backend?",
        a: "Python (Django), Node.js, Java, C# (.NET) și Go sunt toate opțiuni solide pentru majoritatea proiectelor. Alegerea ține mai mult de echipa care va întreține sistemul și de ce folosești deja. Cere programatorului să îți explice de ce recomandă o anumită tehnologie.",
      },
      {
        q: "Cât durează o integrare între două sisteme?",
        a: "O integrare simplă, între două aplicații cu API-uri bine documentate, durează de obicei 1–3 săptămâni. Dacă unul dintre sisteme nu are API sau documentația lipsește, timpul poate crește semnificativ.",
      },
      {
        q: "Pot angaja un programator backend pe oră?",
        a: "Da, mulți programatori lucrează pe oră, de obicei între 120 și 300 de lei pentru nivel mediu și senior. E o variantă potrivită pentru mentenanță și sarcini greu de estimat. Pentru proiecte clare, un preț fix pe etape îți dă mai multă predictibilitate.",
      },
    ],
  },

  "automatizari-ai": {
    seoTitle: "Automatizări și integrare AI: prețuri și oferte verificate",
    metaDescription:
      "Chatboți, integrări ChatGPT, automatizări Make, Zapier sau n8n și web scraping. Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Automatizările și integrările AI preiau munca repetitivă: preluarea comenzilor în tabele, trimiterea automată de emailuri, chatboți care răspund clienților, extragerea de date din documente sau de pe site-uri. Ai nevoie de acest serviciu când pierzi ore cu copierea datelor între aplicații sau când vrei să folosești ChatGPT direct în procesele firmei.",
      "Pe Contractez explici ce proces vrei să automatizezi, chiar fără termeni tehnici, iar platforma te ajută să structurezi cererea. Primești maximum 5 oferte, doar de la specialiști compatibili, și poți cere mai multe dacă vrei. Postarea e gratuită, datele de contact rămân ascunse până alegi, iar recenziile vin doar după colaborări confirmate.",
    ],
    prices: [
      { item: "Automatizare simplă în Make, Zapier sau n8n (2–3 aplicații)", range: "500–2.500 lei" },
      { item: "Chatbot pentru site cu răspunsuri din documentele firmei", range: "2.000–8.000 lei" },
      { item: "Integrare ChatGPT / OpenAI într-o aplicație existentă", range: "2.500–10.000 lei" },
      { item: "Script de web scraping", range: "800–4.000 lei", note: "în funcție de numărul de site-uri" },
      { item: "Model de machine learning personalizat", range: "de la 10.000 lei" },
    ],
    priceFactors: [
      "Numărul de aplicații conectate și de pași în flux",
      "Volumul de date și costurile lunare ale platformelor sau ale API-ului AI",
      "Cât de bine trebuie să înțeleagă chatbotul domeniul tău",
      "Mentenanța: fluxurile se pot strica la schimbări în aplicațiile conectate",
    ],
    checklist: [
      "Cere o demonstrație sau un video cu o automatizare similară făcută de prestator",
      "Cere o estimare scrisă care include și costurile lunare ale platformelor folosite",
      "Întreabă cum sunt protejate datele clienților și unde sunt trimise",
      "Stabilește ca fluxurile și cheile API să fie create în conturile tale",
      "Cere factură și o scurtă documentație despre cum funcționează automatizarea",
    ],
    faq: [
      {
        q: "Cât costă un chatbot pentru site?",
        a: "Un chatbot care răspunde pe baza documentelor și a întrebărilor frecvente ale firmei costă de obicei 2.000–8.000 lei pentru configurare. La asta se adaugă costul lunar al API-ului AI, care depinde de numărul de conversații. Cere prestatorului o estimare a acestui cost înainte de a începe.",
      },
      {
        q: "Make, Zapier sau n8n: ce să aleg?",
        a: "Zapier e simplu, dar devine scump la volume mari. Make oferă mai multă flexibilitate la un preț mai mic, iar n8n poate rula pe propriul server, util când vrei control asupra datelor. Un specialist îți poate recomanda varianta potrivită pentru volumul tău.",
      },
      {
        q: "Este legal web scraping-ul?",
        a: "Colectarea datelor publice e permisă în multe situații, dar trebuie să respecți termenii site-urilor sursă și regulile GDPR când e vorba de date personale. Discută cu prestatorul ce date colectezi și în ce scop, iar pentru cazuri neclare cere o opinie juridică.",
      },
      {
        q: "Cât durează implementarea unei automatizări?",
        a: "O automatizare simplă între câteva aplicații poate fi gata în câteva zile. Un chatbot antrenat pe documentele firmei sau o integrare AI într-o aplicație existentă durează de obicei 2–6 săptămâni, inclusiv testarea.",
      },
    ],
  },

  "devops-cloud": {
    seoTitle: "DevOps și administrare cloud: prețuri și oferte verificate",
    metaDescription:
      "Specialiști DevOps pentru AWS, Azure, Google Cloud, Docker, CI/CD și servere Linux. Postezi proiectul gratuit și primești oferte verificate.",
    intro: [
      "Serviciile DevOps și cloud acoperă configurarea serverelor, migrarea în AWS, Azure sau Google Cloud, containerizarea cu Docker, pipeline-uri CI/CD, monitorizare și backup. Ai nevoie de ele când aplicația crește și serverul nu mai face față, când factura de cloud e prea mare sau când vrei ca fiecare actualizare să ajungă în producție fără intervenții manuale.",
      "Pe Contractez descrii infrastructura actuală și ce vrei să obții, iar platforma te ajută să structurezi cererea. Proiectul ajunge doar la specialiști compatibili, verificați prin email, telefon și, dacă au firmă, în registrul ANAF. Primești cel mult 5 oferte și poți extinde selecția. Postarea e gratuită, iar prețul îl stabilești direct cu prestatorul.",
    ],
    prices: [
      { item: "Configurare server Linux (VPS) cu securizare de bază", range: "500–2.000 lei" },
      { item: "Containerizare aplicație cu Docker", range: "1.000–4.000 lei" },
      { item: "Pipeline CI/CD (GitHub Actions, GitLab CI)", range: "1.500–5.000 lei" },
      { item: "Migrare în cloud (AWS, Azure, Google Cloud)", range: "3.000–20.000 lei" },
      { item: "Administrare servere", range: "500–3.000 lei/lună", note: "în funcție de numărul de servere" },
    ],
    priceFactors: [
      "Numărul de servere, servicii și medii (test, producție)",
      "Cerințele de disponibilitate, backup și securitate",
      "Complexitatea migrării și timpul de nefuncționare acceptat",
      "Intervenția în afara programului sau în regim de urgență",
    ],
    checklist: [
      "Întreabă de proiecte similare și, unde e relevant, de certificări cloud (AWS, Azure, Google Cloud)",
      "Cere o estimare scrisă cu pașii migrării și un plan de revenire dacă ceva nu merge",
      "Asigură-te că toate conturile cloud și cheile de acces sunt pe numele firmei tale",
      "Cere documentație despre infrastructură, ca să o poată prelua și altcineva",
      "Verifică dacă poate emite factură și stabilește clar timpul de răspuns la incidente",
    ],
    faq: [
      {
        q: "Cât costă un specialist DevOps?",
        a: "Pentru proiecte punctuale, un specialist DevOps lucrează de obicei la 120–300 lei pe oră sau la preț fix, de exemplu 1.500–5.000 lei pentru un pipeline CI/CD. Administrarea continuă a serverelor se plătește lunar, de la circa 500 lei pentru o infrastructură mică.",
      },
      {
        q: "Merită să mut aplicația în cloud?",
        a: "Cloud-ul are sens când ai trafic variabil, nevoie de scalare sau de servicii gestionate, cum ar fi baze de date cu backup automat. Pentru aplicații mici, cu trafic constant, un VPS bine configurat e adesea mai ieftin. Un specialist îți poate face o estimare a costurilor lunare pentru ambele variante.",
      },
      {
        q: "Cât durează o migrare în cloud?",
        a: "O aplicație simplă se poate migra în câteva zile, iar o infrastructură cu mai multe servicii și baze de date mari durează de obicei câteva săptămâni. Cere un plan care să includă testarea înainte de mutarea traficului real.",
      },
      {
        q: "Pot reduce factura de cloud?",
        a: "De multe ori da, prin redimensionarea serverelor, oprirea resurselor nefolosite și alegerea planurilor cu angajament. Un audit al costurilor făcut de un specialist DevOps îți arată unde pierzi bani și ce poți schimba fără să afectezi aplicația.",
      },
    ],
  },

  "suport-it": {
    seoTitle: "Suport IT și rețelistică: prețuri și tehnicieni verificați",
    metaDescription:
      "Instalare rețele, configurare routere, reparații calculatoare și recuperare date. Postezi gratuit și primești oferte de la tehnicieni verificați.",
    intro: [
      "Suportul IT și rețelistica acoperă instalarea și configurarea rețelelor în casă sau la birou, routere și Wi-Fi, reparații de calculatoare și laptopuri, recuperarea datelor și măsuri de securitate cibernetică. Ai nevoie de un tehnician când internetul nu acoperă toată locuința, când deschizi un birou nou, când un calculator nu mai pornește sau când ai pierdut fișiere importante.",
      "Pe Contractez descrii problema sau ce vrei să instalezi, iar platforma te ajută să structurezi cererea. Primești maximum 5 oferte, doar de la tehnicieni compatibili, verificați prin email, telefon și, dacă au firmă, în registrul ANAF. Postarea e gratuită, iar datele tale de contact rămân ascunse până alegi prestatorul. Plata o stabilești direct cu el.",
    ],
    prices: [
      { item: "Configurare router și rețea Wi-Fi acasă", range: "150–400 lei" },
      { item: "Rețea de birou cablată (până la 10 posturi)", range: "1.500–5.000 lei", note: "manopera, fără echipamente" },
      { item: "Reinstalare sistem de operare și programe", range: "100–250 lei" },
      { item: "Curățare și diagnosticare laptop", range: "100–300 lei" },
      { item: "Recuperare date de pe hard disk sau SSD", range: "300–2.500 lei", note: "în funcție de tipul defecțiunii" },
      { item: "Abonament suport IT pentru firme mici", range: "500–2.500 lei/lună" },
    ],
    priceFactors: [
      "Deplasarea la domiciliu sau la birou versus lucrul la distanță",
      "Numărul de posturi și suprafața de acoperit cu rețea",
      "Tipul defecțiunii, în special la recuperarea datelor",
      "Urgența și intervențiile în afara programului",
    ],
    checklist: [
      "Cere un diagnostic și o estimare scrisă înainte de orice reparație",
      "Întreabă dacă piesele și echipamentele sunt incluse în preț sau separate",
      "La recuperarea datelor, întreabă dacă plătești și în cazul în care datele nu pot fi salvate",
      "Cere factură și garanție pentru piesele montate și pentru manoperă",
      "Pentru firme, stabilește în scris timpul de răspuns la incidente",
    ],
    faq: [
      {
        q: "Cât costă un tehnician IT la domiciliu?",
        a: "O intervenție simplă la domiciliu, cum ar fi configurarea routerului sau reinstalarea sistemului de operare, costă de obicei 100–400 lei. Unii tehnicieni percep separat deplasarea. Multe probleme de software se pot rezolva și la distanță, la un cost mai mic.",
      },
      {
        q: "Cât costă recuperarea datelor de pe un hard disk?",
        a: "Pentru defecte logice, cum ar fi ștergerea accidentală sau formatarea, prețul este de obicei 300–800 lei. Dacă hard disk-ul are defecte fizice, recuperarea se face în laborator și poate ajunge la 1.000–2.500 lei sau mai mult. Oprește imediat folosirea dispozitivului ca să nu scazi șansele de recuperare.",
      },
      {
        q: "De ce nu am semnal Wi-Fi în toată casa?",
        a: "Pereții groși, distanța față de router și interferențele sunt cauzele obișnuite. Soluțiile sunt un sistem mesh, puncte de acces cablate sau mutarea routerului. Un tehnician poate măsura semnalul și îți poate recomanda echipamentele potrivite.",
      },
      {
        q: "Am nevoie de suport IT permanent pentru o firmă mică?",
        a: "Dacă ai mai multe calculatoare, un server sau date de clienți, un abonament lunar de suport te ajută să previi problemele, nu doar să le repari. Pentru birouri foarte mici, intervențiile la cerere pot fi suficiente. Compară costul lunar cu cel al opririlor neplanificate.",
      },
    ],
  },

  "testare-qa": {
    seoTitle: "Testare software și QA: prețuri și testeri verificați",
    metaDescription:
      "Testare manuală și automată cu Playwright sau Selenium pentru site-uri și aplicații. Postezi gratuit și primești oferte de la testeri verificați.",
    intro: [
      "Testarea software verifică dacă un site sau o aplicație funcționează corect înainte să ajungă la utilizatori: fluxuri de comandă, formulare, compatibilitate pe telefoane și browsere, plus teste automate care rulează la fiecare actualizare. Ai nevoie de un tester când pregătești o lansare, când utilizatorii raportează erori sau când vrei să schimbi codul fără teama că strici ceva.",
      "Pe Contractez descrii aplicația și ce vrei să fie testat, iar platforma te ajută să structurezi cererea. Proiectul este trimis doar testerilor compatibili, iar tu primești cel mult 5 oferte, cu posibilitatea de a extinde selecția. Postarea e gratuită, iar prețul și plata le stabilești direct cu prestatorul ales.",
    ],
    prices: [
      { item: "Testare manuală a unui site înainte de lansare", range: "800–3.000 lei" },
      { item: "Testare aplicație mobilă pe mai multe dispozitive", range: "1.500–5.000 lei" },
      { item: "Set de teste automate end-to-end (Playwright, Selenium)", range: "3.000–12.000 lei" },
      { item: "Raport de bug-uri pentru o funcție nouă", range: "300–1.000 lei" },
      { item: "Tester QA", range: "60–180 lei/oră", note: "manual sau automat" },
    ],
    priceFactors: [
      "Numărul de fluxuri, ecrane și roluri de testat",
      "Testare manuală sau scrierea de teste automate",
      "Numărul de browsere și dispozitive incluse",
      "Existența unei documentații cu cerințele aplicației",
    ],
    checklist: [
      "Cere un exemplu de raport de bug-uri sau de plan de testare anonimizat",
      "Stabilește în estimarea scrisă ce fluxuri, browsere și dispozitive se testează",
      "Pentru teste automate, întreabă cum se integrează în pipeline-ul tău CI/CD",
      "Asigură-te că testerul lucrează pe un mediu de test, nu pe datele reale ale clienților",
      "Verifică dacă poate emite factură",
    ],
    faq: [
      {
        q: "Cât costă testarea unui site?",
        a: "Testarea manuală a unui site de prezentare sau a unui magazin mic costă de obicei 800–3.000 lei. Prețul crește cu numărul de fluxuri și de dispozitive testate. Primești un raport cu erorile găsite, pașii de reproducere și capturi de ecran.",
      },
      {
        q: "Testare manuală sau automată?",
        a: "Testarea manuală e potrivită înainte de o lansare și pentru verificarea experienței utilizatorului. Testele automate costă mai mult la început, dar merită când actualizezi aplicația des, pentru că verifică repede funcțiile principale la fiecare modificare.",
      },
      {
        q: "Cât durează testarea unei aplicații?",
        a: "Testarea manuală a unei aplicații de dimensiune medie durează de obicei 3–10 zile lucrătoare. Scrierea unui set de teste automate pentru fluxurile principale poate lua 2–4 săptămâni.",
      },
      {
        q: "Am nevoie de tester dacă programatorul își testează singur codul?",
        a: "Programatorii testează de regulă ce au construit, dar un tester extern vede aplicația ca un utilizator și găsește erori pe care autorul le scapă. Pentru lansări importante sau aplicații cu plăți, o rundă de testare independentă e o investiție rezonabilă.",
      },
    ],
  },

  "design-creatie": {
    seoTitle: "Designeri grafici și servicii creative: prețuri și oferte",
    metaDescription:
      "Găsește designeri pentru logo, UI/UX, print, ilustrație și randări 3D. Postezi proiectul gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Categoria Design & Creație reunește serviciile vizuale de care are nevoie o afacere sau un proiect personal: logo și identitate vizuală, design de site-uri și aplicații, materiale tipărite, ilustrații și randări 3D. Ai nevoie de un designer când îți lansezi brandul, când pregătești materiale pentru un eveniment sau când vrei să arăți cum va arăta un spațiu înainte să îl amenajezi.",
      "Pe Contractez descrii ce vrei să obții, chiar dacă nu știi încă stilul exact, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la designeri compatibili, verificați prin email, telefon și, dacă au firmă, în registrul ANAF. Prețul și plata le stabilești direct cu designerul ales.",
    ],
    prices: [
      { item: "Logo profesional cu fișiere sursă", range: "500–2.500 lei" },
      { item: "Design UI pentru un site (5–8 pagini)", range: "2.500–8.000 lei" },
      { item: "Flyer sau afiș", range: "150–500 lei" },
      { item: "Ilustrație digitală", range: "300–1.500 lei", note: "per ilustrație" },
      { item: "Randare 3D interior", range: "250–600 lei", note: "per imagine" },
    ],
    faq: [
      {
        q: "Cât costă un designer grafic?",
        a: "Depinde mult de livrabil: un flyer pornește de la circa 150 lei, un logo profesional costă de obicei 500–2.500 lei, iar o identitate vizuală completă trece de 3.000 lei. Mulți designeri lucrează și pe oră, de regulă 80–200 lei. Cere o ofertă cu numărul de revizii incluse.",
      },
      {
        q: "Ce fișiere trebuie să primesc de la designer?",
        a: "Pentru logo și materiale de brand, cere fișiere vectoriale (AI, SVG sau PDF) plus variante PNG pentru online. Pentru print, ai nevoie de PDF pregătit pentru tipar, cu margini de tăiere. Pentru UI, cere acces la fișierul Figma.",
      },
      {
        q: "Cine deține drepturile asupra designului?",
        a: "Stabilește în scris că drepturile de utilizare sau de autor îți sunt cedate după plata integrală. Fără o clauză clară, designerul poate rămâne titularul drepturilor. Cere și confirmarea că fonturile și imaginile folosite au licențe care permit uz comercial.",
      },
    ],
  },

  "logo-identitate": {
    seoTitle: "Logo profesional: cât costă și cum alegi designerul",
    metaDescription:
      "Logo și identitate vizuală pentru firma ta: brand book, cărți de vizită, fișiere vectoriale. Postezi gratuit și primești oferte verificate.",
    intro: [
      "Designul de logo și identitate vizuală înseamnă mai mult decât un simbol: include paleta de culori, fonturile, variantele de logo pentru online și print, cărțile de vizită și, la proiectele complete, un brand book cu reguli de folosire. Ai nevoie de el când îți deschizi firma, când faci rebranding sau când vrei ca toate materialele să arate unitar.",
      "Pe Contractez descrii afacerea, publicul și stilul care îți place, iar platforma te ajută să transformi ideile într-o cerere clară. Primești maximum 5 oferte de la designeri compatibili și poți extinde selecția dacă vrei să vezi mai multe portofolii. Postarea e gratuită, iar datele de contact rămân ascunse până alegi designerul.",
    ],
    prices: [
      { item: "Logo simplu (2–3 propuneri, fișiere vectoriale)", range: "300–800 lei" },
      { item: "Logo profesional cu cercetare și variante", range: "800–2.500 lei" },
      { item: "Identitate vizuală completă cu brand book", range: "3.000–10.000 lei" },
      { item: "Design cărți de vizită", range: "100–300 lei", note: "față-verso, fără tipar" },
      { item: "Rebranding sau modernizare logo existent", range: "500–2.000 lei" },
    ],
    priceFactors: [
      "Numărul de propuneri inițiale și de runde de revizii",
      "Livrabilele: doar logo sau identitate completă cu brand book",
      "Cercetarea pieței și a concurenței înainte de schițe",
      "Experiența designerului și termenul de livrare",
    ],
    checklist: [
      "Uită-te în portofoliu la logo-uri pentru domenii apropiate de al tău și la cum arată aplicate",
      "Cere în oferta scrisă numărul de propuneri, de revizii și formatele de fișiere livrate",
      "Stabilește cedarea drepturilor de autor după plata integrală",
      "Întreabă dacă fonturile folosite au licență pentru uz comercial",
      "Cere factură, mai ales dacă logo-ul e pentru o firmă",
    ],
    faq: [
      {
        q: "Cât costă un logo?",
        a: "Un logo simplu de la un designer freelance costă de obicei 300–800 lei, iar un logo profesional, cu cercetare și mai multe variante, 800–2.500 lei. O identitate vizuală completă, cu brand book, pornește de la circa 3.000 lei. Prețurile foarte mici înseamnă adesea un șablon refolosit.",
      },
      {
        q: "Cât durează realizarea unui logo?",
        a: "De regulă 1–3 săptămâni, de la brief până la fișierele finale. Primele propuneri vin de obicei în câteva zile, iar restul timpului se duce pe revizii. O identitate vizuală completă durează 3–6 săptămâni.",
      },
      {
        q: "Ce formate de fișiere trebuie să primesc?",
        a: "Ai nevoie de fișiere vectoriale (AI, SVG, EPS sau PDF) pentru print și materiale mari, plus PNG cu fundal transparent pentru online. Cere variante color, alb-negru și pe fundal închis, precum și codurile exacte de culoare.",
      },
      {
        q: "Pot înregistra logo-ul ca marcă la OSIM?",
        a: "Da, iar înainte de asta e bine să verifici dacă există mărci similare deja înregistrate. Pentru înregistrare ai nevoie de drepturile asupra logo-ului, deci asigură-te că designerul ți le cedează în scris.",
      },
    ],
  },

  "ui-ux": {
    seoTitle: "Designer UI/UX: prețuri pentru site-uri și aplicații",
    metaDescription:
      "Designeri UI/UX în Figma pentru site-uri și aplicații: wireframes, prototipuri, design complet. Postezi gratuit și primești oferte verificate.",
    intro: [
      "Designul UI/UX stabilește cum arată și cum se folosește un site sau o aplicație: structura paginilor, fluxurile utilizatorului, wireframes, prototipuri interactive și designul final, pregătit pentru programatori. Ai nevoie de un designer UI/UX înainte să începi dezvoltarea unui produs digital, când utilizatorii se pierd în aplicația actuală sau când vrei un redesign al site-ului.",
      "Pe Contractez descrii produsul și cine îl folosește, iar platforma te ajută să structurezi cererea. Proiectul ajunge doar la designeri compatibili și primești cel mult 5 oferte, cu opțiunea de a extinde selecția. Designerii sunt verificați prin email, telefon și, dacă au firmă, în registrul ANAF. Prețul și plata le stabilești direct cu cel ales.",
    ],
    prices: [
      { item: "Wireframes pentru un site (5–8 pagini)", range: "1.000–3.000 lei" },
      { item: "Design UI complet pentru site de prezentare", range: "2.500–8.000 lei" },
      { item: "Design aplicație mobilă (15–30 de ecrane)", range: "5.000–15.000 lei" },
      { item: "Audit UX al unui site sau al unei aplicații", range: "1.500–5.000 lei" },
      { item: "Designer UI/UX", range: "100–250 lei/oră" },
    ],
    priceFactors: [
      "Numărul de ecrane, stări și variante responsive",
      "Cercetarea cu utilizatori și testarea prototipului",
      "Crearea unui design system reutilizabil",
      "Nivelul de detaliu cerut la predarea către programatori",
    ],
    checklist: [
      "Cere studii de caz din portofoliu care arată procesul, nu doar ecranele finale",
      "Stabilește în estimarea scrisă numărul de ecrane, de revizii și dacă include prototip",
      "Cere acces la fișierul Figma pe contul tău sau transferul lui la final",
      "Întreabă cum colaborează cu programatorii la predarea designului",
      "Verifică dacă emite factură și cere cedarea drepturilor asupra designului",
    ],
    faq: [
      {
        q: "Cât costă designul UI/UX pentru o aplicație?",
        a: "Pentru o aplicație mobilă cu 15–30 de ecrane, designul UI/UX costă de obicei 5.000–15.000 lei. Prețul include de regulă wireframes, design final și un prototip interactiv. Cercetarea cu utilizatori reali se plătește adesea separat.",
      },
      {
        q: "Care e diferența dintre UI și UX?",
        a: "UX se ocupă de structură și de fluxuri: ce pași face utilizatorul și cât de ușor își atinge scopul. UI se ocupă de aspectul vizual: culori, fonturi, butoane, spațiere. În practică, majoritatea designerilor freelance le livrează pe amândouă.",
      },
      {
        q: "Cât durează designul unui site sau al unei aplicații?",
        a: "Designul unui site de prezentare durează de obicei 2–4 săptămâni, iar al unei aplicații de complexitate medie 4–8 săptămâni. Feedbackul rapid pe fiecare etapă scurtează mult termenul.",
      },
      {
        q: "Am nevoie de design UI/UX dacă folosesc un șablon?",
        a: "Pentru un site mic, un șablon bine ales poate fi suficient. Pentru aplicații sau produse cu fluxuri specifice, un design gândit pentru utilizatorii tăi reduce erorile și costurile de modificare din timpul programării.",
      },
    ],
  },

  "grafica-print": {
    seoTitle: "Grafică și design print: flyere, afișe și ambalaje",
    metaDescription:
      "Designeri pentru flyere, afișe, bannere, ambalaje și materiale tipărite. Postezi proiectul gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Grafica pentru print și online include flyere, afișe, broșuri, meniuri, bannere, roll-up-uri, ambalaje și etichete, dar și vizualuri pentru social media sau reclame. Ai nevoie de un designer grafic când pregătești un eveniment, lansezi un produs nou, deschizi un local sau vrei materiale promoționale care să arate unitar cu brandul tău.",
      "Pe Contractez descrii materialele de care ai nevoie, dimensiunile și termenul, iar platforma te ajută să structurezi cererea. Primești maximum 5 oferte, doar de la designeri compatibili, și poți extinde selecția. Postarea nu costă nimic, datele tale de contact rămân ascunse până alegi, iar plata o stabilești direct cu designerul.",
    ],
    prices: [
      { item: "Flyer A5 sau A4 (față-verso)", range: "150–500 lei" },
      { item: "Afiș sau banner pentru eveniment", range: "200–600 lei" },
      { item: "Broșură sau catalog", range: "80–200 lei", note: "per pagină" },
      { item: "Design ambalaj sau etichetă produs", range: "800–4.000 lei" },
      { item: "Meniu restaurant", range: "400–1.500 lei" },
      { item: "Set vizualuri social media (10 postări)", range: "300–1.000 lei" },
    ],
    priceFactors: [
      "Numărul de materiale și de variante de dimensiuni",
      "Dacă textele, pozele și logo-ul sunt gata sau trebuie create",
      "Complexitatea: ilustrații, fotomontaje, machete de ambalaj",
      "Numărul de revizii și termenul de livrare",
    ],
    checklist: [
      "Uită-te în portofoliu la materiale tipărite reale, nu doar la machete",
      "Cere în oferta scrisă formatele livrate și dacă fișierul e pregătit pentru tipar (CMYK, margini de tăiere)",
      "Verifică cu tipografia specificațiile tehnice înainte ca designerul să înceapă",
      "Întreabă dacă imaginile și fonturile folosite au licență comercială",
      "Cere factură și fișierele sursă editabile, dacă vei mai modifica materialul",
    ],
    faq: [
      {
        q: "Cât costă designul unui flyer?",
        a: "Designul unui flyer A5 sau A4 costă de obicei 150–500 lei, în funcție de complexitate și de numărul de revizii. Tiparul se plătește separat la tipografie. Dacă ai deja logo, texte și poze, prețul scade.",
      },
      {
        q: "Ce trebuie să conțină un fișier pentru tipar?",
        a: "Fișierul trebuie să fie de regulă PDF, în modul de culoare CMYK, cu rezoluție de 300 dpi și margini de tăiere, de obicei 3 mm pe fiecare latură. Cere tipografiei specificațiile exacte și trimite-le designerului de la început.",
      },
      {
        q: "Cât durează designul pentru materiale tipărite?",
        a: "Un flyer sau un afiș se poate face în 2–5 zile lucrătoare, inclusiv o rundă de revizii. Un catalog sau un ambalaj durează de obicei 1–3 săptămâni. Lasă timp și pentru tipar, mai ales înainte de evenimente.",
      },
      {
        q: "Pot folosi același design și online?",
        a: "Da, dar e bine să ceri designerului și variante adaptate pentru online, în RGB și la dimensiunile rețelelor sociale. Un afiș gândit pentru print nu se citește întotdeauna bine pe ecranul unui telefon.",
      },
    ],
  },

  "ilustratie": {
    seoTitle: "Ilustrator freelance: prețuri pentru ilustrații și personaje",
    metaDescription:
      "Ilustratori pentru cărți de copii, personaje, ilustrații digitale și editoriale. Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Ilustrația acoperă imagini desenate pentru cărți, în special cele pentru copii, personaje și mascote pentru branduri, ilustrații editoriale pentru articole, imagini pentru site-uri, jocuri sau ambalaje. Ai nevoie de un ilustrator când vrei un stil vizual unic, pe care fotografiile sau imaginile de stoc nu îl pot oferi, sau când publici o carte și ai nevoie de imagini coerente.",
      "Pe Contractez descrii proiectul, stilul care îți place și numărul de ilustrații, iar platforma te ajută să structurezi cererea. Proiectul este trimis doar ilustratorilor compatibili și primești cel mult 5 oferte, cu posibilitatea de a extinde selecția. Postarea e gratuită, iar prețul, drepturile și plata le stabilești direct cu ilustratorul ales.",
    ],
    prices: [
      { item: "Ilustrație digitală simplă (spot, iconiță complexă)", range: "150–500 lei" },
      { item: "Ilustrație digitală complexă (scenă completă)", range: "500–1.500 lei" },
      { item: "Design personaj sau mascotă (cu mai multe poziții)", range: "800–3.000 lei" },
      { item: "Ilustrații carte pentru copii (24–32 de pagini)", range: "5.000–15.000 lei" },
      { item: "Copertă de carte ilustrată", range: "800–2.500 lei" },
    ],
    priceFactors: [
      "Nivelul de detaliu și tehnica (vectorial, pictură digitală, tradițional)",
      "Numărul de ilustrații și consistența personajelor între ele",
      "Drepturile de utilizare: o singură publicație sau uz comercial extins",
      "Numărul de schițe și revizii incluse",
    ],
    checklist: [
      "Alege un ilustrator al cărui stil din portofoliu seamănă deja cu ce vrei",
      "Cere în oferta scrisă etapele: schiță, culoare, final, și câte revizii are fiecare",
      "Stabilește clar drepturile de utilizare: unde, cât timp și dacă poți face produse derivate",
      "Pentru cărți, întreabă dacă ilustratorul a mai lucrat cu edituri sau tipografii",
      "Cere factură și fișiere în rezoluție mare, potrivite pentru tipar",
    ],
    faq: [
      {
        q: "Cât costă ilustrațiile pentru o carte de copii?",
        a: "Pentru o carte de 24–32 de pagini, ilustrațiile costă de obicei 5.000–15.000 lei, adică aproximativ 250–600 lei pe pagină ilustrată. Prețul depinde de nivelul de detaliu și de drepturile cedate. Coperta se negociază adesea separat.",
      },
      {
        q: "Cât durează ilustrarea unei cărți?",
        a: "O carte ilustrată pentru copii durează de regulă 2–4 luni, de la schițele personajelor până la fișierele finale. Ilustrațiile individuale se pot livra în câteva zile sau o săptămână, în funcție de complexitate.",
      },
      {
        q: "Cine deține drepturile asupra ilustrațiilor?",
        a: "Ilustratorul rămâne autorul, iar tu primești drepturile de utilizare stabilite în contract. Specifică clar dacă le poți folosi doar în carte sau și pe produse, reclame ori în traduceri. Cesiunea completă a drepturilor patrimoniale costă de obicei mai mult.",
      },
      {
        q: "Pot cere un stil anume sau să copiez un ilustrator cunoscut?",
        a: "Poți arăta exemple de stiluri care îți plac, ca referință, dar nu e corect să ceri copierea exactă a stilului unui alt artist. Cel mai bine e să alegi un ilustrator care lucrează deja într-un stil apropiat de ce cauți.",
      },
    ],
  },

  "design-3d": {
    seoTitle: "Randări 3D și design 3D: prețuri și oferte verificate",
    metaDescription:
      "Randări 3D pentru interioare, exterioare și produse, în Blender, 3ds Max sau SketchUp. Postezi gratuit și primești oferte verificate.",
    intro: [
      "Designul 3D și randările îți arată realist un spațiu sau un produs înainte să existe: amenajări interioare, fațade de case, ansambluri rezidențiale, mobilier la comandă sau produse pentru magazinul online. Ai nevoie de randări când renovezi și vrei să vezi rezultatul, când vinzi imobiliare din plan sau când prezinți un produs fără să organizezi o ședință foto.",
      "Pe Contractez descrii spațiul sau produsul, atașezi informațiile pe care le ai și spui câte imagini vrei, iar platforma te ajută să structurezi cererea. Primești maximum 5 oferte de la designeri 3D compatibili și poți extinde selecția. Postarea e gratuită, iar prețul și plata le stabilești direct cu prestatorul.",
    ],
    prices: [
      { item: "Randare interior (o cameră, o imagine)", range: "250–600 lei" },
      { item: "Proiect 3D complet pentru un apartament (3–4 camere)", range: "2.500–8.000 lei", note: "cu mai multe unghiuri pe cameră" },
      { item: "Randare exterior casă", range: "500–1.500 lei", note: "per imagine" },
      { item: "Modelare și randare produs", range: "200–800 lei", note: "per produs" },
      { item: "Animație sau tur virtual 3D", range: "de la 2.000 lei" },
    ],
    priceFactors: [
      "Suprafața, numărul de camere și de unghiuri cerute",
      "Dacă există deja un model 3D sau planuri exacte",
      "Nivelul de realism și rezoluția imaginilor finale",
      "Numărul de modificări după prima variantă",
    ],
    checklist: [
      "Cere în portofoliu randări din același tip de proiect: interior, exterior sau produs",
      "Trimite planuri cu cote, chiar și schițate, ca estimarea să fie corectă",
      "Cere o estimare scrisă cu numărul de imagini, rezoluția și reviziile incluse",
      "Întreabă dacă primești și fișierul 3D, util pentru modificări ulterioare",
      "Verifică dacă emite factură",
    ],
    faq: [
      {
        q: "Cât costă o randare 3D pentru interior?",
        a: "O randare pentru o cameră costă de obicei 250–600 lei pe imagine. Unii designeri calculează prețul pe metru pătrat, iar pentru un apartament întreg cu mai multe unghiuri pe cameră un proiect ajunge la 2.500–8.000 lei. Dacă ai deja un model 3D, prețul scade.",
      },
      {
        q: "Cât durează o randare 3D?",
        a: "O randare pentru o cameră se livrează de obicei în 3–5 zile lucrătoare, iar un apartament complet în 2–3 săptămâni. Urgențele sunt posibile, dar costă de regulă mai mult.",
      },
      {
        q: "Ce informații trebuie să îi dau designerului 3D?",
        a: "Planul cu dimensiuni, poziția ușilor, a ferestrelor și a instalațiilor, plus fotografii ale spațiului dacă există. Adaugă imagini de inspirație și, dacă le-ai ales deja, linkuri către mobilierul și finisajele dorite.",
      },
      {
        q: "Randarea 3D e același lucru cu un proiect de design interior?",
        a: "Nu întotdeauna. Unii prestatori doar vizualizează un concept primit de la tine, în timp ce un designer de interior propune și amenajarea, materialele și lista de cumpărături. Clarifică din cerere de ce ai nevoie.",
      },
    ],
  },

  "scris-traduceri": {
    seoTitle: "Copywriteri, traducători și corectori: prețuri și oferte",
    metaDescription:
      "Găsește copywriteri, autori de articole, traducători autorizați și corectori. Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Categoria Scris & Traduceri acoperă textele de care ai nevoie pentru afacere sau pentru acte: texte pentru site și reclame, articole de blog, traduceri simple sau autorizate, corectură și redactare. Ai nevoie de aceste servicii când lansezi un site, când vrei trafic din Google, când depui acte în altă țară sau când un document trebuie să fie impecabil.",
      "Pe Contractez descrii ce text sau ce document ai, în cuvintele tale, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la prestatori compatibili, verificați prin email, telefon și, dacă au firmă, în registrul ANAF. Prețul și plata le stabilești direct cu prestatorul ales.",
    ],
    prices: [
      { item: "Texte pentru un site de prezentare (5 pagini)", range: "800–2.500 lei" },
      { item: "Articol de blog SEO (circa 1.000 de cuvinte)", range: "150–400 lei" },
      { item: "Traducere autorizată engleză–română", range: "40–70 lei", note: "per pagină" },
      { item: "Corectură text", range: "15–35 lei", note: "per pagină" },
    ],
    faq: [
      {
        q: "Cum se calculează prețul unui text sau al unei traduceri?",
        a: "Textele se plătesc de obicei per articol, per pagină sau per proiect, iar traducerile per pagină standard, de regulă 2.000 de caractere cu spații. Pentru texte de vânzare contează mai mult complexitatea și cercetarea decât lungimea. Cere o ofertă pe baza textului concret.",
      },
      {
        q: "Când am nevoie de o traducere autorizată?",
        a: "Ai nevoie de traducere autorizată pentru acte depuse la instituții: diplome, certificate de stare civilă, cazier, contracte sau documente pentru angajare în străinătate. Ea se face de un traducător autorizat de Ministerul Justiției și poate fi apoi legalizată la notar, dacă instituția o cere.",
      },
      {
        q: "Cât durează să primesc textele?",
        a: "Un articol de blog se livrează de obicei în 2–5 zile, iar textele pentru un site în 1–2 săptămâni. Traducerile autorizate pentru acte scurte pot fi gata în 1–2 zile lucrătoare, iar urgențele costă în general mai mult.",
      },
    ],
  },

  "copywriting": {
    seoTitle: "Copywriter freelance: prețuri pentru texte site și reclame",
    metaDescription:
      "Copywriteri pentru texte de site, descrieri de produse, reclame și scripturi video. Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Copywritingul înseamnă texte scrise ca să convingă: pagini de site, descrieri de produse, texte pentru reclame pe Facebook sau Google, emailuri de vânzare și scripturi pentru clipuri video. Ai nevoie de un copywriter când site-ul are vizite dar puține cereri, când lansezi un produs, când ai sute de produse fără descrieri sau când reclamele nu aduc rezultate.",
      "Pe Contractez descrii afacerea, publicul și ce texte îți trebuie, iar platforma te ajută să structurezi cererea. Proiectul ajunge doar la copywriteri compatibili și primești maximum 5 oferte, cu opțiunea de a extinde selecția. Postarea e gratuită, datele de contact rămân ascunse până alegi, iar recenziile apar doar după colaborări confirmate.",
    ],
    prices: [
      { item: "Texte pentru site de prezentare (5 pagini)", range: "800–2.500 lei" },
      { item: "Landing page de vânzare", range: "500–1.500 lei" },
      { item: "Descrieri de produse pentru magazin online", range: "20–80 lei", note: "per produs" },
      { item: "Set texte pentru reclame (5–10 variante)", range: "300–1.000 lei" },
      { item: "Script video scurt (Reels, TikTok, reclamă)", range: "150–500 lei", note: "per script" },
    ],
    priceFactors: [
      "Tipul de text: pagini de vânzare costă mai mult decât descrieri simple",
      "Cercetarea necesară despre produs, piață și public",
      "Volumul: prețul per unitate scade la comenzi mari de descrieri",
      "Numărul de revizii și optimizarea pentru SEO",
    ],
    checklist: [
      "Cere exemple de texte publicate și, dacă se poate, rezultatele pe care le-au adus",
      "Dă un brief clar: public, ton, beneficii, ce trebuie să facă cititorul",
      "Cere o estimare scrisă cu numărul de texte, lungimea aproximativă și reviziile incluse",
      "Stabilește că textele sunt originale și că drepturile îți revin după plată",
      "Verifică dacă poate emite factură",
    ],
    faq: [
      {
        q: "Cât costă un copywriter?",
        a: "Textele pentru un site de prezentare costă de obicei 800–2.500 lei, iar un landing page de vânzare 500–1.500 lei. Descrierile de produse se plătesc per bucată, de regulă 20–80 lei, în funcție de lungime și de cercetare. Copywriterii cu experiență în domeniul tău pot cere mai mult.",
      },
      {
        q: "Care e diferența dintre copywriting și content writing?",
        a: "Copywritingul urmărește o acțiune imediată: o comandă, un apel, o înscriere. Content writingul înseamnă articole și materiale informative care atrag trafic și construiesc încredere în timp. Mulți autori le fac pe amândouă, dar merită să ceri exemple din tipul de text de care ai nevoie.",
      },
      {
        q: "Pot folosi texte generate cu AI în loc de un copywriter?",
        a: "AI-ul te ajută la idei și variante, dar textele generic scrise convertesc de obicei mai slab și pot semăna cu ale altor firme. Un copywriter adaptează mesajul la publicul și la ofertele tale. Dacă folosești AI, cere măcar o revizie făcută de un om.",
      },
      {
        q: "Cât durează scrierea textelor pentru un site?",
        a: "Pentru un site de 5 pagini, textele sunt gata de obicei în 1–2 săptămâni, inclusiv o rundă de revizii. Termenul depinde mult de cât de repede răspunzi la întrebările copywriterului despre afacere.",
      },
    ],
  },

  "articole-blog": {
    seoTitle: "Articole de blog și SEO: prețuri și redactori verificați",
    metaDescription:
      "Redactori pentru articole SEO, bloguri și comunicate de presă în limba română. Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Serviciile de articole și blog includ articole optimizate pentru Google, conținut pentru blogul firmei, ghiduri, recenzii de produse și comunicate de presă. Ai nevoie de un redactor când vrei trafic organic constant, când nu ai timp să scrii singur sau când trebuie să anunți o lansare ori un eveniment în presă.",
      "Pe Contractez descrii subiectele, frecvența și publicul, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la redactori compatibili, verificați prin email, telefon și, dacă au firmă, în registrul ANAF. Poți extinde selecția dacă vrei mai multe variante. Postarea e gratuită, iar plata o stabilești direct cu redactorul.",
    ],
    prices: [
      { item: "Articol de blog standard (circa 1.000 de cuvinte)", range: "150–300 lei" },
      { item: "Articol SEO cu cercetare de cuvinte cheie", range: "250–500 lei" },
      { item: "Articol tehnic sau de specialitate", range: "400–800 lei" },
      { item: "Comunicat de presă", range: "200–600 lei", note: "fără distribuire" },
      { item: "Pachet lunar (4–8 articole)", range: "800–3.000 lei/lună" },
    ],
    priceFactors: [
      "Lungimea și nivelul de cercetare necesar",
      "Domeniul: subiectele tehnice, medicale sau juridice costă mai mult",
      "Cercetarea de cuvinte cheie și optimizarea SEO incluse",
      "Volumul lunar și frecvența publicării",
    ],
    checklist: [
      "Cere 2–3 articole publicate, ideal din domeniul tău sau unul apropiat",
      "Stabilește în estimarea scrisă lungimea, cuvintele cheie și dacă include imagini sau meta descriere",
      "Cere texte originale, verificate antiplagiat",
      "Întreabă cum verifică informațiile și ce surse folosește",
      "Verifică dacă emite factură, mai ales la pachete lunare",
    ],
    faq: [
      {
        q: "Cât costă un articol de blog?",
        a: "Un articol standard de circa 1.000 de cuvinte costă de obicei 150–300 lei. Articolele SEO cu cercetare de cuvinte cheie ajung la 250–500 lei, iar cele de specialitate la 400–800 lei. Prețurile foarte mici indică de multe ori texte superficiale.",
      },
      {
        q: "Cât de lung trebuie să fie un articol SEO?",
        a: "Nu există o lungime fixă: articolul trebuie să răspundă complet la întrebarea cititorului. Pentru multe subiecte, 800–1.500 de cuvinte sunt suficiente, iar ghidurile detaliate pot fi mai lungi. Un redactor bun pornește de la ce caută oamenii, nu de la un număr de cuvinte.",
      },
      {
        q: "Câte articole pe lună ar trebui să public?",
        a: "Pentru un blog de firmă, 2–4 articole bine documentate pe lună sunt un ritm sustenabil. Consecvența contează mai mult decât volumul, iar articolele de calitate aduc trafic timp îndelungat.",
      },
      {
        q: "Cât durează să văd rezultate din articolele SEO?",
        a: "Primele efecte apar de regulă după câteva luni, în funcție de concurența pe subiect și de vechimea site-ului. Articolele noi au nevoie de timp ca să fie indexate și să urce în rezultate, așa că strategia funcționează pe termen mediu și lung.",
      },
    ],
  },

  "traduceri": {
    seoTitle: "Traduceri autorizate și traducători: prețuri pe pagină",
    metaDescription:
      "Traduceri autorizate și traduceri tehnice din engleză, germană, franceză, italiană, spaniolă. Postezi gratuit, primești oferte verificate.",
    intro: [
      "Serviciile de traduceri includ traduceri autorizate pentru acte oficiale, traduceri tehnice, juridice sau medicale, localizarea site-urilor și a aplicațiilor și traduceri de marketing. Ai nevoie de un traducător când depui acte la o instituție din altă țară, când semnezi un contract cu un partener străin sau când vrei să îți vinzi produsele pe alte piețe.",
      "Pe Contractez spui ce documente ai, perechea de limbi și dacă ai nevoie de traducere autorizată sau legalizată, iar platforma te ajută să structurezi cererea. Primești maximum 5 oferte, doar de la traducători compatibili, și poți extinde selecția. Postarea e gratuită, iar prețul, termenul și plata le stabilești direct cu traducătorul.",
    ],
    prices: [
      { item: "Traducere autorizată engleză, franceză, italiană sau spaniolă", range: "40–70 lei", note: "per pagină de 2.000 de caractere cu spații" },
      { item: "Traducere autorizată germană", range: "45–80 lei", note: "per pagină" },
      { item: "Traducere limbi rare (nordice, asiatice etc.)", range: "70–150 lei", note: "per pagină" },
      { item: "Traducere tehnică sau juridică de specialitate", range: "50–100 lei", note: "per pagină" },
      { item: "Legalizare notarială a traducerii", range: "50–120 lei", note: "per document, plătită la notar" },
    ],
    priceFactors: [
      "Limba: limbile mai rare costă mai mult",
      "Domeniul textului: tehnic, juridic sau medical",
      "Tipul: traducere simplă, autorizată sau legalizată la notar",
      "Termenul: livrarea urgentă costă de obicei mai mult",
    ],
    checklist: [
      "Pentru acte oficiale, verifică dacă traducătorul este autorizat de Ministerul Justiției pentru perechea de limbi",
      "Întreabă instituția unde depui actele dacă cere traducere autorizată, legalizată sau apostilă",
      "Cere o ofertă scrisă care precizează cum se calculează pagina și ce include prețul",
      "Pentru texte de specialitate, cere exemple de traduceri din același domeniu",
      "Cere factură sau chitanță pentru plata traducerii",
    ],
    faq: [
      {
        q: "Cât costă o traducere autorizată?",
        a: "Pentru engleză, franceză, italiană sau spaniolă, o traducere autorizată costă de obicei 40–70 lei pe pagină. Pentru limbi mai rare, prețul ajunge la 70–150 lei pe pagină. Dacă ai nevoie și de legalizare notarială, taxa notarului se plătește separat.",
      },
      {
        q: "Care e diferența dintre traducerea autorizată și cea legalizată?",
        a: "Traducerea autorizată este făcută, semnată și ștampilată de un traducător autorizat de Ministerul Justiției. Traducerea legalizată înseamnă că, în plus, un notar public certifică semnătura traducătorului. Multe instituții din străinătate cer varianta legalizată, așa că verifică cerința înainte.",
      },
      {
        q: "Cât durează o traducere autorizată?",
        a: "Actele scurte, cum ar fi certificatul de naștere sau diploma, se traduc de obicei în 1–2 zile lucrătoare. Documentele lungi pot dura o săptămână sau mai mult. Pentru legalizare mai adaugă de regulă o zi.",
      },
      {
        q: "Cum se calculează o pagină de traducere?",
        a: "De regulă, o pagină standard are 2.000 de caractere cu spații, numărate din textul sursă sau din traducere, în funcție de traducător. Actele scurte se taxează adesea ca o pagină întreagă. Cere precizarea modului de calcul în ofertă.",
      },
    ],
  },

  "corectura": {
    seoTitle: "Corectură și redactare texte: prețuri și oferte verificate",
    metaDescription:
      "Corectură, redactare și tehnoredactare pentru cărți, lucrări și documente. Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Corectura și redactarea includ verificarea gramaticii, a ortografiei și a punctuației, îmbunătățirea stilului și a clarității, adaptarea textelor la reguli de formatare și tehnoredactarea pentru tipar. Ai nevoie de aceste servicii când publici o carte, când predai o lucrare, când trimiți o ofertă importantă sau când un site ori un catalog trebuie să fie fără greșeli.",
      "Pe Contractez descrii tipul de text, numărul aproximativ de pagini și termenul, iar platforma te ajută să structurezi cererea. Proiectul ajunge doar la prestatori compatibili și primești cel mult 5 oferte, cu posibilitatea de a extinde selecția. Postarea e gratuită, datele tale de contact rămân ascunse până alegi, iar plata o stabilești direct cu prestatorul.",
    ],
    prices: [
      { item: "Corectură (gramatică, ortografie, punctuație)", range: "15–35 lei", note: "per pagină de 1.800–2.000 de caractere" },
      { item: "Redactare și editare de stil", range: "30–70 lei", note: "per pagină" },
      { item: "Corectură și redactare carte (circa 200 de pagini)", range: "3.000–10.000 lei" },
      { item: "Tehnoredactare carte pentru tipar", range: "10–30 lei", note: "per pagină" },
      { item: "Formatare lucrare după normele instituției", range: "200–800 lei", note: "per lucrare" },
    ],
    priceFactors: [
      "Nivelul de intervenție: corectură simplă sau rescriere de stil",
      "Calitatea inițială a textului și domeniul lui",
      "Volumul și termenul de livrare",
      "Formatarea și tehnoredactarea pentru tipar",
    ],
    checklist: [
      "Cere o probă de corectură pe 1–2 pagini din textul tău înainte de comanda completă",
      "Stabilește în oferta scrisă nivelul de intervenție și dacă modificările se fac cu urmărirea schimbărilor",
      "Pentru cărți, întreabă de titluri la care a lucrat și de colaborări cu edituri",
      "Verifică dacă respectă normele ortografice actuale ale Academiei Române",
      "Cere factură și stabilește clar termenul de predare",
    ],
    faq: [
      {
        q: "Cât costă corectura unui text?",
        a: "Corectura simplă costă de obicei 15–35 lei pe pagină standard. Dacă textul are nevoie și de redactare de stil, prețul urcă la 30–70 lei pe pagină. Pentru o carte de circa 200 de pagini, un proiect complet ajunge la 3.000–10.000 lei.",
      },
      {
        q: "Care e diferența dintre corectură și redactare?",
        a: "Corectura repară greșelile de gramatică, ortografie și punctuație, fără să schimbe stilul. Redactarea merge mai departe: reformulează frazele greoaie, elimină repetițiile și face textul mai clar. Spune de la început ce nivel de intervenție vrei.",
      },
      {
        q: "Cât durează corectura unei cărți?",
        a: "Pentru o carte de circa 200 de pagini, corectura durează de obicei 1–3 săptămâni, iar redactarea completă poate dura mai mult. Termenele scurte sunt posibile, dar calitatea scade când textul e citit în grabă.",
      },
      {
        q: "Am voie să cer ajutor la redactarea unei lucrări de licență?",
        a: "Corectura, formatarea după normele facultății și verificarea bibliografiei sunt servicii acceptate. Scrierea lucrării de către altcineva încalcă însă regulile de integritate academică și poate duce la anularea diplomei.",
      },
    ],
  },
};
