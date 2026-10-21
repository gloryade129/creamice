# Creamice: Decisions and Open Questions

Status: **Decided** (owner said so), **Assumed** (I chose a default; owner please confirm or change), **Open** (needs an answer).

| ID | Topic | Status | Detail |
| --- | --- | --- | --- |
| D-1 | Hosting for the live store | **Open** | Vercel Hobby is non-commercial only. Choose paid Vercel, a free host that permits commercial use, or accept the risk. Needed by 24 Oct. See `TECH_STACK.md` section 2. |
| D-2 | Domain name | **Open** | Needed by 24 Oct. Paid yearly. |
| D-3 | Commission base | **Assumed** | 20 percent of product value after discount, excluding delivery fee. Owner said "20% per sale"; confirm whether delivery is included. |
| D-4 | Who pays Flutterwave's fee | **Assumed** | Creamice. The builder gets exactly the commission (fixed-amount split). |
| D-5 | Customer accounts | **Decided** | Customer accounts are in the launch build, and guest checkout stays. An account is optional; it adds saved addresses and order history to the same checkout. |
| D-6 | Commission on refunds and cancellations | **Open** | Agree in writing with the builder whether commission is returned. Refunds are manual in Flutterwave. |
| D-7 | Approval rules | **Assumed** | With approval on: new products, and edits to name, price, description, images, category need admin approval. Stock edits apply immediately. Admin can switch approval off in Settings. |
| D-8 | When stock is taken | **Assumed** | On verified payment, not when added to cart. The last item can be oversold; those orders are flagged for admin. |
| D-9 | Payment timing for the builder | **Decided with a caveat** | Split is automatic at payment time. Money reaches the builder's bank on Flutterwave's settlement schedule, not instantly. |
| D-10 | Builder as board member | **Decided** | Board is a read-only role giving early sight of upcoming drops and board-only updates. One builder at launch. Wear giveaways are handled outside the website. |
| D-11 | Unpaid orders | **Assumed** | Cancelled automatically after 24 hours. |
| D-12 | WhatsApp community fix | **Decided** | WhatsApp Channel plus website `/updates` archive. I could not verify how long a Channel keeps old posts for new followers, so test with a second phone (task O-9). The website archive is the permanent record either way. |
| D-13 | Contact method | **Assumed** | WhatsApp number and email on a Contact page. No contact form at launch. |
| D-14 | Customer notifications | **Decided** | Brevo transactional email: a receipt to the customer and a new-order alert to the seller when a payment is verified. The on-screen confirmation and order page stay the source of truth, so a failed email never hides a paid order. |
| D-15 | Shipping | **Decided** | Nigeria only. Admin configures fees (default plus per state). |
| D-16 | Staff accounts | **Decided** | Created by admin; no public sign-up. |
| D-17 | Partners see customer phone and address | **Assumed** | Needed to fulfil orders. Partners must never see money. |
| D-18 | Tech stack | **Decided** | Next.js, Supabase, Flutterwave, built with Kilo Code. |
| D-19 | Launch date | **Decided** | 28 October 2026. |
| D-20 | Customer data model | **Decided** | Customers live in `customers` and `customer_addresses`, linked to `auth.users`, not in the staff `profiles` table. A customer never gets a staff role by signing up. Order history is read by the confirmed email on the account. |
| D-21 | Guest order links | **Decided** | `/track` exchanges order number plus email for a short private link. The link carries an HMAC token derived from the order number and `ORDER_LINK_SECRET`; the service role key is the fallback secret. Signed-in customers with a confirmed email can also open their own orders without a token. |
| D-22 | Email confirmation | **Decided** | Supabase Auth "Confirm email" must stay on. Order history and token-free order access depend on a confirmed email, so turning it off would let someone claim another person's guest orders. |
| D-23 | Payment email failures | **Decided** | Emails are best-effort after `mark_order_paid`. A Brevo failure is logged, the webhook still returns 200, and the paid order and order page remain authoritative. |

## Questions for the owner
1. Shipping: one flat fee, or different fees by state? What delivery time should the site promise?
2. Which payment methods should Flutterwave offer (card, bank transfer, USSD)? This is set in the Flutterwave dashboard.
3. Return and exchange policy: allowed? within how many days? who pays shipping?
4. Do you want the product sizes to be S to XXL for everything, or different per product?
5. Do you need a "Size guide" page at launch?
6. What exact text goes in the hero banner and brand statement on the home page?
7. Instagram and any other social links to show in the footer.
8. Flutterwave: is business verification complete, is the builder subaccount created, and can you supply test then live `FLW_SECRET_KEY` and `FLW_SECRET_HASH`? No real payment can be run until then.
9. Brevo: please supply `BREVO_API_KEY` and a verified sender address, and approve using Brevo SMTP for Supabase confirmation emails. Until then, order emails and sign-up confirmation cannot be delivered.
10. Customer accounts need `supabase/migrations/001_customer_accounts.sql` run in the Supabase SQL editor, plus Supabase Auth "Confirm email" kept on. Please run it or provide a database password so it can be applied.
