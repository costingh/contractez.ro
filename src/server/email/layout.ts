import { site } from "@/config/site";
import { env } from "../env";

/*
 * Layout-ul emailurilor tranzacționale Contractez.
 * HTML scris de mână, pe tabele, cu stiluri inline: singura variantă care arată la fel în Gmail, Apple Mail,
 * Outlook (desktop și 365) și Yahoo. Clasele din <style> sunt doar îmbunătățiri progresive (mobil, mod întunecat);
 * fără ele emailul arată corect.
 */

export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export type CalloutTone = "info" | "success" | "warning";

export type EmailBlock =
  | { type: "p"; text: string }
  | { type: "button"; text: string; href: string; variant?: "primary" | "secondary" }
  | { type: "card"; title: string; meta?: string; lines?: string[]; href?: string }
  | { type: "muted"; text: string }
  | { type: "code"; text: string }
  | { type: "callout"; tone?: CalloutTone; title?: string; text: string }
  | { type: "list"; items: string[]; style?: "bullet" | "check" }
  | { type: "stats"; items: { value: string; label: string }[] }
  | { type: "divider" }
  | { type: "quote"; text: string; author?: string }
  | { type: "signature"; signoff?: string; name?: string }
  /** „Butonul nu merge?”: linkul complet, ca text, pentru copiat în browser. */
  | { type: "link"; href: string; label?: string };

export type EmailInput = {
  preheader?: string;
  /** Text mic, cu majuscule, deasupra titlului (ex: „Securitatea contului”). */
  eyebrow?: string;
  heading: string;
  blocks: EmailBlock[];
  /** De ce primește omul emailul. Apare în footer. */
  footerNote?: string;
};

export type RenderedEmail = { html: string; text: string };

/* --------------------------------- Brand --------------------------------- */

export const emailColors = {
  page: "#eef1f6",
  card: "#ffffff",
  band: "#0b1426", // banda de sus: panourile întunecate de pe site
  navy: "#142340", // ink-ul brandului: titluri și butoane
  text: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  border: "#e3e8f0",
  soft: "#f5f7fb",
  brand: "#2b4acb", // cobalt: linkuri
  green: "#4cc38a",
} as const;
const C = emailColors;

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono','Courier New',monospace";

/** Logo pentru banda întunecată: PNG găzduit pe site (Gmail și Outlook blochează imaginile `data:`). */
export const EMAIL_LOGO = { path: "/brand/email-logo.png", width: 144, height: 30 } as const;

export function emailLogoUrl() {
  return `${env.APP_URL}${EMAIL_LOGO.path}`;
}

export const footerLinks = () => [
  { label: "Preferințe notificări", href: `${env.APP_URL}/setari` },
  { label: "Termeni", href: `${env.APP_URL}/termeni` },
  { label: "Confidențialitate", href: `${env.APP_URL}/confidentialitate` },
];

const DEFAULT_FOOTER_NOTE = "Primești acest email pentru că ai un cont pe Contractez.";

const TONES: Record<CalloutTone, { bg: string; bar: string; title: string; text: string }> = {
  info: { bg: "#eef2fd", bar: C.brand, title: "#1e3497", text: "#334155" },
  success: { bg: "#ebf8f1", bar: "#2fa36b", title: "#17663f", text: "#334155" },
  warning: { bg: "#fff6e6", bar: "#e0a526", title: "#7a4d00", text: "#4b3a1a" },
};

/* --------------------------------- Blocuri -------------------------------- */

/** Spațiu vertical sigur în Outlook (care ignoră margin pe multe elemente). */
const gap = (px: number) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="${px}" style="height:${px}px;font-size:0;line-height:0">&nbsp;</td></tr></table>`;

const table = (inner: string, style = "", cls = "") =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${cls ? ` class="${cls}"` : ""} style="border-collapse:separate;${style}">${inner}</table>`;

