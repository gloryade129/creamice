# Creamice Website: Product Requirements Document

Version 1.0 | Launch target: 28 October 2026 | Owner: Creamice

Read this first, then `TECH_STACK.md`, `DATABASE.md` and `DESIGN_SYSTEM.md`. Where this file and another disagree, this file wins, then tell the owner.

## 1. What we are building

An online store for Creamice, a casual luxury streetwear brand (hoodies, joggers, sweatshirts, sweatpants, jorts and similar). Customers in Nigeria browse, pick a size, pay online with Flutterwave and receive their order. The team runs the shop from simple dashboards.

The site follows the familiar layout of large Nigerian marketplaces such as Jumia (search bar, category navigation, product grid, clear prices, cart, checkout), dressed in Creamice brand colours and type. It is simple, fast and honest. It is not a flashy brand experience.

## 2. Goals

| Goal | What it means |
| --- | --- |
| More sales | A visitor can go from landing to paid order in under 2 minutes on a phone. Guest checkout, few fields, Flutterwave. |
| Visibility | Pages are indexable by Google, share well on WhatsApp and Instagram, and load fast on mobile data. |
| Easy navigation | Maximum three taps from the home page to any product. Search always visible. |
| Simple | Few page types, no clutter, no features nobody asked for. |
| Fix the WhatsApp problem | New community members can read past announcements on the website, and the WhatsApp Channel carries broadcasts. |
| Team can run it | Partners and admin manage products and orders without a developer. |

## 3. People and roles

| Role | Who | Can do | Cannot do |
| --- | --- | --- | --- |
| Customer | Public visitor | Browse, search, cart, create an account or check out as a guest, see their order history and saved addresses, track an order with order number and email, read public updates | Own orders, addresses and email only. No staff pages. |
| Partner | Team member managing Creamice products | Create products and edit them (price, name, description, images), update stock, see paid orders, approve (confirm) orders, move orders through fulfilment stages | See any money: totals, payments, commission, revenue. Reach admin pages. Cancel or refund. |
| Admin | Owner | Everything: all products, approve or reject partner changes, all orders including money, cancel orders, shipping fees, discount codes, accounts, updates, settings, commission report | n/a |
| Board member | The website builder and invited insiders | A private area showing upcoming drops and board-only updates before the public | See orders, money or manage anything |

Staff accounts for partners, admin and board members are created by the admin (no public staff sign-up). Customers create their own account at `/account/register`; that never grants a staff role.

## 4. Scope

### Launch must-haves (P0)
Storefront, cart, checkout with Flutterwave, automatic builder commission split, order creation and tracking, customer accounts (with guest checkout still available), Brevo order emails, partner dashboard, admin dashboard, shipping fees set by admin, sizes and stock counts, responsive on every device, SEO basics, legal pages.

### Launch if time allows (P1, build in this order)
1. Public Updates archive plus WhatsApp Channel link (this solves the WhatsApp complaint).
2. Discount codes (the owner asked for these at launch).
3. Board area (upcoming drops and board-only updates).

### After launch (P2)
Reviews, wishlist, abandoned-cart reminders, delivery tracking integration, multiple builders, reports beyond the commission report, international shipping.

### Out of scope
Marketplace for other sellers, loyalty points, mobile app, live chat, multi-language, multi-currency, subscriptions.

If the build is behind schedule, cut P1 items from the bottom up. Never cut P0.

## 5. Customer-facing pages and requirements

Each requirement is testable. "Mobile" means a 360 px wide screen.

### 5.1 Global header and footer
- Header: logo (left), search (centre on desktop, icon that opens a search bar on mobile), cart with item count (right). Below it on desktop: category links. On mobile: a menu button opens a slide-in drawer with categories and links.
- Header stays visible when scrolling up and hides when scrolling down on mobile (simple, optional).
- Footer: About, Contact, Delivery and Returns, FAQ, Privacy, Terms, Updates, WhatsApp Channel link, Instagram link, copyright.
- A small strip under the header may show "Delivery across Nigeria" and "Secure payment by Flutterwave". Text only, no icons clutter.

### 5.2 Home
In order: one static hero (image, one-line headline, one gold button to shop), category tiles, "New arrivals" grid (up to 8), "Featured" grid (up to 8, from `is_featured`), a short brand statement, a trust row (delivery, secure payment, WhatsApp support), the three latest public updates. No auto-playing carousel.

### 5.3 Shop and category listing
- Product grid: 2 columns on mobile, 3 on tablet, 4 on desktop.
- Filters: category, size, price range. Sort: newest, price low to high, price high to low.
- Desktop: filters in a left column. Mobile: a "Filter" button opens a bottom sheet.
- Card shows image, name, price (and struck-through compare price if set), "Sold out" label when every variant has zero stock.
- Pagination or "Load more" at 24 per page. URL reflects filters so pages can be shared.
- Empty state: "No products match these filters" with a clear-filters button.

### 5.4 Search
Searches product name and category. Results page uses the same grid. Handles zero results. Search is server-side, case-insensitive.

