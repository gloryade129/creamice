import { describe, it, expect } from "vitest";
import {
  excerptFromBody,
  slugifyUpdateTitle,
} from "../updates";
import { updateFormSchema } from "../validation/updates";

describe("update slugs", () => {
  it("turns punctuation and case into a clean address", () => {
    expect(slugifyUpdateTitle("New drop: October 28!")).toBe(
      "new-drop-october-28"
    );
    expect(slugifyUpdateTitle("  Café Crème  ")).toBe("cafe-creme");
  });

  it("never returns an empty slug", () => {
    expect(slugifyUpdateTitle("!!!")).toBe("update");
  });

  it("keeps a long title inside the column limit without a trailing dash", () => {
    const slug = slugifyUpdateTitle("a".repeat(120));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("update excerpts", () => {
  it("collapses whitespace and keeps short copy whole", () => {
    expect(excerptFromBody("  One   short\n\nupdate.  ")).toBe(
      "One short update."
    );
  });

  it("cuts long copy at a word and marks the cut", () => {
    const text = "word ".repeat(80);
    const excerpt = excerptFromBody(text, 40);
    expect(excerpt.length).toBeLessThanOrEqual(41);
    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt).not.toContain("wor…");
  });
});

describe("update form", () => {
  const valid = {
    title: "October drop",
    body: "The next collection lands on 28 October at noon.",
    intent: "publish" as const,
  };

  it("accepts a complete publish and draft", () => {
    expect(updateFormSchema.safeParse(valid).success).toBe(true);
    expect(
      updateFormSchema.safeParse({ ...valid, intent: "draft" }).success
    ).toBe(true);
  });

  it("rejects a short title, short body or unknown intent", () => {
    expect(updateFormSchema.safeParse({ ...valid, title: "Hi" }).success).toBe(
      false
    );
    expect(
      updateFormSchema.safeParse({ ...valid, body: "Too short" }).success
    ).toBe(false);
    expect(
      updateFormSchema.safeParse({ ...valid, intent: "delete" }).success
    ).toBe(false);
  });

  it("trims the stored title and body", () => {
    const parsed = updateFormSchema.parse({
      ...valid,
      title: "  October drop  ",
      body: `  ${valid.body}  `,
    });
    expect(parsed.title).toBe("October drop");
    expect(parsed.body).toBe(valid.body);
  });
});
