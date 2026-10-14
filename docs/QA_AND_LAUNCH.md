# Creamice: Testing, Security and Launch Checklist

Use test mode until section 6. Tick each line; write failures in `PROGRESS.md`.

## 1. Device and layout checks
Test at widths 320, 360, 390, 768, 1024, 1440.
- [ ] Android Chrome on a real, ordinary phone
- [ ] iPhone Safari
- [ ] Desktop Chrome, Firefox, Safari, Edge
- [ ] No horizontal scrolling on any page
- [ ] Menu, cart, filter sheet open and close with touch, keyboard and Escape
- [ ] Forms show the right keyboard (email, number) and do not zoom the page on iPhone (inputs 16 px)
- [ ] Browser throttled to "Slow 4G": home page usable in under 3 seconds
- [ ] Dashboards usable on a phone; tables show as cards
- [ ] Naira sign renders correctly in both fonts

## 2. Customer flow
- [ ] Home to product in three taps or fewer
- [ ] Search finds a product by name and by category; zero results handled
- [ ] Filters and sort work and the URL can be shared
- [ ] Sold-out size cannot be selected; fully sold-out product shows "Sold out"
- [ ] Cart survives page reload; quantity change and remove work
- [ ] Price changed by admin after item was added: customer sees the new price before paying
- [ ] Checkout validation messages are clear; state changes the delivery fee
- [ ] Order confirmation shows the real status; `/track` needs both order number and matching email
- [ ] Unknown product URL shows the branded 404

## 3. Payments (Flutterwave test mode)
- [ ] Successful payment: order becomes Paid, stock decreases, order appears for partners
- [ ] Failed payment: order stays Pending payment, no stock change
- [ ] Customer closes the tab after paying: webhook still marks the order Paid
- [ ] Same webhook delivered twice: stock decreases once, discount counted once
- [ ] Return page and webhook both arrive: no double processing
- [ ] Edited redirect URL (`status=successful` forced, wrong `transaction_id`): order is NOT marked paid
- [ ] Wrong amount: not accepted
- [ ] Webhook with a wrong or missing signature: rejected with 401
- [ ] Last item bought by two people: the second order is flagged "needs attention"
- [ ] Split: the subaccount shows the exact commission amount for each test payment, including one over 10,000 NGN
- [ ] Commission with a discount code equals 20 percent of (subtotal minus discount), excluding delivery
- [ ] Unpaid order older than 24 hours is cancelled by `expire_unpaid_orders`
- [ ] Late payment on an expired order: recorded and flagged for admin

## 4. Security
Roles and data:
- [ ] Not logged in: every `/dashboard` URL redirects to login
- [ ] Partner opens an admin URL typed by hand: refused
- [ ] Board member opens partner or admin URLs: refused
- [ ] Partner order pages and their network responses contain no prices, totals, payments or commission (check the browser Network tab, not just the screen)
- [ ] Deactivated user is refused even with an old session
- [ ] Using only the public anon key (for example with the Supabase REST URL), reading `orders`, `order_items`, `order_payments`, `profiles`, `store_settings`, `discount_codes` returns nothing; writing to any table fails
- [ ] Draft, pending, upcoming and archived products are not readable with the anon key
- [ ] `/track` with someone else's order number and a wrong email shows nothing

Secrets and requests:
- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `FLW_SECRET_KEY`, `FLW_SECRET_HASH` appear nowhere in the browser bundle (search the built JavaScript) or in git history
- [ ] `.env.local` is in `.gitignore`
- [ ] Prices, stock and totals are recalculated on the server (try sending a changed price in the checkout request: ignored)
- [ ] All inputs validated with zod on the server; very long strings and odd characters are handled
- [ ] Image upload: size and type checked on the server, not only the browser
- [ ] Security headers set (`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, a Content Security Policy that allows Flutterwave, Supabase and GA4)
- [ ] Admin account has a strong unique password; two-factor turned on if available
- [ ] Error pages and logs never print secrets or full payment payloads
- [ ] Privacy policy states what is collected (name, email, phone, address, order history) and why

## 5. Quality gates
- [ ] Lighthouse mobile at least 90 for Performance, Accessibility, Best Practices, SEO on home, listing, product
- [ ] LCP under 2.5 s on Slow 4G
- [ ] Every image has alt text and explicit dimensions or aspect ratio
- [ ] Keyboard-only walkthrough of home, product, cart, checkout works with visible focus
- [ ] Text contrast follows `DESIGN_SYSTEM.md`
- [ ] Link preview in WhatsApp shows a title, description and image for home and a product
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass

## 6. Go-live (27 to 28 October)
Order matters.
1. [ ] Hosting decision made and the plan terms allow a commercial store (TECH_STACK section 2)
2. [ ] `creamice-prod` Supabase project created; `schema.sql` run; bucket created; categories and shipping rows seeded; first admin created
3. [ ] Production environment variables set on the host (live Flutterwave secret key, production Supabase keys, `NEXT_PUBLIC_SITE_URL` with the real domain)
4. [ ] Domain connected, HTTPS working, `www` and non-`www` redirect to one address
5. [ ] In Flutterwave: webhook URL set to `https://<domain>/api/webhooks/flutterwave`, secret hash matches `FLW_SECRET_HASH`, live mode on
6. [ ] Admin Settings filled in: WhatsApp number, Channel link, support email, commission 20 percent, builder subaccount ID, shipping fees
7. [ ] Real products entered and approved; partner accounts created
8. [ ] Real purchase of the cheapest item with a real card. Verify: order Paid, partner sees it, builder subaccount receives the commission, tracking page works. Then refund the test purchase in Flutterwave and cancel the order.
9. [ ] Sitemap submitted to Google Search Console; GA4 receiving events
10. [ ] Weekly backup reminder set
11. [ ] Announce on the WhatsApp Channel and group, Instagram bio link updated

## 7. Rolling back
- Keep the previous deployment available on the host; redeploying it restores the old site within minutes.
- Database changes are additive migrations only; never drop columns in the first month.
- If payments misbehave: pause checkout by setting a "store closed" banner (admin setting) and fix; never ask customers to pay outside Flutterwave.

## 8. First week after launch
- [ ] Check Flutterwave dashboard against the admin Commission report daily
- [ ] Look at Supabase usage (database size, storage, egress) against the free limits every few days
- [ ] Take the first weekly backup
- [ ] Read GA4 and Search Console; fix any pages not indexed
- [ ] Review every order marked "needs attention"
- [ ] Write down what customers ask on WhatsApp; add the repeated ones to the FAQ
