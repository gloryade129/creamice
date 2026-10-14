# Progress Log

Newest entry first. After each task, add: date, task number, what changed, what is left, anything the owner must do.

## 2026-10-14
- T02: Added brand tokens to globals.css (Jet Black, Metallic Gold, Off-White, Charcoal + derived tokens). Mapped all to Tailwind v4 theme (bg-jet, text-offwhite, bg-gold, etc.). Configured Oswald (headings) and Montserrat (body) via next/font with latin subset. Added reduced-motion media query. Created /styleguide page with colours, type scale, buttons, form fields, spacing, motion rules. All checks pass.
- T01: Created Next.js project (TypeScript, Tailwind, App Router) in creamice-site folder. Preserved existing docs/, supabase/, public/, AGENTS.md. Added dependencies: @supabase/supabase-js, @supabase/ssr, zod, lucide-react, vitest. Configured lint (eslint), typecheck (tsc --noEmit), test (vitest run), build (next build --webpack for Windows). Initialized git. All checks pass.
- Documents drafted: PRD, tech stack, database schema, design system, task plan, QA checklist, decisions. No code written yet. Next: T01.
