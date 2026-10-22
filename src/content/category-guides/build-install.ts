import type { CategoryGuides } from "./types";

export const buildInstallGuides: CategoryGuides = {
  "constructii-renovari": {
    seoTitle: "Construcții și renovări: meseriași și oferte de preț",
    metaDescription:
      "Găsește meseriași pentru renovări, gresie, zugrăveli, acoperișuri sau case la roșu. Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Construcțiile și renovările acoperă tot ce ține de casa sau apartamentul tău: de la zugrăveli și montaj de gresie până la renovări complete, acoperișuri, termoizolații și case ridicate la roșu. Ai nevoie de o echipă bună când cumperi o locuință veche, când pregătești o închiriere sau când vrei să construiești de la zero.",
      "Pe Contractez descrii lucrarea cu cuvintele tale, iar platforma te ajută să o structurezi. Postarea este gratuită și primești cel mult 5 oferte, doar de la prestatori compatibili cu cererea ta. Firmele sunt verificate în registrul ANAF, iar datele tale de contact rămân ascunse până alegi tu cu cine vorbești.",
    ],
    prices: [
      { item: "Zugrăveli lavabile, 2 straturi", range: "12–25 lei/mp", note: "manoperă, fără vopsea" },
      { item: "Montaj gresie sau faianță standard", range: "70–130 lei/mp", note: "manoperă, fără adeziv și plăci" },
      { item: "Renovare completă baie (manoperă)", range: "5.000–10.000 lei", note: "baie de 4–6 mp" },
      { item: "Termosistem polistiren 10 cm", range: "60–110 lei/mp", note: "manoperă, fără materiale și schelă" },
      { item: "Casă la roșu (manoperă)", range: "700–1.300 lei/mp", note: "pe mp desfășurat" },
    ],
    faq: [
      {
        q: "Cât costă renovarea unui apartament cu 2 camere?",
        a: "Doar manopera pentru o renovare completă pornește, de regulă, de la 250 lei pe mp util și poate trece de 500 lei/mp dacă refaci instalațiile și compartimentarea. Materialele se adaugă separat și depind mult de nivelul finisajelor. Cel mai sigur e să ceri un deviz pe etape și să compari mai multe oferte.",
      },
      {
        q: "Am nevoie de autorizație de construire pentru renovare?",
        a: "Pentru lucrări de finisaj, precum zugrăveli, gresie, parchet sau schimbarea instalațiilor interioare, în general nu ai nevoie de autorizație. Dacă modifici structura, demolezi pereți portanți, faci extinderi sau schimbi aspectul fațadei, îți trebuie autorizație de construire de la primărie. Când nu ești sigur, întreabă la primărie înainte să începi.",
      },
      {
        q: "Cum aleg un meseriaș bun pentru renovare?",
        a: "Cere un deviz scris, cu manopera și materialele separate, și un calendar al lucrării. Uită-te la lucrări făcute anterior și la recenziile de la clienți reali. Stabilește în scris garanția și modul de plată pe etape, iar la final cere factură.",
      },
    ],
  },

  "renovari-complete": {
    seoTitle: "Renovare apartament la cheie: prețuri și oferte",
    metaDescription:
      "Renovare completă de apartament sau casă, la cheie. Postezi proiectul gratuit și primești oferte de la echipe verificate, ușor de comparat.",
    intro: [
      "O renovare completă înseamnă să refaci locuința pe toate etapele: demolări și decopertări, instalații electrice și sanitare noi, șape, tencuieli, glet, zugrăveli, placări și pardoseli. Ai nevoie de ea când cumperi un apartament vechi, când schimbi compartimentarea sau când vrei să aduci o casă la standardele de azi, cu o singură echipă care coordonează totul.",
      "Pe Contractez îți descrii proiectul cu cuvintele tale, iar platforma te ajută să îl structurezi pe etape. Postarea este gratuită și primești cel mult 5 oferte de la echipe compatibile cu lucrarea, iar dacă vrei mai multe variante poți extinde selecția. Prețul și plata le stabilești direct cu prestatorul ales.",
    ],
    prices: [
      { item: "Renovare completă apartament (manoperă)", range: "250–500 lei/mp", note: "raportat la suprafața utilă, fără materiale" },
      { item: "Renovare completă baie", range: "5.000–10.000 lei", note: "manoperă, baie de 4–6 mp, include instalații și placări" },
      { item: "Renovare bucătărie", range: "4.000–9.000 lei", note: "manoperă, fără mobilier" },
      { item: "Decopertare gresie și faianță", range: "25–45 lei/mp", note: "fără evacuarea molozului" },
      { item: "Demolare pereți neportanți", range: "80–150 lei/mp", note: "pereți din cărămidă sau BCA" },
      { item: "Evacuare moloz", range: "400–1.200 lei", note: "per container, în funcție de oraș" },
    ],
    priceFactors: [
      "Starea locuinței: instalațiile vechi și pereții deteriorați cresc volumul de muncă.",
      "Nivelul finisajelor și complexitatea detaliilor cerute.",
      "Dacă refaci sau nu instalațiile electrice, sanitare și termice.",
      "Orașul și etajul, mai ales fără lift pentru materiale și moloz.",
    ],
    checklist: [
      "Cere un deviz scris pe etape, cu manopera separată de materiale.",
      "Stabilește un grafic de lucru și plăți legate de etape finalizate, nu avansuri mari la început.",
      "Verifică dacă echipa are electrician autorizat ANRE pentru partea electrică.",
      "Dacă vrei să muți sau să demolezi pereți portanți, cere întâi o expertiză tehnică și autorizație de construire.",
      "Cere factură și garanție scrisă pentru lucrare.",
    ],
    faq: [
      {
        q: "Cât costă renovarea completă a unui apartament?",
        a: "Manopera pentru o renovare completă este de obicei între 250 și 500 lei pe mp util, deci pentru 50 mp vorbim de aproximativ 12.500–25.000 lei doar pentru muncă. Materialele pot costa la fel de mult sau mai mult, în funcție de finisaje. Cere oferte detaliate ca să compari corect.",
      },
      {
        q: "Cât durează renovarea unui apartament cu 2 camere?",
        a: "O renovare completă durează de regulă între 6 și 12 săptămâni, în funcție de cât lucrezi la instalații și de timpul de uscare a șapei și a tencuielilor. Comenzile de materiale cu termen lung, cum ar fi ușile sau mobilierul pe comandă, pot prelungi lucrarea. Stabilește un termen în scris cu echipa.",
      },
      {
        q: "Ce ordine au lucrările la o renovare?",
        a: "Ordinea obișnuită este: demolări și decopertări, instalații electrice și sanitare, șape și tencuieli, rigips, glet, apoi placări cu gresie și faianță. Urmează zugrăvelile, pardoselile, ușile și la final montajul obiectelor sanitare și al corpurilor de iluminat. O echipă bună îți explică graficul înainte de începere.",
      },
      {
        q: "Am nevoie de autorizație ca să renovez apartamentul?",
        a: "Pentru finisaje și schimbarea instalațiilor interioare nu ai nevoie, în general, de autorizație de construire. Dacă intervii pe structură, de exemplu deschizi goluri în pereți portanți, îți trebuie expertiză tehnică, acordul asociației de proprietari și autorizație de la primărie. Lucrările structurale fără autorizație pot fi sancționate.",
      },
    ],
  },

  finisaje: {
    seoTitle: "Zugrăveli, glet și rigips: preț manoperă pe mp",
    metaDescription:
      "Zugrav, glet, rigips, tencuieli sau parchet. Postezi gratuit lucrarea și primești oferte de la meseriași verificați, cu prețuri pe mp.",
    intro: [
      "Finisajele sunt lucrările care dau aspectul final unei încăperi: tencuieli, glet, zugrăveli, pereți și tavane din rigips, șape și montaj de parchet. Ai nevoie de ele după o renovare, înainte de mutare, când pereții au fisuri sau pete ori când vrei să schimbi rapid aspectul unei camere.",
      "Pe Contractez scrii ce ai de făcut, iar platforma te ajută să structurezi cererea, de exemplu suprafața și tipul lucrării. Postarea e gratuită și primești cel mult 5 oferte de la meseriași compatibili. Prestatorii sunt verificați prin email și, pentru firme, în registrul ANAF.",
    ],
    prices: [
      { item: "Zugrăveli lavabile, 2 straturi", range: "12–25 lei/mp", note: "manoperă, fără vopsea" },
      { item: "Glet și șlefuire", range: "20–40 lei/mp", note: "2 straturi, manoperă" },
      { item: "Tencuieli manuale sau mecanizate", range: "30–55 lei/mp", note: "manoperă" },
      { item: "Pereți sau tavane din rigips", range: "50–90 lei/mp", note: "structură și plăci, fără finisaj" },
      { item: "Șapă", range: "30–50 lei/mp", note: "grosime standard, manoperă" },
      { item: "Montaj parchet laminat", range: "25–55 lei/mp", note: "include folia de sub parchet, fără plintă" },
    ],
    priceFactors: [
      "Starea pereților: fisurile și denivelările cer mai mult glet și reparații.",
      "Suprafața totală: lucrările mici au adesea un preț minim.",
      "Înălțimea tavanelor și numărul de colțuri, nișe sau ferestre.",
      "Dacă trebuie mutat mobilierul și protejate pardoselile.",
    ],
    checklist: [
      "Cere un preț pe mp și stabilește exact ce include: grund, glet, numărul de straturi.",
      "Întreabă cum măsoară suprafața, cu sau fără golurile de uși și ferestre.",
      "Uită-te la poze cu lucrări anterioare, mai ales la colțuri și îmbinări.",
      "Stabilește în scris termenul, curățenia de la final și garanția.",
      "Cere factură pentru manoperă.",
    ],
    faq: [
      {
        q: "Cât costă zugrăvitul unui apartament cu 2 camere?",
        a: "Un apartament cu 2 camere are în jur de 150–200 mp de pereți și tavane. La 12–25 lei/mp pentru zugrăveli în 2 straturi, manopera ajunge la aproximativ 1.800–5.000 lei. Dacă ai nevoie și de glet, prețul crește semnificativ.",
      },
      {
        q: "Cât costă gletul pe mp?",
        a: "Manopera pentru glet cu șlefuire este de obicei între 20 și 40 lei/mp, în funcție de starea pereților și de numărul de straturi. Gletul mecanizat poate fi mai ieftin pe suprafețe mari. Materialele se plătesc separat.",
      },
      {
        q: "Cât durează gletul și zugrăveala la o cameră?",
        a: "Pentru o cameră obișnuită, gletul, șlefuirea și zugrăveala durează în general 3–5 zile. O mare parte din timp înseamnă uscarea între straturi. Umiditatea și temperatura din încăpere influențează mult durata.",
      },
      {
        q: "E mai bine rigips sau tencuială?",
        a: "Rigipsul e mai rapid, mai curat și potrivit pentru pereți despărțitori ușori, tavane false sau ascunderea traseelor. Tencuiala e mai rezistentă la lovituri și preferată pe pereții exteriori sau în spațiile umede. Un meseriaș bun îți recomandă varianta potrivită după ce vede locul.",
      },
    ],
  },

  "gresie-faianta": {
    seoTitle: "Montaj gresie și faianță: preț manoperă pe mp",
    metaDescription:
      "Montaj gresie, faianță și placări cu piatră. Postezi gratuit lucrarea și primești oferte de la faianțari verificați, cu prețul manoperei pe mp.",
    intro: [
      "Montajul de gresie și faianță include pregătirea suprafeței, aplicarea adezivului, așezarea plăcilor, tăieturile și rostuirea. Ai nevoie de un faianțar când renovezi baia sau bucătăria, când schimbi pardoseala pe hol sau terasă ori când vrei placări cu piatră naturală pe fațadă sau la șemineu.",
      "Pe Contractez descrii lucrarea, inclusiv suprafața și formatul plăcilor, iar platforma te ajută să o structurezi. Postarea e gratuită și primești cel mult 5 oferte de la faianțari compatibili. Datele tale de contact rămân ascunse până alegi tu prestatorul, iar recenziile vin doar de la clienți cu colaborări confirmate.",
    ],
    prices: [
      { item: "Montaj gresie standard", range: "70–120 lei/mp", note: "plăci până la 60×60 cm, manoperă" },
      { item: "Montaj faianță", range: "75–130 lei/mp", note: "manoperă, fără adeziv și plăci" },
      { item: "Montaj plăci format mare", range: "110–180 lei/mp", note: "60×120 cm sau mai mari" },
      { item: "Placări cu piatră naturală", range: "120–220 lei/mp", note: "în funcție de tipul pietrei" },
      { item: "Decopertare gresie sau faianță veche", range: "25–45 lei/mp", note: "fără evacuarea molozului" },
      { item: "Montaj plintă din gresie", range: "15–30 lei/ml", note: "manoperă" },
    ],
    priceFactors: [
      "Formatul plăcilor: cele foarte mici sau foarte mari se montează mai greu.",
      "Modelul de montaj: în diagonală, în spic sau cu motive decorative.",
      "Starea suprafeței: șapa sau pereții denivelați cer pregătire suplimentară.",
      "Numărul de tăieturi, colțuri, nișe și decupaje pentru instalații.",
    ],
    checklist: [
      "Cere un preț pe mp și clarifică ce include: hidroizolație, profile, rostuire, plinte.",
      "Uită-te la lucrări anterioare, mai ales la îmbinări, tăieturi și alinierea rosturilor.",
      "Întreabă dacă aplică hidroizolație în zona dușului înainte de placare.",
      "Stabilește în scris termenul, garanția și curățenia de la final.",
      "Cere deviz și factură.",
    ],
    faq: [
      {
        q: "Cât costă manopera la gresie pe mp?",
        a: "Pentru gresie de format obișnuit, manopera este de regulă între 70 și 120 lei/mp. La plăci mari, de 60×120 cm sau peste, sau la montaj în diagonală, prețul urcă spre 110–180 lei/mp. Adezivul, chitul și plăcile se plătesc separat.",
      },
      {
        q: "Cât costă placarea unei băi cu gresie și faianță?",
        a: "O baie obișnuită are în jur de 4–5 mp de pardoseală și 15–25 mp de pereți placați. La prețurile uzuale de manoperă, asta înseamnă aproximativ 1.500–4.000 lei doar pentru montaj. Decopertarea plăcilor vechi și hidroizolația se adaugă de obicei separat.",
      },
      {
        q: "Cât durează montajul de gresie și faianță într-o baie?",
        a: "Placarea unei băi standard durează de obicei 3–6 zile, inclusiv rostuirea. Dacă e nevoie de decopertare, șapă nouă sau nivelarea pereților, mai adaugi câteva zile pentru execuție și uscare.",
      },
      {
        q: "Se poate pune gresie peste gresie?",
        a: "Da, se poate dacă plăcile vechi sunt bine prinse, plane și fără fisuri, folosind un amorsaj și un adeziv potrivit. Trebuie să ții cont că nivelul pardoselii crește și pot apărea probleme la uși. Un faianțar îți spune după ce verifică suprafața dacă e o soluție sigură.",
      },
    ],
  },

  constructii: {
    seoTitle: "Constructor case la roșu: prețuri manoperă și oferte",
    metaDescription:
      "Zidărie, fundații, structuri și case la roșu. Postezi gratuit proiectul și primești oferte de la constructori verificați, cu prețuri pe mp.",
    intro: [
      "Construcțiile și zidăria includ fundații, structuri din beton armat, zidărie din cărămidă sau BCA, planșee și ridicarea caselor la roșu. Ai nevoie de o echipă de constructori când îți faci o casă nouă, o extindere, o anexă, un garaj sau un gard zidit.",
      "Pe Contractez descrii proiectul cu cuvintele tale, iar platforma te ajută să îl structurezi. Postarea este gratuită și primești cel mult 5 oferte de la echipe compatibile cu lucrarea. Firmele sunt verificate în registrul ANAF, iar prețul și plata le stabilești direct cu prestatorul ales.",
    ],
    prices: [
      { item: "Casă la roșu (manoperă)", range: "700–1.300 lei/mp", note: "pe mp desfășurat, fără materiale" },
      { item: "Zidărie din cărămidă sau BCA", range: "100–180 lei/mp", note: "manoperă" },
      { item: "Fundație (cofrare, armare, turnare)", range: "400–700 lei/mc", note: "manoperă" },
      { item: "Placă din beton armat", range: "450–800 lei/mc", note: "include cofrare și armare" },
      { item: "Pereți despărțitori din BCA", range: "80–140 lei/mp", note: "manoperă" },
    ],
    priceFactors: [
      "Complexitatea proiectului: număr de niveluri, deschideri mari, forme neregulate.",
      "Terenul: săpăturile în teren dificil sau în pantă costă mai mult.",
      "Accesul pe șantier pentru utilaje și materiale.",
      "Zona: în orașele mari tarifele sunt de obicei mai ridicate.",
    ],
    checklist: [
      "Pentru o casă nouă sau o extindere, asigură-te că ai autorizație de construire înainte de începerea lucrărilor.",
      "Cere ca lucrarea să respecte proiectul tehnic și să fie urmărită de un diriginte de șantier.",
      "Solicită un deviz detaliat pe etape: fundație, structură, zidărie, planșee.",
      "Vizitează o lucrare în curs sau terminată de echipa respectivă.",
      "Încheie un contract cu termene, plăți pe etape, garanție și factură.",
    ],
    faq: [
      {
        q: "Cât costă manopera la o casă la roșu?",
        a: "Manopera pentru o casă la roșu este, în general, între 700 și 1.300 lei pe mp desfășurat. Pentru o casă de 100 mp asta înseamnă aproximativ 70.000–130.000 lei doar pentru muncă. Prețul depinde de structură, teren și zonă.",
      },
      {
        q: "Am nevoie de autorizație de construire pentru o casă?",
        a: "Da. Pentru o casă nouă, o extindere sau orice lucrare care afectează structura ai nevoie de autorizație de construire de la primărie, obținută pe baza unui proiect tehnic. Construcția fără autorizație se sancționează și poate duce la obligația de demolare.",
      },
      {
        q: "Cât durează să ridici o casă la roșu?",
        a: "Pentru o casă cu parter și etaj, o echipă organizată termină de obicei faza la roșu în 2–4 luni. Durata depinde de vreme, de timpii de întărire a betonului și de livrarea materialelor. Iarna, lucrările cu beton se fac mai greu.",
      },
      {
        q: "Ce înseamnă o casă la roșu?",
        a: "La roșu înseamnă, de regulă, fundația, structura, zidăria exterioară și interioară, planșeele și acoperișul. Nu include instalațiile, tencuielile, ferestrele sau finisajele. Clarifică exact ce intră în ofertă, pentru că definiția poate varia de la o echipă la alta.",
      },
    ],
  },

  acoperisuri: {
    seoTitle: "Montaj acoperiș și țiglă metalică: preț manoperă mp",
    metaDescription:
      "Montaj țiglă, hidroizolații, jgheaburi și mansardări. Postezi gratuit lucrarea și primești oferte de la dulgheri și tinichigii verificați.",
    intro: [
      "Lucrările la acoperiș includ structura de lemn (șarpanta), montajul învelitorii din țiglă ceramică, țiglă metalică sau tablă, hidroizolațiile pentru terase, jgheaburile și burlanele, dar și mansardarea podului. Ai nevoie de ele când acoperișul plouă, când țigla e deteriorată, după o furtună sau când construiești o casă nouă.",
      "Pe Contractez descrii problema sau proiectul, iar platforma te ajută să îl structurezi. Postarea e gratuită și primești cel mult 5 oferte de la echipe compatibile cu lucrarea. Recenziile apar doar după colaborări confirmate, iar contactul tău rămâne ascuns până alegi prestatorul.",
    ],
    prices: [
      { item: "Montaj țiglă metalică", range: "35–80 lei/mp", note: "manoperă, fără materiale" },
      { item: "Montaj țiglă ceramică", range: "50–100 lei/mp", note: "manoperă" },
      { item: "Șarpantă din lemn", range: "80–150 lei/mp", note: "manoperă, în funcție de complexitate" },
      { item: "Hidroizolație terasă cu membrană", range: "30–60 lei/mp", note: "manoperă" },
      { item: "Montaj jgheaburi și burlane", range: "40–80 lei/ml", note: "manoperă" },
      { item: "Mansardare (izolare și rigips)", range: "150–300 lei/mp", note: "manoperă, fără materiale" },
    ],
    priceFactors: [
      "Forma acoperișului: multe pante, coame, dolii și lucarne cresc prețul.",
      "Înălțimea și accesul: schela și siguranța la înălțime costă.",
      "Dacă trebuie demontată învelitoarea veche și refăcută șarpanta.",
      "Tipul învelitorii: țigla ceramică se montează mai greu decât cea metalică.",
    ],
    checklist: [
      "Dacă schimbi forma acoperișului, materialul învelitorii sau mansardezi, verifică la primărie dacă îți trebuie autorizație de construire.",
      "Întreabă ce măsuri de siguranță la înălțime folosește echipa.",
      "Cere un deviz care separă demontarea, șarpanta, învelitoarea și tinichigeria.",
      "Verifică lucrări anterioare, mai ales la coame, dolii și racordurile cu coșul.",
      "Stabilește în scris garanția pentru infiltrații și cere factură.",
    ],
    faq: [
      {
        q: "Cât costă manopera la acoperiș pe mp?",
        a: "Pentru țiglă metalică, manopera este de obicei între 35 și 80 lei/mp, iar pentru țiglă ceramică între 50 și 100 lei/mp. Dacă se reface și șarpanta, adaugi încă 80–150 lei/mp. Acoperișurile cu multe pante și detalii sunt spre capătul de sus al intervalului.",
      },
      {
        q: "Am nevoie de autorizație pentru schimbarea acoperișului?",
        a: "În general, reparațiile la acoperiș care păstrează forma și materialul învelitorii nu necesită autorizație de construire. Dacă schimbi forma acoperișului, materialul învelitorii sau transformi podul în mansardă, de regulă ai nevoie de autorizație. Întreabă la primărie înainte de a începe.",
      },
      {
        q: "Cât durează schimbarea unui acoperiș?",
        a: "Pentru o casă obișnuită, înlocuirea învelitorii durează de regulă 1–2 săptămâni. Dacă se reface și șarpanta, poate dura 2–4 săptămâni. Vremea contează mult, iar echipele serioase protejează acoperișul cu folie între zile.",
      },
      {
        q: "E mai bună țigla metalică sau cea ceramică?",
        a: "Țigla metalică e mai ușoară, se montează mai repede și costă mai puțin. Țigla ceramică are o durată de viață mai lungă și izolează mai bine fonic, dar cere o șarpantă mai solidă. Alegerea depinde de structura casei și de buget.",
      },
    ],
  },

  termoizolatii: {
    seoTitle: "Termoizolație fațadă cu polistiren: preț manoperă mp",
    metaDescription:
      "Termoizolații cu polistiren sau vată minerală și tencuială decorativă. Postezi gratuit lucrarea și primești oferte de la echipe verificate.",
    intro: [
      "Termoizolațiile reduc pierderile de căldură prin pereți, acoperiș sau planșee. Lucrarea include de obicei lipirea plăcilor de polistiren sau vată minerală, diblurile, plasa din fibră de sticlă, masa de șpaclu și tencuiala decorativă. Ai nevoie de ea când facturile la încălzire sunt mari, când apar mucegai și condens sau când finalizezi o casă nouă.",
      "Pe Contractez descrii lucrarea, de exemplu suprafața fațadei și tipul izolației, iar platforma te ajută să o structurezi. Postarea e gratuită și primești cel mult 5 oferte de la echipe compatibile. Prestatorii sunt verificați prin email și, pentru firme, în registrul ANAF.",
    ],
    prices: [
      { item: "Termosistem polistiren EPS 10 cm", range: "60–110 lei/mp", note: "manoperă, fără materiale și schelă" },
      { item: "Termosistem cu vată bazaltică", range: "80–130 lei/mp", note: "manoperă" },
      { item: "Tencuială decorativă", range: "20–40 lei/mp", note: "manoperă, aplicată pe termosistem" },
      { item: "Izolare pod sau mansardă cu vată minerală", range: "25–50 lei/mp", note: "manoperă" },
      { item: "Închiriere și montaj schelă", range: "8–15 lei/mp", note: "pe lună" },
    ],
    priceFactors: [
      "Înălțimea clădirii și nevoia de schelă sau nacelă.",
      "Materialul ales: vata bazaltică se montează mai greu decât polistirenul.",
      "Numărul de ferestre, glafuri și colțuri care cer profile și detalii.",
      "Starea pereților: tencuiala veche care se desprinde trebuie reparată înainte.",
    ],
    checklist: [
      "Pentru fațadele de bloc sau dacă schimbi aspectul exterior, verifică la primărie dacă îți trebuie autorizație.",
      "Cere detalii despre sistem: grosimea izolației, diblurile, plasa și tencuiala folosite.",
      "Întreabă cum tratează glafurile, soclul și colțurile, unde apar cele mai multe probleme.",
      "Verifică o fațadă terminată de echipă cu cel puțin un an în urmă.",
      "Cere deviz, factură și garanție scrisă.",
    ],
    faq: [
      {
        q: "Cât costă termoizolația unei case pe mp?",
        a: "Manopera pentru un termosistem cu polistiren de 10 cm este de obicei între 60 și 110 lei/mp. Cu tot cu materiale, un sistem complet ajunge în general la 120–250 lei/mp, în funcție de izolație și tencuială. Schela se plătește de regulă separat.",
      },
      {
        q: "Ce grosime de polistiren să aleg?",
        a: "Pentru pereții exteriori se folosește frecvent polistiren de 10 cm, iar pentru clădiri cu consum redus de energie se merge pe 15–20 cm. Grosimea potrivită depinde de zidărie și de zona climatică. O echipă bună îți explică diferența de cost și de performanță.",
      },
      {
        q: "Cât durează termoizolarea unei case?",
        a: "Pentru o casă cu parter și etaj, lucrarea durează în general 2–4 săptămâni. Tencuiala decorativă se aplică doar la temperaturi peste aproximativ 5 °C și pe vreme uscată, așa că sezonul contează.",
      },
      {
        q: "Polistiren sau vată minerală?",
        a: "Polistirenul e mai ieftin și ușor de montat. Vata bazaltică nu arde, lasă pereții să „respire” mai bine și izolează mai bine fonic, dar costă mai mult. Pentru clădirile înalte, regulile de siguranță la incendiu pot impune vata în anumite zone.",
      },
    ],
  },

  instalatii: {
    seoTitle: "Instalatori și electricieni autorizați: oferte de preț",
    metaDescription:
      "Instalator, electrician, centrală termică, aer condiționat sau fotovoltaice. Postezi gratuit și primești oferte de la prestatori verificați.",
    intro: [
      "Instalațiile țin casa funcțională: apă și canalizare, curent electric, încălzire, aer condiționat, panouri fotovoltaice și sisteme de supraveghere. Ai nevoie de un instalator sau electrician când apare o avarie, când renovezi, când schimbi centrala ori când vrei să produci propriul curent.",
      "Pe Contractez descrii ce ai nevoie cu cuvintele tale, iar platforma te ajută să structurezi cererea. Postarea este gratuită și primești cel mult 5 oferte de la prestatori compatibili. Firmele sunt verificate în registrul ANAF, iar datele tale de contact rămân ascunse până alegi tu.",
    ],
    prices: [
      { item: "Punct electric nou (priză sau întrerupător)", range: "80–180 lei/punct", note: "manoperă" },
      { item: "Montaj vas WC", range: "150–300 lei", note: "manoperă" },
      { item: "Montaj centrală termică pe gaz", range: "800–1.800 lei", note: "manoperă, fără punerea în funcțiune" },
      { item: "Montaj aer condiționat 9.000–12.000 BTU", range: "450–800 lei", note: "traseu standard până la 3 m" },
      { item: "Montaj cameră de supraveghere", range: "150–400 lei/cameră", note: "manoperă și configurare" },
    ],
    faq: [
      {
        q: "Am nevoie de electrician autorizat ANRE?",
        a: "Da, pentru proiectarea și executarea instalațiilor electrice legea cere un electrician autorizat ANRE, cu gradul potrivit lucrării. Autorizația contează și când ai nevoie de documente pentru furnizorul de energie, de exemplu la mărirea puterii sau pentru prosumatori.",
      },
      {
        q: "Cine poate lucra la instalația de gaze?",
        a: "Lucrările la instalațiile de gaze naturale pot fi făcute doar de instalatori autorizați ANRE, de regulă printr-o firmă autorizată. Asta include mutarea sau prelungirea traseelor și racordarea unei centrale. Nu lăsa pe nimeni neautorizat să intervină pe gaze.",
      },
      {
        q: "Cât costă un instalator la domiciliu?",
        a: "O intervenție simplă, cum ar fi schimbarea unei baterii sau desfundarea unei scurgeri, costă de obicei între 100 și 450 lei. Unii prestatori adaugă o taxă de deplasare, iar intervențiile de noapte sau în weekend sunt mai scumpe. Întreabă prețul înainte de deplasare.",
      },
    ],
  },

  "instalatii-sanitare": {
    seoTitle: "Instalator sanitar: prețuri montaj și desfundare",
    metaDescription:
      "Instalator pentru montaj obiecte sanitare, țevi și desfundare canalizare. Postezi gratuit și primești oferte de la instalatori verificați din zona ta.",
    intro: [
      "Instalațiile sanitare cuprind traseele de apă rece și caldă, canalizarea și montajul obiectelor sanitare: vas WC, lavoar, cadă, cabină de duș, baterii, boiler sau mașină de spălat. Ai nevoie de un instalator când ai o țeavă spartă, o scurgere înfundată, când renovezi baia sau bucătăria ori când schimbi obiectele vechi.",
      "Pe Contractez scrii ce problemă ai sau ce vrei să montezi, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte de la instalatori compatibili. Datele tale de contact rămân ascunse până alegi prestatorul, iar recenziile vin doar din colaborări confirmate.",
    ],
    prices: [
      { item: "Montaj vas WC clasic", range: "150–300 lei", note: "manoperă" },
      { item: "Montaj WC suspendat cu cadru", range: "450–800 lei", note: "manoperă, fără placarea cadrului" },
      { item: "Montaj lavoar sau baterie", range: "100–250 lei", note: "per bucată" },
      { item: "Desfundare canalizare", range: "150–450 lei", note: "în funcție de metodă și gravitate" },
      { item: "Punct nou de apă sau scurgere", range: "150–300 lei/punct", note: "manoperă" },
      { item: "Instalație sanitară completă baie", range: "2.000–4.500 lei", note: "trasee noi, manoperă" },
    ],
    priceFactors: [
      "Urgența: intervențiile de noapte, în weekend sau de sărbători costă mai mult.",
      "Accesul la țevi: dacă trebuie spart peretele sau pardoseala.",
      "Materialul traseelor existente și starea lor.",
      "Distanța până la tine, dacă se percepe taxă de deplasare.",
    ],
    checklist: [
      "Întreabă prețul intervenției și dacă există taxă de deplasare înainte să vină instalatorul.",
      "Pentru lucrări mai mari, cere un deviz scris cu manopera separată de materiale.",
      "Cere o probă de presiune după montarea traseelor noi, înainte de închiderea pereților.",
      "Stabilește garanția pentru manoperă și cere factură.",
    ],
    faq: [
      {
        q: "Cât costă un instalator pentru montaj WC?",
        a: "Montajul unui vas WC clasic costă de obicei între 150 și 300 lei. Un WC suspendat cu cadru costă mai mult, în general 450–800 lei, pentru că include montajul cadrului și racordurile. Prețul nu include obiectul sanitar.",
      },
      {
        q: "Cât costă desfundarea canalizării?",
        a: "O desfundare simplă la chiuvetă sau WC pornește de la aproximativ 150 lei. Pentru înfundări severe, unde e nevoie de spirală mecanică sau de spălare cu apă sub presiune, prețul poate ajunge la 450 lei sau mai mult. Intervențiile de urgență sunt de regulă mai scumpe.",
      },
      {
        q: "Cât durează refacerea instalației sanitare într-o baie?",
        a: "Refacerea traseelor de apă și canalizare într-o baie durează de obicei 1–3 zile. Montajul obiectelor sanitare se face după placare și durează încă o zi. Proba de presiune trebuie făcută înainte să se acopere țevile.",
      },
      {
        q: "Ce fac dacă s-a spart o țeavă?",
        a: "Închide imediat robinetul general de apă și, dacă apa ajunge la prize sau la tabloul electric, oprește curentul. Apoi cheamă un instalator și fă poze pentru asigurare. Dacă locuiești la bloc, anunță vecinii de dedesubt și administratorul.",
      },
    ],
  },

  "instalatii-electrice": {
    seoTitle: "Electrician autorizat ANRE: prețuri și oferte",
    metaDescription:
      "Electrician autorizat ANRE pentru prize, iluminat, tablouri electrice sau instalații noi. Postezi gratuit și primești oferte de la electricieni verificați.",
    intro: [
      "Instalațiile electrice includ traseele de cabluri, prizele, întrerupătoarele, corpurile de iluminat, tablourile electrice și împământarea. Ai nevoie de un electrician când sar siguranțele, când renovezi și refaci instalația veche, când adaugi prize, când montezi aparate de putere mare sau când ai nevoie de mărirea puterii aprobate.",
      "Pe Contractez descrii lucrarea cu cuvintele tale, iar platforma te ajută să o structurezi. Postarea e gratuită și primești cel mult 5 oferte de la electricieni compatibili cu cererea. Firmele sunt verificate în registrul ANAF, iar prețul și plata le stabilești direct cu electricianul ales.",
    ],
    prices: [
      { item: "Punct nou priză sau întrerupător", range: "80–180 lei/punct", note: "traseu îngropat, manoperă" },
      { item: "Montaj corp de iluminat", range: "50–150 lei/buc", note: "în funcție de tip" },
      { item: "Montaj tablou electric apartament", range: "600–1.500 lei", note: "manoperă, fără aparataj" },
      { item: "Refacere instalație electrică apartament 2 camere", range: "5.000–9.000 lei", note: "manoperă și materiale standard, fără refacerea finisajelor" },
      { item: "Instalație de împământare", range: "800–1.800 lei", note: "manoperă" },
      { item: "Intervenție la defect", range: "150–350 lei", note: "deplasare și diagnostic incluse" },
    ],
    priceFactors: [
      "Tipul pereților: în beton se lucrează mai greu decât în rigips sau cărămidă.",
      "Numărul de puncte și de circuite separate.",
      "Dacă se refac și tabloul electric și împământarea.",
      "Documentele necesare: proiect, dosar pentru furnizor sau verificări PRAM.",
    ],
    checklist: [
      "Cere legitimația de electrician autorizat ANRE și verifică gradul, potrivit lucrării.",
      "Cere un deviz pe puncte și circuite, cu manopera separată de materiale.",
      "Pentru o instalație nouă, cere schema monofilară a tabloului.",
      "Cere măsurători PRAM la final pentru instalațiile noi sau refăcute.",
      "Stabilește garanția și cere factură.",
    ],
    faq: [
      {
        q: "Cât costă un electrician pe punct?",
        a: "Un punct nou, adică o priză sau un întrerupător cu traseu îngropat, costă de obicei între 80 și 180 lei. Prețul crește în pereți din beton sau când traseul e lung. Doza, aparatajul și cablul se plătesc separat.",
      },
      {
        q: "Am nevoie de electrician autorizat ANRE?",
        a: "Da. Legea cere ca instalațiile electrice să fie proiectate și executate de electricieni autorizați ANRE, cu gradul potrivit lucrării. Fără autorizare nu poți obține documentele cerute de furnizor, de exemplu la mărirea puterii, iar asigurarea locuinței poate refuza despăgubirea în caz de incendiu.",
      },
      {
        q: "Cât costă refacerea instalației electrice într-un apartament?",
        a: "Pentru un apartament cu 2 camere, refacerea completă costă orientativ între 5.000 și 9.000 lei, cu manoperă și materiale standard, în funcție de numărul de puncte, de tabloul ales și de tipul pereților. Refacerea tencuielii și zugrăvitul după șlițuire se plătesc separat. Cere un deviz detaliat pe circuite.",
      },
      {
        q: "Cât durează refacerea instalației electrice?",
        a: "Pentru un apartament cu 2 camere, refacerea completă durează de obicei 3–7 zile de lucru. Montajul aparatajului și al corpurilor de iluminat se face după zugrăveli, deci electricianul revine la final.",
      },
    ],
  },

  "instalatii-termice": {
    seoTitle: "Montaj centrală termică și calorifere: prețuri",
    metaDescription:
      "Montaj centrale termice, calorifere, încălzire în pardoseală și pompe de căldură. Postezi gratuit și primești oferte de la instalatori verificați.",
    intro: [
      "Instalațiile termice includ centralele pe gaz, caloriferele, încălzirea în pardoseală, pompele de căldură și traseele care le leagă. Ai nevoie de un instalator când îți schimbi centrala veche, când te debranșezi de la termoficare, când renovezi sau când vrei un sistem de încălzire mai eficient.",
      "Pe Contractez descrii situația, de exemplu tipul locuinței și ce vrei să montezi, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte de la instalatori compatibili. Prestatorii sunt verificați prin email și, pentru firme, în registrul ANAF.",
    ],
    prices: [
      { item: "Montaj centrală termică pe gaz (înlocuire)", range: "800–1.800 lei", note: "manoperă, fără punerea în funcțiune" },
      { item: "Montaj calorifer", range: "150–350 lei/buc", note: "manoperă" },
      { item: "Instalație termică completă apartament", range: "3.000–7.000 lei", note: "trasee și calorifere, manoperă" },
      { item: "Încălzire în pardoseală", range: "40–80 lei/mp", note: "manoperă, fără șapă" },
      { item: "Montaj pompă de căldură aer-apă", range: "4.000–10.000 lei", note: "manoperă" },
      { item: "Revizie centrală termică", range: "200–400 lei", note: "anual" },
    ],
    priceFactors: [
      "Dacă se păstrează traseele existente sau se refac.",
      "Tipul și puterea echipamentului: centrală, pompă de căldură, sistem hibrid.",
      "Lucrările la instalația de gaze și coșul de evacuare.",
      "Avizele și documentele necesare, mai ales la debranșarea de la termoficare.",
    ],
    checklist: [
      "Pentru racordul la gaze, alege un instalator sau o firmă autorizată ANRE pentru gaze naturale.",
      "Punerea în funcțiune a centralei se face obligatoriu de un service autorizat ISCIR (o cere și producătorul pentru garanție).",
      "La pompele de căldură cu agent frigorific, cere un tehnician certificat pentru gaze fluorurate (F-gaz).",
      "Cere un deviz scris cu manopera, materialele și avizele separate.",
      "Cere factură și certificat de garanție pentru lucrare și echipament.",
    ],
    faq: [
      {
        q: "Cât costă montajul unei centrale termice?",
        a: "Manopera pentru montajul unei centrale pe gaz în apartament este de obicei între 800 și 1.800 lei. Dacă se modifică traseele de gaz sau de încălzire, prețul crește. Punerea în funcțiune, proiectul de gaze și avizele se plătesc separat.",
      },
      {
        q: "Am nevoie de autorizație pentru montajul centralei?",
        a: "Lucrările la instalația de gaze se fac doar de instalatori autorizați ANRE. Dacă înlocuiești centrala pe același loc, fără să schimbi debitul, presiunea, traseul conductelor sau poziția, lucrarea se face pe documentația existentă; e nevoie de proiect nou (și, la debit mai mare, de avizul distribuitorului) doar când se schimbă ceva. Punerea în funcțiune o face obligatoriu un service autorizat ISCIR, iar centrala se verifică periodic.",
      },
      {
        q: "Cât costă încălzirea în pardoseală?",
        a: "Manopera pentru încălzirea în pardoseală cu apă este în general între 40 și 80 lei/mp, fără șapă și materiale. La aceasta se adaugă distribuitorul, țevile, izolația și șapa. E o soluție potrivită mai ales cu centrală în condensare sau pompă de căldură.",
      },
      {
        q: "Cât durează înlocuirea unei centrale termice?",
        a: "Dacă traseele rămân aceleași, înlocuirea unei centrale durează de obicei o zi. Dacă e nevoie de un proiect nou de gaze sau de schimbarea coșului, procesul poate dura câteva săptămâni din cauza avizelor.",
      },
    ],
  },

  "aer-conditionat": {
    seoTitle: "Montaj aer condiționat: preț manoperă și oferte",
    metaDescription:
      "Montaj aer condiționat, igienizare și service AC. Postezi gratuit și primești oferte de la tehnicieni frigotehniști verificați, cu prețuri clare.",
    intro: [
      "Serviciile de aer condiționat includ montajul aparatelor split sau multisplit, traseele frigorifice, igienizarea, încărcarea cu agent frigorific, reparațiile și demontarea. Ai nevoie de un tehnician când îți cumperi un aparat nou, când aparatul face miros sau nu mai răcește ori când te muți și vrei să îl iei cu tine.",
      "Pe Contractez scrii ce aparat ai sau vrei să montezi și unde, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte de la tehnicieni compatibili. Contactul tău rămâne ascuns până alegi prestatorul, iar recenziile vin doar din colaborări confirmate.",
    ],
    prices: [
      { item: "Montaj split 9.000–12.000 BTU", range: "450–800 lei", note: "traseu standard până la 3 m" },
      { item: "Montaj split 18.000–24.000 BTU", range: "700–1.200 lei", note: "traseu standard" },
      { item: "Traseu frigorific suplimentar", range: "80–150 lei/ml", note: "include țeava de cupru și izolația" },
      { item: "Igienizare aer condiționat", range: "150–300 lei", note: "per aparat" },
      { item: "Încărcare cu agent frigorific", range: "200–500 lei", note: "în funcție de cantitate" },
      { item: "Demontare aparat", range: "200–400 lei", note: "cu recuperarea agentului frigorific" },
    ],
    priceFactors: [
      "Lungimea traseului frigorific și numărul de găuri în pereți.",
      "Locul unității exterioare: la înălțime sau greu accesibil.",
      "Puterea aparatului și numărul de unități interioare.",
      "Perioada: vara, la cerere mare, prețurile și termenele cresc.",
    ],
    checklist: [
      "Alege un tehnician certificat pentru lucrul cu gaze fluorurate (F-gaz), obligatoriu pentru manipularea agentului frigorific.",
      "Întreabă dacă face vidarea traseului și proba de etanșeitate, nu doar „aerisire” cu freon.",
      "Verifică dacă montajul de către o persoană certificată e o condiție pentru garanția aparatului.",
      "Stabilește din start ce include prețul: lungimea traseului, consolele, scurgerea condensului.",
      "Cere factură și garanție pentru manoperă.",
    ],
    faq: [
      {
        q: "Cât costă montajul unui aer condiționat?",
        a: "Montajul unui aparat split de 9.000–12.000 BTU costă de obicei între 450 și 800 lei, cu un traseu standard de până la 3 m. Fiecare metru în plus costă în general 80–150 lei. Aparatele mai mari și montajul la înălțime sunt mai scumpe.",
      },
      {
        q: "Am nevoie de tehnician autorizat pentru montajul AC?",
        a: "Da, manipularea agentului frigorific din aparatele de aer condiționat trebuie făcută de personal certificat pentru gaze fluorurate (F-gaz). În plus, mulți producători condiționează garanția de montajul făcut de un tehnician certificat. Cere dovada certificării înainte de lucrare.",
      },
      {
        q: "Cât de des trebuie igienizat aerul condiționat?",
        a: "E bine să faci igienizarea cel puțin o dată pe an, de obicei primăvara, înainte de sezonul cald. Dacă folosești aparatul și pentru încălzire, sau observi miros neplăcut, poți face două igienizări pe an. Filtrele le poți curăța singur la câteva săptămâni.",
      },
      {
        q: "Am nevoie de acordul asociației pentru aer condiționat la bloc?",
        a: "Montarea unității exterioare pe fațada blocului poate necesita acordul asociației de proprietari, iar unele primării au reguli privind aspectul fațadelor. Verifică regulile din blocul și orașul tău înainte de montaj. Un tehnician cu experiență îți poate recomanda un amplasament care deranjează cât mai puțin.",
      },
    ],
  },

  "panouri-solare": {
    seoTitle: "Montaj panouri fotovoltaice: prețuri și oferte",
    metaDescription:
      "Montaj panouri fotovoltaice, baterii de stocare și dosar de prosumator. Postezi gratuit și primești oferte de la instalatori verificați.",
    intro: [
      "Un sistem fotovoltaic include panourile, structura de prindere, invertorul, cablurile, protecțiile electrice și, opțional, bateriile de stocare. Instalatorul se ocupă și de dosarul de prosumator la distribuitor. Ai nevoie de el când vrei să reduci factura la curent, să devii prosumator sau să ai energie de rezervă la căderile de tensiune.",
      "Pe Contractez descrii casa, consumul aproximativ și ce îți dorești, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte de la instalatori compatibili. Firmele sunt verificate în registrul ANAF, iar prețul și plata le stabilești direct cu firma aleasă.",
    ],
    prices: [
      { item: "Montaj sistem on-grid (manoperă)", range: "800–1.500 lei/kW", note: "fără echipamente" },
      { item: "Sistem complet 5 kW la cheie", range: "22.000–35.000 lei", note: "include echipamente și montaj" },
      { item: "Montaj baterie de stocare", range: "1.000–2.500 lei", note: "manoperă" },
      { item: "Dosar de prosumator", range: "500–1.500 lei", note: "documentație pentru distribuitor" },
      { item: "Revizie și curățare panouri", range: "300–800 lei", note: "în funcție de numărul de panouri" },
    ],
    priceFactors: [
      "Puterea sistemului și tipul invertorului: on-grid, hibrid sau off-grid.",
      "Tipul acoperișului și structura de prindere: țiglă, tablă, terasă sau la sol.",
      "Dacă se adaugă baterii de stocare.",
      "Distanța dintre panouri și tablou și starea instalației electrice existente.",
    ],
    checklist: [
      "Alege o firmă cu electricieni autorizați ANRE, necesari pentru racordare și dosarul de prosumator.",
      "Cere o ofertă cu mărcile și modelele exacte ale panourilor, invertorului și bateriilor.",
      "Întreabă cine depune dosarul la distribuitor și ce documente primești la final.",
      "Verifică garanțiile separate: pentru panouri, invertor și pentru manoperă.",
      "Cere contract, factură și schema electrică a sistemului.",
    ],
    faq: [
      {
        q: "Cât costă un sistem fotovoltaic de 5 kW?",
        a: "Un sistem on-grid de 5 kW la cheie, cu echipamente și montaj, costă de obicei între 22.000 și 35.000 lei. Cu baterii de stocare, prețul crește semnificativ. Diferențele mari între oferte vin de regulă din calitatea invertorului și a panourilor.",
      },
      {
        q: "Am nevoie de autorizație de construire pentru panouri pe casă?",
        a: "Pentru panourile montate pe acoperișul unei case, în general nu ai nevoie de autorizație de construire, cu excepția clădirilor și zonelor protejate. Ai însă nevoie de documentația pentru distribuitor ca să devii prosumator. Întreabă la primărie dacă locuiești într-o zonă protejată.",
      },
      {
        q: "Cât durează montajul panourilor fotovoltaice?",
        a: "Montajul propriu-zis la o casă durează de obicei 1–3 zile. Procesul de prosumator, cu avizele și schimbarea contorului, poate dura câteva săptămâni, în funcție de distribuitor.",
      },
      {
        q: "Ce înseamnă să fii prosumator?",
        a: "Prosumatorul este consumatorul care produce energie, de exemplu cu panouri fotovoltaice, și livrează surplusul în rețea. Pentru asta ai nevoie de un contor bidirecțional și de documentație aprobată de distribuitor. Energia livrată se compensează sau se plătește în funcție de contractul cu furnizorul.",
      },
    ],
  },

  "smart-home": {
    seoTitle: "Montaj camere de supraveghere și alarme: prețuri",
    metaDescription:
      "Montaj camere video, alarme, interfoane și automatizări pentru casă. Postezi gratuit și primești oferte de la instalatori verificați.",
    intro: [
      "Serviciile de smart home și securitate includ camere de supraveghere, sisteme de alarmă, interfoane și videointerfoane, automatizări pentru porți și dispozitive inteligente: prize, termostate sau iluminat controlat din telefon. Ai nevoie de ele când te muți într-o casă nouă, după o tentativă de efracție sau când vrei să vezi ce se întâmplă acasă când lipsești.",
      "Pe Contractez descrii ce vrei să montezi și unde, iar platforma te ajută să structurezi cererea. Postarea e gratuită și primești cel mult 5 oferte de la instalatori compatibili. Prestatorii sunt verificați prin email și, pentru firme, în registrul ANAF, iar contactul tău rămâne ascuns până alegi.",
    ],
    prices: [
      { item: "Montaj cameră de supraveghere", range: "150–400 lei/cameră", note: "montaj, cablare și configurare" },
      { item: "Sistem cu 4 camere (manoperă)", range: "800–1.800 lei", note: "fără echipamente" },
      { item: "Montaj sistem de alarmă", range: "600–1.500 lei", note: "manoperă, în funcție de numărul de senzori" },
      { item: "Montaj interfon sau videointerfon", range: "250–600 lei", note: "manoperă" },
      { item: "Automatizare poartă", range: "500–1.200 lei", note: "manoperă" },
      { item: "Configurare dispozitive smart", range: "100–250 lei/dispozitiv", note: "montaj și conectare la aplicație" },
    ],
    priceFactors: [
      "Numărul de camere, senzori sau dispozitive.",
      "Cablarea: îngropată, aparentă în canal sau sistem wireless.",
      "Înălțimea și accesul la locurile de montaj.",
      "Configurarea accesului de pe telefon și integrarea cu alte sisteme.",
    ],
    checklist: [
      "Pentru sisteme de alarmă și supraveghere, alege o firmă licențiată de Poliția Română pentru sisteme de securitate.",
      "Discută amplasarea camerelor astfel încât să nu filmeze proprietatea vecinilor sau spațiul public.",
      "Cere oferta cu modelele exacte ale echipamentelor și capacitatea de stocare a înregistrărilor.",
      "Asigură-te că primești parolele de administrator și că le poți schimba.",
      "Cere factură și garanție pentru echipamente și manoperă.",
    ],
    faq: [
      {
        q: "Cât costă montajul camerelor de supraveghere?",
        a: "Manopera este de obicei între 150 și 400 lei pe cameră, cu montaj, cablare și configurare. Un sistem cu 4 camere și înregistrator costă în general 800–1.800 lei doar pentru montaj, iar echipamentele se plătesc separat. Cablarea îngropată sau la înălțime crește prețul.",
      },
      {
        q: "Am voie să pun camere de supraveghere la casă?",
        a: "Da, poți monta camere pentru propria proprietate. Camerele nu ar trebui să filmeze curtea vecinilor sau spațiul public, pentru că intri sub regulile de protecție a datelor (GDPR). La bloc, camerele pe holuri sau la intrare se montează cu acordul asociației de proprietari.",
      },
      {
        q: "Cine poate monta un sistem de alarmă?",
        a: "Sistemele de alarmă împotriva efracției se instalează de firme licențiate de Poliția Română, cu personal atestat. Asta contează și pentru asigurare, iar unii asigurători cer un astfel de montaj. Cere numărul licenței înainte de semnarea contractului.",
      },
      {
        q: "Camere wireless sau cu fir?",
        a: "Camerele wireless se montează repede și sunt potrivite pentru apartamente sau pentru câteva puncte. Cele cu fir, mai ales alimentate prin cablul de rețea (PoE), sunt mai stabile și potrivite pentru case și curți mari. Instalatorul îți poate recomanda varianta potrivită după ce vede locul.",
      },
    ],
  },
};
