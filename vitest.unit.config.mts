import path from "node:path";
import { defineConfig } from "vitest/config";

// Teste unitare pure (fără bază de date): `pnpm test:unit`.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { environment: "node", include: ["tests/matching.test.ts", "tests/anaf.test.ts", "tests/social-links.test.ts", "tests/profile-completion.test.ts", "tests/outreach-rules.test.ts"] },
});