### 5.5 Product page
- Image gallery (swipe on mobile, thumbnails on desktop), name, price, size selector (disabled sizes are sold out), colour selector if the product has colours, quantity, "Add to cart" button, description, delivery and returns summary, "Share on WhatsApp" link.
- Stock is checked again server-side at checkout. Never trust the page.
- Product structured data (schema.org Product) for Google.

### 5.6 Cart
Slide-in drawer from the header, plus a full `/cart` page. Change quantity, remove, see subtotal. Cart is kept in the browser (localStorage). Prices in the cart are refreshed from the server before checkout.

### 5.7 Checkout (guest or account)
One page, single column on mobile, two columns on desktop (form left, summary right).
Fields: full name, email, phone, delivery address, city, state (dropdown of Nigerian states and FCT), optional delivery note, optional discount code.
Behaviour:
- Choosing a state shows the delivery fee set by admin for that state, or the default fee.
- The summary shows subtotal, discount, delivery, total.
- "Pay with Flutterwave" creates the order, then redirects to the Flutterwave hosted payment page.
- The customer returns to a confirmation page showing the real, server-verified result.
- Errors are shown next to the field, in plain words.
- An account is optional. Signed-in customers get their name, email, phone and default saved address filled in, and can pick another saved address for this order. Every order still uses the same server-side prices, stock and delivery rules.
- Preview-catalogue items cannot be paid for.

### 5.8 Order confirmation and tracking
- `/order/[orderNumber]` after payment shows status and items. The private link from checkout or `/track` opens it.
- Signed-in customers with a confirmed email can open their own orders without the private link.
- A customer with only the order number uses `/track`, enters the number and the email used for the order, and receives the private link.
- Status shown to customer: Awaiting payment, Paid, Confirmed, Processing, Shipped, Delivered, Cancelled.
- A "Contact us on WhatsApp about this order" button prefilled with the order number.
- When a payment is verified, Brevo sends the customer a receipt and the seller a new-order alert. The on-screen page remains the source of truth if an email fails.

### 5.8.1 Customer account (optional)
- `/account/register` creates a customer account with name, email, optional phone and password. Supabase sends a confirmation email; the account must confirm it before order history appears.
- `/account/login` signs in, then returns to the page the customer came from (checkout or account).
- `/account` shows the customer's details, up to five saved addresses (one default) and order history for the confirmed email. It redirects to sign-in when signed out.
- Customers can edit their name and phone, add, remove and set a default address, and sign out.
- Account pages are `noindex`. Customer accounts are separate from staff `profiles`: signing up never grants a dashboard role.
- These pages depend on `supabase/migrations/001_customer_accounts.sql`; until it is applied the site shows an "accounts are being set up" state and guest checkout still works.

### 5.9 Updates (the permanent archive)
`/updates` lists public announcements, newest first, each at `/updates/[slug]`. Admin posts them from the dashboard. The WhatsApp Channel link appears at the top and in the footer. Posting an update takes the admin under a minute.

### 5.10 Information pages
About, Contact (WhatsApp number, email, no contact form at launch), Delivery and Returns, FAQ, Privacy Policy, Terms. The owner supplies the text. Until then, mark them clearly as drafts and do not launch with placeholder legal text.

### 5.11 Not found and error pages
Branded, simple, with a link home and a search box.

## 6. Dashboards

All dashboards live under `/dashboard`, require login, and show only what the role may see. They must work on a phone, because the team will use them on phones.

### 6.1 Login
Email and password. No public sign-up. Locked accounts (`is_active = false`) cannot sign in.

### 6.2 Partner dashboard
- **Products:** list of all products with status. Create a product (name, category, price, description, images, sizes with stock). Edit a product.
  - When `require_product_approval` is on (default), a new product is saved as "Pending approval" and goes live only after admin approves. An edit to a live product (name, price, description, images, category) is stored as a pending change; the live product stays unchanged until admin approves. Stock changes apply immediately.
  - Partner sees the status and the admin's rejection note.
- **Orders:** list of orders that are paid or later, filter by status, search by order number or name. Order detail shows customer name, phone, delivery address, note, items, sizes and quantities, status history. **No prices, totals, payment or commission anywhere.**
  - Actions: Approve (Paid to Confirmed), then Processing, Shipped, Delivered. Each change is logged with who and when. Partners cannot cancel or go backwards.

### 6.3 Admin dashboard
- **Overview:** orders today, orders awaiting approval, low-stock items, pending product changes, orders that need attention.
- **Products:** everything partners can do, plus an approval queue (approve or reject with a note), archive, mark Featured, set "Upcoming" (visible to board only).
- **Orders:** all orders, full detail including payment, discount, shipping, commission. Can cancel (and note that the refund is done manually in Flutterwave). Orders flagged `needs_attention` are listed first.
- **Shipping:** default fee, and a fee per state.
- **Discount codes:** create, pause, see use counts.
- **Updates:** write, publish, unpublish; choose public or board audience.
- **Team:** create accounts (name, email, role, temporary password), deactivate, reset password.
- **Commission report:** per order and per month, what was paid to the builder, with a CSV export.
- **Settings:** store name, WhatsApp number, Channel link, support email, approval switch, commission rate and builder subaccount.

