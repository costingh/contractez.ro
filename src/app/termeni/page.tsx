import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { freePlan, paidPlans, rules, site } from "@/config/site";
import { features } from "@/server/env";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description: "Termenii de utilizare Contractez: cum funcționează publicarea proiectelor, ofertele, abonamentele pentru prestatori, recenziile și răspunderea părților.",
  alternates: { canonical: "/termeni" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Termeni și condiții" updated="octombrie 2026">
      <section>
        <h2>1. Despre platformă</h2>
        <p>
          {site.name} este o platformă online care pune în legătură persoane și firme care au nevoie de servicii („Clienți”) cu persoane și firme
          care prestează servicii („Prestatori”). Platforma nu este parte în contractul dintre Client și Prestator și nu intermediază plata
          lucrărilor.
        </p>
        <p>Platforma este operată de {site.operator} („noi”), contact: {site.supportEmail}.</p>
      </section>
      <section>
        <h2>2. Contul</h2>
        <ul>
          <li>Pentru a folosi funcțiile principale ai nevoie de un cont cu o adresă de email confirmată.</li>
          <li>Ești responsabil pentru corectitudinea datelor din cont și pentru păstrarea confidențialității parolei.</li>
          <li>Un cont poate avea atât rolul de Client, cât și pe cel de Prestator.</li>
          <li>Ne rezervăm dreptul de a suspenda conturile care încalcă acești termeni.</li>
        </ul>
      </section>
      <section>
        <h2>3. Publicarea proiectelor</h2>
        <ul>
          <li>Publicarea proiectelor este gratuită. Proiectul trebuie să descrie o cerere reală și actuală.</li>
          <li>Nu este permisă publicarea de date de contact în anunț; acestea sunt ascunse automat.</li>
          <li>Proiectele duplicate, înșelătoare sau ilegale pot fi eliminate fără notificare prealabilă.</li>
          <li>Un proiect primește implicit maximum {rules.defaultMaxApplications} oferte; Clientul poate extinde selecția.</li>
        </ul>
      </section>
      <section>
        <h2>4. Abonamente și aplicări</h2>
        <ul>
          <li>
            Pentru clienți, platforma este gratuită. Prestatorii aplică la proiecte în limita lunară a planului ales: Gratuit (
            {freePlan.monthlyApplications} aplicări pe lună){paidPlans.map((p) => `, ${p.name} (${p.priceLei} lei/lună, ${p.monthlyApplications} aplicări)`).join("")}.
            Prețurile includ TVA.
          </li>
          <li>Limita include aplicările manuale și pe cele automate și se reînnoiește la începutul fiecărei perioade; aplicările nefolosite nu se reportează.</li>
          <li>Abonamentele plătite se reînnoiesc automat lunar și pot fi anulate oricând; planul rămâne activ până la finalul perioadei plătite.</li>
          <li>Aplicările la proiecte eliminate ca frauduloase, false sau duplicate sunt restituite și nu se socotesc în limită.</li>
          <li>Nu garantăm obținerea unui contract; garantăm că aplicarea ajunge la un proiect activ, publicat de un client cu email confirmat.</li>
          {features.managedPayments && (
            <li>
              Abonamentele sunt vândute prin Link (Stripe), care acționează ca vânzător (merchant of record): procesează plata, emite chitanța și
              factura și răspunde de TVA. Abonamentele, metodele de plată și cererile de rambursare se pot gestiona și din contul Link (link.com).
            </li>
          )}
        </ul>
      </section>
      <section>
        <h2>5. Aplicări automate (Auto Bid)</h2>
        <p>
          Prin activarea Auto Bid, Prestatorul autorizează platforma să trimită aplicări în numele său, strict în limitele și cu mesajul aprobat de
          el. Aplicările automate sunt marcate vizibil, iar Clientul le poate dezactiva pentru proiectul său.
        </p>
      </section>
      <section>
        <h2>6. Recenzii</h2>
        <p>
          Recenziile pot fi lăsate doar după o colaborare confirmată. Trebuie să fie oneste și să nu conțină insulte sau date personale. Putem ascunde
          recenziile care încalcă aceste reguli.
        </p>
      </section>
      <section>
        <h2>7. Conduită interzisă</h2>
        <ul>
          <li>Spam, fraudă, oferte false sau colectarea datelor altor utilizatori.</li>
          <li>Conținut ilegal, abuziv sau discriminatoriu.</li>
          <li>Ocolirea sistemelor de siguranță ale platformei sau crearea de conturi multiple pentru a ocoli limitele planurilor.</li>
        </ul>
      </section>
      <section>
        <h2>8. Răspundere</h2>
        <p>
          Calitatea, termenele și plata serviciilor sunt responsabilitatea exclusivă a Clientului și a Prestatorului. Platforma depune eforturi
          rezonabile pentru verificarea și moderarea conținutului, dar nu poate garanta identitatea sau solvabilitatea utilizatorilor.
        </p>
      </section>
      <section>
        <h2>9. Conținutul tău</h2>
        <p>
          Rămâi proprietarul textelor, pozelor și fișierelor pe care le publici. Ne acorzi dreptul neexclusiv, gratuit, de a le afișa și
          distribui pe platformă (inclusiv în rezultatele de căutare și în notificările către alți utilizatori) cât timp sunt publicate.
          Garantezi că ai dreptul să publici acest conținut și că nu încalcă drepturile altora.
        </p>
      </section>
      <section>
        <h2>10. Suspendarea și închiderea contului</h2>
        <ul>
          <li>Poți șterge oricând contul din pagina de setări; datele se șterg conform Politicii de confidențialitate.</li>
          <li>
            Putem limita, suspenda sau închide un cont care încalcă acești termeni (fraudă, spam, conținut ilegal, conturi multiple), cu
            informarea utilizatorului, cu excepția cazurilor în care legea sau siguranța altor utilizatori nu o permit.
          </li>
        </ul>
      </section>
      <section>
        <h2>11. Modificarea termenilor</h2>
        <p>
          Putem actualiza acești termeni când se schimbă serviciul sau legislația. Te anunțăm prin email sau în platformă cu cel puțin 15 zile
          înainte de modificările importante. Continuarea utilizării după intrarea lor în vigoare înseamnă acceptarea noii versiuni.
        </p>
      </section>
      <section>
        <h2>12. Legea aplicabilă și litigii</h2>
        <p>
          Acești termeni sunt guvernați de legea română. Încercăm să rezolvăm orice nemulțumire amiabil, la {site.supportEmail}. Dacă nu reușim,
          litigiile se soluționează de instanțele competente din România; consumatorii pot apela și la procedura de soluționare alternativă a
          litigiilor (SAL) a ANPC.
        </p>
      </section>
      <section>
        <h2>13. Contact</h2>
        <p>
          Pentru întrebări sau sesizări scrie-ne la {site.supportEmail} sau folosește pagina de{" "}
          <Link href="/contact">contact</Link>. Consumatorii se pot adresa și Autorității Naționale pentru Protecția Consumatorilor, inclusiv
          pentru{" "}
          <a href={site.anpcSalUrl} target="_blank" rel="noopener noreferrer">
            soluționarea alternativă a litigiilor (SAL)
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
