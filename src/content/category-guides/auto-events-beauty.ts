import type { CategoryGuides } from "./types";

export const autoEventsBeautyGuides: CategoryGuides = {
  auto: {
    seoTitle: "Service auto: mecanică, vopsitorie, detailing, diagnoză",
    metaDescription:
      "Găsește mecanici, tinichigii, detaileri și electricieni auto. Postezi gratuit ce are mașina și primești oferte de la prestatori verificați.",
    intro: [
      "Categoria Auto & Moto acoperă tot ce ține de întreținerea și repararea mașinii: revizii și reparații mecanice, tinichigerie și vopsitorie după un accident, detailing pentru interior și caroserie, plus diagnoză computerizată și electrică auto. Ai nevoie de ea când se aprinde un martor în bord, când se apropie ITP-ul, după o zgârietură sau când vrei să pregătești mașina pentru vânzare.",
      "Pe Contractez descrii problema cu cuvintele tale, iar platforma te ajută să o structurezi. Postarea e gratuită și primești cel mult 5 oferte, doar de la service-uri și meseriași potriviți cererii tale. Prestatorii sunt verificați prin email, telefon și, când au firmă, în registrul ANAF. Prețul și plata le stabilești direct cu cel pe care îl alegi.",
    ],
    prices: [
      { item: "Schimb ulei și filtre", range: "250–600 lei", note: "cu materiale, autoturism obișnuit" },
      { item: "Diagnoză computerizată", range: "100–250 lei" },
      { item: "Vopsit un element de caroserie", range: "450–1.100 lei", note: "per element, cu materiale" },
      { item: "Detailing interior complet", range: "300–800 lei" },
      { item: "Înlocuire kit distribuție", range: "1.000–3.500 lei", note: "cu piese, în funcție de motor" },
    ],
    faq: [
      {
        q: "Cât costă ora de manoperă la un service auto?",
        a: "La service-urile independente, ora de manoperă e de obicei între 150 și 250 lei, iar la reprezentanțe poate trece de 300 lei. Multe lucrări au însă un timp normat, deci primești un preț pe lucrare, nu pe oră. Cere ca oferta să separe manopera de piese.",
      },
      {
        q: "Cum aleg un service auto de încredere?",
        a: "Verifică dacă service-ul este autorizat RAR pentru tipul de lucrare, cere o estimare scrisă înainte de a lăsa mașina și păstrează piesele înlocuite dacă vrei să le vezi. Recenziile de la clienți reali și garanția oferită la manoperă sunt alte semne bune.",
      },
      {
        q: "Pot primi oferte fără să duc mașina la service?",
        a: "Da, pentru o primă estimare e suficient să descrii simptomele, marca, modelul, motorizarea și anul, eventual cu poze sau codurile de eroare. Pentru un preț final, majoritatea mecanicilor vor să vadă mașina sau să facă o diagnoză.",
      },
    ],
  },

  mecanica: {
    seoTitle: "Mecanic auto: prețuri manoperă și oferte verificate",
    metaDescription:
      "Ai nevoie de un mecanic auto pentru revizie, frâne sau distribuție? Postezi gratuit și primești oferte de la service-uri verificate.",
    intro: [
      "Mecanica auto include reviziile periodice, schimbul de ulei și filtre, înlocuirea distribuției, reparațiile la frâne, suspensie, direcție sau ambreiaj. De obicei cauți un mecanic când se apropie revizia, când auzi zgomote noi la mers, când mașina trage într-o parte la frânare sau când pregătești mașina pentru ITP ori pentru un drum lung.",
      "Pe Contractez scrii ce simți la mașină, cu marca, modelul și anul, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la mecanici potriviți cererii; poți extinde selecția dacă vrei mai multe. Datele tale de contact rămân ascunse până alegi tu prestatorul, iar prețul îl stabiliți direct.",
    ],
    prices: [
      { item: "Revizie: schimb ulei și filtre", range: "250–600 lei", note: "cu ulei și filtre, autoturism obișnuit" },
      { item: "Înlocuire plăcuțe de frână", range: "100–250 lei", note: "manoperă pe ax, fără piese" },
      { item: "Înlocuire discuri și plăcuțe", range: "180–400 lei", note: "manoperă pe ax, fără piese" },
      { item: "Înlocuire kit distribuție și pompă de apă", range: "1.000–3.500 lei", note: "cu piese, în funcție de motor" },
      { item: "Înlocuire amortizoare", range: "200–500 lei", note: "manoperă pe punte" },
      { item: "Manoperă orară", range: "150–250 lei/oră", note: "service independent" },
    ],
    priceFactors: [
      "Marca, modelul și motorizarea mașinii",
      "Piese originale, OEM sau aftermarket",
      "Timpul normat al lucrării și accesul la componente",
      "Service independent sau reprezentanță",
    ],
    checklist: [
      "Alege un service autorizat RAR pentru lucrările de reparații.",
      "Cere o ofertă scrisă, cu manopera și piesele trecute separat.",
      "Întreabă ce garanție oferă la manoperă și la piesele montate.",
      "Cere piesele vechi înapoi dacă vrei să vezi ce s-a înlocuit.",
      "Citește recenziile clienților care au avut lucrări asemănătoare.",
    ],
    faq: [
      {
        q: "Cât costă o revizie auto?",
        a: "O revizie de bază, cu schimb de ulei și filtre, costă de obicei între 250 și 600 lei, cu materiale incluse. Dacă se adaugă filtrul de habitaclu, bujiile sau lichidul de frână, prețul crește. La reprezentanțe și la motoarele mari, totalul poate trece de 1.000 lei.",
      },
      {
        q: "Când trebuie schimbată distribuția?",
        a: "Intervalul îl stabilește producătorul și apare în cartea service a mașinii, în kilometri și în ani. Pentru multe motoare e între 60.000 și 120.000 km, dar diferă mult de la un model la altul. Dacă nu știi când s-a schimbat ultima dată, e mai sigur să o înlocuiești.",
      },
      {
        q: "Cât durează schimbul de distribuție?",
        a: "Pe majoritatea mașinilor, lucrarea durează între 3 și 6 ore. La motoarele cu acces dificil sau cu lanț de distribuție poate dura o zi întreagă. De obicei îți lași mașina dimineața și o iei în aceeași zi sau a doua zi.",
      },
      {
        q: "Pot să îmi aduc singur piesele la service?",
        a: "Multe service-uri acceptă piese aduse de client, dar unele nu oferă garanție la manoperă în acest caz sau cer un tarif mai mare. Întreabă de la început și spune-i mecanicului codul exact al piesei, ca să eviți incompatibilitățile.",
      },
    ],
  },

  "tinichigerie-vopsitorie": {
    seoTitle: "Tinichigerie și vopsitorie auto: prețuri pe element",
    metaDescription:
      "Repari o lovitură sau vopsești un element de caroserie? Postezi gratuit și primești oferte de la tinichigii și vopsitori verificați.",
    intro: [
      "Tinichigeria și vopsitoria auto înseamnă îndreptarea tablei după lovituri, înlocuirea sau repararea elementelor de caroserie, vopsirea în culoarea originală și polishul de finisare. Ai nevoie de acest serviciu după un accident, când ai o zgârietură adâncă sau rugină pe aripă, când bara s-a fisurat sau când vrei să readuci mașina la aspectul inițial înainte de vânzare.",
      "Pe Contractez poți descrie dauna cu cuvintele tale și poți adăuga poze, iar platforma te ajută să o structurezi. Postarea e gratuită și primești cel mult 5 oferte, doar de la ateliere potrivite cererii. Prestatorii sunt verificați prin email, telefon și, când au firmă, în registrul ANAF. Prețul și plata le stabilești direct cu atelierul ales.",
    ],
    prices: [
      { item: "Vopsit un element (aripă, ușă, capotă)", range: "450–1.100 lei", note: "per element, cu materiale" },
      { item: "Reparație și vopsit bară", range: "500–1.200 lei" },
      { item: "Îndreptare lovitură fără vopsire", range: "150–500 lei", note: "pe lovitură, tehnica PDR" },
      { item: "Polish profesional caroserie", range: "400–1.200 lei" },
      { item: "Recondiționare faruri", range: "100–250 lei", note: "pereche" },
      { item: "Revopsire completă", range: "5.000–15.000 lei" },
    ],
    priceFactors: [
      "Numărul de elemente afectate și gradul de deformare",
      "Tipul vopselei: simplă, metalizată sau perlată",
      "Repararea elementului sau înlocuirea lui",
      "Necesitatea de a demonta senzori, ornamente sau tapițerie",
    ],
    checklist: [
      "Alege un atelier autorizat RAR pentru reparații de caroserie.",
      "Cere poze cu lucrări asemănătoare, mai ales la culori metalizate.",
      "Întreabă cum potrivește culoarea și dacă vopsește elementele vecine pentru nuanță.",
      "Stabilește în scris termenul de predare și garanția la vopsea.",
      "Verifică recenziile clienților care au lăsat mașina pentru lucrări similare.",
    ],
    faq: [
      {
        q: "Cât costă vopsitul unei aripi?",
        a: "Vopsirea unei aripi costă de obicei între 450 și 1.100 lei, cu materialele incluse. Dacă aripa are lovituri care trebuie îndreptate, sau dacă vopseaua e metalizată ori perlată, prețul crește. Uneori se vopsește în degradé și pe elementul vecin, ca nuanța să arate uniform.",
      },
      {
        q: "Cât durează vopsirea unui element?",
        a: "Pentru un singur element, lucrarea durează de obicei 1–3 zile, din cauza timpilor de pregătire, uscare și polish. La daune mai mari, cu mai multe elemente sau piese comandate, poate dura una sau două săptămâni.",
      },
      {
        q: "Merită să repar lovitura fără vopsire?",
        a: "Tehnica de îndreptare fără vopsire (PDR) funcționează bine la lovituri mici, fără vopsea crăpată, de exemplu după grindină sau o ușă lovită în parcare. Păstrează vopseaua originală și e mai ieftină. Dacă vopseaua e fisurată sau tabla e întinsă puternic, e nevoie de reparație clasică.",
      },
      {
        q: "Pot repara mașina pe asigurare la un atelier ales de mine?",
        a: "Depinde de polița ta: la CASCO și la RCA-ul celuilalt șofer ai, în general, varianta reparației în service sau a despăgubirii în bani. Verifică cu asigurătorul ce opțiuni ai și dacă atelierul ales trebuie să lucreze cu el. Cere atelierului o estimare scrisă, utilă în discuția cu asigurătorul.",
      },
    ],
  },

  detailing: {
    seoTitle: "Detailing auto: prețuri ceramică, polish și interior",
    metaDescription:
      "Vrei detailing interior, polish sau protecție ceramică? Postezi gratuit cererea și primești oferte de la detaileri auto verificați.",
    intro: [
      "Detailingul auto înseamnă curățarea în profunzime a mașinii și protejarea ei: spălare detaliată, curățarea tapițeriei și a plasticelor, corecția vopselei prin polish, tratamente ceramice și folie de protecție. Îl ceri când vrei să vinzi mașina, după ce ai cumpărat una second-hand, când tapițeria are pete vechi sau când vrei să protejezi vopseaua unei mașini noi.",
      "Pe Contractez spui ce vrei să rezolvi, iar platforma te ajută să structurezi cererea, chiar dacă nu știi termenii tehnici. Postarea e gratuită și primești cel mult 5 oferte, doar de la detaileri potriviți cererii; poți extinde selecția. Contactul tău rămâne ascuns până alegi prestatorul, iar recenziile vin doar după colaborări confirmate.",
    ],
    prices: [
      { item: "Spălare detaliată exterior cu ceară", range: "150–400 lei" },
      { item: "Curățare interior completă", range: "300–800 lei", note: "tapițerie, plastice, mochete" },
      { item: "Corecție vopsea (polish 1–2 pași)", range: "800–2.500 lei" },
      { item: "Protecție ceramică vopsea", range: "1.500–5.000 lei", note: "de obicei cu polish inclus" },
      { item: "Folie PPF pe partea frontală", range: "3.000–8.000 lei", note: "capotă, bară, aripi, oglinzi" },
    ],
    priceFactors: [
      "Mărimea mașinii: compactă, sedan sau SUV",
      "Starea vopselei și a interiorului",
      "Durata și numărul de straturi ale tratamentului ceramic",
      "Calitatea produselor și a foliei folosite",
    ],
    checklist: [
      "Cere poze înainte și după cu mașini asemănătoare cu a ta.",
      "Întreabă ce produs ceramic sau ce folie folosește și ce durată promite producătorul.",
      "Clarifică ce include pachetul: decontaminare, polish, jante, geamuri.",
      "Întreabă de condițiile de întreținere și de verificările ulterioare.",
      "Citește recenziile clienților și verifică portofoliul de lucrări.",
    ],
    faq: [
      {
        q: "Cât costă protecția ceramică la mașină?",
        a: "Un tratament ceramic aplicat profesional costă de obicei între 1.500 și 5.000 lei. Prețul include de regulă și corecția vopselei, care ocupă cea mai mare parte din timp. Diferența vine din mărimea mașinii, starea vopselei și durabilitatea produsului ales.",
      },
      {
        q: "Cât durează un detailing complet?",
        a: "Un detailing de interior durează de obicei 4–8 ore. Un pachet cu polish și protecție ceramică poate dura 2–3 zile, pentru că stratul ceramic are nevoie de timp să se întărească înainte de predare.",
      },
      {
        q: "Care e diferența dintre ceramică și folie PPF?",
        a: "Tratamentul ceramic e un strat subțire care face vopseaua mai lucioasă și mai ușor de curățat, dar nu oprește pietrele sau zgârieturile. Folia PPF e o peliculă transparentă mai groasă, care absoarbe impacturile mici. Multe mașini noi primesc folie pe partea din față și ceramică pe restul.",
      },
      {
        q: "Merită detailing înainte de a vinde mașina?",
        a: "Pentru multe mașini, o curățare completă a interiorului și un polish ușor schimbă mult impresia la vizionare și în poze. Nu are sens să plătești un tratament ceramic de durată dacă vinzi imediat. Spune-i detailerului că pregătești mașina de vânzare, ca să îți propună un pachet potrivit.",
      },
    ],
  },

  "electrica-auto": {
    seoTitle: "Diagnoză auto și electrician auto: prețuri și oferte",
    metaDescription:
      "Ai un martor aprins în bord sau o problemă electrică? Postezi gratuit și primești oferte de diagnoză de la electricieni auto verificați.",
    intro: [
      "Electrica și diagnoza auto includ citirea codurilor de eroare cu tester, depanarea instalației electrice, repararea alternatorului sau a electromotorului, problemele de baterie și consum, plus montajul și revizia instalațiilor GPL. Cauți un electrician auto când se aprinde martorul de motor, când mașina pornește greu, când nu mai merg geamurile sau luminile ori când vrei să treci pe GPL.",
      "Pe Contractez descrii simptomele cu cuvintele tale, iar platforma te ajută să structurezi cererea. Postarea e gratuită, iar clienții nu plătesc nimic platformei. Primești cel mult 5 oferte, doar de la prestatori compatibili, verificați prin email, telefon și, când au firmă, în registrul ANAF. Prețul și plata le stabilești direct cu cel ales.",
    ],
    prices: [
      { item: "Diagnoză computerizată", range: "100–250 lei" },
      { item: "Depanare instalație electrică", range: "150–250 lei/oră" },
      { item: "Reparație alternator sau electromotor", range: "300–900 lei", note: "cu piese, în funcție de model" },
      { item: "Montaj instalație GPL secvențială", range: "2.500–5.000 lei", note: "cu piese, fără omologare RAR" },
      { item: "Revizie instalație GPL", range: "150–350 lei" },
    ],
    priceFactors: [
      "Complexitatea electronicii mașinii și accesul la testerul potrivit",
      "Timpul necesar pentru a găsi defectul",
      "Reparația componentei sau înlocuirea ei",
      "Tipul de motor și de injecție, la montajul GPL",
    ],
    checklist: [
      "Alege un service autorizat RAR, iar pentru GPL un atelier autorizat pentru montaj.",
      "Cere raportul de diagnoză cu codurile de eroare citite.",
      "Întreabă dacă prețul diagnozei se scade din reparație.",
      "La GPL, cere detalii despre componente, garanție și omologare.",
      "Verifică recenziile pentru probleme asemănătoare cu a ta.",
    ],
    faq: [
      {
        q: "Cât costă o diagnoză auto computerizată?",
        a: "Diagnoza computerizată costă de obicei între 100 și 250 lei. Prețul crește la mașinile cu multe module electronice sau când e nevoie de teste suplimentare pe lângă citirea erorilor. Unele service-uri scad costul diagnozei din reparația făcută la ele.",
      },
      {
        q: "Ce înseamnă martorul de motor aprins?",
        a: "Martorul de motor arată că unitatea de control a înregistrat o eroare, de la un senzor defect până la probleme de aprindere sau de emisii. Fără diagnoză nu poți ști cauza. Dacă martorul clipește sau mașina își pierde puterea, oprește-te și cere ajutor, ca să eviți daune mai mari.",
      },
      {
        q: "Cât costă montajul unei instalații GPL?",
        a: "O instalație GPL secvențială costă de obicei între 2.500 și 5.000 lei, în funcție de motor și de componente. Motoarele cu injecție directă necesită soluții mai scumpe. După montaj, instalația trebuie omologată la RAR, iar costul acestei etape se adaugă dacă nu e inclus în ofertă.",
      },
      {
        q: "Cât durează diagnoza unei probleme electrice?",
        a: "Citirea erorilor durează de obicei sub o oră. Defectele intermitente, cum ar fi un consum care descarcă bateria peste noapte, pot cere o zi sau mai mult de verificări. Electricianul îți poate spune după primele teste cât timp estimează.",
      },
    ],
  },

  evenimente: {
    seoTitle: "Servicii evenimente: organizare, DJ, catering, decor",
    metaDescription:
      "Organizezi o nuntă, un botez sau un eveniment corporate? Postezi gratuit și primești oferte de la organizatori, DJ și catering verificați.",
    intro: [
      "Categoria Evenimente reunește tot ce îți trebuie pentru o nuntă, un botez, o aniversare sau un eveniment de firmă: organizare și coordonare, DJ și formații, catering și torturi, decor și aranjamente florale, animatori, MC și photo booth. O folosești când ai data stabilită și vrei să compari prestatori fără să suni pe rând la fiecare.",
      "Pe Contractez descrii evenimentul cu cuvintele tale, iar platforma te ajută să structurezi cererea: data, locația, numărul de invitați și bugetul. Postarea e gratuită și primești cel mult 5 oferte, doar de la prestatori disponibili și compatibili; poți extinde selecția. Contactul tău rămâne ascuns până alegi, iar prețul și plata le stabilești direct.",
    ],
    prices: [
      { item: "DJ nuntă", range: "3.000–8.000 lei", note: "program complet, cu sonorizare" },
      { item: "Meniu nuntă", range: "300–550 lei/persoană" },
      { item: "Decor sală nuntă", range: "2.000–25.000 lei" },
      { item: "Animator petrecere copii", range: "400–1.000 lei", note: "program de 2 ore" },
      { item: "Coordonare în ziua nunții", range: "3.000–10.000 lei" },
    ],
    faq: [
      {
        q: "Cu cât timp înainte rezerv prestatorii pentru nuntă?",
        a: "Pentru sâmbetele din mai–septembrie, mulți DJ, formații, fotografi și saloane se rezervă cu 6–12 luni înainte. Pentru botezuri și aniversări, de obicei sunt suficiente câteva săptămâni. Cu cât data e mai fixă, cu atât primești oferte mai precise.",
      },
      {
        q: "Ce informații dau ca să primesc oferte corecte?",
        a: "Spune data, orașul și locația, numărul de invitați, durata evenimentului și ce servicii vrei incluse. Un buget orientativ îi ajută pe prestatori să îți propună pachetul potrivit. Dacă ai preferințe de stil, adaugă câteva exemple sau poze.",
      },
      {
        q: "Trebuie să semnez contract cu prestatorii de evenimente?",
        a: "Da, e recomandat să ai un contract scris cu data, orele, serviciile incluse, avansul și condițiile de anulare. Contractul te protejează dacă apar neînțelegeri sau schimbări de program. Clarifică și cine suportă costurile suplimentare dacă evenimentul se prelungește.",
      },
    ],
  },

  "organizare-evenimente": {
    seoTitle: "Wedding planner și organizare evenimente: prețuri",
    metaDescription:
      "Cauți un wedding planner sau un organizator de evenimente? Postezi gratuit și primești oferte de la organizatori verificați, fără telefoane.",
    intro: [
      "Organizarea de evenimente înseamnă planificarea și coordonarea unei nunți, a unui botez sau a unui eveniment corporate: alegerea locației și a furnizorilor, bugetul, programul zilei și rezolvarea problemelor pe loc. Ai nevoie de un organizator când nu ai timp să te ocupi de toate detaliile, când evenimentul e în alt oraș sau când vrei doar ca cineva să coordoneze ziua cea mare.",
      "Pe Contractez spui ce fel de eveniment pregătești și cât de mult ajutor vrei, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la organizatori potriviți. Prestatorii sunt verificați prin email, telefon și, când au firmă, în registrul ANAF. Onorariul îl negociezi direct cu organizatorul ales.",
    ],
    prices: [
      { item: "Coordonare în ziua nunții", range: "3.000–10.000 lei" },
      { item: "Planificare completă nuntă", range: "10.000–30.000 lei", note: "onorariu, fără costul furnizorilor" },
      { item: "Organizare botez", range: "2.000–8.000 lei" },
      { item: "Eveniment corporate sau team building", range: "de la 5.000 lei", note: "onorariu de organizare" },
      { item: "Consultanță și plan de buget", range: "500–1.500 lei" },
    ],
    priceFactors: [
      "Planificare completă sau doar coordonare în ziua evenimentului",
      "Numărul de invitați și de furnizori coordonați",
      "Perioada: sâmbetele de vară sunt cele mai cerute",
      "Deplasarea în alt oraș sau evenimentele de mai multe zile",
    ],
    checklist: [
      "Cere un contract cu data, orele de coordonare, serviciile incluse și condițiile de anulare.",
      "Uită-te în portofoliu la evenimente de mărimea și stilul tău.",
      "Întreabă cum lucrează cu furnizorii și dacă primește comisioane de la ei.",
      "Stabilește câte întâlniri sunt incluse și cum comunicați până la eveniment.",
      "Citește recenziile de la cupluri sau firme cu care a lucrat.",
    ],
    faq: [
      {
        q: "Cât costă un wedding planner?",
        a: "Coordonarea doar în ziua nunții costă de obicei între 3.000 și 10.000 lei. Planificarea completă, de la alegerea locației până la final, pornește de la aproximativ 10.000 lei și poate depăși 30.000 lei la nunțile mari. Onorariul nu include costul locației, al meniului sau al altor furnizori.",
      },
      {
        q: "Cu cât timp înainte angajez un organizator de nunți?",
        a: "Pentru planificare completă, ideal e să începi cu 9–12 luni înainte, ca să ai de unde alege locația și furnizorii. Pentru coordonarea în ziua nunții, de obicei sunt suficiente 2–3 luni, timp în care organizatorul preia programul și contactele.",
      },
      {
        q: "Ce face concret un wedding planner în ziua nunții?",
        a: "Verifică sosirea și montajul furnizorilor, ține programul pe minute, coordonează intrările, momentele și tranzițiile și rezolvă problemele fără să te implice. Tu și invitații tăi vă puteți bucura de eveniment, iar furnizorii au o singură persoană de contact.",
      },
      {
        q: "Merită un organizator pentru un botez sau o aniversare?",
        a: "Pentru evenimente mici, cu puțini furnizori, te poți descurca și singur. Un organizator ajută când ai mulți invitați, decor și animatori de coordonat sau puțin timp la dispoziție. Poți cere și doar un pachet parțial, de exemplu decor și coordonare.",
      },
    ],
  },

  "muzica-dj": {
    seoTitle: "DJ nuntă și formație: cât costă și cum îi alegi",
    metaDescription:
      "Cauți DJ, formație sau solist pentru nuntă ori petrecere? Postezi gratuit și primești oferte de la artiști și DJ verificați.",
    intro: [
      "Serviciile de muzică pentru evenimente includ DJ, formații live, soliști pentru ceremonie sau program artistic, plus sonorizarea și luminile necesare. Ai nevoie de ele la nunți, botezuri, aniversări, petreceri de firmă sau lansări. Un DJ bun citește sala și ține ritmul serii, iar o formație aduce atmosfera live, mai ales la nunțile cu muzică populară.",
      "Pe Contractez spui data, locația, durata și stilul muzical dorit, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la artiști potriviți cererii; poți extinde selecția. Contactul tău rămâne ascuns până alegi, iar recenziile pot fi lăsate doar după o colaborare confirmată.",
    ],
    prices: [
      { item: "DJ nuntă", range: "3.000–8.000 lei", note: "8–10 ore, cu sonorizare și lumini" },
      { item: "DJ botez sau aniversare", range: "1.500–3.500 lei", note: "4–6 ore" },
      { item: "DJ eveniment corporate", range: "2.000–5.000 lei" },
      { item: "Formație nuntă", range: "10.000–30.000 lei" },
      { item: "Solist pentru ceremonie sau program", range: "1.000–4.000 lei" },
      { item: "Închiriere sonorizare și lumini", range: "800–3.000 lei", note: "pe eveniment" },
    ],
    priceFactors: [
      "Data: sâmbetele din sezonul de nunți sunt mai scumpe",
      "Durata programului și orele suplimentare",
      "Echipamentul inclus: sonorizare, lumini, efecte",
      "Deplasarea și numărul de membri ai formației",
    ],
    checklist: [
      "Semnează un contract cu data, orele de început și de final și tariful pentru ore suplimentare.",
      "Ascultă înregistrări sau mixuri recente și vezi clipuri de la evenimente.",
      "Întreabă ce echipament aduce și dacă are aparatură de rezervă.",
      "Discută lista de melodii preferate și cele interzise.",
      "Citește recenziile de la clienți cu evenimente asemănătoare.",
    ],
    faq: [
      {
        q: "Cât costă un DJ de nuntă?",
        a: "Un DJ pentru nuntă costă de obicei între 3.000 și 8.000 lei, pentru un program de 8–10 ore cu sonorizare și lumini. Sâmbetele de vară și orașele mari sunt la capătul de sus al intervalului. Verifică dacă prețul include ore suplimentare, lumini arhitecturale sau efecte speciale.",
      },
      {
        q: "DJ sau formație la nuntă?",
        a: "Un DJ e mai flexibil la stiluri, ocupă mai puțin spațiu și costă mai puțin. O formație aduce muzică live, potrivită mai ales pentru muzica populară și momentele tradiționale. Mulți combină: formație pentru o parte din seară și DJ pentru rest.",
      },
      {
        q: "Cu cât timp înainte rezerv DJ-ul?",
        a: "Pentru sâmbetele din mai–septembrie, DJ-ii și formațiile cerute se rezervă adesea cu 6–12 luni înainte. Pentru botezuri sau petreceri în extrasezon, câteva săptămâni sunt de obicei suficiente. Avansul blochează data, așa că trece-l în contract.",
      },
      {
        q: "Cât timp cântă DJ-ul la o nuntă?",
        a: "De obicei, programul acoperă toată petrecerea, în jur de 8–10 ore, de la sosirea invitaților până la final. Orele de după limita din contract se plătesc separat. Stabilește dinainte ora de montaj și cine se ocupă de muzica de la ceremonie, dacă e în altă locație.",
      },
    ],
  },

  catering: {
    seoTitle: "Catering evenimente și torturi: prețuri pe persoană",
    metaDescription:
      "Ai nevoie de catering, tort sau candy bar pentru eveniment? Postezi gratuit și primești oferte de la firme de catering verificate.",
    intro: [
      "Cateringul și cofetăria pentru evenimente includ meniuri complete pentru nunți și botezuri, platouri și finger food pentru evenimente de firmă, torturi personalizate, candy bar și bar mobil cu barman. Ai nevoie de ele când locația nu are bucătărie proprie, când organizezi o petrecere acasă sau la birou ori când vrei un tort sau un desert special pentru o ocazie.",
      "Pe Contractez descrii evenimentul, numărul de invitați și ce vrei să servești, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la furnizori compatibili. Prestatorii sunt verificați prin email, telefon și, când au firmă, în registrul ANAF. Meniul, prețul și plata le stabilești direct cu cel ales.",
    ],
    prices: [
      { item: "Meniu nuntă", range: "300–550 lei/persoană", note: "în funcție de meniu și băuturi" },
      { item: "Meniu botez sau aniversare", range: "150–350 lei/persoană" },
      { item: "Finger food pentru eveniment corporate", range: "60–150 lei/persoană" },
      { item: "Tort personalizat", range: "120–250 lei/kg" },
      { item: "Candy bar", range: "1.500–4.000 lei", note: "pentru aproximativ 80–120 de invitați" },
      { item: "Bar mobil cu barman", range: "2.000–6.000 lei", note: "pe eveniment" },
    ],
    priceFactors: [
      "Numărul de invitați și numărul de feluri",
      "Băuturile incluse sau aduse separat",
      "Personalul de servire, vesela și transportul",
      "Ingredientele și complexitatea decorului la tort",
    ],
    checklist: [
      "Verifică dacă bucătăria sau laboratorul are înregistrarea ori autorizarea sanitar-veterinară (DSVSA).",
      "Cere o degustare înainte de a semna, mai ales pentru nunți.",
      "Semnează un contract cu data, orele de servire, meniul și numărul final de invitați.",
      "Întreabă ce include prețul: personal, veselă, transport, montaj.",
      "Uită-te la portofoliu și la recenziile clienților.",
    ],
    faq: [
      {
        q: "Cât costă meniul la nuntă de persoană?",
        a: "Un meniu de nuntă costă de obicei între 300 și 550 lei de persoană, în funcție de oraș, de numărul de feluri și de faptul că include sau nu băuturile. Locațiile premium pot depăși acest interval. Cere ofertă scrisă cu ce intră exact în preț.",
      },
      {
        q: "Cât costă un kilogram de tort?",
        a: "Un tort personalizat costă de obicei între 120 și 250 lei pe kilogram. Prețul crește cu decorul: figurinele, florile naturale sau etajele multiple se pot taxa separat. Pentru nunți, se calculează în general 100–150 g de tort pe invitat.",
      },
      {
        q: "Cu cât timp înainte comand cateringul?",
        a: "Pentru nunți și evenimente mari, rezervă cateringul cu câteva luni înainte, mai ales pentru sezonul de vară. Pentru o petrecere mică sau un eveniment de birou, de obicei 1–3 săptămâni sunt suficiente. Numărul final de invitați se confirmă, de regulă, cu câteva zile înainte.",
      },
      {
        q: "Ce trebuie să verific la o firmă de catering?",
        a: "Asigură-te că are autorizațiile sanitare pentru prepararea și transportul hranei și că poate servi numărul tău de invitați. Cere o degustare și întreabă cum menține mâncarea la temperatura corectă la locație. Recenziile de la alte evenimente îți spun multe despre punctualitate și porții.",
      },
    ],
  },

  decor: {
    seoTitle: "Decor nuntă și aranjamente florale: prețuri și oferte",
    metaDescription:
      "Cauți decor de sală, aranjamente florale sau baloane? Postezi gratuit și primești oferte de la decoratori și floriști verificați.",
    intro: [
      "Decorul pentru evenimente include aranjarea sălii, centrele de masă, aranjamentele florale, arcadele, buchetul miresei și lumânările de cununie, plus decorurile cu baloane pentru botezuri și aniversări. Ai nevoie de un decorator când vrei ca sala să arate unitar, într-o temă anume, sau când locația nu are un pachet de decor inclus.",
      "Pe Contractez spui tipul evenimentului, locația, numărul de mese și stilul dorit, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la decoratori potriviți; poți extinde selecția. Contactul tău rămâne ascuns până alegi, iar prețul și plata le stabilești direct cu decoratorul.",
    ],
    prices: [
      { item: "Pachet decor sală nuntă, de bază", range: "2.000–5.000 lei", note: "centre de masă și decor simplu" },
      { item: "Decor complet nuntă", range: "6.000–25.000 lei" },
      { item: "Aranjament floral de masă", range: "100–300 lei/masă" },
      { item: "Buchet de mireasă", range: "300–800 lei" },
      { item: "Arcadă din baloane", range: "300–1.000 lei" },
      { item: "Decor botez sau aniversare", range: "1.000–4.000 lei" },
    ],
    priceFactors: [
      "Numărul de mese și mărimea sălii",
      "Flori naturale de sezon sau de import",
      "Elemente închiriate: arcade, candelabre, textile",
      "Montajul, demontajul și transportul",
    ],
    checklist: [
      "Semnează un contract cu data, ora de montaj și de demontaj și lista elementelor incluse.",
      "Cere poze din portofoliu cu evenimente reale, nu doar randări.",
      "Întreabă ce flori sunt în sezon la data ta și ce alternative ai.",
      "Clarifică ce rămâne la tine și ce e doar închiriat.",
      "Citește recenziile clienților despre punctualitate și rezultat.",
    ],
    faq: [
      {
        q: "Cât costă decorul la nuntă?",
        a: "Un decor de bază, cu centre de masă și câteva elemente pentru sală, costă de obicei între 2.000 și 5.000 lei. Un decor complet, cu multe flori naturale, arcadă și scenografie, poate ajunge la 25.000 lei sau mai mult. Prețul depinde mult de numărul de mese și de flori.",
      },
      {
        q: "Cât costă un aranjament floral de masă?",
        a: "Un aranjament de masă costă de obicei între 100 și 300 lei, în funcție de mărime și de flori. Trandafirii de import, bujorii sau orhideele ridică prețul, iar florile de sezon îl țin mai jos. Cere o probă sau poze cu aranjamente asemănătoare.",
      },
      {
        q: "Cu cât timp înainte rezerv decoratorul?",
        a: "Pentru nunțile din sezon, rezervă decoratorul cu 4–8 luni înainte, ca să ai timp pentru tematică și probe. Pentru botezuri și aniversări, câteva săptămâni sunt de obicei suficiente. Confirmă tema finală și numărul de mese cu cel puțin două săptămâni înainte.",
      },
      {
        q: "Pot folosi flori artificiale ca să economisesc?",
        a: "Da, florile artificiale de calitate arată bine în poze și pot fi refolosite, iar unii decoratori le închiriază. Poți combina flori naturale pentru masa mirilor și buchet cu flori artificiale pentru restul sălii. Discută variantele cu decoratorul în funcție de buget.",
      },
    ],
  },

  animatori: {
    seoTitle: "Animatori petreceri copii, MC și photo booth: prețuri",
    metaDescription:
      "Cauți animatori pentru petrecerea copilului, MC sau photo booth? Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Serviciile de entertainment includ animatori pentru petreceri de copii, mascote, face painting, baloane modelate, MC pentru nunți și evenimente de firmă, plus photo booth sau oglindă foto. Ai nevoie de ele la aniversări, botezuri, petreceri la grădiniță sau evenimente corporate, când vrei ca invitații să fie implicați, iar programul să curgă fără pauze lungi.",
      "Pe Contractez spui vârsta copiilor sau tipul evenimentului, numărul de invitați și durata, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la prestatori compatibili. Aceștia sunt verificați prin email, telefon și, când au firmă, în registrul ANAF. Prețul îl stabilești direct cu cel ales.",
    ],
    prices: [
      { item: "Animator petrecere copii", range: "400–1.000 lei", note: "program de 2 ore" },
      { item: "Mascotă", range: "150–300 lei/oră" },
      { item: "Face painting sau baloane modelate", range: "200–400 lei/oră" },
      { item: "MC pentru nuntă sau eveniment corporate", range: "1.500–5.000 lei" },
      { item: "Photo booth", range: "800–2.000 lei", note: "aproximativ 3 ore, cu printuri" },
    ],
    priceFactors: [
      "Durata programului și numărul de copii",
      "Numărul de animatori și activitățile incluse",
      "Costumele, recuzita și materialele",
      "Deplasarea la locație și ziua din săptămână",
    ],
    checklist: [
      "Stabilește în contract data, ora de început, durata și activitățile incluse.",
      "Cere clipuri sau poze de la petreceri reale.",
      "Întreabă dacă programul e potrivit pentru vârsta copiilor.",
      "Verifică materialele folosite la face painting, mai ales pentru pielea sensibilă.",
      "Citește recenziile de la alți părinți sau organizatori.",
    ],
    faq: [
      {
        q: "Cât costă un animator pentru petrecerea copilului?",
        a: "Un program de animație de 2 ore costă de obicei între 400 și 1.000 lei, în funcție de numărul de copii și de activități. Mascotele, face painting-ul sau baloanele modelate pot fi incluse în pachet sau taxate separat. În weekend, prețurile sunt adesea mai mari.",
      },
      {
        q: "Cât durează o petrecere cu animatori?",
        a: "Pentru copiii mici, 1–2 ore de animație sunt de obicei suficiente, pentru că atenția scade după acest interval. La copiii mai mari, programul poate fi de 2–3 ore, cu jocuri, concursuri și ateliere. Lasă timp separat pentru tort și masă.",
      },
      {
        q: "Cât costă un photo booth la eveniment?",
        a: "Un photo booth cu printuri nelimitate costă de obicei între 800 și 2.000 lei pentru aproximativ 3 ore. Prețul crește cu orele suplimentare, recuzita personalizată sau cabinele de tip oglindă și 360°. Întreabă dacă primești și fișierele digitale.",
      },
      {
        q: "De ce am nevoie de un MC la eveniment?",
        a: "Un MC anunță momentele, ține legătura dintre program, DJ și invitați și umple pauzele fără să se simtă goluri. E util la nunțile mari și la evenimentele de firmă cu discursuri sau premieri. Discută cu el programul și tonul dorit cu câteva zile înainte.",
      },
    ],
  },

  "frumusete-sanatate": {
    seoTitle: "Servicii frumusețe: make-up, manichiură, masaj, fitness",
    metaDescription:
      "Cauți make-up artist, manichiuristă, maseur sau antrenor personal? Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Categoria Frumusețe & Sănătate include coafură și make-up pentru evenimente, manichiură și pedichiură, masaj de relaxare și terapie, plus antrenori personali, planuri alimentare, yoga și pilates. O folosești când te pregătești pentru o nuntă, când vrei un serviciu la domiciliu sau când cauți pe cineva care să te ajute constant cu antrenamentele.",
      "Pe Contractez descrii ce îți dorești, iar platforma te ajută să structurezi cererea: data, locul, numărul de persoane. Postarea e gratuită și primești cel mult 5 oferte, doar de la prestatori compatibili; poți extinde selecția. Datele tale de contact rămân ascunse până alegi, iar prețul și plata le stabilești direct.",
    ],
    prices: [
      { item: "Machiaj mireasă", range: "400–900 lei" },
      { item: "Manichiură semipermanentă", range: "100–180 lei" },
      { item: "Masaj de relaxare, 60 de minute", range: "150–300 lei" },
      { item: "Ședință cu antrenor personal", range: "100–250 lei" },
      { item: "Plan alimentar personalizat", range: "200–600 lei" },
    ],
    faq: [
      {
        q: "Pot găsi servicii de frumusețe la domiciliu?",
        a: "Da, mulți make-up artiști, hair stiliști, manichiuriste și maseuri lucrează și la domiciliu. Taxa de deplasare se adaugă de obicei la preț, în funcție de distanță. Menționează în cerere că vrei serviciul acasă și adresa aproximativă.",
      },
      {
        q: "Cum aleg un prestator de frumusețe de încredere?",
        a: "Uită-te la portofoliu, cu poze de lucrări reale, și la recenziile clienților. Întreabă ce produse folosește și cum sterilizează instrumentele. Pentru evenimente, o probă înainte de ziua cea mare te ajută să eviți surprizele.",
      },
      {
        q: "Pot cere oferte pentru mai multe persoane?",
        a: "Da, de exemplu machiaj și coafură pentru mireasă, mame și domnișoare de onoare. Scrie în cerere câte persoane sunt și ce servicii vrea fiecare. Mulți prestatori oferă un preț de pachet sau vin cu un asistent ca să se încadreze în timp.",
      },
    ],
  },

  "coafura-makeup": {
    seoTitle: "Machiaj și coafură mireasă: prețuri și oferte",
    metaDescription:
      "Cauți make-up artist sau hair stilist pentru nuntă ori eveniment? Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Serviciul acoperă machiajul și coafura pentru ocazii speciale: nunți, cununii civile, botezuri, baluri, ședințe foto sau evenimente de firmă. Ai nevoie de el când vrei un look care să reziste o zi întreagă și să arate bine în poze, mai ales pentru mireasă, dar și pentru mame, nașe sau domnișoare de onoare, la salon sau la domiciliu.",
      "Pe Contractez spui data, ora, locul și câte persoane trebuie pregătite, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la prestatori compatibili. Aceștia sunt verificați prin email, telefon și, când au firmă, în registrul ANAF. Contactul tău rămâne ascuns până alegi, iar prețul îl stabiliți direct.",
    ],
    prices: [
      { item: "Machiaj de eveniment", range: "200–500 lei" },
      { item: "Machiaj de mireasă", range: "400–900 lei", note: "proba se plătește de obicei separat" },
      { item: "Probă machiaj", range: "200–400 lei" },
      { item: "Coafură de eveniment", range: "150–400 lei" },
      { item: "Coafură de mireasă", range: "300–700 lei" },
      { item: "Deplasare la domiciliu", range: "50–200 lei", note: "în funcție de distanță și oră" },
    ],
    priceFactors: [
      "Experiența și portofoliul artistului",
      "Complexitatea coafurii sau a machiajului",
      "Numărul de persoane și ora de începere",
      "Deplasarea la domiciliu sau la locația evenimentului",
    ],
    checklist: [
      "Uită-te în portofoliu la lucrări pe tipul tău de ten și de păr.",
      "Fă o probă înainte de nuntă și cere poze de la ea.",
      "Stabilește în scris data, ora de început, locul și persoanele incluse.",
      "Întreabă ce produse folosește și dacă ai alergii sau ten sensibil.",
      "Citește recenziile de la alte mirese sau cliente.",
    ],
    faq: [
      {
        q: "Cât costă machiajul de mireasă?",
        a: "Machiajul de mireasă costă de obicei între 400 și 900 lei, iar în orașele mari și la artiști cu experiență poate depăși acest interval. Proba se plătește de regulă separat sau e inclusă într-un pachet. Deplasarea la domiciliu și ora foarte matinală pot adăuga costuri.",
      },
      {
        q: "Cât durează machiajul și coafura pentru mireasă?",
        a: "Machiajul de mireasă durează de obicei 1–1,5 ore, iar coafura 1–2 ore, în funcție de complexitate. Dacă se pregătesc și alte persoane, calculează în jur de 45–60 de minute pentru fiecare. Programează începerea astfel încât să mai rămână timp de rezervă înainte de ședința foto.",
      },
      {
        q: "Merită proba de machiaj?",
        a: "Da, mai ales pentru nuntă. La probă vezi cum arată machiajul pe tenul tău, în lumina zilei și în poze, și poți cere ajustări fără grabă. Poți face proba în aceeași zi cu o altă ocazie, ca să vezi cât rezistă.",
      },
      {
        q: "Cu cât timp înainte rezerv make-up artistul?",
        a: "Pentru sâmbetele din sezonul de nunți, make-up artiștii cunoscuți se rezervă adesea cu câteva luni înainte. Pentru alte evenimente, 2–4 săptămâni sunt de obicei suficiente. Fixează proba cu aproximativ o lună înainte de nuntă.",
      },
    ],
  },

  manichiura: {
    seoTitle: "Manichiură semipermanentă și gel: prețuri și oferte",
    metaDescription:
      "Cauți manichiură semipermanentă, unghii gel sau pedichiură? Postezi gratuit și primești oferte de la manichiuriste verificate.",
    intro: [
      "Serviciul include manichiura clasică și semipermanentă, construcția și întreținerea unghiilor cu gel, pedichiura clasică sau cu semipermanent, plus nail art. Ai nevoie de el ca rutină lunară de îngrijire, înainte de o nuntă sau de un eveniment, când vrei unghii mai lungi și rezistente sau când preferi o manichiuristă care vine la tine acasă.",
      "Pe Contractez spui ce serviciu vrei, zona și dacă preferi salon sau domiciliu, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la prestatori compatibili. Contactul tău rămâne ascuns până alegi, iar recenziile pot fi lăsate doar după o colaborare confirmată.",
    ],
    prices: [
      { item: "Manichiură clasică", range: "50–100 lei" },
      { item: "Manichiură semipermanentă", range: "100–180 lei" },
      { item: "Construcție unghii cu gel", range: "150–280 lei" },
      { item: "Întreținere gel", range: "120–220 lei", note: "la 3–4 săptămâni" },
      { item: "Pedichiură clasică sau cu semipermanent", range: "120–250 lei" },
    ],
    priceFactors: [
      "Tipul serviciului: clasic, semipermanent sau gel",
      "Lungimea unghiilor și complexitatea designului",
      "Îndepărtarea materialului vechi",
      "Salon sau deplasare la domiciliu",
    ],
    checklist: [
      "Întreabă cum sterilizează instrumentele și dacă folosește pile de unică folosință.",
      "Uită-te la portofoliu, cu poze reale, nu doar modele de pe internet.",
      "Întreabă ce produse folosește și cât rezistă de obicei.",
      "Spune dacă ai alergii sau unghii fragile.",
      "Citește recenziile clientelor.",
    ],
    faq: [
      {
        q: "Cât costă manichiura semipermanentă?",
        a: "Manichiura semipermanentă costă de obicei între 100 și 180 lei. Designurile complicate, îndepărtarea materialului vechi sau deplasarea la domiciliu pot crește prețul. În orașele mari, tarifele sunt de regulă spre capătul de sus.",
      },
      {
        q: "Cât rezistă manichiura semipermanentă?",
        a: "De obicei rezistă 2–3 săptămâni, în funcție de cum crește unghia și de cât de des lucrezi cu mâinile în apă. După acest interval, unghia crește și se vede marginea. Pentru îndepărtare, e mai bine să mergi la manichiuristă decât să îl smulgi.",
      },
      {
        q: "Care e diferența dintre semipermanent și gel?",
        a: "Semipermanentul e un lac aplicat pe unghia naturală, fără să o lungească. Gelul se folosește pentru construcție, ca să lungească sau să întărească unghia, și e mai gros. Gelul durează de obicei mai mult, dar cere întreținere regulată.",
      },
      {
        q: "Cât durează o ședință de manichiură?",
        a: "O manichiură semipermanentă durează în jur de 1–1,5 ore, iar o construcție cu gel 2–3 ore. Pedichiura durează de obicei aproximativ o oră. Dacă vrei și nail art, adaugă timp în plus.",
      },
    ],
  },

  masaj: {
    seoTitle: "Masaj relaxare și kinetoterapie: prețuri pe ședință",
    metaDescription:
      "Cauți masaj de relaxare, masaj de recuperare sau kinetoterapie? Postezi gratuit și primești oferte de la terapeuți verificați.",
    intro: [
      "Serviciul include masajul de relaxare, masajul de recuperare pentru tensiune musculară, masajul sportiv, precum și ședințele de kinetoterapie. Îl cauți când ai spatele încordat după multe ore la birou, după antrenamente intense sau când vrei o oră de relaxare la salon ori acasă. Pentru dureri persistente, accidentări sau afecțiuni, consultă mai întâi un medic.",
      "Pe Contractez descrii ce tip de masaj vrei, durata și dacă preferi salon sau domiciliu, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la terapeuți compatibili. Aceștia sunt verificați prin email, telefon și, când au firmă, în registrul ANAF. Prețul îl stabiliți direct.",
    ],
    prices: [
      { item: "Masaj de relaxare, 60 de minute", range: "150–300 lei" },
      { item: "Masaj de recuperare sau sportiv, 60 de minute", range: "180–350 lei" },
      { item: "Masaj la domiciliu, 60 de minute", range: "250–450 lei", note: "cu deplasare" },
      { item: "Ședință de kinetoterapie", range: "120–250 lei" },
      { item: "Abonament 10 ședințe de masaj", range: "1.300–2.800 lei" },
    ],
    priceFactors: [
      "Durata ședinței și tipul de masaj",
      "Experiența și pregătirea terapeutului",
      "Salon sau deplasare la domiciliu",
      "Ședință individuală sau abonament",
    ],
    checklist: [
      "Cere detalii despre pregătirea terapeutului și cursurile absolvite.",
      "Pentru kinetoterapie, alege un kinetoterapeut cu studii de specialitate și drept de liberă practică.",
      "Spune-i dacă ai probleme de sănătate, iar pentru afecțiuni cere mai întâi sfatul medicului.",
      "Întreabă ce include ședința și cât durează efectiv masajul.",
      "Citește recenziile de la alți clienți.",
    ],
    faq: [
      {
        q: "Cât costă un masaj de 60 de minute?",
        a: "Un masaj de relaxare de 60 de minute costă de obicei între 150 și 300 lei. Masajul sportiv sau de recuperare e în general puțin mai scump. La domiciliu, prețul crește cu taxa de deplasare, iar abonamentele reduc costul pe ședință.",
      },
      {
        q: "Care e diferența dintre masaj și kinetoterapie?",
        a: "Masajul se concentrează pe relaxarea mușchilor și pe starea de bine. Kinetoterapia folosește exerciții adaptate pentru recuperarea mișcării, de exemplu după o accidentare, și se face de obicei la recomandarea medicului. Pentru o problemă de sănătate, discută întâi cu medicul ce variantă ți se potrivește.",
      },
      {
        q: "Cât de des pot face masaj?",
        a: "Pentru relaxare, mulți oameni aleg o ședință la una–patru săptămâni, în funcție de buget și de cum se simt. Dacă ai o afecțiune, o sarcină sau iei tratament, întreabă medicul înainte. Un terapeut serios te va întreba despre starea ta de sănătate înainte de prima ședință.",
      },
      {
        q: "Pot chema un maseur la domiciliu?",
        a: "Da, mulți terapeuți vin cu masa de masaj și cu tot ce le trebuie. Asigură-te că ai un spațiu liniștit de aproximativ 2 x 3 metri și o cameră încălzită. Deplasarea se adaugă de obicei la prețul ședinței.",
      },
    ],
  },

  "fitness-nutritie": {
    seoTitle: "Antrenor personal și plan alimentar: prețuri și oferte",
    metaDescription:
      "Cauți antrenor personal, plan alimentar, yoga sau pilates? Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Serviciul include antrenamente cu antrenor personal la sală, acasă sau online, planuri alimentare personalizate, ședințe individuale de yoga și pilates. Îl cauți când vrei să începi să faci mișcare în siguranță, când ai stagnat la sală, când vrei să îți organizezi mesele sau să îți îmbunătățești postura. Dacă ai o afecțiune sau iei tratament, discută întâi cu medicul.",
      "Pe Contractez spui ce obiectiv ai, cât timp ai la dispoziție și unde vrei să te antrenezi, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte, doar de la prestatori compatibili; poți extinde selecția. Contactul tău rămâne ascuns până alegi, iar prețul și plata le stabilești direct.",
    ],
    prices: [
      { item: "Ședință cu antrenor personal", range: "100–250 lei", note: "50–60 de minute" },
      { item: "Pachet 12 ședințe cu antrenor", range: "1.000–2.500 lei" },
      { item: "Program de antrenament online", range: "300–800 lei/lună" },
      { item: "Plan alimentar personalizat", range: "200–600 lei" },
      { item: "Ședință individuală de yoga sau pilates", range: "120–250 lei" },
    ],
    priceFactors: [
      "Ședințe individuale sau pachete lunare",
      "Locul antrenamentului: sală, acasă sau online",
      "Experiența și certificările prestatorului",
      "Nivelul de urmărire: ajustări săptămânale, mesaje, rapoarte",
    ],
    checklist: [
      "Cere detalii despre certificări și pregătire, de exemplu cursuri de instructor sau studii de nutriție.",
      "Pentru afecțiuni medicale, cere întâi sfatul medicului, iar planul alimentar să îl facă un medic sau un dietetician.",
      "Întreabă cum îți evaluează nivelul la început și cum urmărește progresul.",
      "Fii atent la promisiuni de rezultate rapide garantate.",
      "Citește recenziile de la clienți cu obiective asemănătoare.",
    ],
    faq: [
      {
        q: "Cât costă o ședință cu antrenor personal?",
        a: "O ședință de 50–60 de minute costă de obicei între 100 și 250 lei. Pachetele de 8 sau 12 ședințe reduc prețul pe ședință. Antrenamentele la domiciliu sunt mai scumpe din cauza deplasării, iar cele online sunt adesea mai accesibile.",
      },
      {
        q: "Cât costă un plan alimentar personalizat?",
        a: "Un plan alimentar personalizat costă de obicei între 200 și 600 lei, în funcție de cât de detaliat e și dacă include ajustări ulterioare. Unii prestatori oferă abonamente lunare cu urmărire. Dacă ai diabet, probleme digestive sau altă afecțiune, planul trebuie făcut de un medic sau de un dietetician.",
      },
      {
        q: "De câte ședințe pe săptămână am nevoie?",
        a: "Pentru început, 2–3 antrenamente pe săptămână sunt un ritm ușor de menținut pentru majoritatea oamenilor. Antrenorul poate ajusta frecvența după obiectiv, timp liber și cum te recuperezi. Consecvența contează mai mult decât numărul de ședințe dintr-o săptămână.",
      },
      {
        q: "Pot face antrenamente cu antrenor online?",
        a: "Da, multe antrenamente se pot face online, prin apel video sau cu un program trimis în aplicație și feedback pe filmări. Varianta e potrivită dacă ai deja ceva experiență și echipament de bază. Pentru început, câteva ședințe față în față te ajută să înveți tehnica corectă.",
      },
    ],
  },
};
