# Creamice: Database

The source of truth is `supabase/schema.sql`. This file explains it. Run the SQL once in the Supabase SQL editor of each project (dev and prod). Later changes go in numbered files in `supabase/migrations/` (`0002_...sql`) and are never edited after they have run in production.

## 1. Rules

- Money is an integer number of **kobo** (1 naira = 100 kobo). Convert to naira only for display and for Flutterwave.
- Row Level Security is on for every table. The browser's anon key can read only public catalogue data and public updates. All other access is server-side with the service role key, after a role check.
- Partners never see money. Money lives in `order_payments` and in `order_items.unit_price_kobo`. `orders` and `order_items` (without the price column) are what partner code reads.
- Order status changes are recorded in `order_events`.

## 2. Tables

| Table | Purpose | Who reads it (through server code) |
| --- | --- | --- |
| `profiles` | Staff users and their role | Admin; each user reads their own |
| `store_settings` | One row: store details, default shipping fee, approval switch, commission rate, builder subaccount ID | Admin writes; public parts (WhatsApp links) read by server for pages |
| `categories` | Hoodies, Joggers, etc. | Public |
| `products` | Name, slug, description, price, status, featured, pending changes | Public sees `active`; partner and admin see all; board sees `upcoming` |
| `product_images` | Image paths and alt text | Same as products |
| `product_variants` | Size, optional colour, stock | Same as products |
| `shipping_rates` | Delivery fee per state | Public (for checkout), admin writes |
| `discount_codes` | Percent or fixed codes with limits | Admin; checkout validates server-side |
| `orders` | Customer, delivery details, status. No money. | Admin, partner, customer by number plus email |
| `order_items` | Items with price snapshot | Admin (with price); partner (without price) |
| `order_payments` | Totals, discount, shipping, commission snapshot, Flutterwave references | Admin only |
| `order_events` | Status history | Admin, partner |
| `updates` | Announcements archive | Public (`public` audience), board (`board`), admin writes |

## 3. Product status values

| Status | Meaning | Visible to |
| --- | --- | --- |
| `draft` | Being prepared | Creator, admin |
| `pending_approval` | New product waiting for admin | Partner, admin |
| `active` | Live and buyable | Everyone |
| `upcoming` | Announced but not buyable | Board, partner, admin |
| `archived` | Removed from the shop | Admin |

Edits to an `active` product by a partner (while `require_product_approval` is on) are written to `pending_changes` as JSON, for example `{"name": "...", "price_kobo": 2500000}`. The live columns do not change until admin approves, which copies the JSON into the columns and clears it. Rejecting clears it and stores `review_note`.

## 4. Order status values and who may set them

| From | To | By |
| --- | --- | --- |
| (created) | `pending_payment` | System at checkout |
| `pending_payment` | `paid` | System, via `mark_order_paid` after Flutterwave verification |
| `paid` | `confirmed` | Partner or admin |
| `confirmed` | `processing` | Partner or admin |
| `processing` | `shipped` | Partner or admin |
| `shipped` | `delivered` | Partner or admin |
| `paid`, `confirmed`, `processing` | `cancelled` | Admin only |
| `pending_payment` | `cancelled` | System after 24 hours (`expire_unpaid_orders`) or admin |

Implement these rules once in `lib/orders.ts` and test them. Partners cannot skip or reverse steps.

## 5. Database functions

| Function | Use |
| --- | --- |
| `decrement_stock(variant_id, qty)` | Atomic stock decrease, returns false if not enough. Used by `mark_order_paid`. |
| `mark_order_paid(tx_ref, flw_transaction_id)` | Idempotent payment completion: marks payment successful, takes stock, sets the order to `paid`, counts the discount use, writes the event. If stock ran out or the order was already cancelled, it still records the payment and sets `needs_attention` for admin. Returns true the first time, false on repeats. |
| `expire_unpaid_orders()` | Cancels unpaid orders older than 24 hours. Call from an admin button or a scheduled job. |

All three are callable only by the service role.

## 6. Starting data (seed)

- `categories`: Hoodies, Sweatshirts, Joggers, Sweatpants, Jorts, Sweaters.
- `shipping_rates`: one row for each of the 36 states and the FCT, all set to the default fee until admin edits them. (The owner said admin will configure fees.)
- `store_settings`: leave `commission_rate` at 0.2000. Leave `builder_subaccount_id` empty until the owner has it.
- Create the first admin by hand: add the user in Supabase Auth, then insert a `profiles` row with role `admin`.
- Sizes used by default: S, M, L, XL, XXL (partners can add others).

## 7. Weekly backup (free plan has none)

Until the project moves to a paid plan, export `orders`, `order_items`, `order_payments`, `products`, `product_variants`, `discount_codes`, `updates` as CSV from the Supabase dashboard every week and store them somewhere other than the repo. Also keep the Flutterwave transaction export.
