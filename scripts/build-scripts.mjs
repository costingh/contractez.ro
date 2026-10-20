// Împachetează worker-ul și scriptul de migrare în fișiere ESM autonome (dist/*.mjs),
// ca să ruleze în imaginea Docker fără node_modules complete (output standalone Next).
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** `server-only` aruncă eroare în afara React Server Components; în worker îl înlocuim cu un modul gol. */
const serverOnlyStub = {
  name: "server-only-stub",
  setup(b) {
    b.onResolve({ filter: /^server-only$/ }, () => ({ path: "server-only", namespace: "stub" }));
    b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: "export {};", loader: "js" }));
  },
};

const result = await build({
  absWorkingDir: root,
  entryPoints: { worker: "src/worker/index.ts", migrate: "src/scripts/migrate.ts" },
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: "linked",
  tsconfig: "tsconfig.json",
  // Dependențe native/opționale care nu pot fi împachetate (au fallback JS sau nu sunt folosite).
  external: ["msgpackr-extract", "bufferutil", "utf-8-validate", "pg-native"],
  // Unele pachete CJS folosesc require(); oferim un require real în ESM.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __pathDirname } from 'node:path';",
      "const require = __createRequire(import.meta.url);",
      "const __filename = __fileURLToPath(import.meta.url);",
      "const __dirname = __pathDirname(__filename);",
    ].join("\n"),
  },
  plugins: [serverOnlyStub],
  metafile: true,
  logLevel: "info",
});

const nextInputs = Object.keys(result.metafile.inputs).filter((p) => p.includes("node_modules/next/"));
if (nextInputs.length) {
  console.warn(`⚠️  Bundle-ul include module Next.js (${nextInputs.length}); worker-ul nu ar trebui să depindă de Next.`);
}
