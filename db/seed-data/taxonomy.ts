// Taxonomia inițială: categorii principale → subcategorii → competențe.
// Slug-urile sunt stabile (folosite în URL-uri și de AI); numele pot fi modificate liber.

export type TaxonomySub = { slug: string; name: string; skills: string[] };
export type TaxonomyCategory = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  workMode: "remote" | "on_site" | "hybrid";
  subs: TaxonomySub[];
};

export const taxonomy: TaxonomyCategory[] = [
  {
    slug: "it-programare",
    name: "IT & Programare",
    icon: "code",
    description: "Site-uri, aplicații, magazine online, automatizări și suport IT.",
    workMode: "remote",
    subs: [
      { slug: "dezvoltare-web", name: "Dezvoltare web", skills: ["React", "Next.js", "Vue", "Angular", "Node.js", "PHP", "Laravel", "HTML/CSS", "TypeScript"] },
      { slug: "site-prezentare", name: "Site de prezentare", skills: ["WordPress", "Webflow", "Wix", "Elementor", "Landing page"] },
      { slug: "magazin-online", name: "Magazin online", skills: ["WooCommerce", "Shopify", "PrestaShop", "Integrare plăți", "Integrare curierat"] },
      { slug: "aplicatii-mobile", name: "Aplicații mobile", skills: ["React Native", "Flutter", "iOS / Swift", "Android / Kotlin"] },
      { slug: "backend-api", name: "Backend & API", skills: ["Python", "Django", "Java", "C# / .NET", "Go", "PostgreSQL", "MySQL", "API REST"] },
      { slug: "automatizari-ai", name: "Automatizări & AI", skills: ["Integrare ChatGPT / OpenAI", "Chatbot", "Make / Zapier / n8n", "Web scraping", "Machine learning"] },
      { slug: "devops-cloud", name: "DevOps & Cloud", skills: ["Docker", "Linux", "AWS", "Google Cloud", "Azure", "CI/CD", "Administrare servere"] },
      { slug: "suport-it", name: "Suport IT & rețelistică", skills: ["Instalare rețele", "Configurare routere", "Reparații calculatoare", "Recuperare date", "Securitate cibernetică"] },
      { slug: "testare-qa", name: "Testare & QA", skills: ["Testare manuală", "Testare automată", "Playwright", "Selenium"] },
    ],
  },
  {
    slug: "design-creatie",
    name: "Design & Creație",
    icon: "palette",
    description: "Identitate vizuală, grafică, UI/UX, ilustrație și design 3D.",
    workMode: "remote",
    subs: [
      { slug: "logo-identitate", name: "Logo & identitate vizuală", skills: ["Logo", "Brand book", "Cărți de vizită", "Adobe Illustrator"] },
      { slug: "ui-ux", name: "UI/UX design", skills: ["Figma", "Wireframes", "Design aplicații", "Design site"] },
      { slug: "grafica-print", name: "Grafică & print", skills: ["Flyere", "Afișe", "Ambalaje", "Bannere", "Adobe Photoshop", "InDesign"] },
      { slug: "ilustratie", name: "Ilustrație", skills: ["Ilustrație digitală", "Ilustrație carte copii", "Personaje"] },
      { slug: "design-3d", name: "Design 3D & randări", skills: ["Blender", "3ds Max", "SketchUp", "Randări interioare"] },
    ],
  },
  {
    slug: "marketing-vanzari",
    name: "Marketing & Vânzări",
    icon: "megaphone",
    description: "SEO, reclame, social media, email marketing și strategie.",
    workMode: "remote",
    subs: [
      { slug: "seo", name: "SEO", skills: ["SEO on-page", "SEO tehnic", "Link building", "SEO local", "Audit SEO"] },
      { slug: "reclame-online", name: "Reclame online", skills: ["Google Ads", "Facebook Ads", "TikTok Ads", "LinkedIn Ads", "Google Analytics"] },
      { slug: "social-media", name: "Social media", skills: ["Administrare pagini", "Instagram", "TikTok", "Facebook", "Content creation"] },
      { slug: "email-marketing", name: "Email marketing", skills: ["Mailchimp", "Newsletter", "Automatizări email"] },
      { slug: "strategie-marketing", name: "Strategie & consultanță", skills: ["Plan de marketing", "Cercetare de piață", "Branding", "Growth"] },
      { slug: "vanzari-lead-gen", name: "Vânzări & lead generation", skills: ["Cold calling", "Prospectare B2B", "CRM", "Telesales"] },
    ],
  },
  {
    slug: "scris-traduceri",
    name: "Scris & Traduceri",
    icon: "languages",
    description: "Copywriting, articole, traduceri autorizate și corectură.",
    workMode: "remote",
    subs: [
      { slug: "copywriting", name: "Copywriting", skills: ["Texte site", "Descrieri produse", "Texte reclame", "Scripturi video"] },
      { slug: "articole-blog", name: "Articole & blog", skills: ["Articole SEO", "Bloguri", "Comunicate de presă"] },
      { slug: "traduceri", name: "Traduceri", skills: ["Engleză", "Germană", "Franceză", "Italiană", "Spaniolă", "Traduceri autorizate", "Traduceri tehnice"] },
      { slug: "corectura", name: "Corectură & redactare", skills: ["Corectură", "Redactare lucrări", "Tehnoredactare"] },
    ],
  },
  {
    slug: "foto-video",
    name: "Foto & Video",
    icon: "camera",
    description: "Fotografie de eveniment și produs, filmări, editare și animație.",
    workMode: "hybrid",
    subs: [
      { slug: "fotografie", name: "Fotografie", skills: ["Fotografie nuntă", "Fotografie botez", "Fotografie produs", "Fotografie imobiliare", "Ședință foto"] },
      { slug: "filmare", name: "Filmare", skills: ["Filmare evenimente", "Filmare dronă", "Videoclip prezentare"] },
      { slug: "editare-video", name: "Editare video", skills: ["Premiere Pro", "DaVinci Resolve", "Reels / TikTok", "Subtitrare"] },
      { slug: "animatie", name: "Animație & motion", skills: ["After Effects", "Animație 2D", "Explainer video"] },
    ],
  },
  {
    slug: "constructii-renovari",
    name: "Construcții & Renovări",
    icon: "hard-hat",
    description: "Renovări, finisaje, zidărie, acoperișuri, gresie și faianță.",
    workMode: "on_site",
    subs: [
      { slug: "renovari-complete", name: "Renovări complete", skills: ["Renovare apartament", "Renovare casă", "Amenajări interioare"] },
      { slug: "finisaje", name: "Finisaje", skills: ["Zugrăveli", "Glet", "Rigips", "Tencuieli", "Parchet"] },
      { slug: "gresie-faianta", name: "Gresie & faianță", skills: ["Montaj gresie", "Montaj faianță", "Placări piatră"] },
      { slug: "constructii", name: "Construcții & zidărie", skills: ["Zidărie", "Fundații", "Structuri", "Case la roșu"] },
      { slug: "acoperisuri", name: "Acoperișuri", skills: ["Montaj țiglă", "Hidroizolații", "Jgheaburi", "Mansardări"] },
      { slug: "termoizolatii", name: "Termoizolații & fațade", skills: ["Polistiren", "Vată minerală", "Tencuială decorativă"] },
    ],
  },
  {
    slug: "instalatii",
    name: "Instalații",
    icon: "wrench",
    description: "Instalații sanitare, electrice, termice, aer condiționat și gaze.",
    workMode: "on_site",
    subs: [
      { slug: "instalatii-sanitare", name: "Instalații sanitare", skills: ["Instalator", "Desfundare canalizare", "Montaj obiecte sanitare", "Reparații țevi"] },
      { slug: "instalatii-electrice", name: "Instalații electrice", skills: ["Electrician", "Tablouri electrice", "Prize și iluminat", "Autorizat ANRE"] },
      { slug: "instalatii-termice", name: "Instalații termice", skills: ["Centrale termice", "Calorifere", "Încălzire în pardoseală", "Pompe de căldură"] },
      { slug: "aer-conditionat", name: "Aer condiționat", skills: ["Montaj aer condiționat", "Igienizare AC", "Service AC"] },
      { slug: "panouri-solare", name: "Panouri fotovoltaice", skills: ["Montaj fotovoltaice", "Prosumator", "Baterii stocare"] },
      { slug: "smart-home", name: "Smart home & securitate", skills: ["Camere supraveghere", "Alarme", "Interfoane", "Automatizări casă"] },
    ],
  },
  {
    slug: "casa-gradina",
    name: "Casă & Grădină",
    icon: "home",
    description: "Curățenie, mobilă, grădinărit, reparații și mici meșteșuguri.",
    workMode: "on_site",
    subs: [
      { slug: "curatenie", name: "Curățenie", skills: ["Curățenie generală", "Curățenie după constructor", "Spălat canapele", "Curățenie birouri"] },
      { slug: "mobila", name: "Mobilă & tâmplărie", skills: ["Mobilă la comandă", "Montaj mobilă", "Tâmplărie PVC", "Uși interioare"] },
      { slug: "gradinarit", name: "Grădinărit & peisagistică", skills: ["Tuns gazon", "Amenajare grădină", "Sistem irigații", "Toaletare pomi"] },
      { slug: "reparatii-casa", name: "Reparații & handyman", skills: ["Mici reparații", "Montaj corpuri iluminat", "Montaj TV", "Lăcătuș"] },
      { slug: "electrocasnice", name: "Reparații electrocasnice", skills: ["Mașini de spălat", "Frigidere", "Aragaze"] },
      { slug: "dezinsectie", name: "Dezinsecție & deratizare", skills: ["Dezinsecție", "Deratizare", "Dezinfecție"] },
    ],
  },
  {
    slug: "transport-mutari",
    name: "Transport & Mutări",
    icon: "truck",
    description: "Mutări, transport marfă, curierat și debarasări.",
    workMode: "on_site",
    subs: [
      { slug: "mutari", name: "Mutări", skills: ["Mutare apartament", "Mutare birou", "Hamali", "Ambalare"] },
      { slug: "transport-marfa", name: "Transport marfă", skills: ["Dubă 3.5t", "Transport internațional", "Transport mobilă"] },
      { slug: "debarasare", name: "Debarasare", skills: ["Debarasare moloz", "Debarasare mobilier"] },
      { slug: "soferi", name: "Șoferi & curierat", skills: ["Șofer personal", "Livrări", "Curierat local"] },
    ],
  },
  {
    slug: "auto",
    name: "Auto & Moto",
    icon: "car",
    description: "Mecanică, tinichigerie, detailing și diagnoză.",
    workMode: "on_site",
    subs: [
      { slug: "mecanica", name: "Mecanică auto", skills: ["Revizii", "Distribuție", "Frâne", "Suspensie"] },
      { slug: "tinichigerie-vopsitorie", name: "Tinichigerie & vopsitorie", skills: ["Tinichigerie", "Vopsitorie", "Polish"] },
      { slug: "detailing", name: "Detailing auto", skills: ["Detailing interior", "Ceramică", "Folie protecție"] },
      { slug: "electrica-auto", name: "Electrică & diagnoză", skills: ["Diagnoză computerizată", "Electrică auto", "Instalații GPL"] },
    ],
  },
  {
    slug: "evenimente",
    name: "Evenimente",
    icon: "party-popper",
    description: "Organizare, DJ, catering, decor și animatori.",
    workMode: "on_site",
    subs: [
      { slug: "organizare-evenimente", name: "Organizare evenimente", skills: ["Nunți", "Botezuri", "Evenimente corporate", "Wedding planner"] },
      { slug: "muzica-dj", name: "Muzică & DJ", skills: ["DJ", "Formație", "Solist", "Sonorizare"] },
      { slug: "catering", name: "Catering & cofetărie", skills: ["Catering", "Tort", "Candy bar", "Barman"] },
      { slug: "decor", name: "Decor & flori", skills: ["Decor sală", "Aranjamente florale", "Baloane"] },
      { slug: "animatori", name: "Animatori & entertainment", skills: ["Animatori copii", "MC", "Photo booth"] },
    ],
  },
  {
    slug: "educatie",
    name: "Educație & Meditații",
    icon: "graduation-cap",
    description: "Meditații, cursuri, limbi străine și pregătire examene.",
    workMode: "hybrid",
    subs: [
      { slug: "meditatii", name: "Meditații", skills: ["Matematică", "Română", "Fizică", "Chimie", "Informatică", "Bacalaureat", "Evaluare națională"] },
      { slug: "limbi-straine", name: "Limbi străine", skills: ["Engleză", "Germană", "Franceză", "Spaniolă", "Italiană", "Pregătire IELTS / Cambridge"] },
      { slug: "cursuri-profesionale", name: "Cursuri profesionale", skills: ["Programare", "Excel", "Contabilitate", "Design grafic"] },
      { slug: "muzica-arte", name: "Muzică & arte", skills: ["Pian", "Chitară", "Canto", "Desen"] },
    ],
  },
  {
    slug: "business-financiar",
    name: "Business & Financiar",
    icon: "briefcase",
    description: "Contabilitate, consultanță, fonduri europene și resurse umane.",
    workMode: "remote",
    subs: [
      { slug: "contabilitate", name: "Contabilitate", skills: ["Contabilitate SRL", "Contabilitate PFA", "Salarizare", "Declarații ANAF", "e-Factura"] },
      { slug: "consultanta-afaceri", name: "Consultanță afaceri", skills: ["Plan de afaceri", "Înființare firmă", "Analiză financiară"] },
      { slug: "fonduri-europene", name: "Fonduri europene", skills: ["Scriere proiecte", "Start-Up Nation", "PNRR", "Implementare proiecte"] },
      { slug: "resurse-umane", name: "Resurse umane", skills: ["Recrutare", "Revisal", "Proceduri HR"] },
      { slug: "asistenta-virtuala", name: "Asistență virtuală", skills: ["Introducere date", "Suport clienți", "Programări", "Administrativ"] },
    ],
  },
  {
    slug: "juridic",
    name: "Juridic & Notarial",
    icon: "scale",
    description: "Avocați, consultanță juridică, GDPR și contracte.",
    workMode: "hybrid",
    subs: [
      { slug: "consultanta-juridica", name: "Consultanță juridică", skills: ["Drept civil", "Drept comercial", "Dreptul muncii", "Drept penal"] },
      { slug: "contracte", name: "Contracte & documente", skills: ["Redactare contracte", "Termeni și condiții", "Acte societate"] },
      { slug: "gdpr", name: "GDPR & conformitate", skills: ["Politică confidențialitate", "Audit GDPR", "DPO"] },
      { slug: "proprietate-intelectuala", name: "Mărci & proprietate intelectuală", skills: ["Înregistrare marcă OSIM", "EUIPO"] },
    ],
  },
  {
    slug: "frumusete-sanatate",
    name: "Frumusețe & Sănătate",
    icon: "sparkles",
    description: "Coafură, make-up, masaj, fitness și nutriție.",
    workMode: "on_site",
    subs: [
      { slug: "coafura-makeup", name: "Coafură & make-up", skills: ["Make-up eveniment", "Coafură", "Make-up mireasă"] },
      { slug: "manichiura", name: "Manichiură & pedichiură", skills: ["Manichiură semipermanentă", "Unghii gel", "Pedichiură"] },
      { slug: "masaj", name: "Masaj & terapie", skills: ["Masaj terapeutic", "Masaj relaxare", "Kinetoterapie"] },
      { slug: "fitness-nutritie", name: "Fitness & nutriție", skills: ["Antrenor personal", "Plan alimentar", "Yoga", "Pilates"] },
    ],
  },
  {
    slug: "imobiliare-arhitectura",
    name: "Arhitectură & Imobiliare",
    icon: "building",
    description: "Proiectare, design interior, topografie, autorizații și evaluări.",
    workMode: "hybrid",
    subs: [
      { slug: "arhitectura", name: "Arhitectură & proiectare", skills: ["Proiect casă", "Autorizație construire", "Proiect structură", "Certificat energetic"] },
      { slug: "design-interior", name: "Design interior", skills: ["Design apartament", "Design spații comerciale", "Home staging"] },
      { slug: "topografie-cadastru", name: "Topografie & cadastru", skills: ["Cadastru", "Intabulare", "Ridicare topografică"] },
      { slug: "evaluari-imobiliare", name: "Evaluări & agenți", skills: ["Evaluare ANEVAR", "Agent imobiliar", "Administrare proprietăți"] },
    ],
  },
  {
    slug: "animale",
    name: "Animale de companie",
    icon: "paw-print",
    description: "Pet sitting, plimbat câini, dresaj și toaletaj.",
    workMode: "on_site",
    subs: [
      { slug: "pet-sitting", name: "Pet sitting & plimbat câini", skills: ["Pet sitting", "Plimbat câini", "Pensiune animale"] },
      { slug: "dresaj", name: "Dresaj", skills: ["Dresaj câini", "Comportament canin"] },
      { slug: "toaletaj", name: "Toaletaj", skills: ["Tuns câini", "Toaletaj pisici"] },
    ],
  },
  {
    slug: "altele",
    name: "Alte servicii",
    icon: "shapes",
    description: "Orice alt serviciu care nu se încadrează în categoriile de mai sus.",
    workMode: "hybrid",
    subs: [{ slug: "diverse", name: "Diverse", skills: [] }],
  },
];

