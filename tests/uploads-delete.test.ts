import { mkdtemp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Directorul de upload e citit din env la importul modulului: îl setăm înainte de importul dinamic.
let dir: string;
let uploads: typeof import("@/server/uploads");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "cz-uploads-"));
  process.env.UPLOAD_DIR = dir;
  uploads = await import("@/server/uploads");
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

const exists = (p: string) =>
  stat(p).then(
    () => true,
    () => false,
  );

describe("deleteUpload", () => {
  it("șterge un fișier salvat de saveUpload", async () => {
    const saved = await uploads.saveUpload(new File([PNG], "a.png", { type: "image/png" }), "public/avatars", "image");
    expect(await exists(path.join(dir, saved.path))).toBe(true);
    expect(await uploads.deleteUpload(saved.path)).toBe(true);
    expect(await exists(path.join(dir, saved.path))).toBe(false);
    // A doua oară: fișierul lipsește, fără eroare.
    expect(await uploads.deleteUpload(saved.path)).toBe(false);
  });

  it("ignoră căile invalide și nu iese din directorul de upload", async () => {
    const outside = path.join(dir, "..", `cz-secret-${Date.now()}.txt`);
    await writeFile(outside, "x");
    const inside = path.join(dir, "public", "avatars", "notes.txt");
    await mkdir(path.dirname(inside), { recursive: true });
    await writeFile(inside, "x");
    const file = "3a7f0c1d-2b3e-4f5a-8b9c-0d1e2f3a4b5c";
    for (const bad of [
      null,
      undefined,
      "",
      `../${path.basename(outside)}`,
      `public/avatars/../../../${path.basename(outside)}`,
      "public/avatars/notes.txt",
      `public/avatars/${file}.svg`,
      `public/other/${file}.jpg`,
      `/etc/passwd`,
      `public\\avatars\\${file}.jpg`,
    ]) {
      expect(await uploads.deleteUpload(bad), String(bad)).toBe(false);
    }
    expect(await exists(outside)).toBe(true);
    expect(await exists(inside)).toBe(true);
    await rm(outside, { force: true });
  });
});
