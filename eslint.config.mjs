import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "dist/**",
    "backups/**",
    // Extensia Chrome (JS de browser, testată separat cu node --test).
    "tools/**",
    // Worktree-urile altor sesiuni Claude (au propriul .next și propriile teste).
    ".claude/**",
  ]),
]);

export default eslintConfig;
