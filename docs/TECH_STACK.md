# Creamice: Tech Stack and Architecture

## 1. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router) with TypeScript | Server rendering gives fast pages and good SEO. Widely known, so AI tools write it reliably. |
| Styling | Tailwind CSS, with brand tokens as CSS variables | Small CSS, consistent design, easy to follow `DESIGN_SYSTEM.md`. |
| Database, auth, file storage | Supabase (PostgreSQL, Supabase Auth, Storage) | One free service for all three. Real SQL for orders and money. |
| Payments | Flutterwave Standard (hosted checkout) plus subaccount split | Card, transfer and USSD handled by Flutterwave. The commission split is built in. |
| Hosting | See section 2. Decision needed before launch. | |
| Validation | `zod` | One schema checks form input on client and server. |
| Icons | `lucide-react` | Simple line icons. |
| Fonts | Oswald and Montserrat through `next/font` | Self-hosted at build, no layout shift. |
| Tests | Vitest for pure logic (money, commission, status rules) | The riskiest code is calculations; test those. |

Dependency rule: add nothing else without asking the owner. No UI kits, no animation libraries, no state libraries (cart uses React context and localStorage). Pin exact versions in `package.json` and commit the lockfile. Use the latest stable versions when the project is created.

## 2. "Everything must be free": what is true and what is not

I checked the providers' current documentation on 14 October 2026. Re-check before launch because plans change.

