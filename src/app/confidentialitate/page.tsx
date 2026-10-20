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
          Operatorul datelor este administratorul platformei {site.name} (datele de identificare ale operatorului vor fi completate la
          înregistrarea entității juridice). Ne poți contacta la {site.supportEmail}.
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
          <li>Furnizorilor noștri: găzduire (VPS), email tranzacțional (Resend), plăți (Stripe), AI (OpenAI).</li>
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
        <h2>8. Cookie-uri</h2>
        <p>Folosim doar cookie-uri strict necesare pentru autentificare și securitate. Nu folosim cookie-uri de publicitate.</p>
      </section>
    </LegalPage>
  );
}
