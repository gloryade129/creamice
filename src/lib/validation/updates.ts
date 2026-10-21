import { z } from "zod";

// Admin writes public announcements. The slug is generated on the server from
// the title and never comes from the browser, so old links stay predictable.
export const updateFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give the update a title of at least 3 characters.")
    .max(140, "Keep the title under 140 characters."),
  body: z
    .string()
    .trim()
    .min(20, "Write at least 20 characters so the update says something.")
    .max(20_000, "Keep the update under 20,000 characters."),
  intent: z.enum(["draft", "publish"]),
});

export type UpdateFormInput = z.infer<typeof updateFormSchema>;

export function firstUpdateError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the update and try again.";
}
