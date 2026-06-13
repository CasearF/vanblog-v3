import { describe, it, expect } from "vitest";
import { reactionImages, reactionLocale } from "../utils/walineReactions";

describe("walineReactions", () => {
  it("exposes 6 reactions as inline svg data URIs", () => {
    expect(reactionImages).toHaveLength(6);
    for (const src of reactionImages) {
      expect(src.startsWith("data:image/svg+xml,")).toBe(true);
      const decoded = decodeURIComponent(
        src.replace("data:image/svg+xml,", "")
      );
      expect(decoded).toContain("<svg");
      expect(decoded).toContain('viewBox="0 0 36 36"');
    }
  });

  it("has a non-empty label for every reaction image (locale reaction0..5)", () => {
    const locale = reactionLocale as Record<string, string>;
    reactionImages.forEach((_, i) => {
      expect((locale[`reaction${i}`] ?? "").length).toBeGreaterThan(0);
    });
    expect(reactionLocale.reactionTitle.length).toBeGreaterThan(0);
  });
});
