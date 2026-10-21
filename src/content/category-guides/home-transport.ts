import type { CategoryGuides } from "./types";

export const homeTransportGuides: CategoryGuides = {
  "casa-gradina": {
    seoTitle: "Servicii pentru casă și grădină: prețuri și oferte",
    metaDescription:
      "Curățenie, mobilă, grădinărit, reparații sau dezinsecție. Publici gratuit proiectul și primești oferte de la prestatori verificați din zona ta.",
    intro: [
      "Casa și grădina au nevoie de grijă constantă: o curățenie generală înainte de sărbători, un dulap montat, gazonul tuns, o mașină de spălat care nu mai pornește sau o problemă cu gândacii. În această categorie găsești prestatori pentru lucrările de zi cu zi, dar și pentru proiecte mai mari, cum ar fi mobila la comandă sau amenajarea grădinii.",
      "Pe Contractez descrii ce ai nevoie cu propriile cuvinte, iar platforma te ajută să structurezi cererea. Publicarea este gratuită și primești cel mult 5 oferte de la prestatori compatibili, verificați prin email, telefon și, când au firmă, în registrul ANAF. Datele tale de contact rămân ascunse până alegi tu cu cine vorbești.",
    ],
    prices: [
      { item: "Curățenie generală apartament 2 camere", range: "250–450 lei" },
      { item: "Montaj mobilă din cutie (dulap)", range: "150–350 lei", note: "per corp, manoperă" },
      { item: "Tuns gazon", range: "0,5–2 lei/mp" },
      { item: "Dezinsecție gândaci apartament", range: "150–300 lei" },
      { item: "Handyman", range: "80–150 lei/oră" },
    ],
    faq: [
      {
        q: "Cât costă să publici o cerere pentru o lucrare în casă?",
        a: "Nimic. Publicarea proiectului este gratuită și nu plătești nimic platformei. Prețul lucrării îl stabilești direct cu prestatorul pe care îl alegi.",
      },
      {
        q: "Pot cere o singură ofertă pentru mai multe lucrări mici?",
        a: "Da. Dacă ai mai multe reparații mărunte, de exemplu o lustră, un raft și o ușă care nu se închide bine, le poți descrie în același proiect. Un handyman îți poate face o ofertă pentru tot pachetul, de obicei mai avantajoasă decât deplasări separate.",
      },
      {
        q: "Cum îmi dau seama dacă un prestator este de încredere?",
        a: "Uită-te la recenzii, care pe Contractez pot fi lăsate doar după o colaborare confirmată, și la verificările din profil. Cere o ofertă scrisă cu ce include prețul și întreabă dacă emite factură.",
      },
    ],
  },

  curatenie: {
    seoTitle: "Firmă de curățenie: prețuri pe mp și oferte verificate",
    metaDescription:
      "Curățenie generală, după constructor sau la birou. Publici gratuit cererea și primești oferte de la firme de curățenie verificate din orașul tău.",
    intro: [
      "Serviciile de curățenie acoperă curățenia generală a locuinței, curățenia după constructor sau renovare, spălarea canapelelor, saltelelor și covoarelor, dar și întreținerea periodică a birourilor. Ai nevoie de ele când te muți, înainte să predai o chirie, după o renovare sau pur și simplu când nu mai ai timp să faci totul singur.",
      "Pe Contractez scrii ce suprafață ai, ce tip de curățenie vrei și când, iar platforma te ajută să clarifici detaliile. Cererea ajunge doar la firme compatibile și primești cel mult 5 oferte, pe care le poți compara liniștit. Publicarea e gratuită, iar prețul și plata le stabilești direct cu firma aleasă.",
    ],
    prices: [
      { item: "Curățenie generală apartament 2 camere", range: "250–450 lei", note: "bucătărie, baie, geamuri pe interior" },
      { item: "Curățenie generală casă", range: "6–10 lei/mp" },
      { item: "Curățenie după constructor", range: "8–15 lei/mp", note: "include îndepărtarea urmelor de var și vopsea" },
      { item: "Spălat canapea 3 locuri", range: "150–300 lei", note: "injecție-extracție" },
      { item: "Spălat geamuri și tâmplărie", range: "5–10 lei/mp" },
      { item: "Curățenie birouri", range: "2–5 lei/mp", note: "per intervenție, la abonament" },
    ],
    priceFactors: [
      "Suprafața și gradul de murdărie: o curățenie după constructor durează de câteva ori mai mult decât una de întreținere.",
      "Ce intră în pachet: geamuri pe exterior, interiorul dulapurilor, electrocasnice, balcon.",
      "Frecvența: abonamentele săptămânale sau lunare au de obicei tarif mai mic pe intervenție.",
      "Urgența și programul: weekendul sau intervențiile în aceeași zi pot costa mai mult.",
    ],
    checklist: [
      "Cere o ofertă scrisă care să spună clar ce încăperi și ce suprafețe sunt incluse.",
      "Întreabă dacă firma vine cu produse și echipamente proprii și ce soluții folosește pe parchet, marmură sau lemn masiv.",
      "Verifică dacă emite factură, mai ales dacă ai nevoie de ea pentru firmă sau pentru predarea unei chirii.",
      "Citește recenziile și cere, la nevoie, poze de la lucrări asemănătoare, de exemplu curățenii după constructor.",
      "Stabilește dinainte ce se întâmplă dacă nu ești mulțumit de o zonă: revin gratuit sau nu.",
    ],
    faq: [
      {
        q: "Cât costă curățenia după constructor?",
        a: "Tarifele uzuale sunt în jur de 8–15 lei/mp, în funcție de cât de mult praf, var și resturi de vopsea au rămas. Pentru un apartament de 60 mp asta înseamnă aproximativ 500–900 lei. Geamurile foarte murdare sau resturile de silicon pot ridica prețul.",
      },
      {
        q: "Cât durează o curățenie generală într-un apartament de 2 camere?",
        a: "O echipă de două persoane termină de obicei în 4–6 ore. Dacă incluzi interiorul dulapurilor, cuptorul și geamurile pe ambele părți, poate dura o zi întreagă.",
      },
      {
        q: "Trebuie să cumpăr eu produsele de curățenie?",
        a: "De regulă nu, firmele vin cu produse și aparatură proprii, iar costul e inclus în preț. Dacă ai suprafețe delicate sau preferi anumite produse, spune asta în cerere ca să fie luat în calcul în ofertă.",
      },
      {
        q: "Merită un abonament de curățenie pentru birou?",
        a: "Pentru un birou folosit zilnic, o curățenie săptămânală sau de două ori pe săptămână ține spațiul în ordine cu un cost previzibil. Firmele oferă de obicei un tarif lunar fix, mai mic decât suma intervențiilor separate.",
      },
    ],
  },

  mobila: {
    seoTitle: "Mobilă la comandă și montaj mobilă: prețuri și oferte",
    metaDescription:
      "Mobilă la comandă, montaj mobilă, tâmplărie PVC și uși interioare. Publici gratuit proiectul și primești oferte de la meșteri și firme verificate.",
    intro: [
      "Categoria include mobila făcută pe măsură, de la bucătării și dressinguri la biblioteci, montajul mobilei cumpărate din magazin, tâmplăria PVC sau aluminiu și montajul ușilor interioare. Ai nevoie de ea când îți amenajezi o locuință nouă, când un spațiu are dimensiuni atipice sau când nu ai sculele și timpul să asamblezi singur zeci de corpuri.",
      "Pe Contractez descrii ce vrei să realizezi, ce dimensiuni ai și ce materiale preferi, iar platforma te ajută să pui informațiile în ordine. Primești cel mult 5 oferte de la prestatori compatibili, iar dacă vrei mai multe variante poți extinde selecția. Datele tale de contact rămân ascunse până alegi tu prestatorul.",
    ],
    prices: [
      { item: "Montaj mobilă din cutie (dulap 2–3 uși)", range: "150–350 lei", note: "manoperă" },
      { item: "Montaj mobilă de bucătărie", range: "150–300 lei/ml", note: "fără racorduri de apă și gaz" },
      { item: "Bucătărie la comandă din PAL", range: "1.500–3.500 lei/ml", note: "corpuri și fronturi, fără electrocasnice" },
      { item: "Dulap sau dressing la comandă", range: "1.000–2.200 lei/mp", note: "mp de front" },
      { item: "Fereastră PVC montată", range: "1.200–2.500 lei", note: "aprox. 120×140 cm, termopan dublu" },
      { item: "Montaj ușă interioară", range: "200–400 lei", note: "manoperă, per ușă" },
    ],
    priceFactors: [
      "Materialul: PAL melaminat, MDF vopsit, furnir sau lemn masiv au prețuri foarte diferite.",
      "Feroneria: balamalele cu închidere lentă și sertarele cu extragere totală cresc costul.",
      "Complexitatea: colțuri, nișe, pereți strâmbi sau corpuri până la tavan cer mai multă muncă.",
      "Transportul și urcatul la etaj, mai ales fără lift.",
    ],
    checklist: [
      "Cere o ofertă scrisă cu materialele, tipul de feronerie, culoarea și termenul de execuție.",
      "Solicită o schiță sau o randare înainte de a plăti avansul pentru mobila la comandă.",
      "Întreabă ce garanție oferă pentru mobilier și montaj și dacă emite factură.",
      "Uită-te la poze de la lucrări anterioare și citește recenziile altor clienți.",
      "Stabilește cine face măsurătorile finale; ideal este ca prestatorul să le facă la fața locului.",
    ],
    faq: [
      {
        q: "Cât costă o bucătărie la comandă?",
        a: "Pentru PAL melaminat, prețurile pornesc de la aproximativ 1.500 lei pe metru liniar și pot trece de 3.500 lei/ml pentru MDF vopsit și feronerie premium. O bucătărie de 3 metri liniari cu corpuri sus și jos ajunge frecvent la 5.000–10.000 lei, fără blat special și electrocasnice.",
      },
      {
        q: "Cât durează realizarea mobilei la comandă?",
        a: "De obicei 2–6 săptămâni de la semnarea comenzii, în funcție de complexitate și de cât de ocupat e atelierul. Montajul propriu-zis durează între câteva ore și 2–3 zile.",
      },
      {
        q: "Cât costă montajul mobilei cumpărate din magazin?",
        a: "Montajul unui dulap mediu costă în jur de 150–350 lei, iar o cameră întreagă poate ajunge la 500–1.000 lei. Unii meșteri lucrează la bucată, alții cu tarif orar, așa că cere prețul total înainte să înceapă.",
      },
      {
        q: "Ce avans se plătește de obicei pentru mobila la comandă?",
        a: "Este uzual un avans din valoarea comenzii pentru achiziția materialelor, iar restul se plătește la montaj. Avansul și restul plății le stabilești direct cu prestatorul, așa că trece-le în ofertă sau în contract.",
      },
    ],
  },

  gradinarit: {
    seoTitle: "Grădinar și amenajare grădină: prețuri și oferte",
    metaDescription:
      "Tuns gazon, amenajare grădină, sisteme de irigații și toaletare pomi. Publici gratuit cererea și primești oferte de la grădinari verificați.",
    intro: [
      "Serviciile de grădinărit și peisagistică includ tunsul și întreținerea gazonului, amenajarea unei grădini de la zero, montajul gazonului rulou, instalarea sistemelor de irigații și toaletarea pomilor și arbuștilor. Ai nevoie de ele primăvara, când pornește sezonul, după ce ți-ai construit casa sau când nu mai ai timp să întreții curtea în fiecare săptămână.",
      "Pe Contractez spui ce suprafață ai, ce lucrări vrei și cât de des, iar platforma te ajută să structurezi cererea. Cererea ajunge doar la prestatori compatibili și primești cel mult 5 oferte. Grădinarii sunt verificați prin email, telefon și, când au firmă, în registrul ANAF, iar publicarea este gratuită.",
    ],
    prices: [
      { item: "Tuns gazon", range: "0,5–2 lei/mp", note: "cu strângerea ierbii" },
      { item: "Gazon rulou montat", range: "25–45 lei/mp", note: "pregătire teren, rulou și montaj" },
      { item: "Sistem de irigații automat", range: "15–35 lei/mp", note: "aspersoare, picurare și programator" },
      { item: "Toaletare pom", range: "100–400 lei", note: "per pom, în funcție de înălțime" },
      { item: "Abonament întreținere grădină", range: "400–1.200 lei/lună", note: "curte de 300–600 mp" },
    ],
    priceFactors: [
      "Suprafața și accesul utilajelor în curte.",
      "Starea terenului: nivelare, îndepărtarea buruienilor sau aport de pământ vegetal.",
      "Materialele alese: tipul de gazon, plante, piatră decorativă, componente de irigații.",
      "Frecvența întreținerii și dacă resturile vegetale sunt ridicate de prestator.",
    ],
    checklist: [
      "Cere o ofertă scrisă care separă manopera de materiale și plante.",
      "Pentru amenajări mari, solicită o schiță sau un plan înainte de începerea lucrării.",
      "Întreabă dacă prestatorul ridică resturile vegetale și dacă transportul e inclus.",
      "Verifică recenziile și cere poze cu grădini amenajate anterior.",
      "Pentru irigații, întreabă ce garanție oferă la componente și cine face revizia de primăvară.",
    ],
    faq: [
      {
        q: "Cât costă tunsul gazonului?",
        a: "Tarifele uzuale sunt în jur de 0,5–2 lei/mp, cu prețuri mai mici pe mp la suprafețe mari. Multe firme au și un tarif minim pe deplasare, de exemplu pentru curți foarte mici.",
      },
      {
        q: "Cât costă gazonul rulou montat?",
        a: "Cu pregătirea terenului, rulou și montaj, prețul este de obicei 25–45 lei/mp. Dacă terenul are nevoie de nivelare serioasă sau de pământ vegetal adus, costul crește.",
      },
      {
        q: "Când se face toaletarea pomilor?",
        a: "Tăierile principale la pomii fructiferi se fac de regulă la sfârșitul iernii, înainte de pornirea în vegetație. Lăstarii lacomi și ramurile uscate pot fi îndepărtate și vara.",
      },
      {
        q: "Cât durează montajul unui sistem de irigații?",
        a: "Pentru o curte obișnuită de câteva sute de metri pătrați, montajul durează de obicei 1–3 zile. Grădinile mari sau cu multe zone separate pot necesita mai mult timp.",
      },
    ],
  },

  "reparatii-casa": {
    seoTitle: "Handyman și mici reparații în casă: prețuri și oferte",
    metaDescription:
      "Mici reparații, montaj TV, corpuri de iluminat și lăcătuș. Publici gratuit lista de lucrări și primești oferte de la meșteri verificați.",
    intro: [
      "Un handyman rezolvă lucrările mărunte pentru care nu chemi o echipă întreagă: montaj TV pe perete, lustre și aplice, rafturi, galerii, uși care se freacă, robineți care picură sau o yală blocată. Ai nevoie de el când te muți, când strângi o listă de mici defecte sau când rămâi pe dinafară și ai nevoie urgent de un lăcătuș.",
      "Pe Contractez îți scrii lista de reparații cu propriile cuvinte, iar platforma te ajută să o organizezi. Primești cel mult 5 oferte de la meșteri compatibili, verificați prin email și telefon. Datele tale de contact rămân ascunse până alegi tu, iar prețul și plata le stabilești direct cu meșterul.",
    ],
    prices: [
      { item: "Handyman", range: "80–150 lei/oră", note: "deseori cu minim 1–2 ore" },
      { item: "Montaj TV pe perete", range: "100–250 lei", note: "fără suport" },
      { item: "Montaj lustră sau aplică", range: "60–150 lei", note: "per bucată" },
      { item: "Montaj rafturi, galerii, tablouri", range: "50–120 lei", note: "per lucrare mică" },
      { item: "Deblocare ușă (lăcătuș)", range: "150–350 lei", note: "mai mult noaptea" },
      { item: "Înlocuire butuc yală", range: "100–250 lei", note: "plus prețul butucului" },
    ],
    priceFactors: [
      "Numărul de lucrări grupate în aceeași vizită.",
      "Tipul peretelui: betonul și rigipsul cer dibluri și scule diferite.",
      "Urgența: intervențiile de noapte, în weekend sau de sărbători costă mai mult.",
      "Dacă meșterul aduce materialele sau le cumperi tu.",
    ],
    checklist: [
      "Fă o listă completă de lucrări și cere un preț total, nu doar tariful orar.",
      "Întreabă dacă deplasarea e inclusă și dacă există un tarif minim.",
      "La lăcătuș, cere prețul înainte de intervenție și pregătește un act care dovedește că locuiești acolo.",
      "Verifică recenziile și întreabă dacă emite factură sau chitanță.",
    ],
    faq: [
      {
        q: "Cât costă un handyman pe oră?",
        a: "Tarifele uzuale sunt în jur de 80–150 lei pe oră, adesea cu un minim de 1–2 ore. Pentru mai multe lucrări mici e mai avantajos să ceri un preț pe tot pachetul.",
      },
      {
        q: "Cât costă montajul unui televizor pe perete?",
        a: "Montajul unui TV pe un perete obișnuit costă de obicei 100–250 lei, fără suport. Ascunderea cablurilor în perete sau în canal de cablu se plătește separat.",
      },
      {
        q: "Cât costă un lăcătuș pentru deblocarea ușii?",
        a: "O deblocare fără distrugerea yalei costă în general 150–350 lei, iar noaptea sau în weekend prețul poate crește. Dacă butucul trebuie spart și înlocuit, adaugi prețul butucului nou.",
      },
      {
        q: "Handymanul poate face și lucrări electrice?",
        a: "Montajul unei lustre sau înlocuirea unei prize pot intra în lucrările de handyman. Pentru modificări la tabloul electric sau trasee noi, alege un electrician autorizat ANRE.",
      },
    ],
  },

  electrocasnice: {
    seoTitle: "Reparații electrocasnice la domiciliu: prețuri și oferte",
    metaDescription:
      "Reparații mașini de spălat, frigidere și aragaze la domiciliu. Publici gratuit defecțiunea și primești oferte de la tehnicieni verificați.",
    intro: [
      "Serviciile de reparații electrocasnice acoperă mașinile de spălat rufe și vase, frigiderele și congelatoarele, aragazele și cuptoarele. Tehnicianul vine la domiciliu, face diagnosticul și înlocuiește piesa defectă. Ai nevoie de el când mașina nu mai evacuează apa, frigiderul nu mai răcește, aragazul nu se mai aprinde sau apare un cod de eroare pe afișaj.",
      "Pe Contractez descrii defecțiunea, marca și modelul aparatului, iar platforma te ajută să incluzi detaliile utile pentru diagnostic. Cererea ajunge doar la tehnicieni compatibili și primești cel mult 5 oferte. Publicarea este gratuită, iar prețul reparației îl stabilești direct cu tehnicianul ales.",
    ],
    prices: [
      { item: "Deplasare și diagnostic", range: "80–150 lei", note: "deseori scăzut din costul reparației" },
      { item: "Înlocuire pompă evacuare mașină de spălat", range: "200–400 lei", note: "cu piesa" },
      { item: "Înlocuire rulmenți mașină de spălat", range: "400–800 lei", note: "cu piese și manoperă" },
      { item: "Înlocuire rezistență mașină de spălat", range: "200–400 lei", note: "cu piesa" },
      { item: "Încărcare freon și reparație circuit frigider", range: "300–600 lei" },
      { item: "Reparație aragaz (termocuplu, aprindere)", range: "150–350 lei" },
    ],
    priceFactors: [
      "Piesa necesară și disponibilitatea ei pentru marca respectivă.",
      "Vechimea aparatului: piesele pentru modele vechi pot fi greu de găsit.",
      "Dacă reparația se face la domiciliu sau aparatul trebuie dus în atelier.",
      "Urgența intervenției.",
    ],
    checklist: [
      "Spune marca, modelul și codul de eroare încă din cerere, ca tehnicianul să vină cu piesa potrivită.",
      "Întreabă cât costă deplasarea și dacă se scade din reparație.",
      "Cere prețul total, cu piesă și manoperă, înainte să accepți reparația.",
      "Întreabă ce garanție oferă pentru piesa montată și pentru manoperă și dacă emite factură.",
      "Dacă aparatul e încă în garanție, verifică întâi la service-ul autorizat al producătorului.",
    ],
    faq: [
      {
        q: "Cât costă reparația unei mașini de spălat?",
        a: "Cele mai multe reparații obișnuite, ca pompa de evacuare sau rezistența, costă 200–400 lei cu piesa. Înlocuirea rulmenților este mai scumpă, de obicei 400–800 lei, pentru că mașina trebuie demontată aproape complet.",
      },
      {
        q: "Merită să repar o mașină de spălat veche?",
        a: "Dacă reparația se apropie de jumătate din prețul unei mașini noi și aparatul are peste 8–10 ani, mulți aleg înlocuirea. Pentru defecte simple, cum ar fi pompa sau garnitura, reparația merită aproape mereu.",
      },
      {
        q: "Cât durează o reparație la domiciliu?",
        a: "Dacă tehnicianul are piesa la el, majoritatea reparațiilor se fac în 1–2 ore. Când piesa trebuie comandată, lucrarea se finalizează la o a doua vizită, după câteva zile.",
      },
      {
        q: "De ce nu mai răcește frigiderul?",
        a: "Cauzele frecvente sunt termostatul, ventilatorul, senzorul de dezghețare sau o pierdere de freon. Un tehnician poate stabili cauza la diagnostic și îți spune dacă reparația merită.",
      },
    ],
  },

  dezinsectie: {
    seoTitle: "Dezinsecție și deratizare: prețuri și firme autorizate",
    metaDescription:
      "Dezinsecție pentru gândaci și ploșnițe, deratizare și dezinfecție. Publici gratuit cererea și primești oferte de la firme DDD verificate.",
    intro: [
      "Serviciile DDD înseamnă dezinsecție (gândaci, ploșnițe, purici, furnici, țânțari, căpușe), deratizare (șoareci și șobolani) și dezinfecție. Ai nevoie de ele când observi insecte sau rozătoare în casă, după ce te muți într-o locuință nouă, la blocuri sau pentru spații comerciale și restaurante care au nevoie de tratamente periodice.",
      "Pe Contractez descrii problema, tipul spațiului și suprafața, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte de la firme compatibile, verificate prin email, telefon și în registrul ANAF. Datele tale rămân ascunse până alegi firma, iar prețul îl stabilești direct cu ea.",
    ],
    prices: [
      { item: "Dezinsecție gândaci garsonieră sau 2 camere", range: "150–300 lei", note: "per tratament" },
      { item: "Dezinsecție gândaci apartament 3–4 camere", range: "200–350 lei", note: "per tratament" },
      { item: "Tratament ploșnițe apartament", range: "300–700 lei", note: "de obicei 2 tratamente" },
      { item: "Deratizare casă sau curte", range: "200–500 lei", note: "cu stații de momeală" },
      { item: "Dezinfecție apartament", range: "150–350 lei" },
      { item: "Contract DDD pentru spații comerciale", range: "150–400 lei/lună" },
    ],
    priceFactors: [
      "Tipul dăunătorului: ploșnițele cer mai multe tratamente decât gândacii.",
      "Suprafața și gradul de infestare.",
      "Numărul de tratamente incluse și dacă există garanție de revenire.",
      "Dacă se tratează un singur apartament sau tot blocul, inclusiv subsolul.",
    ],
    checklist: [
      "Alege o firmă autorizată pentru servicii DDD, cu aviz de la Direcția de Sănătate Publică (DSP), și cere să vezi documentul.",
      "Întreabă ce substanțe folosește, dacă sunt biocide avizate și cât timp trebuie să stai în afara locuinței.",
      "Cere o ofertă scrisă cu numărul de tratamente și intervalul dintre ele.",
      "Solicită factură și certificatul de efectuare a tratamentului, util la asociația de proprietari sau la controale.",
      "Întreabă ce garanție oferă dacă dăunătorii reapar.",
    ],
    faq: [
      {
        q: "Cât costă o dezinsecție de gândaci într-un apartament?",
        a: "Pentru o garsonieră sau un apartament de 2 camere, un tratament costă de obicei 150–300 lei. La infestări mari se recomandă al doilea tratament după 2–3 săptămâni, uneori la preț redus.",
      },
      {
        q: "Câte tratamente sunt necesare pentru ploșnițe?",
        a: "De regulă sunt necesare cel puțin două tratamente, la 7–14 zile distanță, pentru că ouăle rezistă la prima aplicare. Pregătirea casei, adică spălarea lenjeriei la temperatură mare și eliberarea zonelor din jurul patului, contează mult.",
      },
      {
        q: "Cât timp trebuie să stau afară după dezinsecție?",
        a: "Depinde de substanța folosită; de obicei se recomandă câteva ore, urmate de aerisire. Firma trebuie să îți spună exact timpul de așteptare și măsurile pentru copii și animale de companie.",
      },
      {
        q: "Ce înseamnă o firmă DDD autorizată?",
        a: "Este o firmă care are dreptul să presteze servicii de dezinfecție, dezinsecție și deratizare, cu aviz de la DSP și personal instruit. Folosește biocide avizate și îți poate da documente pentru tratamentul efectuat.",
      },
    ],
  },

  "transport-mutari": {
    seoTitle: "Transport și mutări: prețuri și oferte de la firme",
    metaDescription:
      "Mutări, transport marfă, debarasare și curierat local. Publici gratuit cererea și primești oferte de la transportatori și firme verificate.",
    intro: [
      "Categoria acoperă tot ce ține de mutat lucruri dintr-un loc în altul: mutări de apartament, casă sau birou, transport de mobilă și marfă cu duba, debarasarea molozului și a mobilierului vechi, dar și șoferi și curieri pentru livrări locale. Ai nevoie de ea când te muți, când cumperi ceva voluminos sau când termini o renovare.",
      "Pe Contractez descrii ce trebuie transportat, de unde și până unde, iar platforma te ajută să structurezi cererea. Publicarea este gratuită și primești cel mult 5 oferte de la prestatori compatibili, verificați prin email, telefon și, când au firmă, în registrul ANAF. Prețul și plata le stabilești direct cu prestatorul ales.",
    ],
    prices: [
      { item: "Mutare apartament 2 camere, în același oraș", range: "700–1.600 lei" },
      { item: "Dubă 3,5 t cu șofer, local", range: "80–150 lei/oră" },
      { item: "Transport interurban cu duba", range: "2–3,5 lei/km" },
      { item: "Container moloz 7 mc", range: "500–900 lei" },
      { item: "Livrare locală colet", range: "20–50 lei" },
    ],
    faq: [
      {
        q: "Cât costă o mutare în același oraș?",
        a: "O garsonieră se mută de obicei cu 400–900 lei, iar un apartament de 2 camere cu 700–1.600 lei. Prețul depinde mai ales de volumul de lucruri, etaj, lift și dacă vrei ambalare și demontare de mobilă.",
      },
      {
        q: "Ce informații trebuie să dau pentru o ofertă corectă?",
        a: "Spune adresele, etajele și dacă există lift, lista lucrurilor mari și data dorită. Pozele cu mobila și cu accesul la clădire ajută prestatorul să estimeze corect volumul și numărul de hamali.",
      },
      {
        q: "Pot cere oferte pentru o mutare în alt oraș?",
        a: "Da. Scrie ambele adrese, data dorită și ce ai de mutat, iar ofertele vin de la prestatori compatibili cu cererea ta. La distanțe mari, prețul se calculează de obicei pe kilometru, plus manipularea la încărcare și descărcare.",
      },
    ],
  },

  mutari: {
    seoTitle: "Mutări apartament: cât costă și cum alegi firma",
    metaDescription:
      "Mutări apartament, casă sau birou, cu hamali și ambalare. Publici gratuit cererea și primești oferte de la firme de mutări verificate.",
    intro: [
      "Firmele de mutări se ocupă de transportul complet al lucrurilor tale: ambalare, demontarea și remontarea mobilei, încărcare cu hamali, transport și descărcare la noua adresă. Ai nevoie de ele când te muți în alt apartament, într-o casă sau în alt oraș, când îți muți biroul sau când ai doar câteva piese grele de urcat la etaj.",
      "Pe Contractez descrii ce ai de mutat, adresele, etajele și data dorită, iar platforma te ajută să nu uiți detaliile importante. Primești cel mult 5 oferte de la firme compatibile și poți extinde selecția dacă vrei mai multe. Datele tale rămân ascunse până alegi firma, iar plata o stabilești direct cu ea.",
    ],
    prices: [
      { item: "Mutare garsonieră, același oraș", range: "400–900 lei" },
      { item: "Mutare apartament 2 camere, același oraș", range: "700–1.600 lei" },
      { item: "Mutare apartament 3 camere sau casă", range: "1.200–3.000 lei" },
      { item: "Hamal", range: "50–80 lei/oră", note: "per persoană" },
      { item: "Dubă cu șofer pentru mutare", range: "80–150 lei/oră" },
      { item: "Mutare interurbană", range: "de la 1.500 lei", note: "în funcție de distanță și volum" },
    ],
    priceFactors: [
      "Volumul de lucruri și numărul de piese mari, ca dulapuri, pian sau electrocasnice.",
      "Etajul, existența liftului și distanța de la mașină până la intrare.",
      "Serviciile extra: ambalare, materiale de ambalat, demontare și remontare mobilă.",
      "Distanța și ziua: weekendurile și sfârșitul de lună sunt mai aglomerate.",
    ],
    checklist: [
      "Cere o ofertă scrisă cu prețul total, numărul de hamali, tipul mașinii și ce servicii sunt incluse.",
      "Întreabă dacă firma are asigurare pentru bunurile transportate și ce acoperă aceasta.",
      "Verifică dacă emite factură și cum se tratează eventualele daune.",
      "Citește recenziile și cere referințe de la mutări asemănătoare.",
      "Trimite poze sau cere o evaluare la fața locului pentru mutările mari, ca să eviți surprize la final.",
    ],
    faq: [
      {
        q: "Cât costă mutarea unui apartament de 2 camere?",
        a: "În același oraș, prețul este de obicei 700–1.600 lei, cu 2–3 hamali și o dubă. Dacă e nevoie de ambalare completă, demontare de mobilă sau urcat fără lift la etaje mari, costul crește.",
      },
      {
        q: "Cât durează o mutare?",
        a: "Un apartament de 2 camere se mută de obicei într-o zi, în 4–8 ore. Mutările interurbane sau cele de case mari pot dura două zile.",
      },
      {
        q: "Cu cât timp înainte rezerv firma de mutări?",
        a: "Ideal cu 1–2 săptămâni înainte, iar pentru sfârșitul de lună sau vară chiar mai devreme. Pentru mutări mici, multe firme pot veni și în câteva zile.",
      },
      {
        q: "Firma de mutări răspunde dacă se strică ceva?",
        a: "Depinde de contract și de asigurarea firmei. Cere să fie trecut în scris cum se procedează în caz de daune și fă poze obiectelor valoroase înainte de mutare.",
      },
    ],
  },

  "transport-marfa": {
    seoTitle: "Transport marfă cu duba: prețuri pe km și oferte",
    metaDescription:
      "Transport marfă cu dubă de 3,5 t, transport mobilă și transport internațional. Publici gratuit cererea și primești oferte de la transportatori verificați.",
    intro: [
      "Transportul de marfă acoperă cursele cu dubă de 3,5 t în oraș sau între orașe, transportul de mobilă și electrocasnice cumpărate, transportul de paleți pentru firme și cursele internaționale. Ai nevoie de el când cumperi ceva voluminos, când trimiți marfă unui client sau când ai de dus lucruri în străinătate.",
      "Pe Contractez descrii ce transporți, dimensiunile sau greutatea aproximativă, adresele și data, iar platforma te ajută să clarifici cererea. Primești cel mult 5 oferte de la transportatori compatibili, verificați prin email, telefon și, când au firmă, în registrul ANAF. Publicarea e gratuită.",
    ],
    prices: [
      { item: "Dubă 3,5 t cu șofer, local", range: "80–150 lei/oră", note: "deseori cu minim 2 ore" },
      { item: "Transport interurban cu duba", range: "2–3,5 lei/km" },
      { item: "Transport o piesă de mobilă, în oraș", range: "150–350 lei", note: "cu încărcare" },
      { item: "Palet în grupaj, intern", range: "150–350 lei/palet" },
      { item: "Transport internațional, dubă dedicată", range: "4–6 lei/km" },
    ],
    priceFactors: [
      "Distanța și dacă duba se întoarce goală.",
      "Volumul și greutatea, care stabilesc tipul de vehicul.",
      "Manipularea: ajutor la încărcare, urcat la etaj sau descărcare cu hamali.",
      "Transport dedicat sau în grupaj, împreună cu alte mărfuri.",
    ],
    checklist: [
      "Cere o ofertă scrisă cu prețul total, inclusiv taxe de drum și eventualele ore de așteptare.",
      "Întreabă dacă transportatorul are asigurare pentru marfa transportată, iar la cursele internaționale asigurare CMR.",
      "Verifică dacă emite factură și dacă poate întocmi documentele de transport necesare.",
      "Citește recenziile și întreabă de transporturi asemănătoare făcute anterior.",
    ],
    faq: [
      {
        q: "Cât costă transportul cu o dubă pe kilometru?",
        a: "Pentru curse interurbane, tarifele uzuale sunt în jur de 2–3,5 lei/km. Pentru distanțe scurte în oraș, majoritatea transportatorilor lucrează cu tarif orar sau preț fix pe cursă.",
      },
      {
        q: "Cât încape într-o dubă de 3,5 t?",
        a: "O dubă de 3,5 t are de obicei un volum util de 12–20 mc și o sarcină utilă de aproximativ 1–1,5 tone. Ajunge pentru mobila unei garsoniere sau a unui apartament mic.",
      },
      {
        q: "Cât costă transportul unei canapele în oraș?",
        a: "Transportul unei piese mari în același oraș costă de obicei 150–350 lei. Prețul crește dacă e nevoie de încă un om la urcat și nu există lift.",
      },
      {
        q: "Cât durează un transport internațional cu duba?",
        a: "Pe distanțe ca România–Germania, o dubă dedicată ajunge de obicei în 1–2 zile. Transportul în grupaj e mai ieftin, dar poate dura mai mult, în funcție de rută.",
      },
    ],
  },

  debarasare: {
    seoTitle: "Debarasare moloz și mobilier: prețuri și oferte",
    metaDescription:
      "Debarasare moloz, mobilier vechi, poduri și pivnițe. Publici gratuit cererea și primești oferte de la firme de debarasare verificate.",
    intro: [
      "Debarasarea înseamnă încărcarea, transportul și eliminarea molozului rămas după renovare, a mobilierului vechi, a electrocasnicelor scoase din uz sau a lucrurilor strânse în pod, pivniță sau garaj. Ai nevoie de ea după o renovare, când golești o locuință moștenită sau înainte de a preda ori vinde o proprietate.",
      "Pe Contractez descrii ce trebuie evacuat, cantitatea aproximativă și accesul, iar platforma te ajută să structurezi cererea. Cererea ajunge doar la firme compatibile și primești cel mult 5 oferte. Datele tale de contact rămân ascunse până alegi firma, iar prețul îl stabilești direct cu ea.",
    ],
    prices: [
      { item: "Container moloz 3–4 mc", range: "350–600 lei", note: "livrare, ridicare și eliminare" },
      { item: "Container moloz 7 mc", range: "500–900 lei", note: "livrare, ridicare și eliminare" },
      { item: "Evacuare moloz în saci, cu încărcare", range: "100–200 lei/mc" },
      { item: "Debarasare mobilier vechi apartament", range: "400–1.200 lei" },
      { item: "Golire pod, pivniță sau garaj", range: "500–1.500 lei" },
    ],
    priceFactors: [
      "Cantitatea și tipul deșeurilor: molozul e greu, mobilierul e voluminos.",
      "Etajul, liftul și distanța până la locul de parcare.",
      "Demontarea mobilierului înainte de încărcare.",
      "Taxele de depozitare la groapa de gunoi sau stația de sortare.",
    ],
    checklist: [
      "Cere o ofertă scrisă care spune clar dacă eliminarea deșeurilor și încărcarea sunt incluse.",
      "Întreabă unde sunt duse deșeurile; o firmă serioasă le predă la un depozit sau o stație autorizată.",
      "Pentru container pe domeniul public, întreabă dacă firma se ocupă de aviz sau dacă trebuie să îl obții tu.",
      "Verifică dacă emite factură și citește recenziile altor clienți.",
    ],
    faq: [
      {
        q: "Cât costă un container de moloz de 7 mc?",
        a: "Un container de 7 mc costă de obicei 500–900 lei, cu livrare, ridicare și eliminare. Containerele de 3–4 mc sunt potrivite pentru o baie sau o bucătărie renovată.",
      },
      {
        q: "Pot pune containerul pe stradă?",
        a: "Dacă ocupi domeniul public, de obicei ai nevoie de aviz de la primărie. Regulile diferă de la un oraș la altul, așa că întreabă firma sau primăria înainte de livrare.",
      },
      {
        q: "Cât costă debarasarea mobilierului vechi?",
        a: "Pentru câteva piese mari, prețul pornește de la aproximativ 200–400 lei, iar golirea completă a unui apartament ajunge frecvent la 400–1.200 lei. Etajul fără lift și demontarea cresc costul.",
      },
      {
        q: "Cât durează o debarasare?",
        a: "O debarasare de apartament se face de obicei în câteva ore, cu 2–3 oameni și o dubă. Containerul se lasă de regulă câteva zile, apoi îl ridică firma.",
      },
    ],
  },

  soferi: {
    seoTitle: "Șofer personal și curierat local: prețuri și oferte",
    metaDescription:
      "Șofer personal, livrări și curierat local în orașul tău. Publici gratuit cererea și primești oferte de la șoferi și curieri verificați.",
    intro: [
      "Categoria include șoferi personali care conduc mașina ta, de exemplu la un drum lung, la aeroport sau la un eveniment, precum și curieri și livratori pentru colete, documente sau marfă în oraș. Ai nevoie de ei când nu poți sau nu vrei să conduci, când ai o firmă cu livrări regulate sau când trebuie să ajungă ceva urgent la cineva.",
      "Pe Contractez descrii traseul, programul și ce trebuie transportat, iar platforma te ajută să clarifici cererea. Primești cel mult 5 oferte de la prestatori compatibili, verificați prin email, telefon și, când au firmă, în registrul ANAF. Prețul și plata le stabilești direct cu cel ales.",
    ],
    prices: [
      { item: "Șofer personal, cu mașina ta", range: "50–100 lei/oră" },
      { item: "Șofer personal pe zi", range: "300–600 lei/zi", note: "aprox. 8 ore" },
      { item: "Transfer la aeroport cu mașina ta", range: "100–250 lei" },
      { item: "Livrare locală colet sau documente", range: "20–50 lei" },
      { item: "Curierat cu duba în oraș", range: "80–200 lei/cursă" },
    ],
    priceFactors: [
      "Durata și distanța, plus timpul de așteptare.",
      "Programul: noaptea, weekendul și sărbătorile costă mai mult.",
      "Volumul și greutatea coletelor la curierat.",
      "Regularitatea: livrările zilnice pentru firme se negociază lunar.",
    ],
    checklist: [
      "Cere vechimea permisului și categoria potrivită pentru vehiculul condus.",
      "Pentru șofer personal, verifică dacă asigurarea RCA a mașinii tale acoperă și alți șoferi.",
      "Cere o ofertă scrisă cu tariful, timpul de așteptare inclus și eventualele costuri de întoarcere.",
      "Citește recenziile și, pentru livrări regulate, întreabă dacă emite factură.",
    ],
    faq: [
      {
        q: "Cât costă un șofer personal?",
        a: "Pentru drumuri scurte, tarifele uzuale sunt de 50–100 lei pe oră, cu mașina clientului. O zi întreagă costă de obicei 300–600 lei, iar pentru drumuri lungi se adaugă cazarea și întoarcerea șoferului.",
      },
      {
        q: "Cât costă o livrare urgentă în oraș?",
        a: "Un colet mic sau un plic livrat în aceeași zi costă de obicei 20–50 lei, în funcție de distanță și oră. Pentru obiecte mari e nevoie de o dubă, cu prețuri de la aproximativ 80 lei pe cursă.",
      },
      {
        q: "Pot angaja un șofer să îmi conducă mașina în alt oraș?",
        a: "Da, mulți șoferi fac astfel de curse, de exemplu pentru a aduce mașina dintr-un service sau după o achiziție. Prețul include de regulă și drumul de întoarcere al șoferului cu trenul sau autocarul.",
      },
      {
        q: "Există livratori pentru firme, cu program fix?",
        a: "Da, poți descrie în proiect numărul de livrări, zona și programul. Prestatorii îți pot face o ofertă pe cursă sau un tarif lunar, pe care îl negociezi direct.",
      },
    ],
  },

  animale: {
    seoTitle: "Servicii pentru animale de companie: prețuri și oferte",
    metaDescription:
      "Pet sitting, plimbat câini, dresaj și toaletaj. Publici gratuit cererea și primești oferte de la îngrijitori și dresori verificați din zona ta.",
    intro: [
      "Categoria acoperă îngrijirea animalelor de companie când tu nu poți: plimbat câini, pet sitting la tine acasă sau la îngrijitor, pensiune, dresaj și corectarea comportamentului, plus toaletaj pentru câini și pisici. Ai nevoie de ele când pleci în concediu, când ai program lung la birou sau când câinele tău are nevoie de educație.",
      "Pe Contractez descrii animalul, ce are nevoie și pe ce perioadă, iar platforma te ajută să structurezi cererea. Publicarea este gratuită și primești cel mult 5 oferte de la prestatori compatibili, verificați prin email și telefon. Recenziile pot fi lăsate doar după o colaborare confirmată.",
    ],
    prices: [
      { item: "Plimbat câine 30 de minute", range: "20–45 lei" },
      { item: "Pet sitting, vizită la domiciliu", range: "40–100 lei/vizită" },
      { item: "Ședință individuală de dresaj", range: "80–200 lei" },
      { item: "Toaletaj complet câine talie medie", range: "180–320 lei" },
    ],
    faq: [
      {
        q: "Cum găsesc pe cineva de încredere pentru animalul meu?",
        a: "Citește recenziile, care pe Contractez apar doar după o colaborare confirmată, și cere o întâlnire de cunoaștere înainte de prima zi. Întreabă ce experiență are prestatorul cu animale de talia și temperamentul celui tău.",
      },
      {
        q: "Ce informații trebuie să dau în cerere?",
        a: "Spune specia, rasa sau talia, vârsta, eventualele probleme de sănătate sau comportament și perioada. Cu cât descrierea e mai clară, cu atât ofertele vor fi mai potrivite.",
      },
      {
        q: "Cum plătesc serviciile pentru animale?",
        a: "Prețul și modalitatea de plată le stabilești direct cu prestatorul. Platforma nu încasează bani pentru lucrare și nu plătești nimic pentru publicarea cererii.",
      },
    ],
  },

  "pet-sitting": {
    seoTitle: "Pet sitting și plimbat câini: prețuri și oferte",
    metaDescription:
      "Pet sitter, plimbat câini și pensiune pentru animale. Publici gratuit cererea și primești oferte de la îngrijitori verificați din zona ta.",
    intro: [
      "Pet sittingul înseamnă îngrijirea animalului tău când tu lipsești: vizite la domiciliu pentru hrănire, apă proaspătă și litieră, plimbări zilnice pentru câini, cazare la îngrijitor sau într-o pensiune. Ai nevoie de el în concediu, la delegații, când lucrezi multe ore departe de casă sau când câinele are nevoie de mai multă mișcare decât îi poți oferi tu.",
      "Pe Contractez descrii animalul, programul dorit și perioada, iar platforma te ajută să incluzi detaliile importante. Primești cel mult 5 oferte de la îngrijitori compatibili, verificați prin email și telefon. Datele tale de contact rămân ascunse până alegi tu, iar prețul îl stabilești direct cu îngrijitorul.",
    ],
    prices: [
      { item: "Plimbat câine 30 de minute", range: "20–45 lei" },
      { item: "Plimbat câine 60 de minute", range: "40–70 lei" },
      { item: "Vizită la domiciliu pentru pisică", range: "40–100 lei/vizită", note: "hrănire, apă, litieră" },
      { item: "Cazare la îngrijitor", range: "60–150 lei/noapte" },
      { item: "Pet sitter cu înnoptare la tine acasă", range: "120–250 lei/noapte" },
      { item: "Pensiune pentru câini", range: "50–150 lei/zi" },
    ],
    priceFactors: [
      "Talia și numărul animalelor.",
      "Durata și frecvența vizitelor sau a plimbărilor.",
      "Nevoile speciale: medicație, dietă, animale în vârstă sau reactive.",
      "Perioada: în preajma sărbătorilor și vara cererea crește.",
    ],
    checklist: [
      "Cere o întâlnire de cunoaștere înainte de prima zi, ca să vezi cum interacționează cu animalul tău.",
      "Întreabă ce experiență are cu talia, rasa sau nevoile animalului tău.",
      "Lasă în scris rutina, hrana, medicația și datele medicului veterinar.",
      "Stabilește cum primești vești, de exemplu poze sau mesaje după fiecare vizită.",
      "Citește recenziile altor proprietari de animale.",
    ],
    faq: [
      {
        q: "Cât costă un pet sitter pe zi?",
        a: "O vizită la domiciliu costă de obicei 40–100 lei, iar cazarea la îngrijitor 60–150 lei pe noapte. Dacă vrei ca pet sitterul să doarmă la tine, prețul ajunge la aproximativ 120–250 lei pe noapte.",
      },
      {
        q: "Cât costă plimbatul câinelui?",
        a: "O plimbare de 30 de minute costă în general 20–45 lei, iar una de o oră 40–70 lei. Pachetele cu plimbări zilnice pe o lună au de obicei un preț mai mic pe plimbare.",
      },
      {
        q: "De câte vizite pe zi are nevoie o pisică?",
        a: "Pentru o pisică sănătoasă adultă, o vizită pe zi este de obicei suficientă pentru hrană, apă și litieră. Pisicile tinere, bătrâne sau care iau tratament pot avea nevoie de două vizite.",
      },
      {
        q: "E mai bine pet sitting acasă sau pensiune?",
        a: "Pisicile se descurcă de obicei mai bine în mediul lor, cu vizite la domiciliu. Câinii sociabili se pot adapta bine la o pensiune sau la un îngrijitor, iar cei anxioși preferă adesea să rămână acasă.",
      },
    ],
  },

  dresaj: {
    seoTitle: "Dresaj câini și comportament canin: prețuri și oferte",
    metaDescription:
      "Dresaj de ascultare, educație pentru pui și corectarea comportamentului. Publici gratuit cererea și primești oferte de la dresori verificați.",
    intro: [
      "Dresajul canin acoperă educația puilor, ascultarea de bază (șezi, culcat, rămâi, chemarea, mersul la lesă) și lucrul cu probleme de comportament precum trasul de lesă, lătratul excesiv, anxietatea de separare sau reactivitatea față de alți câini. Ai nevoie de el când aduci un pui acasă, când adopți un câine adult sau când viața de zi cu zi devine greu de gestionat.",
      "Pe Contractez descrii câinele, vârsta lui și ce vrei să rezolvi, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte de la dresori compatibili, verificați prin email și telefon. Recenziile pot fi lăsate doar după o colaborare confirmată, iar prețul îl stabilești direct cu dresorul.",
    ],
    prices: [
      { item: "Ședință individuală", range: "80–200 lei", note: "aprox. 1 oră" },
      { item: "Curs de ascultare de bază", range: "800–2.000 lei", note: "8–10 ședințe" },
      { item: "Curs pentru pui și socializare", range: "400–1.000 lei" },
      { item: "Consultație de comportament", range: "200–500 lei", note: "evaluare și plan de lucru" },
      { item: "Dresaj cu cazare la dresor", range: "de la 2.500 lei", note: "2–4 săptămâni" },
    ],
    priceFactors: [
      "Tipul cursului: ședințe individuale, grupă sau dresaj cu cazare.",
      "Problema de rezolvat: corectarea agresivității cere mai mult timp decât ascultarea de bază.",
      "Locul: la tine acasă, în parc sau pe terenul dresorului.",
      "Experiența și specializarea dresorului.",
    ],
    checklist: [
      "Întreabă ce metode folosește și evită dresorii care se bazează pe pedepse fizice.",
      "Cere o primă evaluare înainte de a plăti un curs întreg.",
      "Asigură-te că te implică și pe tine, nu doar lucrează cu câinele fără tine.",
      "Citește recenziile și cere exemple de cazuri asemănătoare cu al tău.",
      "Stabilește în scris numărul de ședințe, durata lor și prețul total.",
    ],
    faq: [
      {
        q: "Cât costă dresajul unui câine?",
        a: "O ședință individuală costă de obicei 80–200 lei, iar un curs de ascultare de bază de 8–10 ședințe 800–2.000 lei. Problemele de comportament mai serioase pot necesita mai multe ședințe.",
      },
      {
        q: "La ce vârstă poate începe dresajul?",
        a: "Educația de bază și socializarea pot începe de când puiul ajunge acasă, în jurul vârstei de 2–3 luni, cu exerciții scurte. Câinii adulți pot învăța și ei la orice vârstă, chiar dacă uneori e nevoie de mai multă răbdare.",
      },
      {
        q: "Cât durează un curs de ascultare?",
        a: "Un curs de bază durează de obicei 4–8 săptămâni, cu una sau două ședințe pe săptămână. Rezultatele depind mult de cât exersezi cu câinele între ședințe.",
      },
      {
        q: "Merită dresajul cu cazare la dresor?",
        a: "Poate ajuta când ai puțin timp, dar câinele trebuie să învețe să asculte și de tine. Alege un dresor care include și ședințe de predare, în care îți arată cum să continui acasă.",
      },
    ],
  },

  toaletaj: {
    seoTitle: "Toaletaj câini și pisici: cât costă și cum alegi salonul",
    metaDescription:
      "Tuns câini, baie, toaletaj pisici și tăiat unghii. Publici gratuit cererea și primești oferte de la saloane și groomeri verificați din zona ta.",
    intro: [
      "Toaletajul include baia, uscarea și periajul, tunsul pe rasă sau de întreținere, descâlcirea blănii, tăiatul unghiilor și curățarea urechilor, pentru câini și pisici. Ai nevoie de el periodic pentru rasele cu blană lungă sau care crește continuu, când blana s-a încâlcit, în sezonul de năpârlire sau înainte de o expoziție.",
      "Pe Contractez descrii animalul, talia, tipul de blană și ce servicii vrei, iar platforma te ajută să clarifici cererea. Primești cel mult 5 oferte de la groomeri compatibili, inclusiv saloane și toaletori care vin la domiciliu. Datele tale rămân ascunse până alegi tu, iar publicarea este gratuită.",
    ],
    prices: [
      { item: "Toaletaj complet câine talie mică", range: "120–220 lei" },
      { item: "Toaletaj complet câine talie medie", range: "180–320 lei" },
      { item: "Toaletaj complet câine talie mare", range: "250–500 lei" },
      { item: "Baie și uscare câine talie medie", range: "100–160 lei" },
      { item: "Toaletaj pisică", range: "150–350 lei", note: "mai mult pentru blană lungă încâlcită" },
      { item: "Tăiat unghii", range: "20–50 lei" },
    ],
    priceFactors: [
      "Talia și tipul de blană.",
      "Starea blănii: nodurile și încâlcirile cer timp suplimentar.",
      "Temperamentul animalului și cât de obișnuit e cu toaletajul.",
      "Locul: toaletajul la domiciliu costă de obicei mai mult decât la salon.",
    ],
    checklist: [
      "Întreabă ce experiență are groomerul cu rasa ta, mai ales la tunsul pe standard de rasă.",
      "Verifică dacă salonul e curat și dacă animalele stau în siguranță cât așteaptă.",
      "Cere prețul total dinainte, inclusiv eventualul cost pentru descâlcire.",
      "Spune dacă animalul are probleme de piele, alergii sau este anxios.",
      "Citește recenziile și cere poze cu lucrări anterioare.",
    ],
    faq: [
      {
        q: "Cât costă toaletajul unui câine?",
        a: "Un toaletaj complet costă de obicei 120–220 lei pentru talie mică, 180–320 lei pentru talie medie și 250–500 lei pentru talie mare. Baia simplă, fără tuns, este mai ieftină.",
      },
      {
        q: "Cât de des trebuie dus câinele la toaletaj?",
        a: "Rasele cu blană care crește continuu, ca bichonul sau pudelul, au nevoie de toaletaj la 4–8 săptămâni. Rasele cu păr scurt pot merge mai rar, de câteva ori pe an, mai ales în sezonul de năpârlire.",
      },
      {
        q: "Cât durează un toaletaj complet?",
        a: "Pentru un câine de talie mică sau medie durează de obicei 1,5–3 ore. Câinii mari sau cu blana încâlcită pot sta mai mult.",
      },
      {
        q: "Se poate face toaletaj pisicilor?",
        a: "Da, mai ales pentru pisicile cu blană lungă care fac noduri. Mulți groomeri lucrează cu pisici, dar întreabă de experiența lor, pentru că pisicile tolerează mai greu baia și uscarea.",
      },
    ],
  },
};
