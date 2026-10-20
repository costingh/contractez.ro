import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({ page, pages, params, basePath }: { page: number; pages: number; params: Record<string, string | undefined>; basePath: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries({ ...params, page: String(p) }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]);
    return `${basePath}?${sp.toString()}`;
  };
  return (
    <nav aria-label="Paginare" className="flex items-center justify-between gap-3 border-t pt-6 pb-2 sm:justify-center sm:gap-6">
      <Button asChild variant="outline" size="sm" aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
        <Link href={href(Math.max(1, page - 1))}>
          <ChevronLeft /> Înapoi
        </Link>
      </Button>
      <span className="text-sm text-muted-foreground tabular-nums">
        Pagina {page} din {pages}
      </span>
      <Button asChild variant="outline" size="sm" aria-disabled={page >= pages} className={page >= pages ? "pointer-events-none opacity-50" : ""}>
        <Link href={href(Math.min(pages, page + 1))}>
          Înainte <ChevronRight />
        </Link>
      </Button>
    </nav>
  );
}
