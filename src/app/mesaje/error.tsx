"use client"; // Granițele de eroare sunt componente client.

import { ErrorFallback } from "@/components/shared/error-fallback";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorFallback error={error} retry={retry} />;
}