| Service | Free plan facts | What it means for Creamice |
| --- | --- | --- |
| Vercel | The Hobby plan is restricted to **non-commercial, personal use** ([Vercel Hobby plan](https://vercel.com/docs/plans/hobby)). | A store that takes payments is commercial use. Vercel Hobby is fine for building and previewing, but running the live store on it breaks Vercel's terms and the project can be paused. |
| Supabase | Free: 500 MB database, 1 GB file storage, 5 GB egress, 50,000 monthly active users. **Free projects pause after 1 week of inactivity. No automatic backups.** Up to 2 active projects ([Supabase pricing](https://supabase.com/pricing.md)). | Enough for a launch. Use one project for development and one for production. Take weekly manual exports. Keep the dev project active or it pauses. Product images count towards the 5 GB egress, so compress them hard. |
| Flutterwave | No monthly fee. A fee is taken on each transaction. | "Free" means no subscription, not no cost per sale. The fee is charged to the Creamice share (see section 6). |
| Domain | Not free. It is paid yearly and the price depends on the registrar and the ending (.com, .ng and so on). | Without a domain, customers see a long `something.vercel.app` address, which hurts trust and sales, and order emails cannot be sent from your own address. Budget for this. |

**Hosting decision (D-1), needed by 24 October.** Options:
- **A. Vercel Pro** (paid, about 20 USD per month per developer seat at the time of writing). Simplest, fully permitted.
- **B. A free host whose terms allow commercial use** (for example Netlify or Cloudflare, both of which can run Next.js). Cost is zero, but I could not read their current terms from here, so the owner must confirm commercial use is permitted on the free plan before choosing. Expect some extra setup.
- **C. Stay on Vercel Hobby anyway.** Not recommended. Risk is the live store being suspended.

To keep every option open, the code must stay host-neutral: no Vercel KV, Blob, Edge Config or other Vercel-only services, no `@vercel/analytics` dependency. Use standard Next.js features only.

## 3. How the pieces connect

```
Customer's phone/laptop
        |
        v
  Next.js app (host)  <----------------------------+
   |  pages (server rendered)                       |
   |  server actions / route handlers               |
   |        |                  |                    |
   |        v                  v                    |
   |   Supabase           Flutterwave API           |
   |   Postgres, Auth,    - create payment          |
   |   Storage            - verify transaction      |
   |        ^             - webhook  ---------------+
   |        |
   +--- Browser talks to Supabase ONLY for:
        (1) login (Supabase Auth)
        (2) reading public catalogue data (RLS allows it)
```

Key rule: the browser never reads or writes private data (orders, money, settings, profiles) directly. All of that goes through server code that first checks who the user is and what role they have, then uses the service role key.

## 4. Project structure

```
src/
  app/
    (store)/                 public site
      page.tsx               home
      shop/page.tsx          listing, filters, search
      category/[slug]/page.tsx
      product/[slug]/page.tsx
      cart/page.tsx
      checkout/page.tsx
      checkout/return/page.tsx    verifies payment on return
      order/[orderNumber]/page.tsx
      track/page.tsx
      account/page.tsx, account/login, account/register
      updates/page.tsx, updates/[slug]/page.tsx
      (info pages: about, contact, delivery-returns, faq, privacy, terms)
    login/page.tsx
    dashboard/
      layout.tsx             checks role, renders role-specific nav
      page.tsx               overview statistics and recent orders
      products/...           products, new, edit, approval queue
      orders/page.tsx        role-aware list (admin sees money, partner does not)
      orders/[id]/page.tsx   role-aware detail and guarded status actions
      commission/page.tsx    admin monthly commission report
      shipping, discounts, updates, team, settings
    api/
      checkout/route.ts      creates order + Flutterwave payment
      checkout/quote/route.ts  server prices for the checkout summary
      commission/export/route.ts  admin-only CSV for one month
      webhooks/flutterwave/route.ts
    sitemap.ts, robots.ts, not-found.tsx, error.tsx
  proxy.ts                   refreshes the Supabase auth cookies (Next 16 proxy)
  components/
    ui/                      Button, Input, Select, Badge, Modal, Drawer, Toast...
    store/                   Header, Footer, ProductCard, ProductGallery, CartDrawer...
    dashboard/               Sidebar, DataTable, StatusBadge, OrderTimeline...
  lib/
    supabase/                browser client, server client, admin (service role) client
    auth/                    getCurrentUser, requireRole
    data/                    ALL database reads/writes, one file per area
      partner-orders.ts      partner-safe order columns and queries (no money)
      orders.ts              admin order reads (payment, commission, totals)
      reports.ts             overview counts, monthly commission report
    flutterwave.ts           createPayment, verifyTransaction, checkWebhook
    email/                   Brevo customer receipt + seller alert
    order-token.ts           HMAC private links for guest orders
    money.ts                 kobo helpers, formatNaira, commission calc
    orders.ts                allowed status transitions
    reports.ts               Lagos day/month ranges, CSV and decimal formatting
    cart/                    cart context + localStorage
    validation/              zod schemas
  styles/globals.css         brand tokens
supabase/schema.sql
docs/
```

Rules for structure: pages stay thin; business rules live in `lib/`; every database call lives in `lib/data/`, so permission rules are in one place; `lib/supabase/admin.ts` is imported only from server files.

Order reads are deliberately split. `lib/data/partner-orders.ts` selects no `unit_price_kobo`, no totals and never reads `order_payments`; it also excludes `pending_payment`, so a partner cannot open an unpaid cart by direct link. `lib/data/orders.ts` is the admin read model. Tests check the partner column strings, not just the rendered page.

Reporting uses West Africa Time (UTC+1, no DST) for "today" and for the commission month, even though `paid_at` is stored in UTC. The report counts successful payments, not order status, and uses the commission snapshot saved with the payment. Delivery is shown but excluded from commission. CSV money is written as exact decimal naira from integer kobo; the export is admin-only and sends `Cache-Control: no-store`.

## 5. Authentication and roles

### 5.1 Staff

- Supabase Auth with email and password. Staff only.
- On sign-in, server code loads the user's `profiles` row. `requireRole(['admin'])` is called at the top of every dashboard page, server action and route handler. Hiding a menu item is not security.
- Admin creates staff accounts with the Supabase admin API (`auth.admin.createUser`, email pre-confirmed, temporary password) and inserts the `profiles` row. This avoids depending on Supabase's built-in email sending, which is heavily limited on the free plan as far as I know. The admin shares the temporary password privately (for example on WhatsApp) and the user changes it after first login.
- Staff passwords: minimum 10 characters. Turn on Supabase's leaked-password protection if the plan offers it. If time allows, enable TOTP two-factor for the admin account.
- Deactivated users (`is_active = false`) are refused even if their session is still valid.

### 5.2 Customers

- Customers sign up at `/account/register` with Supabase Auth. A trigger-free first read creates their `customers` row from the auth user (id, confirmed email, metadata name/phone); a unique lower-cased email index prevents duplicate accounts.
- Customer accounts are separate from `profiles`. Signing up never grants a dashboard role, and staff can still shop with the same Supabase session.
- Supabase Auth "Confirm email" must stay on. Order history and token-free order access require `email_confirmed_at`; turning confirmation off would let someone claim another person's guest orders (D-22).
- Configure Supabase Auth custom SMTP with Brevo so confirmation and password-reset emails come from the verified Creamice sender, not Supabase's limited built-in mailer. Add the site URL and `/account` redirect to Supabase Auth URL Configuration, or confirmation links will not return to the site.
- `src/proxy.ts` refreshes the auth cookies on navigation. A server component cannot write refreshed cookies, so without this the customer silently becomes a guest when the access token expires.
- `/account`, `/account/login` and `/account/register` are `force-dynamic`; `/account` redirects signed-out visitors to sign-in with a safe `next` path. Account pages are `noindex`.
- Every account server action starts from `getCustomerSession()` and reads the customer id from the session, never from the form. Address reads and writes are also scoped by that id.
- `supabase/migrations/001_customer_accounts.sql` is required. If it has not run, `ensureCustomer` returns null and `/account` shows "Accounts are being set up"; guest checkout and order links keep working.

Partner data safety: write `lib/data/partner-orders.ts` so it selects only `orders` columns and `order_items` columns *excluding* `unit_price_kobo`, and never touches `order_payments`. Add a test that fails if a partner order object contains any money field.

## 6. Payments, step by step

Read Flutterwave's current documentation before writing this code and follow it over anything written here from memory:
- Standard payments: https://developer.flutterwave.com/docs/collecting-payments/standard
- Split payments: https://developer.flutterwave.com/docs/collecting-payments/split-payments
- Webhooks: https://developer.flutterwave.com/docs/webhooks (confirm the exact signature header and method there)

### 6.1 One-time setup
1. Owner completes Flutterwave business verification so live payments are allowed.
2. In the Creamice Flutterwave dashboard, create a **subaccount** for the builder using the builder's bank details (dashboard or "create subaccount" endpoint). Copy the subaccount ID (starts with `RS_`).
3. Admin pastes that ID into Dashboard, Settings, Builder subaccount. The builder's secret keys are never needed or stored.
4. In Flutterwave Settings, Webhooks: set the URL to `https://<domain>/api/webhooks/flutterwave` and set a secret hash; put the same value in `FLW_SECRET_HASH`.

### 6.2 Checkout (server, `api/checkout`)
1. Validate the request with zod: items (variant id, quantity), customer details, state, optional discount code.
2. Load variants and prices from the database. Reject sold-out or inactive items. Never use a price from the browser.
3. Work out subtotal, discount, delivery fee (state rate or default), total. Work out commission: `round(commission_rate x (subtotal - discount))`, in kobo.
4. Insert `orders` (status `pending_payment`), `order_items` (with price snapshot), `order_payments` (status `initiated`, unique `tx_ref`, commission snapshot). A signed-in customer's `customer_id` is stored; guest orders leave it null.
5. Call `POST https://api.flutterwave.com/v3/payments` with the secret key as a Bearer token. Amounts to Flutterwave are in naira (kobo divided by 100). Body:

```json
{
  "tx_ref": "CRM-1001-8f3a2c",
  "amount": 25500,
  "currency": "NGN",
  "redirect_url": "https://<domain>/checkout/return",
  "customer": { "email": "...", "name": "...", "phonenumber": "..." },
  "meta": { "order_number": "CRM-1001" },
  "subaccounts": [
    { "id": "RS_XXXXXXXX", "transaction_charge_type": "flat_subaccount", "transaction_charge": 4500 }
  ]
}
```

   `flat_subaccount` means the subaccount receives that fixed amount and Creamice receives the rest, with Flutterwave's fee coming out of Creamice's share ([split payments](https://developer.flutterwave.com/docs/collecting-payments/split-payments)). The builder therefore receives exactly the commission. If the commission is 0 or no subaccount is configured, omit `subaccounts`.
6. Return the hosted link from the response (`data.link`). The browser redirects to it.

### 6.3 Return page (`checkout/return`)
Flutterwave redirects with `status`, `tx_ref`, `transaction_id` in the URL. These are untrusted. Server code must:
1. Look up the order by `tx_ref`.
2. Verify with Flutterwave using the transaction ID (verify endpoint, confirm exact path in the API reference).
3. Accept only if the status is `successful`, the amount is at least the stored total, the currency is `NGN`, and the `tx_ref` matches.
4. Call the database function `mark_order_paid(tx_ref, transaction_id)`.
5. Show the real result: success, failed or still pending.

### 6.4 Webhook (`api/webhooks/flutterwave`)
1. Check the signature header against `FLW_SECRET_HASH`. Reject with 401 if it does not match.
2. Ignore events that are not successful charges.
3. Verify the transaction with the API exactly as in 6.3 (do not trust the webhook body).
4. Call `mark_order_paid`. It is idempotent, so the return page and the webhook can both run safely in any order.
5. Always answer 200 quickly once the signature is valid.

### 6.5 Things that must be tested in Flutterwave test mode
Successful payment, failed payment, abandoned payment, closing the page before returning (webhook must still complete the order), the webhook delivered twice, a tampered redirect URL, and the split amounts visible in the dashboard for the subaccount. Also test a payment above 10,000 NGN, because Flutterwave notes a stamp duty on larger amounts ([split payments](https://developer.flutterwave.com/docs/collecting-payments/split-payments)); confirm the builder's received amount is what is promised.

### 6.6 Checkout guards
- The checkout page shows a server quote from `/api/checkout/quote` before payment; it never displays a browser price. The quote route applies the same validation, stock, shipping and discount rules as the order route.
- Preview-catalogue items are for design review only. They are labelled in the storefront, rejected by the quote and checkout routes, and block the pay button.
- With no `FLW_SECRET_KEY`, checkout shows "Payment setup is in progress" and the API returns 503. No order is created and no paid state is faked.
- If Flutterwave payment creation fails after the order is created, the order stays `pending_payment` / `initiated`; it can expire through `expire_unpaid_orders`. Never mark it paid on the client response.
- `NEXT_PUBLIC_SITE_URL` must be the real public origin in production. It is used for the Flutterwave return URL and the private order link in emails.

### 6.7 Email notifications (Brevo)

- Server-only env: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `SELLER_EMAIL`. The sender email or its domain must be verified in Brevo.
- Send only after `mark_order_paid` reports a verified, first-time payment: a receipt to the customer and a new-order alert to the seller. Each includes the order number, items, total, delivery details and the private order link.
- Email is best-effort (D-23). Catch and log failures without secrets, never fail the webhook because Brevo is down, and keep the paid order and `/order/[orderNumber]` authoritative.
- Supabase Auth confirmation and reset emails use Brevo SMTP configured in the Supabase dashboard. They are separate from this API code and need no app env var.

## 7. Images

1. Admin and partner uploads go through a form that resizes in the browser (max 1600 px on the long side, WebP, about 80 percent quality) before upload. Reject files over 5 MB before compression.
2. Server code uploads to the public Supabase bucket `product-images` using the service role key, stores `storage_path` in `product_images`.
3. Pages render images with `next/image` using correct `sizes`, a fixed aspect ratio (4:5) so nothing jumps, `priority` only on the first visible image.
4. Delete the old file when an image is replaced.

## 8. Cart

React context plus localStorage, wrapped in try/catch (storage can be unavailable). Stores variant id, quantity and a display snapshot. On entering checkout the server re-reads real prices and stock; any difference is shown to the customer before they pay.

## 9. SEO and sharing

`generateMetadata` on every page; Open Graph image per product; `app/sitemap.ts` lists products, categories and updates; `app/robots.ts` blocks `/dashboard` and `/api`; JSON-LD `Product` on product pages; canonical URLs; filters that change listings use query strings and canonical points to the base page.

## 10. Environments

| Environment | Supabase project | Flutterwave keys | Notes |
| --- | --- | --- | --- |
| Local | `creamice-dev` | Test | `.env.local` |
| Preview/staging | `creamice-dev` | Test | Safe place to try things |
| Production | `creamice-prod` | Live | Only switched to live keys on launch day |

The free plan allows two active projects, which is exactly dev and prod.

## 11. Performance habits

Server components by default, client components only where interaction needs them (cart, filters, forms, image upload). No client-side data fetching for catalogue pages. Cache catalogue reads and revalidate when products change. Fonts through `next/font`. No third-party scripts except GA4, loaded after interaction.
