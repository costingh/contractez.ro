"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** `href` e ancora secțiunii, ex. "#servicii". */
export type SectionTab = { href: string; label: string };

/**
 * Sub-navigație lipită sub header pentru paginile lungi cu secțiuni (ex. /profil).
 * Pe mobil se derulează DOAR orizontal (fără scroll vertical/diagonal, fără scrollbar), tab-ul secțiunii
 * curente e marcat și ținut la vedere, iar marginile se estompează când mai sunt tab-uri în afara ecranului.
 */
export function SectionTabs({ items, label, className }: { items: SectionTab[]; label: string; className?: string }) {
  const navRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(items[0]?.href);
  const [edges, setEdges] = useState({ start: false, end: false });
  const firstScroll = useRef(true);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const start = el.scrollLeft > 2;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdges((e) => (e.start === start && e.end === end ? e : { start, end }));
  }, []);

  // Secțiunea curentă = cea mai apropiată secțiune al cărei început a trecut de marginea de jos a barei.
  useEffect(() => {
    let frame = 0;
    const spy = () => {
      frame = 0;
      const line = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 24;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = items[0]?.href;
      let best = -Infinity;
      for (const item of items) {
        const top = document.getElementById(item.href.slice(1))?.getBoundingClientRect().top;
        if (top !== undefined && top <= line && top > best) {
          best = top;
          current = item.href;
        }
      }
      if (atBottom && items.length) current = items[items.length - 1].href;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(spy);
    };
    const onHash = () => {
      const hash = location.hash;
      if (items.some((i) => i.href === hash)) setActive(hash);
    };
    onHash();
    spy();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHash);
    window.addEventListener("resize", updateEdges);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("resize", updateEdges);
    };
  }, [items, updateEdges]);

  // Ține tab-ul activ la vedere: îl centrează în bară (doar orizontal, pagina nu se mișcă).
  useEffect(() => {
    const scroller = scrollerRef.current;
    const link = scroller?.querySelector<HTMLAnchorElement>(`a[href="${active}"]`);
    if (!scroller || !link) return;
    const left = link.offsetLeft - (scroller.clientWidth - link.offsetWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, left), behavior: firstScroll.current ? "instant" : "smooth" });
    firstScroll.current = false;
    updateEdges();
  }, [active, updateEdges]);

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className={cn(
        "sticky top-15 z-20 -mx-4 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:mx-0",
        className,
      )}
    >
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className="no-scrollbar relative flex h-12 touch-pan-x items-stretch gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 sm:px-0"
      >
        {items.map((item) => {
          const current = item.href === active;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setActive(item.href)}
              aria-current={current ? "location" : undefined}
              className={cn(
                "relative flex shrink-0 items-center px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors",
                current && "text-foreground after:bg-foreground",
              )}
            >
              {item.label}
            </a>
          );
        })}
      </div>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent transition-opacity duration-200",
          edges.start ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-200",
          edges.end ? "opacity-100" : "opacity-0",
        )}
      />
    </nav>
  );
}
