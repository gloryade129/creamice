# AGENTS.md: Creamice store

This file is read at the start of every task. Keep to it. If something here conflicts with what you are asked, stop and ask the owner.

## Project
Online store for Creamice, a Nigerian streetwear brand. Next.js (App Router, TypeScript), Tailwind CSS, Supabase (Postgres, Auth, Storage), Flutterwave payments. Launch date: 28 October 2026.

## Read before working
- `docs/PRD.md`: what to build and the rules of each page
- `docs/TECH_STACK.md`: architecture, folder layout, payment steps
- `docs/DATABASE.md` and `supabase/schema.sql`: data and permissions
- `docs/DESIGN_SYSTEM.md`: colours, fonts, components, motion
- `docs/TASKS.md`: the ordered task list. Do one task per session.
- `docs/DECISIONS.md`: choices already made and open questions
Read only what the current task needs, but always check the PRD section and the design rules for the thing you build.

## How to work
1. Work on one task from `docs/TASKS.md` at a time. Do not start the next one.
2. Before coding, say in two or three lines what you will change. Then make small, reviewable changes.
3. Run the type check, linter and tests. Fix what you broke.
4. Check the page at 360 px, 768 px and 1280 px wide.
5. When finished, tick the task in `docs/TASKS.md` and add a short entry to `docs/PROGRESS.md` (what changed, what is left, anything the owner must do).
6. If a requirement is unclear, ask. Do not invent business rules, prices, policy text or copy.

## Hard rules
- No new dependencies without asking. Allowed: next, react, tailwindcss, @supabase/supabase-js, @supabase/ssr, zod, lucide-react, vitest.
- Money is integer kobo everywhere. Never use floating point for money. Convert to naira only for display and for Flutterwave.
- Never trust the browser for prices, stock, totals, discounts, roles or payment results. Recalculate on the server.
- Every dashboard page, server action and route handler starts with a role check (`requireRole`). Hiding a button is not security.
- Partners must never receive money data: no `unit_price_kobo`, totals, `order_payments`, commission, revenue. Use only `lib/data/partner-orders.ts` for partner order data.
- The service role key and Flutterwave secret key are server only. Never import `lib/supabase/admin.ts` or `lib/flutterwave/*` from a client component. Never log secrets or full payment payloads.
- A payment is real only after server-side verification with Flutterwave plus the `mark_order_paid` database function. The redirect URL and webhook body alone prove nothing.
- Do not edit `supabase/schema.sql` after it has run in production; add a numbered file in `supabase/migrations/`.
- Do not touch payment, commission or auth code unless the current task is about it.
- Validate all input with zod on the server. Escape or sanitise anything shown back to a user.
- Keep the code host-neutral: no Vercel-only services.

## Design rules (short version; full rules in the design doc)
- Two themes: **light storefront** (`:root`) and **dark dashboard** (`.theme-admin`). The storefront is a clean marketplace; the dashboard is a focused admin tool. Never mix them.
- Colours: only the tokens in `globals.css`. Black, gold and white. Gold is an accent, not a wash: one filled gold primary action per viewport.
- Gold `#C6A15B` is never used as small text on white. Use `gold-ink` for gold text in the light theme.
- Fonts: Oswald for display and dashboard numbers, Montserrat for everything else. Through `next/font` only.
- No emojis, no gradients, no glows, no glassmorphism, no auto-playing carousels. Shadows only on hover and floating layers.
- Radii: 8 px controls, 12 px cards, 16 px panels. Borders separate content.
- Animation: 150 to 200 ms only, and respect `prefers-reduced-motion`.
- Mobile first. No horizontal scroll at 320 px. Touch targets at least 44 px. Tables become stacked cards on mobile.
- Never invent prices, stock, ratings, policy text or delivery promises. Placeholder imagery must be labelled as such.

## Code style
- TypeScript strict mode. No `any`. Small functions, clear names.
- Server components by default; add `"use client"` only where interaction needs it.
- Business rules in `src/lib/`, database access only in `src/lib/data/`, pages stay thin.
- Handle loading, empty and error states for every list and form.
- Use `next/image` with explicit `sizes` for all images, with alt text.
- Write Vitest tests for money, commission, order status rules and anything with calculations.
- Comments explain why, not what.

## Commands (fill in once the project exists)
- Install: `npm install`
- Dev: `npm run dev`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`

## Definition of done
Works on a phone and a desktop, handles errors, passes type check, lint, tests and build, matches the design rules, respects roles, task ticked, progress logged.