### 6.4 Board area
Read-only. Shows products with status Upcoming (name, images, description, no buy button) and board-only updates. Nothing else.

## 7. Money, payments and the builder commission

This section is the one most likely to be built wrongly. Read `TECH_STACK.md` section 6 for the technical steps.

1. Prices are stored in kobo as integers. The browser never sends a price; the server calculates every amount from the database.
2. Order total = sum of (price x quantity) minus discount plus delivery fee.
3. The commission is **20% of the product value after discount, excluding the delivery fee**, rounded to the nearest kobo. The rate is a setting. (Decision D-3: confirm with the owner.)
4. At payment creation the server tells Flutterwave to split the payment: a fixed amount equal to the commission goes to the builder's Flutterwave subaccount; the rest stays with the Creamice account. The builder's own API keys are never used or stored.
5. Flutterwave charges its fees to the Creamice share, so the builder receives exactly the commission amount.
6. An order is marked paid only after the server verifies the transaction with Flutterwave (status successful, amount and currency match). Redirect parameters and webhook bodies alone are never trusted.
7. Each order stores a snapshot of the rate, base, commission and subaccount used, so later setting changes do not rewrite history.
8. Timing: the split happens when the payment is processed. When the money actually reaches the builder's bank follows Flutterwave's settlement schedule, so "immediately" means "automatically, with no manual step by Creamice", not "same second".
9. Refunds and cancelled paid orders are handled manually in Flutterwave. Whether the builder's commission is returned on a refund must be agreed in writing between the owner and the builder (Decision D-6).

## 8. Order lifecycle

```
pending_payment --(payment verified)--> paid --(partner approves)--> confirmed
   --> processing --> shipped --> delivered
pending_payment --(24 hours, no payment)--> cancelled   (no stock was taken)
paid / confirmed / processing --(admin only)--> cancelled
```

- Stock is taken when payment is verified, not when the cart is filled. If two customers pay for the last item, the second order is marked `needs_attention` for the admin to refund or restock.
- Webhooks can arrive twice or before the customer returns. Processing must be idempotent: handling the same payment twice changes nothing the second time.

## 9. Non-functional requirements

### Responsive and device support
- Designed mobile-first. Works from 320 px to 1920 px wide with no horizontal scrolling.
- Tested on: Android Chrome (low-end phone), iPhone Safari, desktop Chrome, Firefox, Safari and Edge.
- Touch targets at least 44 x 44 px. Forms use the right keyboard (numeric for phone, email for email).

### Performance
- Mobile Lighthouse score 90 or higher for Performance, Accessibility, Best Practices and SEO on home, listing and product pages.
- Largest Contentful Paint under 2.5 s on a throttled "Slow 4G" test.
- Product images are resized and compressed to WebP before upload (max 1600 px wide, about 150 KB each), served at the right size, lazy-loaded below the fold.
- Initial JavaScript for storefront pages kept small: no heavy UI libraries, no animation libraries.

### SEO and visibility
Unique title and description per page, Open Graph and Twitter images (so links look good on WhatsApp and Instagram), `sitemap.xml`, `robots.txt`, clean URLs (`/product/black-hoodie`), product structured data, Google Search Console and GA4 connected after launch.

### Accessibility
WCAG AA contrast (checked values are in `DESIGN_SYSTEM.md`), visible keyboard focus, labels on every input, alt text on every image, respects reduced-motion setting.

### Security and privacy
See `QA_AND_LAUNCH.md`. In short: HTTPS only, server-side validation of everything, role checks on every dashboard action, no secrets in the browser, webhook signature check, privacy policy that says what personal data is kept (name, email, phone, address) and why.

### Reliability
The free database plan has no automatic backups and pauses an inactive project after a week. Take a manual export of orders and products weekly until the project moves to a paid plan.

## 10. What the owner must supply

| Item | Needed by |
| --- | --- |
| Flutterwave business account approved for live payments (start now, verification can take days) | 20 Oct |
| Builder's Flutterwave subaccount created and its ID | 20 Oct |
| Domain name | 24 Oct |
| Product photos (consistent background), names, prices, sizes, stock for launch products | 22 Oct |
| Logo as transparent PNG or SVG (the files provided are on white or black backgrounds) | 16 Oct |
| Text for About, Delivery and Returns, FAQ, Privacy, Terms | 24 Oct |
| Shipping fee per state (or one flat fee) | 20 Oct |
| WhatsApp number and Channel link, Instagram link | 16 Oct |
| Written agreement with the builder about commission, refunds and board membership | before launch |

## 11. Success checks at launch

- A real test purchase on the live site completes, the commission appears in the builder's Flutterwave subaccount, the order shows up for partners, and the customer can track it.
- A partner account cannot see any money anywhere (checked page by page).
- Lighthouse targets met on the three key pages.
- The site is usable on a 360 px phone with one hand.

After launch, track weekly: visitors, add-to-cart rate, checkout completion rate, orders, average order value. The owner sets targets once there is a baseline; this document does not invent numbers.

## 12. Open questions

Tracked in `DECISIONS.md`.
