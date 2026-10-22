import type { Metadata } from "next";

/** Paginile de cont (autentificare, înregistrare, resetări) nu au valoare în căutare. */
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
