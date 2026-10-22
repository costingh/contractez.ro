import { describe, expect, it } from "vitest";
import { parseUploadPath } from "@/server/uploads";

const id = "6cd9b1a2-3f4e-4a5b-9c8d-7e6f5a4b3c2d";
const file = "3a7f0c1d-2b3e-4f5a-8b9c-0d1e2f3a4b5c";

describe("parseUploadPath", () => {
  it("acceptă exact căile produse de saveUpload", () => {
    expect(parseUploadPath(`public/avatars/${file}.jpg`)).toEqual({ kind: "public" });
    expect(parseUploadPath(`public/covers/${file}.webp`)).toEqual({ kind: "public" });
    expect(parseUploadPath(`chat/${id}/${file}.pdf`)).toEqual({ kind: "chat", conversationId: id });
  });

  it("respinge traversarea și orice altă formă (raportul QA: ..%2F decodat de Next)", () => {
    for (const bad of [
      `public/../chat/${id}/${file}.pdf`,
      `public/avatars/../../chat/${id}/${file}.pdf`,
      `chat/${id}/../${id}/${file}.pdf`,
      `chat/${id}/${file}.pdf/../x`,
      `public/avatars/${file}.svg`,
      `public/other/${file}.jpg`,
      `public/avatars/%2e%2e/${file}.jpg`,
      `public\\avatars\\${file}.jpg`,
      `/etc/passwd`,
      ``,
    ]) {
      expect(parseUploadPath(bad), bad).toBeNull();
    }
  });
});
