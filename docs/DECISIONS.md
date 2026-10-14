# Creamice: Decisions and Open Questions

Status: **Decided** (owner said so), **Assumed** (I chose a default; owner please confirm or change), **Open** (needs an answer).

| ID | Topic | Status | Detail |
| --- | --- | --- | --- |
| D-1 | Hosting for the live store | **Open** | Vercel Hobby is non-commercial only. Choose paid Vercel, a free host that permits commercial use, or accept the risk. Needed by 24 Oct. See `TECH_STACK.md` section 2. |
| D-2 | Domain name | **Open** | Needed by 24 Oct. Paid yearly. |
| D-3 | Commission base | **Assumed** | 20 percent of product value after discount, excluding delivery fee. Owner said "20% per sale"; confirm whether delivery is included. |
| D-4 | Who pays Flutterwave's fee | **Assumed** | Creamice. The builder gets exactly the commission (fixed-amount split). |
| D-5 | Customer accounts | **Assumed** | Guest checkout only at launch; tracking by order number plus email. Accounts are post-launch. |
| D-6 | Commission on refunds and cancellations | **Open** | Agree in writing with the builder whether commission is returned. Refunds are manual in Flutterwave. |
| D-7 | Approval rules | **Assumed** | With approval on: new products, and edits to name, price, description, images, category need admin approval. Stock edits apply immediately. Admin can switch approval off in Settings. |
| D-8 | When stock is taken | **Assumed** | On verified payment, not when added to cart. The last item can be oversold; those orders are flagged for admin. |
| D-9 | Payment timing for the builder | **Decided with a caveat** | Split is automatic at payment time. Money reaches the builder's bank on Flutterwave's settlement schedule, not instantly. |
| D-10 | Builder as board member | **Decided** | Board is a read-only role giving early sight of upcoming drops and board-only updates. One builder at launch. Wear giveaways are handled outside the website. |
| D-11 | Unpaid orders | **Assumed** | Cancelled automatically after 24 hours. |
| D-12 | WhatsApp community fix | **Decided** | WhatsApp Channel plus website `/updates` archive. I could not verify how long a Channel keeps old posts for new followers, so test with a second phone (task O-9). The website archive is the permanent record either way. |
| D-13 | Contact method | **Assumed** | WhatsApp number and email on a Contact page. No contact form at launch. |
| D-14 | Customer notifications | **Assumed** | On-screen confirmation and tracking page at launch. Email only if a domain is ready (P1). |
| D-15 | Shipping | **Decided** | Nigeria only. Admin configures fees (default plus per state). |
| D-16 | Staff accounts | **Decided** | Created by admin; no public sign-up. |
| D-17 | Partners see customer phone and address | **Assumed** | Needed to fulfil orders. Partners must never see money. |
| D-18 | Tech stack | **Decided** | Next.js, Supabase, Flutterwave, built with Kilo Code. |
| D-19 | Launch date | **Decided** | 28 October 2026. |

## Questions for the owner
1. Shipping: one flat fee, or different fees by state? What delivery time should the site promise?
2. Which payment methods should Flutterwave offer (card, bank transfer, USSD)? This is set in the Flutterwave dashboard.
3. Return and exchange policy: allowed? within how many days? who pays shipping?
4. Do you want the product sizes to be S to XXL for everything, or different per product?
5. Do you need a "Size guide" page at launch?
6. What exact text goes in the hero banner and brand statement on the home page?
7. Instagram and any other social links to show in the footer.
