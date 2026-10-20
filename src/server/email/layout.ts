import { env } from "../env";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export type EmailBlock =
  | { type: "p"; text: string }
  | { type: "button"; text: string; href: string }
  | { type: "card"; title: string; meta?: string; lines?: string[]; href?: string }
  | { type: "muted"; text: string }
  | { type: "code"; text: string };

export function renderEmail(opts: { preheader?: string; heading: string; blocks: EmailBlock[]; footerNote?: string }) {
  const body = opts.blocks
    .map((b) => {
      switch (b.type) {
        case "p":
          return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1f2937">${esc(b.text)}</p>`;
        case "muted":
          return `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#6b7280">${esc(b.text)}</p>`;
        case "code":
          return `<p style="margin:0 0 16px;font-size:28px;letter-spacing:6px;font-weight:700;color:#111827">${esc(b.text)}</p>`;
        case "button":
          return `<p style="margin:24px 0"><a href="${esc(b.href)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px">${esc(b.text)}</a></p>`;
        case "card":
          return `<div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 12px">
            ${b.meta ? `<div style="font-size:12px;color:#6b7280;margin-bottom:4px">${esc(b.meta)}</div>` : ""}
            <div style="font-size:16px;font-weight:600;color:#111827;margin-bottom:6px">${b.href ? `<a href="${esc(b.href)}" style="color:#111827;text-decoration:none">${esc(b.title)}</a>` : esc(b.title)}</div>
            ${(b.lines ?? []).map((l) => `<div style="font-size:14px;color:#374151;line-height:1.5">${esc(l)}</div>`).join("")}
          </div>`;
      }
    })
    .join("\n");

  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px">
<tr><td>
<div style="font-size:18px;font-weight:800;color:#0f766e;margin-bottom:20px">${esc(env.APP_NAME)}</div>
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:#111827">${esc(opts.heading)}</h1>
${body}
</td></tr></table>
<p style="font-size:12px;color:#9ca3af;margin:16px 0 0;max-width:560px">${esc(opts.footerNote ?? "Primești acest email pentru că ai un cont pe platformă.")} <a href="${env.APP_URL}/setari" style="color:#6b7280">Preferințe notificări</a></p>
</td></tr></table></body></html>`;
}
