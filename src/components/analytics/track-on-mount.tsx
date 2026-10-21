"use client";

import { useEffect } from "react";
import { vtEvent } from "./visitrack-client";

/** Trimite un eveniment VisitTrack când componenta apare (ex. o căutare cu filtre). Se repetă doar când se schimbă props. */
export function TrackOnMount({ name, props }: { name: string; props?: Record<string, string | number | boolean | null | undefined> }) {
  const key = JSON.stringify(props ?? {});
  useEffect(() => {
    vtEvent(name, JSON.parse(key));
  }, [name, key]);
  return null;
}
