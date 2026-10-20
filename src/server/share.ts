import QRCode from "qrcode";
import { env } from "./env";

/** Link scurt, ușor de scris de mână sau de pus pe o carte de vizită. */
export function profileShortUrl(slug: string) {
  return `${env.APP_URL}/p/${slug}`;
}

export async function qrSvg(text: string) {
  return QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#0b3b39", light: "#ffffff" } });
}

export async function qrPng(text: string, width = 600) {
  return QRCode.toBuffer(text, { type: "png", errorCorrectionLevel: "M", margin: 2, width, color: { dark: "#0b3b39", light: "#ffffff" } });
}

export async function qrDataUrl(text: string, width = 300) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: "M", margin: 1, width, color: { dark: "#0b3b39", light: "#ffffff" } });
}
