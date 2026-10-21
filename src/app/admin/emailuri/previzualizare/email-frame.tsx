"use client";

import { useEffect, useRef, useState } from "react";

/** Iframe pentru un email randat: își potrivește înălțimea după conținut (fără scripturi în email). */
export function EmailFrame({ html, title, width }: { html: string; title: string; width: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(720);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    let observer: ResizeObserver | null = null;
    const attach = () => {
      const doc = frame.contentDocument;
      if (!doc?.documentElement) return;
      const measure = () => setHeight(doc.documentElement.scrollHeight);
      measure();
      observer?.disconnect();
      observer = new ResizeObserver(measure);
      observer.observe(doc.documentElement);
    };
    // Iframe-ul se poate încărca înainte de hidratare: măsurăm imediat dacă e gata, apoi la fiecare încărcare.
    if (frame.contentDocument?.readyState === "complete") attach();
    frame.addEventListener("load", attach);
    return () => {
      frame.removeEventListener("load", attach);
      observer?.disconnect();
    };
  }, [html]);

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={html}
      // Fără scripturi; same-origin doar ca să putem măsura înălțimea.
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="block max-w-full rounded-xl border bg-white"
      style={{ width, height }}
    />
  );
}