/** Atribute specifice categoriei, afișate în formularul de proiect și ca filtre. */
export const categoryAttributeSeed: Record<
  string,
  { key: string; label: string; kind: "text" | "number" | "select" | "boolean"; options?: string[]; unit?: string }[]
> = {
  "renovari-complete": [
    { key: "surface", label: "Suprafață", kind: "number", unit: "mp" },
    { key: "property_type", label: "Tip proprietate", kind: "select", options: ["Apartament", "Casă", "Spațiu comercial", "Birou"] },
    { key: "materials_included", label: "Materialele sunt incluse", kind: "boolean" },
  ],
  finisaje: [{ key: "surface", label: "Suprafață", kind: "number", unit: "mp" }],
  "gresie-faianta": [{ key: "surface", label: "Suprafață", kind: "number", unit: "mp" }],
  "site-prezentare": [
    { key: "pages", label: "Număr pagini", kind: "number" },
    { key: "has_content", label: "Am textele și pozele", kind: "boolean" },
  ],
  "magazin-online": [
    { key: "products", label: "Număr produse", kind: "number" },
    { key: "platform", label: "Platformă preferată", kind: "select", options: ["Indiferent", "WooCommerce", "Shopify", "Custom"] },
  ],
  mutari: [
    { key: "rooms", label: "Număr camere", kind: "number" },
    { key: "floor", label: "Etaj", kind: "number" },
    { key: "elevator", label: "Există lift", kind: "boolean" },
  ],
  "reclame-online": [{ key: "ad_budget", label: "Buget reclame (separat de onorariu)", kind: "number", unit: "lei/lună" }],
  traduceri: [
    { key: "pages", label: "Număr pagini", kind: "number" },
    { key: "certified", label: "Traducere autorizată", kind: "boolean" },
  ],
  "organizare-evenimente": [
    { key: "guests", label: "Număr invitați", kind: "number" },
    { key: "event_date", label: "Data evenimentului", kind: "text" },
  ],
  meditatii: [
    { key: "level", label: "Nivel", kind: "select", options: ["Primar", "Gimnaziu", "Liceu", "Facultate", "Adult"] },
    { key: "sessions_per_week", label: "Ședințe pe săptămână", kind: "number" },
  ],
};