function button(b: Extract<EmailBlock, { type: "button" }>) {
  const href = esc(b.href);
  const label = esc(b.text);
  if (b.variant === "secondary") {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn-table" style="margin:8px 0 24px">
<tr><td align="center" class="btn-secondary-td" style="border:1.5px solid #c8d1e1;border-radius:10px;background:${C.card}">
<a href="${href}" target="_blank" class="btn-secondary" style="display:inline-block;padding:12px 24px;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;color:${C.navy};text-decoration:none;border-radius:10px">${label}</a>
</td></tr></table>`;
  }
  // Outlook desktop nu știe border-radius și padding pe <a>: îi dăm un buton VML cu aceleași dimensiuni.
  const width = Math.min(520, Math.max(180, Math.round(b.text.length * 9.2 + 64)));
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn-table" style="margin:8px 0 28px"><tr><td>
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:${width}px;" arcsize="21%" stroke="f" fillcolor="${C.navy}">
<w:anchorlock/>
<center style="color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:bold;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn-table"><tr>
<td align="center" bgcolor="${C.navy}" class="btn-primary-td" style="border-radius:10px;background:${C.navy}">
<a href="${href}" target="_blank" class="btn-primary" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid ${C.navy}">${label}&nbsp;&rarr;</a>
</td></tr></table>
<!--<![endif]-->
</td></tr></table>`;
}

function renderBlock(b: EmailBlock): string {
  switch (b.type) {
    case "p":
      return `<p class="t-body" style="margin:0 0 18px;font-family:${FONT};font-size:16px;line-height:26px;color:${C.text}">${esc(b.text)}</p>`;
    case "muted":
      return `<p class="t-muted" style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:22px;color:${C.muted}">${esc(b.text)}</p>`;
    case "link":
      return `<p class="t-muted" style="margin:0 0 16px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted}">${esc(b.label ?? "Dacă butonul nu funcționează, copiază linkul în browser:")}<br><a href="${esc(b.href)}" target="_blank" class="t-link" style="color:${C.brand};text-decoration:underline;word-break:break-all">${esc(b.href)}</a></p>`;
    case "code":
      return `${table(
        `<tr><td align="center" style="padding:6px 0 26px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" class="code-pill" bgcolor="${C.soft}" style="background:${C.soft};border:1px solid #d9e0ec;border-radius:14px;padding:16px 26px 16px 34px">
<span class="code-text" style="font-family:${MONO};font-size:32px;line-height:38px;font-weight:700;letter-spacing:10px;color:${C.navy};white-space:nowrap">${esc(b.text)}</span>
</td></tr></table></td></tr>`,
      )}`;
    case "button":
      return button(b);
    case "card": {
      const title = b.href
        ? `<a href="${esc(b.href)}" target="_blank" class="t-heading" style="color:${C.navy};text-decoration:none">${esc(b.title)}</a>`
        : esc(b.title);
      const lines = (b.lines ?? [])
        .map((l) => `<div class="t-body" style="font-family:${FONT};font-size:14px;line-height:22px;color:#475569">${esc(l)}</div>`)
        .join("");
      const more = b.href
        ? `<div style="padding-top:10px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:600"><a href="${esc(b.href)}" target="_blank" class="t-link" style="color:${C.brand};text-decoration:none">Vezi detalii&nbsp;&rarr;</a></div>`
        : "";
      return table(
        `<tr><td class="card" style="border:1px solid ${C.border};border-radius:12px;padding:18px 20px;background:${C.card}">
${b.meta ? `<div class="t-muted" style="font-family:${FONT};font-size:12px;line-height:18px;font-weight:600;letter-spacing:0.02em;color:${C.muted};padding-bottom:4px">${esc(b.meta)}</div>` : ""}
<div class="t-heading" style="font-family:${FONT};font-size:17px;line-height:24px;font-weight:700;color:${C.navy};padding-bottom:${lines ? 6 : 0}px">${title}</div>
${lines}${more}
</td></tr>`,
        "margin:0 0 12px",
      ) + gap(4);
    }
    case "callout": {
      const t = TONES[b.tone ?? "info"];
      return table(
        `<tr><td class="callout callout-${b.tone ?? "info"}" bgcolor="${t.bg}" style="background:${t.bg};border-left:4px solid ${t.bar};border-radius:0 10px 10px 0;padding:16px 20px">
${b.title ? `<div class="callout-title" style="font-family:${FONT};font-size:15px;line-height:22px;font-weight:700;color:${t.title};padding-bottom:4px">${esc(b.title)}</div>` : ""}
<div class="callout-text" style="font-family:${FONT};font-size:15px;line-height:23px;color:${t.text}">${esc(b.text)}</div>
</td></tr>`,
      ) + gap(22);
    }
    case "list": {
      const check = b.style === "check";
      const rows = b.items
        .map(
          (i) => `<tr>
<td width="26" valign="top" style="width:26px;padding:2px 0 10px;font-family:${FONT};font-size:${check ? 15 : 18}px;line-height:${check ? 24 : 22}px;font-weight:700;color:${check ? "#2fa36b" : C.green}">${check ? "&#10003;" : "&bull;"}</td>
<td valign="top" class="t-body" style="padding:2px 0 10px;font-family:${FONT};font-size:16px;line-height:24px;color:${C.text}">${esc(i)}</td>
</tr>`,
        )
        .join("");
      return table(rows, "margin:0 0 10px") + gap(8);
    }
    case "stats": {
      // Celulele colorate sunt chiar <td>-urile rândului, ca toate să aibă aceeași înălțime; între ele, coloane goale.
      const items = b.items.slice(0, 3);
      const w = Math.floor((100 - (items.length - 1) * 2) / items.length);
      const cells = items
        .map(
          (s) => `<td width="${w}%" valign="top" class="stat" bgcolor="${C.soft}" style="width:${w}%;background:${C.soft};border:1px solid ${C.border};border-radius:12px;padding:16px 16px 14px">
<div class="t-heading stat-value" style="font-family:${FONT};font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.02em;color:${C.navy}">${esc(s.value)}</div>
<div class="t-muted" style="font-family:${FONT};font-size:12px;line-height:17px;font-weight:600;color:${C.muted};padding-top:2px">${esc(s.label)}</div>
</td>`,
        )
        .join(`<td width="2%" style="width:2%;font-size:0;line-height:0">&nbsp;</td>`);
      return table(`<tr>${cells}</tr>`) + gap(24);
    }
    case "divider":
      return table(`<tr><td class="divider" style="border-top:1px solid ${C.border};font-size:0;line-height:0;height:1px">&nbsp;</td></tr>`, "margin:8px 0 26px") ;
    case "quote":
      return table(
        `<tr><td class="quote" bgcolor="${C.soft}" style="background:${C.soft};border:1px solid ${C.border};border-radius:4px 16px 16px 16px;padding:16px 20px">
${b.author ? `<div class="t-heading" style="font-family:${FONT};font-size:13px;line-height:18px;font-weight:700;color:${C.navy};padding-bottom:6px">${esc(b.author)}</div>` : ""}
<div class="t-body" style="font-family:${FONT};font-size:15px;line-height:24px;color:${C.text};white-space:pre-line">${esc(b.text)}</div>
</td></tr>`,
      ) + gap(24);
    case "signature":
      return `<p class="t-body" style="margin:8px 0 0;font-family:${FONT};font-size:16px;line-height:24px;color:${C.text}">${esc(b.signoff ?? "Cu drag,")}<br><strong class="t-heading" style="color:${C.navy};font-weight:700">${esc(b.name ?? `Echipa ${site.name}`)}</strong></p>`;
  }
}

/* --------------------------------- Pagina --------------------------------- */

const STYLE = `
:root{color-scheme:light dark;supported-color-schemes:light dark}
body{margin:0!important;padding:0!important;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none}
a{text-decoration:none}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}
u+#body a{color:inherit;text-decoration:none}
.btn-primary:hover{background:#1c2f57!important}
@media only screen and (max-width:620px){
  .wrap{padding:0!important}
  .shell{border-radius:0!important;border-left:0!important;border-right:0!important}
  .band{padding:22px 24px!important;border-radius:0!important}
  .content{padding:30px 24px 28px!important}
  .h1{font-size:24px!important;line-height:31px!important}
  .btn-table{width:100%!important}
  .btn-primary,.btn-secondary{display:block!important;text-align:center!important}
  .stat{padding:14px 12px 12px!important}
  .stat-value{font-size:24px!important;line-height:30px!important}
  .code-text{font-size:26px!important;letter-spacing:7px!important}
  .footer{padding:24px 24px 32px!important}
}
@media (prefers-color-scheme:dark){
  body,.page{background:#070c17!important}
  .shell,.content{background:#111a2d!important;border-color:#22304b!important}
  .h1,.t-heading{color:#f1f4fa!important}
  .t-body,.callout-text{color:#cdd5e2!important}
  .t-muted,.footer-text{color:#8d9ab0!important}
  .t-link,.footer-link{color:#9db0ff!important}
  .eyebrow{color:#7fe0b0!important}
  .card{background:#111a2d!important;border-color:#2a3956!important}
  .stat,.quote,.code-pill{background:#18233a!important;border-color:#2a3956!important}
  .code-text{color:#f1f4fa!important}
  .divider{border-color:#22304b!important}
  .callout-info{background:#16224a!important}
  .callout-success{background:#11301f!important}
  .callout-warning{background:#352710!important}
  .callout-title{color:#f1f4fa!important}
  .btn-primary-td{background:#f1f4fa!important}
  .btn-primary{color:#0b1426!important;border-color:#f1f4fa!important}
  .btn-secondary-td{background:transparent!important;border-color:#3a4a6a!important}
  .btn-secondary{color:#f1f4fa!important}
}
[data-ogsc] .h1,[data-ogsc] .t-heading{color:#f1f4fa!important}
[data-ogsc] .t-body{color:#cdd5e2!important}
`;

/** Text ascuns după preheader, ca să nu tragă în previzualizare începutul emailului. */
const PREHEADER_PAD = "&#847;&zwnj;&nbsp;".repeat(60);

function header() {
  const logo = esc(emailLogoUrl());
  return `<tr><td class="band" bgcolor="${C.band}" align="left" style="background:${C.band};border-radius:16px 16px 0 0;padding:26px 40px">
<a href="${esc(env.APP_URL)}" target="_blank" style="text-decoration:none;color:#ffffff;display:inline-block">
<img src="${logo}" width="${EMAIL_LOGO.width}" height="${EMAIL_LOGO.height}" alt="${esc(site.name)}" style="display:block;border:0;outline:none;width:${EMAIL_LOGO.width}px;height:${EMAIL_LOGO.height}px;max-width:${EMAIL_LOGO.width}px;font-family:${FONT};font-size:22px;line-height:30px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;background:${C.band}">
</a>
</td></tr>`;
}

function footer(note: string) {
  const links = footerLinks()
    .map((l) => `<a href="${esc(l.href)}" target="_blank" class="footer-link" style="color:#475569;text-decoration:underline">${esc(l.label)}</a>`)
    .join(`<span style="color:#b6c0d0">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>`);
  return `<tr><td class="footer" align="center" style="padding:28px 40px 40px;font-family:${FONT}">
<div class="t-heading" style="font-size:15px;line-height:22px;font-weight:700;letter-spacing:-0.01em;color:${C.navy}">${esc(site.name)}</div>
<div class="footer-text" style="font-size:13px;line-height:20px;color:${C.muted};padding:2px 0 14px">${esc(site.tagline)}</div>
<div class="footer-text" style="font-size:12px;line-height:19px;color:${C.muted};padding-bottom:12px">${esc(note)}</div>
<div style="font-size:12px;line-height:19px;padding-bottom:14px">${links}</div>
<div class="footer-text" style="font-size:12px;line-height:19px;color:${C.faint}">${esc(site.name)} este operat de ${esc(site.operator)}.<br>Întrebări? Scrie-ne la <a href="mailto:${esc(site.supportEmail)}" class="footer-link" style="color:#475569;text-decoration:underline">${esc(site.supportEmail)}</a></div>
</td></tr>`;
}

export function renderEmailHtml(opts: EmailInput): string {
  const body = opts.blocks.map(renderBlock).join("\n");
  const note = opts.footerNote ?? DEFAULT_FOOTER_NOTE;
  return `<!doctype html>
<html lang="ro" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(opts.heading)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>body,table,td,div,p,a,span,h1{font-family:'Segoe UI',Arial,sans-serif!important}</style><![endif]-->
<style>${STYLE}</style>
</head>
<body id="body" class="page" style="margin:0;padding:0;background:${C.page};word-spacing:normal">
${opts.preheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${esc(opts.preheader)}${PREHEADER_PAD}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="page" bgcolor="${C.page}" style="background:${C.page}">
<tr><td align="center" class="wrap" style="padding:32px 16px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="shell" bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.border};border-radius:16px;border-collapse:separate">
${header()}
<tr><td class="content" bgcolor="${C.card}" style="background:${C.card};padding:40px 40px 36px;border-radius:0 0 16px 16px">
${opts.eyebrow ? `<div class="eyebrow" style="font-family:${FONT};font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#2fa36b;padding-bottom:10px">${esc(opts.eyebrow)}</div>` : ""}
<h1 class="h1" style="margin:0 0 20px;font-family:${FONT};font-size:28px;line-height:35px;font-weight:700;letter-spacing:-0.02em;color:${C.navy}">${esc(opts.heading)}</h1>
${body}
</td></tr>
</table>
</td></tr>
${footer(note)}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}

/* ------------------------------ Varianta text ------------------------------ */

export function renderEmailText(opts: EmailInput): string {
  const out: string[] = [];
  if (opts.eyebrow) out.push(opts.eyebrow.toUpperCase());
  out.push(opts.heading, "");
  for (const b of opts.blocks) {
    switch (b.type) {
      case "p":
      case "muted":
        out.push(b.text, "");
        break;
      case "code":
        out.push(`    ${b.text}`, "");
        break;
      case "button":
        out.push(`${b.text}: ${b.href}`, "");
        break;
      case "link":
        out.push(b.href, "");
        break;
      case "card":
        out.push(...[b.meta, b.title, ...(b.lines ?? []), b.href].filter((x): x is string => Boolean(x)).map((l, i) => (i === 0 ? `* ${l}` : `  ${l}`)), "");
        break;
      case "callout":
        out.push(b.title ? `${b.title}: ${b.text}` : b.text, "");
        break;
      case "list":
        out.push(...b.items.map((i) => `- ${i}`), "");
        break;
      case "stats":
        out.push(b.items.map((s) => `${s.value} ${s.label}`).join(" · "), "");
        break;
      case "divider":
        out.push("---", "");
        break;
      case "quote":
        if (b.author) out.push(`${b.author}:`);
        out.push(...b.text.split("\n").map((l) => `> ${l}`), "");
        break;
      case "signature":
        out.push(b.signoff ?? "Cu drag,", b.name ?? `Echipa ${site.name}`, "");
        break;
    }
  }
  out.push(
    "--",
    `${site.name} · ${env.APP_URL.replace(/^https?:\/\//, "")}`,
    opts.footerNote ?? DEFAULT_FOOTER_NOTE,
    ...footerLinks().map((l) => `${l.label}: ${l.href}`),
    `${site.name} este operat de ${site.operator}. Contact: ${site.supportEmail}`,
  );
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** HTML + varianta text (pentru livrabilitate). */
export function renderEmail(opts: EmailInput): RenderedEmail {
  return { html: renderEmailHtml(opts), text: renderEmailText(opts) };
}
