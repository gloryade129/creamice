# Creamice: Build Plan to 28 October 2026

Today is 14 October, so there are 14 days. That is tight but realistic for one builder working with AI, only if scope is held and the owner delivers the items in Part A on time. If a day slips, cut from the bottom of the "cut list" at the end. Do not cut payments, security or mobile quality.

## How to give a task to Kilo Code

Paste this, replacing the task number:

> Read AGENTS.md. Then do task T__ from docs/TASKS.md only. Read the PRD section and design rules relevant to it first. Tell me your plan in a few lines, then implement. Run typecheck, lint and tests, check 360, 768 and 1280 px widths, tick the task and add a note to docs/PROGRESS.md. Do not start any other task.

Review each result yourself before moving on. Commit after every task with a clear message.

## Part A: Owner tasks (start today, run alongside the build)

- [ ] O-1 Start Flutterwave business verification for live payments (can take days). Deadline 20 Oct.
- [ ] O-2 Create the builder's subaccount in Flutterwave and note the ID. Deadline 20 Oct.
- [ ] O-3 Decide hosting (see `TECH_STACK.md` section 2). Deadline 24 Oct.
- [ ] O-4 Buy the domain. Deadline 24 Oct.
- [ ] O-5 Get a transparent PNG or SVG of the logo. Deadline 16 Oct.
- [ ] O-6 Photograph launch products on one backdrop; list name, price, sizes, stock. Deadline 22 Oct.
- [ ] O-7 Write About, Delivery and Returns, FAQ, Privacy, Terms (or have them reviewed). Deadline 24 Oct.
- [ ] O-8 Decide shipping fee per state or one flat fee. Deadline 20 Oct.
- [ ] O-9 Create the WhatsApp Channel and post a first update. Test with a second phone how far back a new follower can scroll. Deadline 20 Oct.
- [ ] O-10 Write down the commission, refund and board membership agreement with the builder. Before launch.

## Part B: Build tasks

### Phase 1: Foundation (14 to 15 Oct)
- [x] T01 Create the Next.js project (TypeScript, Tailwind, App Router) inside this folder without deleting `docs/`, `supabase/`, `public/`, `AGENTS.md`. Set up lint, typecheck, Vitest scripts. Fill in the commands in `AGENTS.md`. Initialise git.
- [ ] T02 Brand tokens in `globals.css`, Tailwind theme mapping, Oswald and Montserrat through `next/font`, reduced-motion rule. Add a temporary `/styleguide` page showing colours, type scale, buttons and fields.
- [ ] T03 UI primitives: Button, Input, Select, Textarea, Badge, Drawer, BottomSheet, Toast, Skeleton. Keyboard and focus behaviour included.
- [ ] T04 Create the Supabase `creamice-dev` project. Run `supabase/schema.sql`. Create the `product-images` bucket. Add env vars. Build the three Supabase clients (browser, server, admin) and a seed script for categories and the 37 shipping rows.
- [ ] T05 Login page, `getCurrentUser`, `requireRole`, dashboard layout with role-based navigation (admin, partner, board). Create the first admin by hand.
- [ ] T06 `lib/money.ts` (kobo helpers, naira formatting, commission calculation) and `lib/orders.ts` (allowed status transitions) with Vitest tests, including rounding and edge cases.

### Phase 2: Back office for products (16 to 17 Oct)
- [ ] T07 Admin: product create and edit form with variants (size, colour, stock), categories, slug generation.
- [ ] T08 Image upload with in-browser resize to WebP, upload through the server, reorder and delete.
- [ ] T09 Partner product flow and approval: partner creates and edits, changes go to pending, admin approval queue with reject note, stock edits immediate.
- [ ] T10 Admin Team page: create account with temporary password, set role, deactivate.

### Phase 3: Storefront (18 to 19 Oct)
- [ ] T11 Header, footer, mobile menu drawer, search field.
- [ ] T12 Home page.
- [ ] T13 Shop and category listings with filters, sort, pagination, search results, empty states.
- [ ] T14 Product page with gallery, size selector, stock state, share on WhatsApp, structured data.
- [ ] T15 Cart: context with localStorage, drawer, `/cart` page.

### Phase 4: Checkout and payments (20 to 21 Oct)
- [ ] T16 Admin Shipping page (default fee and per-state fees) and Settings page (store details, WhatsApp links, approval switch, commission rate, builder subaccount).
- [ ] T17 `/api/checkout`: validate, price on the server, create order, items and payment record with commission snapshot. Tests for totals.
- [ ] T18 Flutterwave payment creation with the split, in test mode. Redirect to the hosted page.
- [ ] T19 Return page: verify with Flutterwave, call `mark_order_paid`, show real status.
- [ ] T20 Webhook route with signature check and the same verification. Test idempotency.
- [ ] T21 Order confirmation page and `/track` (order number plus email).

### Phase 5: Running orders (22 to 23 Oct)
- [ ] T22 Partner Orders: list, filters, detail, Approve and status buttons, history. Test that no money field reaches the browser.
- [ ] T23 Admin Orders: full detail with money, cancel, needs-attention list, expire-unpaid button.
- [ ] T24 Admin Overview and Commission report with CSV export.

### Phase 6: Launch extras (24 Oct; stop here if behind)
- [ ] T25 Updates archive: admin posting, public `/updates`, WhatsApp Channel link in header strip and footer.
- [ ] T26 Discount codes: admin page, checkout validation, usage count.
- [ ] T27 Board area: upcoming products, board-only updates.

### Phase 7: Quality (25 to 26 Oct)
- [ ] T28 SEO: metadata, Open Graph, sitemap, robots, canonical URLs.
- [ ] T29 Information pages with the owner's real text.
- [ ] T30 Responsive pass at 320, 360, 390, 768, 1024, 1440. Fix every overflow.
- [ ] T31 Performance pass: Lighthouse mobile on home, listing, product; image sizes; bundle size.
- [ ] T32 Accessibility pass: keyboard, focus, labels, alt text, contrast.
- [ ] T33 Security review using `QA_AND_LAUNCH.md` section 4.
- [ ] T34 Full test-mode run of `QA_AND_LAUNCH.md` sections 1 to 3.

### Phase 8: Go live (27 to 28 Oct)
- [ ] T35 Create `creamice-prod` Supabase project, run schema, seed, create admin, create bucket.
- [ ] T36 Deploy to the chosen host, connect domain, set production env vars, set the Flutterwave webhook URL and secret hash, switch to live keys.
- [ ] T37 Real purchase of the cheapest item. Confirm the order, the builder split in Flutterwave, partner view, tracking page. Refund the test purchase manually.
- [ ] T38 Submit the sitemap to Google Search Console, turn on GA4, announce on the WhatsApp Channel and group.
- [ ] T39 Launch on 28 October. Watch orders and errors for the first day.

## Cut list (cut from the top when behind)
1. T27 Board area
2. T26 Discount codes
3. T25 Updates archive (keep the WhatsApp Channel link in the footer)
4. Order confirmation email
5. Category filters beyond category, size and price
Never cut: T17 to T21, T22, T30 to T34, T37.

## Realistic warnings
- Flutterwave live approval is outside your control. If it is not ready by 26 Oct, launch date is at risk. Start O-1 today.
- Real products, photos and policy text decide whether the site feels finished. Empty or placeholder content will hurt sales more than a missing feature.
- The AI will sometimes produce code that looks right and is wrong, especially in payments and permissions. Test those by hand (see `QA_AND_LAUNCH.md`).
