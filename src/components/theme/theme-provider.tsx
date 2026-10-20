"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Tema luminoasă / întunecată (clasa `.dark` pe <html>), implicit după sistem. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
