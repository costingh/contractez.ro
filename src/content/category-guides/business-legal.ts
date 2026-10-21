import type { CategoryGuides } from "./types";

export const businessLegalGuides: CategoryGuides = {
  "business-financiar": {
    seoTitle: "Servicii business și financiare: contabili și consultanți",
    metaDescription:
      "Găsești contabili, consultanți, specialiști în fonduri europene și HR. Publici gratuit proiectul și primești oferte de la prestatori verificați.",
    intro: [
      "Categoria Business & Financiar adună serviciile de care are nevoie o firmă sau un PFA ca să funcționeze corect: contabilitate și salarizare, consultanță pentru înființare și planuri de afaceri, scrierea și implementarea proiectelor cu fonduri europene, resurse umane și asistență virtuală. Majoritatea lucrărilor se pot face la distanță, așa că poți colabora cu prestatori din orice oraș.",
      "Pe Contractez descrii ce ai nevoie cu propriile cuvinte, iar platforma te ajută să structurezi cererea. Publicarea este gratuită și primești cel mult 5 oferte, doar de la prestatori potriviți pentru proiectul tău. Firmele prestatorilor sunt verificate în registrul ANAF, iar prețul și plata le stabilești direct cu cel pe care îl alegi.",
    ],
    prices: [
      { item: "Contabilitate SRL mic", range: "250–600 lei/lună", note: "volum redus de documente" },
      { item: "Plan de afaceri", range: "1.000–5.000 lei" },
      { item: "Scriere proiect finanțare nerambursabilă", range: "2.000–10.000 lei", note: "sau avans plus procent din finanțare" },
      { item: "Administrare Revisal externalizată", range: "20–50 lei/angajat/lună" },
      { item: "Asistent virtual", range: "30–80 lei/oră" },
    ],
    faq: [
      {
        q: "Pot lucra cu un contabil sau consultant din alt oraș?",
        a: "Da. Contabilitatea, consultanța și asistența virtuală se fac în mare parte online: documentele se trimit electronic, iar declarațiile se depun prin SPV. Contează mai mult experiența cu tipul tău de firmă decât distanța.",
      },
      {
        q: "Cum compar ofertele primite?",
        a: "Uită-te la ce este inclus concret în preț: numărul de documente, salarizarea, bilanțul, termenele de livrare. Cere ca toate ofertele să fie pentru același volum de muncă, ca să le poți compara corect.",
      },
      {
        q: "Plătesc ceva platformei ca să primesc oferte?",
        a: "Nu. Publicarea proiectului este gratuită, iar clienții nu plătesc nimic platformei. Prețul și modul de plată le stabilești direct cu prestatorul ales.",
      },
    ],
  },

  contabilitate: {
    seoTitle: "Contabil pentru SRL și PFA: prețuri și oferte",
    metaDescription:
      "Cauți contabil pentru SRL sau PFA? Publici gratuit cererea și primești oferte de la contabili verificați. Vezi prețurile orientative pe lună.",
    intro: [
      "Un contabil ține evidența documentelor firmei, întocmește și depune declarațiile la ANAF, gestionează e-Factura și SAF-T, calculează salariile și pregătește situațiile financiare anuale. Ai nevoie de el când înființezi un SRL sau un PFA în sistem real, când vrei să schimbi contabilul actual sau când ai de recuperat o contabilitate rămasă în urmă.",
      "Pe Contractez descrii firma, numărul aproximativ de documente pe lună și dacă ai angajați, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la contabili potriviți pentru cererea ta, și poți extinde selecția dacă vrei mai multe. Datele tale de contact rămân ascunse până alegi tu cu cine vorbești.",
    ],
    prices: [
      { item: "PFA în sistem real", range: "150–400 lei/lună" },
      { item: "SRL micro, fără angajați", range: "250–600 lei/lună", note: "până la aproximativ 30 de documente pe lună" },
      { item: "SRL plătitor de TVA, activitate medie", range: "600–1.500 lei/lună", note: "50–150 de documente pe lună" },
      { item: "Salarizare și Revisal", range: "30–60 lei/angajat/lună" },
      { item: "Bilanț anual", range: "500–2.000 lei", note: "uneori inclus în abonamentul lunar" },
      { item: "Recuperare contabilitate restantă", range: "de la 1.000 lei", note: "depinde de perioada și volumul de documente" },
    ],
    priceFactors: [
      "Numărul de documente lunare (facturi, bonuri, extrase)",
      "Dacă firma este plătitoare de TVA și face operațiuni intracomunitare",
      "Numărul de angajați pentru salarizare",
      "Domeniul de activitate (comerț, producție, construcții, servicii)",
    ],
    checklist: [
      "Verifică dacă contabilul sau firma de contabilitate este membru CECCAR (expert contabil sau contabil autorizat).",
      "Întreabă ce include exact abonamentul: declarații, e-Factura, SAF-T, salarizare, bilanț, reprezentare la controale.",
      "Cere să știi cum se predau documentele și care este termenul lunar până la care trebuie trimise.",
      "Întreabă dacă are experiență cu firme din domeniul tău și cu forma ta de organizare.",
      "Semnează un contract scris de prestări servicii, cu tariful și responsabilitățile fiecărei părți.",
    ],
    faq: [
      {
        q: "Cât costă un contabil pentru un SRL mic?",
        a: "Pentru un SRL micro fără angajați și cu puține documente, prețurile pornesc de obicei de la 250 de lei pe lună. Tariful crește cu numărul de documente, cu TVA-ul și cu salarizarea. Cere oferte pentru volumul tău real ca să știi exact cât plătești.",
      },
      {
        q: "De ce acte are nevoie contabilul în fiecare lună?",
        a: "De regulă îi trimiți facturile emise și primite, extrasele de cont, bonurile fiscale, documentele de casă și, dacă ai angajați, pontajul. Majoritatea contabililor lucrează cu documente scanate sau trimise electronic.",
      },
      {
        q: "Cum schimb contabilul firmei?",
        a: "Reziliezi contractul cu actualul contabil conform clauzelor de preaviz și ceri predarea documentelor, a balanțelor și a accesului la conturile firmei. Noul contabil verifică ce primește și preia evidența de la luna următoare. E bine ca predarea să fie consemnată într-un proces-verbal.",
      },
      {
        q: "Am nevoie de contabil pentru PFA?",
        a: "Un PFA în sistem real poate ține singur evidența, dar mulți aleg un contabil ca să evite erorile la declarații și la calculul contribuțiilor. Un specialist îți poate spune ce variantă de impozitare ți se potrivește.",
      },
    ],
  },

  "consultanta-afaceri": {
    seoTitle: "Consultanță afaceri: plan de afaceri și înființare firmă",
    metaDescription:
      "Ai nevoie de plan de afaceri, înființare firmă sau analiză financiară? Publici gratuit proiectul și primești oferte de la consultanți verificați.",
    intro: [
      "Consultanța de afaceri te ajută să iei decizii pe baza unor cifre clare. Poate însemna un plan de afaceri pentru bancă, investitori sau un program de finanțare, înființarea unui SRL cu toate actele, alegerea formei de organizare potrivite sau o analiză financiară a firmei. Ai nevoie de ea când pornești o afacere, extinzi activitatea sau vrei să înțelegi de ce nu ies cifrele.",
      "Pe Contractez explici situația cu propriile cuvinte, iar platforma te ajută să structurezi cererea. Proiectul ajunge doar la consultanți compatibili, iar tu primești cel mult 5 oferte. Prestatorii sunt verificați prin e-mail și, când au firmă, în registrul ANAF. Recenziile pot fi lăsate doar după o colaborare confirmată.",
    ],
    prices: [
      { item: "Înființare SRL (acte și depunere)", range: "500–1.500 lei", note: "plus taxele ONRC" },
      { item: "Plan de afaceri simplu", range: "1.000–3.000 lei" },
      { item: "Plan de afaceri pentru bancă sau finanțare", range: "2.500–7.000 lei" },
      { item: "Analiză financiară a firmei", range: "1.500–5.000 lei" },
      { item: "Consultanță pe oră", range: "150–500 lei/oră" },
    ],
    priceFactors: [
      "Scopul documentului (uz intern, bancă, investitori, finanțare)",
      "Gradul de detaliu al proiecțiilor financiare și al analizei de piață",
      "Datele pe care le ai deja pregătite",
      "Termenul de livrare",
    ],
    checklist: [
      "Cere exemple de planuri de afaceri sau analize făcute pentru firme din domenii apropiate.",
      "Clarifică dacă proiecțiile financiare sunt incluse și pe câți ani.",
      "Întreabă câte runde de modificări sunt incluse în preț.",
      "Pentru înființarea firmei, întreabă dacă taxele ONRC și sediul sunt incluse în ofertă.",
      "Stabiliți în contract livrabilele, termenul și confidențialitatea datelor.",
    ],
    faq: [
      {
        q: "Cât costă un plan de afaceri?",
        a: "Un plan de afaceri simplu pornește de la aproximativ 1.000 de lei. Pentru bancă sau un program de finanțare, cu proiecții pe mai mulți ani și analiză de piață, prețul poate ajunge la câteva mii de lei. Contează mult cât de bine sunt pregătite datele tale.",
      },
      {
        q: "De ce acte am nevoie pentru înființarea unui SRL?",
        a: "De obicei ai nevoie de actele de identitate ale asociaților, dovada sediului social, rezervarea denumirii la ONRC, actul constitutiv și declarațiile asociaților și administratorului. Un consultant îți poate pregăti dosarul și te poate ajuta să alegi codurile CAEN.",
      },
      {
        q: "Cât durează înființarea unei firme?",
        a: "Dacă dosarul este complet, înregistrarea la ONRC se face de regulă în câteva zile lucrătoare. Timpul total depinde și de cât de repede pregătești documentele pentru sediu și de eventualele corecturi cerute.",
      },
      {
        q: "SRL sau PFA, ce aleg?",
        a: "Depinde de venitul estimat, de cheltuieli, de clienți și de cât de mult vrei să separi riscul personal de cel al afacerii. Un consultant sau un contabil îți poate face o comparație pe cifrele tale, ținând cont de regulile fiscale în vigoare.",
      },
    ],
  },

  "fonduri-europene": {
    seoTitle: "Consultant fonduri europene: scriere proiecte și prețuri",
    metaDescription:
      "Cauți consultant pentru fonduri europene, Start-Up Nation sau PNRR? Publici gratuit proiectul și primești oferte de la consultanți verificați.",
    intro: [
      "Un consultant în fonduri europene verifică dacă ești eligibil, scrie cererea de finanțare și planul de afaceri, pregătește bugetul și anexele și, la nevoie, te ajută la implementare și la cererile de rambursare. Ai nevoie de el când se deschide un apel pentru IMM-uri, Start-Up Nation, PNRR sau programe regionale și vrei să depui un dosar complet la timp.",
      "Pe Contractez descrii ideea de proiect și programul vizat, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la consultanți compatibili, și poți extinde selecția. Onorariul, avansul și eventualul procent din finanțare le negociezi direct cu consultantul; platforma nu intermediază plata.",
    ],
    prices: [
      { item: "Analiză de eligibilitate", range: "0–500 lei", note: "unii consultanți o oferă gratuit" },
      { item: "Scriere proiect microgrant sau Start-Up Nation", range: "2.000–8.000 lei" },
      { item: "Proiect de investiții mare (PNRR, programe regionale)", range: "de la 10.000 lei" },
      { item: "Taxă de succes", range: "3–8% din finanțare", note: "de obicei plătită după aprobare, uneori cu avans" },
      { item: "Management implementare proiect", range: "1.000–4.000 lei/lună" },
    ],
    priceFactors: [
      "Programul de finanțare și complexitatea ghidului",
      "Valoarea proiectului și numărul de anexe cerute",
      "Dacă implementarea și cererile de rambursare sunt incluse",
      "Structura onorariului: fix, avans plus taxă de succes sau doar taxă de succes",
    ],
    checklist: [
      "Cere exemple de proiecte aprobate pe programe similare celui pe care îl vizezi.",
      "Clarifică în scris cât plătești dacă proiectul este respins și ce se întâmplă la redepunere.",
      "Întreabă dacă răspunsurile la clarificări și implementarea sunt incluse în onorariu.",
      "Fii atent la cererile de avans mare înainte de depunere.",
      "Semnează un contract scris care detaliază livrabilele, termenele și modul de calcul al taxei de succes.",
    ],
    faq: [
      {
        q: "Cât ia un consultant pentru fonduri europene?",
        a: "Unii consultanți cer un onorariu fix pentru scriere, alții un avans plus un procent din finanțarea aprobată, iar alții doar taxă de succes. Procentul diferă în funcție de program și de valoarea proiectului. Compară ofertele după costul total în cazul aprobării și în cazul respingerii.",
      },
      {
        q: "Cât durează scrierea unui proiect?",
        a: "Pentru programele simple, câteva săptămâni pot fi suficiente dacă ai documentele pregătite. Proiectele de investiții mari, cu studii și avize, pot cere câteva luni. Începe din timp, înainte de deschiderea apelului.",
      },
      {
        q: "De ce documente am nevoie pentru o cerere de finanțare?",
        a: "De obicei sunt cerute actele firmei, situațiile financiare, oferte de preț pentru investiții, dovada dreptului de folosință asupra spațiului și diverse declarații. Lista exactă este în ghidul solicitantului al fiecărui program, iar consultantul te ajută să o completezi.",
      },
      {
        q: "Am nevoie de cofinanțare?",
        a: "Multe programe cer o contribuție proprie și finanțarea cheltuielilor neeligibile, iar unele funcționează pe principiul rambursării. Verifică ghidul programului împreună cu consultantul, ca să știi de câți bani ai nevoie pe parcurs.",
      },
    ],
  },

  "resurse-umane": {
    seoTitle: "Servicii resurse umane: Revisal, recrutare și proceduri HR",
    metaDescription:
      "Externalizezi Revisal, recrutare sau proceduri HR? Publici gratuit cererea și primești oferte de la specialiști HR verificați, fără costuri pentru tine.",
    intro: [
      "Serviciile de resurse umane acoperă administrarea personalului și recrutarea: contracte de muncă și acte adiționale, înregistrarea în Revisal, dosare de personal, regulament intern, fișe de post, proceduri de evaluare și selecție de candidați. Sunt utile când angajezi primii oameni, când nu ai un departament HR intern sau când vrei să pui ordine în documentele existente.",
      "Pe Contractez descrii câți angajați ai și ce ai nevoie, iar platforma te ajută să structurezi cererea. Proiectul ajunge doar la specialiști HR compatibili și primești cel mult 5 oferte. Prestatorii sunt verificați, iar datele tale de contact rămân ascunse până alegi tu prestatorul cu care discuți.",
    ],
    prices: [
      { item: "Administrare Revisal și dosare personal", range: "20–50 lei/angajat/lună", note: "de obicei cu un minim lunar" },
      { item: "Regulament intern și fișe de post", range: "1.000–4.000 lei" },
      { item: "Recrutare post de execuție", range: "1.500–4.000 lei/post" },
      { item: "Recrutare post de specialitate sau management", range: "1–2 salarii brute ale postului" },
      { item: "Consultanță HR pe oră", range: "100–300 lei/oră" },
    ],
    priceFactors: [
      "Numărul de angajați și frecvența modificărilor de contract",
      "Tipul și nivelul posturilor de recrutat",
      "Starea documentelor existente",
      "Dacă serviciul este lunar sau pe proiect",
    ],
    checklist: [
      "Întreabă ce include administrarea lunară: Revisal, acte adiționale, adeverințe, concedii.",
      "Pentru recrutare, clarifică dacă există garanție de înlocuire a candidatului și pe ce perioadă.",
      "Cere exemple de proceduri sau regulamente făcute pentru firme de mărimea ta.",
      "Verifică modul în care sunt protejate datele personale ale angajaților.",
      "Semnează un contract scris, cu responsabilitățile și tarifele clar descrise.",
    ],
    faq: [
      {
        q: "Cât costă externalizarea Revisal?",
        a: "De obicei se plătește pe angajat pe lună, cu un minim lunar pentru firmele mici. Prețul crește dacă ai multe modificări de contract, angajări și plecări frecvente. Uneori serviciul este inclus în pachetul de salarizare al contabilului.",
      },
      {
        q: "Când trebuie înregistrat un contract de muncă în Revisal?",
        a: "Contractul de muncă se înregistrează în Revisal înainte ca angajatul să înceapă lucrul. Și modificările importante, cum ar fi salariul sau funcția, trebuie transmise în termenele legale, așa că e util ca cineva să urmărească aceste termene.",
      },
      {
        q: "Cât durează o recrutare?",
        a: "Pentru posturi de execuție, câteva săptămâni pot fi suficiente. Pentru posturi de specialitate sau de conducere, procesul poate dura una-două luni sau mai mult, în funcție de cât de rar este profilul căutat.",
      },
      {
        q: "Ce documente HR are nevoie o firmă mică?",
        a: "Cel puțin contractele individuale de muncă, fișele de post, dosarele de personal și regulamentul intern. Un specialist HR îți poate spune ce alte documente sunt necesare pentru activitatea și numărul tău de angajați.",
      },
    ],
  },

  "asistenta-virtuala": {
    seoTitle: "Asistent virtual: introducere date și suport clienți",
    metaDescription:
      "Ai nevoie de asistent virtual pentru e-mail, programări sau suport clienți? Publici gratuit cererea și primești oferte de la prestatori verificați.",
    intro: [
      "Un asistent virtual preia de la distanță sarcinile administrative care îți consumă timpul: răspunsuri la e-mail, gestionarea calendarului și a programărilor, introducere și verificare de date, suport pentru clienți prin chat sau telefon, cercetare online și organizarea documentelor. Este util pentru antreprenori, cabinete și firme mici care au nevoie de ajutor câteva ore pe săptămână, fără un angajat cu normă întreagă.",
      "Pe Contractez descrii sarcinile, numărul estimat de ore și instrumentele pe care le folosești, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la prestatori compatibili. Tariful și modul de plată le stabilești direct cu asistentul ales, iar recenziile se lasă doar după o colaborare confirmată.",
    ],
    prices: [
      { item: "Tarif orar asistent virtual", range: "30–80 lei/oră" },
      { item: "Pachet lunar de 20 de ore", range: "800–1.800 lei/lună" },
      { item: "Gestionare e-mail și programări", range: "500–1.500 lei/lună" },
      { item: "Introducere date (proiect punctual)", range: "300–1.500 lei" },
      { item: "Suport clienți part-time", range: "1.500–3.500 lei/lună" },
    ],
    priceFactors: [
      "Numărul de ore pe lună și programul cerut",
      "Limbile în care se comunică cu clienții",
      "Instrumentele și platformele folosite (CRM, magazin online, contabilitate)",
      "Urgența și disponibilitatea în afara orelor obișnuite",
    ],
    checklist: [
      "Fă un test scurt, plătit, înainte de o colaborare pe termen lung.",
      "Clarifică disponibilitatea, timpul de răspuns și modul de raportare a orelor.",
      "Dă acces doar la conturile necesare și folosește parole partajate printr-un manager de parole.",
      "Cere un acord de confidențialitate dacă asistentul lucrează cu date ale clienților.",
      "Stabiliți în contract sarcinile, numărul de ore și tariful.",
    ],
    faq: [
      {
        q: "Cât costă un asistent virtual?",
        a: "Tarifele pornesc de obicei de la 30 de lei pe oră pentru sarcini simple și cresc pentru suport în limbi străine sau lucru în aplicații specializate. Multe colaborări se fac pe pachete lunare de ore, care ies mai avantajos decât plata strict pe oră.",
      },
      {
        q: "Ce sarcini pot delega unui asistent virtual?",
        a: "E-mail, calendar, programări, introducere de date, actualizarea produselor într-un magazin online, răspunsuri la clienți și cercetare online. Sarcinile repetitive și bine descrise se deleagă cel mai ușor.",
      },
      {
        q: "Cum lucrez în siguranță cu un asistent virtual?",
        a: "Creează-i un cont separat acolo unde se poate, în loc să îi dai parola ta. Semnați un acord de confidențialitate și revocă accesul când colaborarea se încheie.",
      },
      {
        q: "Plătesc pe oră sau pe proiect?",
        a: "Pentru sarcini continue se folosește de obicei un pachet lunar de ore. Pentru lucrări punctuale, cum ar fi introducerea unui set de date, un preț fix pe proiect este mai ușor de controlat.",
      },
    ],
  },

  juridic: {
    seoTitle: "Servicii juridice: avocați, contracte, GDPR și mărci",
    metaDescription:
      "Găsești avocați și consultanți pentru contracte, GDPR sau înregistrare marcă. Publici gratuit cererea și primești oferte de la prestatori verificați.",
    intro: [
      "Categoria Juridic & Notarial cuprinde consultanța juridică în drept civil, comercial, al muncii sau penal, redactarea și revizuirea contractelor, documentele pentru societăți, conformarea cu GDPR și protecția mărcilor la OSIM sau EUIPO. Actele care cer formă autentică se încheie doar la un notar public, dar multe documente pot fi pregătite sau verificate înainte de un avocat.",
      "Pe Contractez descrii situația cu propriile cuvinte, fără să știi termenii juridici, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la prestatori compatibili. Datele de contact rămân ascunse până alegi tu, iar onorariul îl stabilești direct cu prestatorul.",
    ],
    prices: [
      { item: "Consultație juridică inițială", range: "200–600 lei" },
      { item: "Contract simplu (închiriere, prestări servicii)", range: "300–1.000 lei" },
      { item: "Pachet GDPR pentru site", range: "300–1.200 lei" },
      { item: "Înregistrare marcă OSIM (onorariu)", range: "800–2.000 lei", note: "plus taxele OSIM" },
    ],
    faq: [
      {
        q: "Care e diferența dintre avocat și consultant juridic?",
        a: "Avocatul este membru al unui barou din UNBR și te poate reprezenta în instanță. Alți specialiști, cum ar fi consultanții GDPR sau consilierii în proprietate industrială, se ocupă de domenii precise. Pentru litigii și reprezentare ai nevoie de un avocat.",
      },
      {
        q: "Pot primi consultanță juridică online?",
        a: "Da, multe consultații, opinii scrise și redactări de contracte se fac online, prin videoconferință și documente trimise electronic. Pentru reprezentare în instanță sau acte notariale este nevoie și de prezență fizică.",
      },
      {
        q: "Informațiile din cererea mea sunt confidențiale?",
        a: "Datele tale de contact rămân ascunse până alegi un prestator. Totuși, în descrierea publică a proiectului e bine să eviți nume, adrese sau detalii care te pot identifica; le poți discuta direct cu prestatorul ales.",
      },
    ],
  },

  "consultanta-juridica": {
    seoTitle: "Consultanță juridică și avocat: cât costă o consultație",
    metaDescription:
      "Ai nevoie de avocat pentru drept civil, comercial sau al muncii? Publici gratuit cererea și primești oferte de la avocați și juriști verificați.",
    intro: [
      "Consultanța juridică te ajută să înțelegi ce drepturi și obligații ai înainte să iei o decizie sau când ai deja o problemă. Poate fi vorba de un litigiu cu un vecin sau un client, o succesiune, un conflict de muncă, o datorie neplătită, o plângere penală sau o problemă comercială între firme. Primul pas este de obicei o consultație și, dacă e nevoie, o opinie scrisă.",
      "Pe Contractez descrii situația pe scurt, cu cuvintele tale, iar platforma te ajută să structurezi cererea pe domeniul potrivit. Primești cel mult 5 oferte, doar de la prestatori compatibili, și poți extinde selecția. Datele tale de contact rămân ascunse până alegi tu, iar onorariul și plata le stabilești direct cu avocatul.",
    ],
    prices: [
      { item: "Consultație inițială (30–60 de minute)", range: "200–600 lei" },
      { item: "Tarif orar avocat", range: "250–1.000 lei/oră" },
      { item: "Opinie juridică scrisă", range: "500–2.500 lei" },
      { item: "Notificare sau somație", range: "300–1.000 lei" },
      { item: "Reprezentare într-un litigiu simplu", range: "de la 2.500 lei", note: "pe o instanță, fără taxele judiciare" },
    ],
    priceFactors: [
      "Domeniul de drept și complexitatea situației",
      "Experiența avocatului și orașul în care lucrează",
      "Onorariu fix, pe oră sau cu o parte de succes",
      "Urgența și volumul de documente de analizat",
    ],
    checklist: [
      "Verifică în Tabloul avocaților (UNBR sau site-ul baroului) că avocatul are drept de exercitare a profesiei.",
      "Alege un avocat care lucrează frecvent în domeniul problemei tale.",
      "Cere să știi de la început cum se calculează onorariul și ce cheltuieli suplimentare pot apărea.",
      "Semnează un contract de asistență juridică scris, cu onorariul și serviciile incluse.",
      "Pregătește toate documentele relevante înainte de consultație, ca să nu plătești timp pierdut.",
    ],
    faq: [
      {
        q: "Cât costă o consultație la avocat?",
        a: "O consultație inițială costă de obicei între câteva sute de lei și 600 de lei, în funcție de oraș, experiența avocatului și complexitatea problemei. Unii avocați scad costul consultației din onorariu dacă le încredințezi apoi cazul.",
      },
      {
        q: "Ce documente iau la prima consultație?",
        a: "Ia tot ce ține de situație: contracte, facturi, corespondență, notificări primite, hotărâri anterioare și actele de proprietate, dacă e cazul. O scurtă cronologie a evenimentelor ajută avocatul să înțeleagă repede problema.",
      },
      {
        q: "Cum se stabilește onorariul unui avocat?",
        a: "Onorariul poate fi fix, pe oră, combinat sau cu o componentă de succes și se trece în contractul de asistență juridică. Taxele judiciare de timbru și cheltuielile cu experți nu fac de obicei parte din onorariu.",
      },
      {
        q: "Cât durează un proces civil?",
        a: "Durata variază mult: de la câteva luni pentru cauze simple până la câțiva ani dacă sunt mai multe căi de atac sau expertize. Avocatul îți poate da o estimare după ce vede dosarul, dar nu o garanție.",
      },
    ],
  },

  contracte: {
    seoTitle: "Redactare contracte și acte societate: prețuri și oferte",
    metaDescription:
      "Ai nevoie de un contract, termeni și condiții sau acte pentru firmă? Publici gratuit cererea și primești oferte de la juriști și avocați verificați.",
    intro: [
      "Un contract bine scris te protejează înainte să apară o problemă. Aici intră redactarea și revizuirea contractelor de închiriere, prestări servicii, vânzare sau colaborare, termenii și condițiile pentru magazine online și aplicații, acordurile de confidențialitate, actele constitutive și modificările de acte ale unei societăți, cum ar fi schimbarea sediului sau cesiunea de părți sociale.",
      "Pe Contractez descrii ce fel de document îți trebuie și pentru ce situație, iar platforma te ajută să structurezi cererea. Proiectul ajunge doar la prestatori compatibili și primești cel mult 5 oferte. Prestatorii sunt verificați prin e-mail și, când au firmă, în registrul ANAF, iar prețul îl stabilești direct cu cel ales.",
    ],
    prices: [
      { item: "Contract simplu (închiriere, prestări servicii)", range: "300–1.000 lei" },
      { item: "Contract comercial complex", range: "1.000–5.000 lei" },
      { item: "Termeni și condiții pentru magazin online", range: "800–2.500 lei" },
      { item: "Revizuire contract existent", range: "250–1.000 lei" },
      { item: "Modificare acte societate", range: "500–2.000 lei", note: "plus taxele ONRC" },
      { item: "Acord de confidențialitate (NDA)", range: "300–800 lei" },
    ],
    priceFactors: [
      "Tipul și lungimea documentului",
      "Dacă se pornește de la zero sau de la un model existent",
      "Numărul de runde de negociere cu cealaltă parte",
      "Limba documentului (română, engleză sau bilingv)",
    ],
    checklist: [
      "Pentru contracte cu miză mare, alege un avocat înscris în barou (verificabil în tabloul UNBR).",
      "Întreabă câte runde de modificări sunt incluse în preț.",
      "Cere ca documentul să fie adaptat activității tale, nu un model generic.",
      "Pentru termeni și condiții, verifică dacă sunt acoperite și protecția consumatorului și GDPR.",
      "Stabiliți în scris termenul de livrare și prețul final.",
    ],
    faq: [
      {
        q: "Cât costă redactarea unui contract?",
        a: "Un contract simplu, cum ar fi unul de închiriere sau de prestări servicii, pornește de obicei de la câteva sute de lei. Contractele comerciale complexe sau negociate cu cealaltă parte pot costa câteva mii de lei. Prețul depinde mult de cât de personalizat trebuie să fie.",
      },
      {
        q: "Pot folosi un model de contract de pe internet?",
        a: "Poți, dar modelele generice nu țin cont de situația ta și pot conține clauze nepotrivite sau depășite. O revizuire făcută de un specialist costă mai puțin decât o redactare de la zero și reduce riscurile.",
      },
      {
        q: "Contractul trebuie semnat la notar?",
        a: "Majoritatea contractelor sunt valabile semnate de părți, fără notar. Anumite acte, cum ar fi vânzarea unui imobil, cer formă autentică notarială. Un jurist îți poate spune dacă documentul tău are nevoie de această formă.",
      },
      {
        q: "Cât durează redactarea unui contract?",
        a: "Un contract standard poate fi gata în câteva zile lucrătoare. Documentele complexe sau cele care trec prin negocieri pot dura câteva săptămâni.",
      },
    ],
  },

  gdpr: {
    seoTitle: "Conformitate GDPR pentru firme: documente, audit și DPO",
    metaDescription:
      "Ai nevoie de politică de confidențialitate, audit GDPR sau DPO? Publici gratuit cererea și primești oferte de la consultanți GDPR verificați.",
    intro: [
      "Conformarea cu GDPR înseamnă să știi ce date personale prelucrezi, de ce și cum le protejezi. Serviciile includ politica de confidențialitate și politica de cookie-uri pentru site, registrul activităților de prelucrare, informări și acorduri pentru angajați și clienți, contracte cu împuterniciții, audit GDPR și serviciu de responsabil cu protecția datelor (DPO). Ai nevoie de ele când lansezi un site sau lucrezi cu datele clienților.",
      "Pe Contractez descrii activitatea firmei și ce date prelucrezi, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la consultanți compatibili. Datele tale de contact rămân ascunse până alegi tu, iar tariful și plata le stabilești direct cu prestatorul.",
    ],
    prices: [
      { item: "Politică de confidențialitate și cookie-uri", range: "300–1.200 lei" },
      { item: "Implementare GDPR firmă mică", range: "1.500–5.000 lei", note: "registru, informări, proceduri" },
      { item: "Audit GDPR", range: "2.000–8.000 lei" },
      { item: "DPO externalizat", range: "300–1.500 lei/lună" },
      { item: "Instruire angajați", range: "500–2.000 lei/sesiune" },
    ],
    priceFactors: [
      "Volumul și tipul datelor prelucrate (de exemplu, date de sănătate)",
      "Numărul de angajați, sisteme și furnizori implicați",
      "Dacă documentele sunt personalizate sau pornesc de la un șablon",
      "Nevoia de monitorizare continuă sau de DPO",
    ],
    checklist: [
      "Cere ca documentele să fie adaptate proceselor tale reale, nu copiate dintr-un model.",
      "Întreabă dacă prestatorul analizează și site-ul, formularele și instrumentele de marketing.",
      "Pentru întrebări juridice sau litigii, alege un avocat înscris în barou (verificabil în tabloul UNBR).",
      "Clarifică ce primești concret la final: lista documentelor și recomandările.",
      "Semnează un contract scris care include confidențialitatea datelor la care are acces.",
    ],
    faq: [
      {
        q: "Cât costă implementarea GDPR pentru o firmă mică?",
        a: "Pentru o firmă mică, cu puține fluxuri de date, implementarea pornește de obicei de la aproximativ 1.500 de lei. Dacă prelucrezi date sensibile sau ai multe sisteme, costul crește. Un pachet doar pentru site costă mai puțin.",
      },
      {
        q: "Am nevoie de politică de confidențialitate pe site?",
        a: "Dacă site-ul colectează date personale, de exemplu prin formulare de contact, comenzi sau cookie-uri de analiză, trebuie să informezi vizitatorii despre aceste prelucrări. Politica de confidențialitate este modul obișnuit de a face acest lucru.",
      },
      {
        q: "Firma mea trebuie să numească un DPO?",
        a: "Obligația de a numi un DPO depinde de tipul organizației și de natura și amploarea prelucrărilor. Nu toate firmele sunt obligate. Un consultant îți poate spune dacă situația ta intră în această categorie.",
      },
      {
        q: "Cât durează o implementare GDPR?",
        a: "Pentru o firmă mică, de la câteva zile la câteva săptămâni, în funcție de cât de repede furnizezi informațiile despre procese. Pentru organizații mai mari, auditul și implementarea pot dura luni.",
      },
    ],
  },

  "proprietate-intelectuala": {
    seoTitle: "Înregistrare marcă la OSIM și EUIPO: cost și durată",
    metaDescription:
      "Vrei să îți înregistrezi marca la OSIM sau EUIPO? Publici gratuit cererea și primești oferte de la consilieri și avocați verificați.",
    intro: [
      "Protecția proprietății intelectuale înseamnă, de cele mai multe ori, înregistrarea unei mărci: numele sau logo-ul sub care vinzi produse și servicii. Un specialist verifică dacă marca este disponibilă, alege clasele potrivite, pregătește cererea la OSIM pentru România sau la EUIPO pentru Uniunea Europeană și te reprezintă la opoziții. E util să faci asta înainte de lansare sau de investiții mari în brand.",
      "Pe Contractez descrii marca, produsele sau serviciile și teritoriul dorit, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la prestatori compatibili. Onorariul și plata le stabilești direct cu cel ales, iar recenziile pot fi lăsate doar după o colaborare confirmată.",
    ],
    prices: [
      { item: "Verificare disponibilitate marcă", range: "200–600 lei" },
      { item: "Înregistrare marcă OSIM, o clasă", range: "800–2.000 lei", note: "onorariu, plus taxele OSIM" },
      { item: "Înregistrare marcă UE (EUIPO)", range: "1.500–3.500 lei", note: "onorariu, plus taxa EUIPO" },
      { item: "Opoziție sau răspuns la opoziție", range: "1.000–3.000 lei" },
      { item: "Reînnoire marcă", range: "500–1.500 lei", note: "plus taxele oficiale" },
    ],
    priceFactors: [
      "Numărul de clase de produse și servicii",
      "Teritoriul: România, Uniunea Europeană sau internațional",
      "Marcă verbală sau combinată (cu logo)",
      "Apariția unei opoziții din partea altor titulari",
    ],
    checklist: [
      "Alege un consilier în proprietate industrială autorizat sau un avocat înscris în barou (verificabil în tabloul UNBR).",
      "Cere o verificare de anterioritate înainte de depunere.",
      "Întreabă dacă oferta include taxele oficiale sau doar onorariul.",
      "Clarifică ce se întâmplă și cât costă dacă apare o opoziție.",
      "Stabiliți totul într-un contract scris, cu termenele și costurile totale.",
    ],
    faq: [
      {
        q: "Cât costă înregistrarea unei mărci la OSIM?",
        a: "Costul total este format din taxele OSIM și onorariul specialistului, dacă lucrezi cu unul. Taxele cresc cu numărul de clase și diferă pentru mărcile cu element grafic. Cere o ofertă care să arate separat taxele oficiale și onorariul.",
      },
      {
        q: "Cât durează înregistrarea unei mărci?",
        a: "La OSIM, procedura durează de obicei câteva luni dacă nu apar opoziții. Dacă cineva face opoziție, termenul se poate prelungi semnificativ. Există și o procedură de urgență, cu taxe mai mari.",
      },
      {
        q: "Cât timp este protejată marca?",
        a: "O marcă înregistrată la OSIM sau la EUIPO este protejată 10 ani de la data depozitului și poate fi reînnoită pentru noi perioade de câte 10 ani.",
      },
      {
        q: "OSIM sau EUIPO, ce aleg?",
        a: "OSIM protejează marca doar în România, iar EUIPO în toate statele Uniunii Europene, la un cost mai mare. Alegerea depinde de piețele în care vinzi sau plănuiești să vinzi.",
      },
    ],
  },

  "imobiliare-arhitectura": {
    seoTitle: "Arhitecți, cadastru și evaluări imobiliare: oferte",
    metaDescription:
      "Găsești arhitecți, designeri de interior, topografi și evaluatori. Publici gratuit proiectul și primești oferte de la prestatori verificați.",
    intro: [
      "Categoria Arhitectură & Imobiliare reunește serviciile de care ai nevoie când construiești, cumperi, vinzi sau amenajezi o proprietate: proiectare și documentație pentru autorizația de construire, design interior, cadastru și intabulare, ridicări topografice, evaluări imobiliare pentru bancă sau vânzare și servicii de agenți imobiliari. Unele lucrări cer deplasare la proprietate, altele se pot face la distanță.",
      "Pe Contractez descrii proprietatea și ce vrei să faci, iar platforma te ajută să structurezi cererea. Publicarea este gratuită și primești cel mult 5 oferte, doar de la prestatori compatibili cu lucrarea. Datele tale de contact rămân ascunse până alegi tu, iar prețul și plata le stabilești direct cu prestatorul.",
    ],
    prices: [
      { item: "Proiect casă complet", range: "70–200 lei/mp" },
      { item: "Proiect design interior apartament", range: "80–400 lei/mp" },
      { item: "Cadastru și intabulare apartament", range: "550–1.000 lei", note: "plus tariful OCPI" },
      { item: "Evaluare apartament ANEVAR", range: "400–900 lei" },
      { item: "Certificat energetic apartament", range: "250–600 lei" },
    ],
    faq: [
      {
        q: "De ce specialiști am nevoie ca să construiesc o casă?",
        a: "De obicei ai nevoie de un arhitect cu drept de semnătură OAR, de inginer de structură și de instalații, de un topograf pentru ridicarea topografică și de un studiu geotehnic. Arhitectul coordonează de regulă echipa de proiectare.",
      },
      {
        q: "Ce trebuie să fac înainte să vând un apartament?",
        a: "Verifică dacă apartamentul are cadastru și intabulare, apoi obține certificatul energetic și extrasul de carte funciară. O evaluare sau o discuție cu un agent imobiliar te ajută să stabilești un preț realist.",
      },
      {
        q: "Prestatorii vin la proprietate?",
        a: "Pentru cadastru, ridicări topografice, evaluări și certificate energetice este necesară deplasarea la proprietate. Designul interior și unele etape de proiectare se pot face parțial la distanță, pe baza măsurătorilor și a fotografiilor.",
      },
    ],
  },

  arhitectura: {
    seoTitle: "Proiect casă și autorizație de construire: preț arhitect",
    metaDescription:
      "Ai nevoie de proiect de casă, autorizație de construire sau certificat energetic? Publici gratuit proiectul și primești oferte de la arhitecți verificați.",
    intro: [
      "Arhitectul transformă ideea ta într-un proiect care poate fi autorizat și construit. Serviciile includ proiectul de arhitectură, documentația pentru autorizația de construire (DTAC), proiectul tehnic împreună cu inginerii de structură și instalații, adaptarea unui proiect tipizat, extinderi și mansardări, plus certificatul de performanță energetică. Ai nevoie de ele când construiești o casă, modifici o clădire existentă sau vinzi ori închiriezi o locuință.",
      "Pe Contractez descrii terenul, suprafața dorită și etapa în care ești, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la prestatori compatibili, și poți extinde selecția. Prestatorii sunt verificați prin e-mail și, când au firmă, în registrul ANAF.",
    ],
    prices: [
      { item: "Proiect casă complet (arhitectură, structură, instalații)", range: "70–200 lei/mp" },
      { item: "Doar documentație pentru autorizație (DTAC)", range: "40–110 lei/mp" },
      { item: "Adaptare proiect tipizat", range: "7.000–18.000 lei" },
      { item: "Proiect sau expertiză de structură", range: "1.500–5.000 lei" },
      { item: "Certificat energetic apartament", range: "250–600 lei" },
      { item: "Certificat energetic casă", range: "400–1.200 lei" },
    ],
    priceFactors: [
      "Suprafața construită și complexitatea arhitecturii",
      "Proiect personalizat sau tipizat",
      "Fazele incluse: DTAC, proiect tehnic, detalii de execuție, asistență pe șantier",
      "Avizele cerute prin certificatul de urbanism",
    ],
    checklist: [
      "Verifică în Tabloul Național al Arhitecților (OAR) că arhitectul are drept de semnătură pentru documentația de autorizare.",
      "Cere portofoliu cu proiecte construite, nu doar randări.",
      "Clarifică fazele incluse în preț și dacă specialitățile (structură, instalații) sunt cuprinse.",
      "Întreabă dacă se ocupă și de obținerea avizelor sau doar de proiect.",
      "Semnează un contract scris cu fazele, termenele și onorariul pentru fiecare etapă.",
    ],
    faq: [
      {
        q: "Cât costă proiectul unei case?",
        a: "Un proiect complet, cu arhitectură, structură și instalații, se calculează de obicei pe metru pătrat construit. Pentru o casă de 150 mp, costul poate ajunge de la aproximativ 10.000 la peste 25.000 de lei, în funcție de complexitate. Un proiect tipizat adaptat costă mai puțin.",
      },
      {
        q: "De ce acte am nevoie pentru autorizația de construire?",
        a: "De obicei îți trebuie actul de proprietate și extrasul de carte funciară, certificatul de urbanism, avizele cerute prin acesta, studiul geotehnic, ridicarea topografică și documentația DTAC semnată de arhitect. Lista exactă apare în certificatul de urbanism.",
      },
      {
        q: "Cât durează obținerea autorizației de construire?",
        a: "Proiectarea durează de la câteva săptămâni la câteva luni, iar obținerea avizelor poate adăuga încă o perioadă care diferă de la o localitate la alta. Planifică din timp, mai ales dacă ai nevoie de avize de la mai multe instituții.",
      },
      {
        q: "Când am nevoie de certificat energetic?",
        a: "Certificatul de performanță energetică este necesar la vânzarea sau închirierea unei locuințe, precum și la recepția unei construcții noi. Se emite de un auditor energetic atestat, după vizitarea proprietății.",
      },
    ],
  },

  "design-interior": {
    seoTitle: "Design interior apartament: prețuri pe mp și oferte",
    metaDescription:
      "Vrei proiect de design interior pentru apartament sau spațiu comercial? Publici gratuit cererea și primești oferte de la designeri verificați.",
    intro: [
      "Un designer de interior te ajută să folosești bine spațiul și să alegi finisaje, mobilier și iluminat care merg împreună. Serviciul poate include consultanță, schițe de compartimentare, randări 3D, planuri pentru electricieni și instalatori, liste de achiziții și supervizarea lucrărilor. E util când renovezi sau mobilezi un apartament, amenajezi un birou sau un spațiu comercial ori pregătești o proprietate pentru vânzare prin home staging.",
      "Pe Contractez descrii spațiul, suprafața, stilul dorit și bugetul aproximativ, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la designeri compatibili. Datele tale de contact rămân ascunse până alegi tu, iar recenziile pot fi lăsate doar după o colaborare confirmată.",
    ],
    prices: [
      { item: "Consultanță la domiciliu", range: "300–800 lei/vizită" },
      { item: "Proiect design complet apartament", range: "80–400 lei/mp", note: "randări, planuri tehnice, listă de achiziții" },
      { item: "Randări 3D pentru o cameră", range: "800–2.500 lei" },
      { item: "Home staging pentru vânzare sau închiriere", range: "1.500–5.000 lei" },
      { item: "Supervizare lucrări", range: "1.000–3.000 lei/lună" },
    ],
    priceFactors: [
      "Suprafața și numărul de încăperi",
      "Nivelul de detaliu: doar concept sau proiect tehnic complet",
      "Numărul de variante și de runde de modificări",
      "Dacă sunt incluse achizițiile și supervizarea pe șantier",
    ],
    checklist: [
      "Cere portofoliu cu proiecte realizate, cu fotografii după execuție, nu doar randări.",
      "Clarifică ce primești concret: randări, planuri pentru instalații, liste de mobilier cu prețuri.",
      "Întreabă câte runde de modificări sunt incluse.",
      "Dacă se modifică pereți sau structura, implică un arhitect sau un inginer de structură.",
      "Semnează un contract scris cu etapele, termenele și onorariul.",
    ],
    faq: [
      {
        q: "Cât costă un designer de interior pentru un apartament?",
        a: "Proiectul se calculează de obicei pe metru pătrat. Un apartament de două camere poate costa câteva mii de lei pentru un proiect complet, iar prețul crește odată cu nivelul de detaliu și cu supervizarea. O consultanță punctuală costă mai puțin.",
      },
      {
        q: "Cât durează un proiect de design interior?",
        a: "Pentru un apartament, proiectul durează de obicei câteva săptămâni, în funcție de cât de repede aprobi variantele. Execuția lucrărilor este separată și poate dura câteva luni.",
      },
      {
        q: "Designerul se ocupă și de execuție?",
        a: "Unii designeri oferă doar proiectul, alții și supervizarea sau coordonarea echipelor. Clarifică de la început ce include oferta, ca să știi dacă trebuie să cauți separat echipa de renovare.",
      },
      {
        q: "Ce trebuie să pregătesc înainte de prima discuție?",
        a: "Un plan sau măsurătorile spațiului, fotografii, câteva imagini cu stiluri care îți plac și un buget aproximativ pentru amenajare. Spune și ce mobilier vrei să păstrezi.",
      },
    ],
  },

  "topografie-cadastru": {
    seoTitle: "Cadastru și intabulare: cât costă și cât durează",
    metaDescription:
      "Ai nevoie de cadastru, intabulare sau ridicare topografică? Publici gratuit cererea și primești oferte de la topografi autorizați și verificați.",
    intro: [
      "Cadastrul identifică exact o proprietate, iar intabularea o înscrie în cartea funciară pe numele proprietarului. Serviciile din această categorie includ cadastru și intabulare pentru apartamente, case și terenuri, ridicări topografice pentru proiectare, dezmembrări și alipiri de terenuri, actualizări de informații și relevee. Ai nevoie de ele la vânzare, la moștenire, la construirea unei case sau când vrei un credit ipotecar.",
      "Pe Contractez descrii tipul proprietății, localitatea și ce lucrare îți trebuie, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la prestatori compatibili, și poți extinde selecția. Prestatorii sunt verificați, iar prețul și plata le stabilești direct cu cel ales.",
    ],
    prices: [
      { item: "Cadastru și intabulare apartament", range: "550–1.000 lei", note: "plus tariful OCPI" },
      { item: "Cadastru teren intravilan", range: "1.000–2.500 lei" },
      { item: "Cadastru casă și teren", range: "1.500–3.500 lei" },
      { item: "Ridicare topografică pentru proiectare", range: "800–2.500 lei" },
      { item: "Dezmembrare sau alipire teren", range: "1.200–3.000 lei" },
      { item: "Releveu apartament", range: "300–800 lei" },
    ],
    priceFactors: [
      "Tipul și suprafața proprietății",
      "Localizarea și accesul la teren",
      "Situația actelor (documente lipsă, diferențe de suprafață)",
      "Regimul de urgență la OCPI",
    ],
    checklist: [
      "Verifică dacă topograful are autorizare ANCPI valabilă pentru lucrări de cadastru.",
      "Întreabă dacă prețul include tariful OCPI sau doar documentația.",
      "Clarifică cine depune dosarul la OCPI și cine răspunde la eventualele completări cerute.",
      "Cere un termen estimativ pentru predarea documentației.",
      "Semnează un contract scris cu lucrarea, prețul și termenul.",
    ],
    faq: [
      {
        q: "Cât costă cadastrul pentru un apartament?",
        a: "Pentru un apartament, documentația cadastrală costă de obicei între aproximativ 550 și 1.000 de lei, la care se adaugă tariful OCPI. Prețul diferă în funcție de oraș, de numărul de camere și de situația actelor.",
      },
      {
        q: "Cât durează cadastrul și intabularea?",
        a: "Măsurătorile și documentația se fac de obicei în una–trei săptămâni. La OCPI, prima înregistrare durează în jur de 15 zile lucrătoare, iar intabularea în baza unui act are termene mai scurte și poate fi cerută și în regim de urgență, cu tarif mai mare. Verifică termenul exact la OCPI-ul din județ.",
      },
      {
        q: "De ce acte am nevoie pentru cadastru?",
        a: "De obicei îți trebuie actul de proprietate (contract, certificat de moștenitor, titlu de proprietate), actul de identitate și, dacă există, documentații cadastrale sau planuri anterioare. Topograful îți spune ce mai lipsește după ce vede actele.",
      },
      {
        q: "Care e diferența dintre cadastru și intabulare?",
        a: "Cadastrul măsoară și identifică proprietatea, iar intabularea înscrie dreptul tău de proprietate în cartea funciară. De obicei se fac împreună, la prima înregistrare a imobilului.",
      },
    ],
  },

  "evaluari-imobiliare": {
    seoTitle: "Evaluare imobiliară ANEVAR și agent imobiliar: prețuri",
    metaDescription:
      "Ai nevoie de evaluare ANEVAR, agent imobiliar sau administrare proprietate? Publici gratuit cererea și primești oferte de la prestatori verificați.",
    intro: [
      "Această categorie acoperă serviciile pentru valoarea și tranzacționarea unei proprietăți. Un evaluator autorizat întocmește raportul de evaluare pentru credit ipotecar, succesiune, partaj, vânzare sau situații contabile. Un agent imobiliar te ajută să vinzi, să cumperi sau să închiriezi, iar un administrator de proprietăți se ocupă de chiriași, plăți și mici reparații când nu ai timp să faci asta singur.",
      "Pe Contractez descrii proprietatea și ce serviciu îți trebuie, iar platforma te ajută să structurezi cererea. Primești cel mult 5 oferte, doar de la prestatori compatibili. Datele tale de contact rămân ascunse până alegi tu, iar recenziile se lasă doar după o colaborare confirmată.",
    ],
    prices: [
      { item: "Evaluare apartament ANEVAR", range: "400–900 lei" },
      { item: "Evaluare casă cu teren", range: "700–1.800 lei" },
      { item: "Evaluare teren", range: "500–1.500 lei" },
      { item: "Comision agent imobiliar la vânzare", range: "1–3% din preț" },
      { item: "Administrare proprietate închiriată", range: "8–15% din chiria lunară" },
    ],
    priceFactors: [
      "Tipul și suprafața proprietății",
      "Scopul evaluării (bancă, instanță, uz intern)",
      "Localizarea și deplasarea evaluatorului",
      "Serviciile incluse în comisionul agentului (fotografii, promovare, acte)",
    ],
    checklist: [
      "Verifică dacă evaluatorul este membru titular ANEVAR, cu specializarea potrivită.",
      "Pentru credit ipotecar, întreabă banca dacă evaluatorul este pe lista ei de evaluatori acceptați.",
      "La agentul imobiliar, citește contractul de intermediere: exclusivitate, durată, comision.",
      "Cere exemple de proprietăți vândute sau administrate în zona ta.",
      "Pune în scris prețul, termenul de predare și serviciile incluse.",
    ],
    faq: [
      {
        q: "Cât costă o evaluare imobiliară pentru bancă?",
        a: "O evaluare pentru un apartament costă de obicei câteva sute de lei, iar pentru o casă cu teren mai mult. Pentru credit ipotecar, evaluatorul trebuie să fie acceptat de bancă, așa că verifică lista ei înainte să alegi.",
      },
      {
        q: "Cât durează o evaluare imobiliară?",
        a: "Inspecția proprietății durează de obicei sub o oră, iar raportul se predă în câteva zile lucrătoare. Termenul poate crește pentru proprietăți atipice sau dacă lipsesc documente.",
      },
      {
        q: "De ce acte are nevoie evaluatorul?",
        a: "De regulă actul de proprietate, extrasul de carte funciară, documentația cadastrală și, pentru case, autorizația de construire sau procesul-verbal de recepție. Evaluatorul îți spune exact ce îi trebuie pentru scopul raportului.",
      },
      {
        q: "Merită să lucrez cu un agent imobiliar?",
        a: "Un agent te poate ajuta la stabilirea prețului, promovare, vizionări și pregătirea actelor, mai ales dacă nu ai timp. Compară comisionul cu serviciile incluse și citește atent clauzele de exclusivitate înainte să semnezi.",
      },
    ],
  },

  altele: {
    seoTitle: "Alte servicii: găsește prestatori pentru orice proiect",
    metaDescription:
      "Ai un proiect care nu se încadrează în altă categorie? Îl publici gratuit și primești oferte de la prestatori verificați, potriviți pentru cererea ta.",
    intro: [
      "Nu orice nevoie are o categorie clară. Aici intră lucrările neobișnuite, sarcinile mici și proiectele care combină mai multe domenii: ajutor la o mutare de mobilier, un comision, asamblarea unui obiect, organizarea unui spațiu, ajutor la un eveniment sau orice altă lucrare pentru care nu știi exact ce tip de prestator îți trebuie.",
      "Pe Contractez descrii ce ai nevoie cu propriile cuvinte, iar platforma te ajută să structurezi cererea și să o trimiți prestatorilor potriviți. Publicarea este gratuită și primești cel mult 5 oferte. Prestatorii sunt verificați prin e-mail și, când au firmă, în registrul ANAF, iar prețul îl stabilești direct cu cel ales.",
    ],
    faq: [
      {
        q: "Ce fel de proiecte pot publica aici?",
        a: "Orice serviciu legal care nu se regăsește în celelalte categorii: sarcini mici, lucrări punctuale sau proiecte care combină mai multe domenii. Dacă nu ești sigur unde se încadrează, descrie-l aici și platforma te ajută să-l structurezi.",
      },
      {
        q: "Cum stabilesc prețul pentru o lucrare neobișnuită?",
        a: "Descrie cât mai concret ce trebuie făcut, unde și până când. Prestatorii îți trimit oferte, iar tu compari prețurile și condițiile înainte să alegi.",
      },
      {
        q: "Cât costă să public o cerere?",
        a: "Nimic. Publicarea este gratuită, iar clienții nu plătesc nimic platformei. Plata pentru lucrare o stabilești direct cu prestatorul.",
      },
    ],
  },

  diverse: {
    seoTitle: "Servicii diverse și mici lucrări: prețuri și oferte",
    metaDescription:
      "Ai o lucrare mică sau neobișnuită? Publici gratuit cererea, o descrii cu cuvintele tale și primești oferte de la prestatori verificați din zona ta.",
    intro: [
      "Subcategoria Diverse este pentru orice nu se potrivește în altă parte: comisioane și cumpărături, ajutor la mutat câteva obiecte, montat un raft sau asamblat un mobilier mic, ajutor la organizarea unui eveniment, stat la coadă pentru un act, sortat și organizat un spațiu sau sarcini mixte pentru care nu găsești un specialist anume.",
      "Pe Contractez descrii lucrarea cu cuvintele tale, iar platforma te ajută să o structurezi și să o trimiți doar prestatorilor compatibili. Primești cel mult 5 oferte și poți extinde selecția dacă vrei mai multe. Datele tale de contact rămân ascunse până alegi tu, iar recenziile pot fi lăsate doar după o colaborare confirmată.",
    ],
    prices: [
      { item: "Lucrare mică de 1–2 ore", range: "100–300 lei" },
      { item: "Ajutor la oră (comisioane, sarcini diverse)", range: "50–150 lei/oră" },
      { item: "Cumpărături și livrare în oraș", range: "50–150 lei", note: "fără contravaloarea produselor" },
      { item: "Ajutor la un eveniment", range: "200–600 lei/zi" },
      { item: "Organizare și sortare spațiu", range: "300–1.000 lei" },
    ],
    priceFactors: [
      "Durata estimată și numărul de persoane necesare",
      "Distanța și deplasarea",
      "Urgența și programul (seara, weekend)",
      "Dacă sunt necesare unelte sau un vehicul",
    ],
    checklist: [
      "Descrie lucrarea cât mai concret: ce, unde, când și cât crezi că durează.",
      "Cere un preț fix pentru lucrările scurte, ca să eviți surprizele.",
      "Uită-te la recenziile prestatorului, lăsate după colaborări confirmate.",
      "Clarifică dinainte cine cumpără materialele și cum se decontează.",
      "Pentru lucrări mai mari, pune înțelegerea în scris, chiar și printr-un mesaj detaliat.",
    ],
    faq: [
      {
        q: "Cât costă o lucrare mică?",
        a: "Pentru o sarcină de una-două ore, prețurile pornesc de obicei de la aproximativ 100 de lei, în funcție de oraș și de efortul necesar. Dacă e nevoie de vehicul sau de mai multe persoane, costul crește.",
      },
      {
        q: "Cum descriu o lucrare care nu are o categorie clară?",
        a: "Scrie ce trebuie făcut, unde, când și ce rezultat aștepți. Adaugă fotografii dacă ajută. Platforma te ajută să structurezi cererea, ca prestatorii să înțeleagă repede ce ai nevoie.",
      },
      {
        q: "Cât de repede primesc oferte?",
        a: "Depinde de tipul lucrării și de zonă. O descriere clară și un termen realist cresc șansele să primești oferte potrivite mai repede.",
      },
      {
        q: "Cum plătesc prestatorul?",
        a: "Prețul și modul de plată le stabilești direct cu prestatorul; platforma nu intermediază plata pentru lucrare. Pentru sarcini scurte, cel mai simplu este să convineți un preț fix înainte de începere.",
      },
    ],
  },
};
