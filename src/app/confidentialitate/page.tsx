import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Politica de confidențialitate" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Politica de confidențialitate (GDPR)" updated="octombrie 2026">
      <section>
        <h2>1. Cine prelucrează datele</h2>
        <p>
          Operatorul datelor este {site.operator}, administratorul platformei {site.name}. Ne poți contacta la {site.supportEmail}.
        </p>
      </section>
      <section>
        <h2>2. Ce date colectăm</h2>
        <ul>
          <li>Date de cont: nume, email, parolă (stocată criptat), opțional număr de telefon.</li>
          <li>Date de profil: localitate, servicii, tarife, informații despre firmă (denumire, CUI), portofoliu.</li>
          <li>Conținut: proiecte publicate, oferte, mesaje, recenzii, raportări.</li>
          <li>Date tehnice: adresă IP, tip de browser, jurnale de securitate, evenimente de utilizare.</li>
          <li>Date de plată: procesate de Stripe (prin Link, vânzătorul abonamentelor); nu stocăm datele cardului.</li>
        </ul>
      </section>
      <section>
        <h2>3. De ce le folosim (scop și temei legal)</h2>
        <ul>
          <li>Furnizarea serviciului și potrivirea proiectelor cu prestatorii — executarea contractului (art. 6(1)(b) GDPR).</li>
          <li>Prevenirea fraudei și securitatea platformei — interes legitim (art. 6(1)(f)).</li>
          <li>Facturare și obligații fiscale — obligație legală (art. 6(1)(c)).</li>
          <li>Emailuri de marketing — doar cu consimțământul tău, pe care îl poți retrage oricând (art. 6(1)(a)).</li>
        </ul>
      </section>
      <section>
        <h2>4. Funcții AI</h2>
        <p>
          Pentru structurarea cererilor, căutarea în limbaj natural și generarea de propuneri, textul introdus poate fi trimis unui furnizor de
          servicii AI (OpenAI), care acționează ca persoană împuternicită. Nu trimitem parole sau date de plată. Scorul de compatibilitate este
          calculat de platformă printr-o formulă deterministă, nu prin decizii automate cu efect juridic.
        </p>
      </section>
      <section>
        <h2>5. Cui le transmitem</h2>
        <ul>
          <li>Celorlalți utilizatori: profilul public, proiectele publicate (fără date de contact și fără adresă exactă), ofertele și mesajele către destinatar.</li>
          <li>Furnizorilor noștri: găzduire (Hetzner Online, servere în Uniunea Europeană), email tranzacțional (Resend), plăți (Stripe), AI (OpenAI), analiza traficului (VisitTrack), chat de suport (Crisp, doar dacă deschizi chat-ul).</li>
          <li>Autorităților, doar când legea o cere.</li>
        </ul>
      </section>
      <section>
        <h2>6. Cât timp le păstrăm</h2>
        <p>
          Datele de cont pe durata existenței contului. După ștergerea contului păstrăm doar datele cerute de lege (de exemplu, evidența plăților) și
          jurnalele de securitate pentru o perioadă limitată.
        </p>
      </section>
      <section>
        <h2>7. Drepturile tale</h2>
        <ul>
          <li>Acces, rectificare, ștergere, restricționare, portabilitate și opoziție.</li>
          <li>Retragerea consimțământului pentru marketing, din pagina de setări.</li>
          <li>Plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).</li>
        </ul>
        <p>Pentru exercitarea drepturilor scrie-ne la {site.supportEmail}.</p>
      </section>
      <section>
        <h2>8. Transferuri în afara Uniunii Europene</h2>
        <p>
          Unii furnizori (de exemplu OpenAI, Stripe, Resend, Crisp) pot prelucra date și în afara Spațiului Economic European. În aceste
          cazuri transferul se face pe baza mecanismelor prevăzute de GDPR: decizia de adecvare UE–SUA (Data Privacy Framework), acolo unde
          furnizorul este certificat, sau clauzele contractuale standard aprobate de Comisia Europeană.
        </p>
      </section>
      <section>
        <h2>9. Securitate</h2>
        <p>
          Parolele sunt stocate criptat (hash), conexiunile folosesc HTTPS, accesul la date este limitat la persoanele care au nevoie de el, iar
          fișierele private (de exemplu atașamentele din chat) sunt disponibile doar participanților la conversație. Facem copii de siguranță
          zilnice ale datelor.
        </p>
      </section>
      <section>
        <h2>10. Vârsta minimă</h2>
        <p>Platforma este destinată persoanelor de cel puțin 18 ani. Nu colectăm cu bună știință date despre minori.</p>
      </section>
      <section id="cookie-uri" className="scroll-mt-24">
        <h2>11. Cookie-uri și analiza traficului</h2>
        <ul>
          <li>
            <strong>Strict necesare</strong> (fără acord, pentru că fără ele site-ul nu funcționează): sesiunea de autentificare, protecția
            formularelor și alegerea ta privind cookie-urile (<code>cz_consent</code>, 6 luni).
          </li>
          <li>
            <strong>Analiză (VisitTrack)</strong>: vedem câți vizitatori avem, de unde vin, ce pagini citesc și unde se blochează în procesul de
            publicare sau înscriere. Fără acordul tău, analiza rulează fără cookie-uri: nu salvăm nimic în browserul tău, iar vizitele din zile
            diferite nu sunt legate între ele. Dacă apeși „Accept”, salvăm un identificator anonim (<code>_vt_vid</code>, 2 ani), ca să
            recunoaștem vizitele repetate, iar pentru conturile logate legăm vizitele de cont (fără email sau nume), pentru statistici despre
            înscrieri, proiecte și abonamente. Temeiul este consimțământul (art. 6(1)(a) GDPR), pe care îl poți retrage oricând din „Setări
            cookie-uri”, în subsolul paginii.
          </li>
          <li>Nu folosim cookie-uri de publicitate și nu vindem date.</li>
        </ul>
      </section>
      <section>
        <h2>12. Modificări</h2>
        <p>
          Putem actualiza această politică atunci când se schimbă serviciul sau legislația. Data ultimei actualizări apare la începutul
          paginii; modificările importante le anunțăm prin email sau în platformă.
        </p>
      </section>
    </LegalPage>
  );
}
