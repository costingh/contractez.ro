import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { formatRating, initials } from "@/lib/format";
import { isPhoneVerified } from "@/server/features";
import { cardPrice, getPublicCard } from "@/server/providers/public-card";

export const alt = "Profil de prestator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function loadAssets() {
  return Promise.all([
    readFile(join(process.cwd(), "public/brand/contractez-mark-ink.svg"), "base64").then((b) => `data:image/svg+xml;base64,${b}`),
    readFile(join(process.cwd(), "public/fonts/Geist-400.ttf")),
    readFile(join(process.cwd(), "public/fonts/Geist-700.ttf")),
  ]);
}

const NAVY = "#142340";
const INK = "#0d1626";
const VERIFIED = "#17714a";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [mark, regular, bold] = await loadAssets();
  const card = await getPublicCard(slug);
  const opts = {
    ...size,
    fonts: [
      { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Geist", data: bold, weight: 700 as const, style: "normal" as const },
    ],
  };
  if (!card) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#060b16", color: "white", fontSize: 72, fontFamily: "Geist", fontWeight: 700 }}>
        {site.name}
      </div>,
      opts,
    );
  }
  const p = card.profile;
  const badges = [
    card.companyVerifiedAt ? "Firmă verificată ANAF" : null,
    isPhoneVerified(card.phoneVerifiedAt) ? "Telefon verificat" : null,
    card.issuesInvoice ? "Emite factură" : null,
    p.remote ? "Lucrează remote" : null,
    p.onSite ? `Se deplasează ${p.travelRadiusKm} km` : null,
  ].filter(Boolean) as string[];
  const location = [card.localityName, card.countyCode].filter(Boolean).join(", ");
  const meta = [
    location,
    p.ratingCount > 0 && p.ratingAvg ? `Rating ${formatRating(p.ratingAvg)} · ${p.ratingCount === 1 ? "1 recenzie" : `${p.ratingCount} recenzii`}` : "",
    p.yearsExperience ? `${p.yearsExperience} ani experiență` : "",
  ].filter(Boolean);

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#f7f7f5", fontFamily: "Geist", padding: 48 }}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "white", borderRadius: 32, border: "2px solid #e3e3de", overflow: "hidden" }}>
        <div style={{ display: "flex", padding: "44px 52px 0", gap: 36, alignItems: "center" }}>
          <div style={{ display: "flex", width: 140, height: 140, borderRadius: 999, background: `linear-gradient(140deg, #1c2f57, ${NAVY} 55%, #2b4acb)`, color: "white", fontSize: 58, fontWeight: 700, alignItems: "center", justifyContent: "center" }}>
            {initials(card.name)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 58, fontWeight: 700, color: INK, lineHeight: 1.05 }}>{card.name}</div>
            <div style={{ fontSize: 30, color: "#3b4555", marginTop: 10 }}>{p.headline.slice(0, 70)}</div>
            <div style={{ display: "flex", gap: 22, fontSize: 26, color: "#5b6472", marginTop: 14 }}>
              {meta.map((m) => (
                <div key={m} style={{ display: "flex" }}>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "30px 52px 0" }}>
          {badges.slice(0, 4).map((b) => (
            <div key={b} style={{ display: "flex", fontSize: 24, padding: "8px 18px", borderRadius: 999, background: "#e7f4ee", color: VERIFIED, fontWeight: 700 }}>
              {b}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "18px 52px 0" }}>
          {card.skills.slice(0, 5).map((s) => (
            <div key={s} style={{ display: "flex", fontSize: 22, padding: "6px 16px", borderRadius: 12, border: "2px solid #e3e3de", color: "#2a3444" }}>
              {s}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: "auto", padding: "26px 52px", background: "#060b16", color: "white", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>{cardPrice(card)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src={mark} width={44} height={44} alt="" />
            <div style={{ display: "flex", fontSize: 32, fontWeight: 700, letterSpacing: "-0.04em" }}>contractez</div>
          </div>
        </div>
      </div>
    </div>,
    opts,
  );
}
