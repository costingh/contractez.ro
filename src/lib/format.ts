import { formatDistanceToNowStrict, format } from "date-fns";
import { ro } from "date-fns/locale";

export function formatLei(n: number | null | undefined, suffix = " lei") {
  if (n === null || n === undefined) return "—";
  return `${n.toLocaleString("ro-RO")}${suffix}`;
}

export function describeBudget(p: { budgetType: string; budgetMin: number | null; budgetMax: number | null }) {
  const fmt = (n: number) => n.toLocaleString("ro-RO");
  const suffix = p.budgetType === "hourly" ? " lei/oră" : p.budgetType === "monthly" ? " lei/lună" : " lei";
  if (p.budgetType === "unknown" || (!p.budgetMin && !p.budgetMax)) return "Buget de discutat";
  if (p.budgetMin && p.budgetMax && p.budgetMin !== p.budgetMax) return `${fmt(p.budgetMin)}–${fmt(p.budgetMax)}${suffix}`;
  if (p.budgetMax) return `până la ${fmt(p.budgetMax)}${suffix}`;
  return `de la ${fmt(p.budgetMin!)}${suffix}`;
}

export function timeAgo(d: Date | string | null | undefined) {
  if (!d) return "";
  return `acum ${formatDistanceToNowStrict(new Date(d), { locale: ro })}`;
}

export function formatDate(d: Date | string | null | undefined, pattern = "d MMM yyyy") {
  if (!d) return "";
  return format(new Date(d), pattern, { locale: ro });
}

export function formatDateTime(d: Date | string | null | undefined) {
  return formatDate(d, "d MMM yyyy, HH:mm");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function formatDistance(km: number | null | undefined) {
  if (km === null || km === undefined) return null;
  if (km < 1) return "sub 1 km";
  return `${Math.round(km)} km`;
}

export function formatResponseTime(minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined) return null;
  if (minutes < 60) return "răspunde în sub o oră";
  if (minutes < 24 * 60) return `răspunde în ~${Math.round(minutes / 60)} ore`;
  return `răspunde în ~${Math.round(minutes / 1440)} zile`;
}
