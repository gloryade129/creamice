import { afterEach, describe, expect, it } from "vitest";
import { absoluteUrl, getSiteUrl } from "../site";

const original = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (original === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = original;
  }
});

describe("site url", () => {
  it("falls back to the local development origin", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe("http://localhost:3000");
    expect(absoluteUrl("/shop")).toBe("http://localhost:3000/shop");
  });

  it("trims trailing slashes from the configured origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://creamice.example///";
    expect(getSiteUrl()).toBe("https://creamice.example");
    expect(absoluteUrl("updates")).toBe("https://creamice.example/updates");
  });

  it("keeps the home path on the configured origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://creamice.example";
    expect(absoluteUrl("/")).toBe("https://creamice.example/");
  });
});
