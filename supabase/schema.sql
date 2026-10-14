-- Creamice database schema (PostgreSQL / Supabase)
-- Run once in the Supabase SQL editor on a new project.
-- Rules this file enforces:
--   * Money is stored as integer kobo (1 naira = 100 kobo). Never floats.
--   * Row Level Security is ON for every table. The browser can only read
--     public catalogue data. Everything else goes through server code that
--     uses the service role key after checking the user's role.
--   * Partners must never see money. Money lives in order_payments and in
--     order_items.unit_price_kobo; partner queries must not select them.

-- ---------------------------------------------------------------- types
create type user_role as enum ('admin', 'partner', 'board');
create type product_status as enum ('draft', 'pending_approval', 'active', 'upcoming', 'archived');
create type order_status as enum (
  'pending_payment', 'paid', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
);
create type payment_status as enum ('initiated', 'successful', 'failed');
create type discount_type as enum ('percent', 'fixed');
create type update_audience as enum ('public', 'board');

-- ------------------------------------------------------------ helpers
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------- profiles
-- One row per staff user (admin, partner, board). Customers do not have
-- accounts at launch (guest checkout).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------- store settings
-- Exactly one row. Read and written by admin server code only.
create table store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Creamice',
  whatsapp_number text,
  whatsapp_channel_url text,
  support_email text,
  default_shipping_fee_kobo bigint not null default 0 check (default_shipping_fee_kobo >= 0),
  require_product_approval boolean not null default true,
  commission_rate numeric(5, 4) not null default 0.2000 check (commission_rate >= 0 and commission_rate <= 1),
  builder_subaccount_id text,
  updated_at timestamptz not null default now()
);
insert into store_settings default values;
create trigger store_settings_updated before update on store_settings
  for each row execute function set_updated_at();

-- -------------------------------------------------------- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ----------------------------------------------------------- products
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price_kobo bigint not null check (price_kobo >= 0),
  compare_at_price_kobo bigint check (compare_at_price_kobo is null or compare_at_price_kobo > price_kobo),
  status product_status not null default 'draft',
  is_featured boolean not null default false,
  -- Partner edits to a live product wait here until an admin approves.
  pending_changes jsonb,
  pending_submitted_by uuid references profiles (id),
  pending_submitted_at timestamptz,
  review_note text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on products (status);
create index products_category_idx on products (category_id);
create trigger products_updated before update on products
  for each row execute function set_updated_at();

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  sort_order int not null default 0
);
create index product_images_product_idx on product_images (product_id, sort_order);

-- Size (and optional colour) with its own stock count.
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  size text not null,
  color text,
  sku text unique,
  stock int not null default 0 check (stock >= 0)
);
create unique index product_variants_unique_idx
  on product_variants (product_id, size, coalesce(color, ''));

-- ----------------------------------------------------------- shipping
-- Admin sets a fee per state. A state without an active row uses
-- store_settings.default_shipping_fee_kobo.
create table shipping_rates (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  fee_kobo bigint not null check (fee_kobo >= 0),
  is_active boolean not null default true
);

-- ---------------------------------------------------------- discounts
create table discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  type discount_type not null,
  value int not null check (value > 0),
  min_subtotal_kobo bigint not null default 0 check (min_subtotal_kobo >= 0),
  max_uses int check (max_uses is null or max_uses > 0),
  used_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  check (type <> 'percent' or value <= 100)
);

-- ------------------------------------------------------------- orders
create sequence order_number_seq start 1001;

-- No money columns here, so partner views can read this table safely.
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('CRM-' || nextval('order_number_seq')),
  status order_status not null default 'pending_payment',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_state text not null,
  delivery_note text,
  -- Set when payment succeeded but stock had run out. Admin must resolve
  -- (partial refund or restock).
  needs_attention boolean not null default false,
  attention_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on orders (status, created_at desc);
create index orders_email_idx on orders (lower(customer_email));
create trigger orders_updated before update on orders
  for each row execute function set_updated_at();

-- unit_price_kobo is money: server code for partners must not select it.
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  variant_id uuid references product_variants (id) on delete set null,
  product_name text not null,
  size text not null,
  color text,
  unit_price_kobo bigint not null check (unit_price_kobo >= 0),
  quantity int not null check (quantity > 0)
);
create index order_items_order_idx on order_items (order_id);

-- All money for an order. Admin only.
create table order_payments (
  order_id uuid primary key references orders (id) on delete cascade,
  tx_ref text not null unique,
  flw_transaction_id text,
  status payment_status not null default 'initiated',
  subtotal_kobo bigint not null check (subtotal_kobo >= 0),
  discount_kobo bigint not null default 0 check (discount_kobo >= 0),
  shipping_kobo bigint not null default 0 check (shipping_kobo >= 0),
  total_kobo bigint not null check (total_kobo >= 0),
  discount_code_id uuid references discount_codes (id) on delete set null,
  -- Snapshot of the commission terms at the time of the order.
  commission_rate numeric(5, 4) not null,
  commission_base_kobo bigint not null,
  commission_kobo bigint not null,
  builder_subaccount_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index order_payments_status_idx on order_payments (status);

-- Audit trail of every status change.
create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  actor_id uuid references profiles (id),
  from_status order_status,
  to_status order_status not null,
  note text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on order_events (order_id, created_at);

-- ------------------------------------------------------------ updates
-- Announcements and drop news. This is the permanent archive that fixes
-- "new WhatsApp members cannot see old posts".
create table updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  body text not null,
  audience update_audience not null default 'public',
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index updates_published_idx on updates (audience, is_published, published_at desc);

-- ---------------------------------------------------- stock function
-- Atomically takes stock. Returns false when there is not enough.
create or replace function decrement_stock(p_variant_id uuid, p_qty int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_changed int;
begin
  update product_variants
     set stock = stock - p_qty
   where id = p_variant_id
     and stock >= p_qty;
  get diagnostics rows_changed = row_count;
  return rows_changed = 1;
end;
$$;
revoke all on function decrement_stock(uuid, int) from public, anon, authenticated;
grant execute on function decrement_stock(uuid, int) to service_role;

-- ------------------------------------------- payment confirmation
-- Called by server code ONLY after it has verified the transaction with
-- Flutterwave. Safe to call twice for the same tx_ref (idempotent).
-- Returns true when this call did the work, false when it was already done.
create or replace function mark_order_paid(p_tx_ref text, p_flw_transaction_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  pay order_payments%rowtype;
  prev_status order_status;
  item record;
  flagged boolean := false;
  note_text text := null;
begin
  select * into pay from order_payments where tx_ref = p_tx_ref for update;
  if not found then
    raise exception 'Unknown tx_ref %', p_tx_ref;
  end if;
  if pay.status = 'successful' then
    return false;
  end if;

  select status into prev_status from orders where id = pay.order_id for update;
  if prev_status <> 'pending_payment' then
    flagged := true;
    note_text := 'Payment arrived when order status was ' || prev_status || '.';
  end if;

  update order_payments
     set status = 'successful',
         flw_transaction_id = p_flw_transaction_id,
         paid_at = now()
   where order_id = pay.order_id;

  for item in
    select variant_id, quantity from order_items where order_id = pay.order_id
  loop
    if item.variant_id is null or not decrement_stock(item.variant_id, item.quantity) then
      flagged := true;
      note_text := coalesce(note_text || ' ', '') || 'Stock ran out for one or more items after payment.';
    end if;
  end loop;

  update orders
     set status = 'paid',
         needs_attention = flagged,
         attention_note = note_text
   where id = pay.order_id;

  insert into order_events (order_id, from_status, to_status, note)
  values (pay.order_id, prev_status, 'paid', 'Payment verified');

  if pay.discount_code_id is not null then
    update discount_codes set used_count = used_count + 1 where id = pay.discount_code_id;
  end if;

  return true;
end;
$$;
revoke all on function mark_order_paid(text, text) from public, anon, authenticated;
grant execute on function mark_order_paid(text, text) to service_role;

-- Cancels orders that were never paid after 24 hours. No stock is
-- involved because stock is only taken on payment. Call from the admin
-- dashboard or a scheduled job. Returns how many orders were cancelled.
create or replace function expire_unpaid_orders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  with expired as (
    update orders
       set status = 'cancelled'
     where status = 'pending_payment'
       and created_at < now() - interval '24 hours'
    returning id
  )
  insert into order_events (order_id, from_status, to_status, note)
  select id, 'pending_payment', 'cancelled', 'Expired: no payment within 24 hours'
    from expired;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function expire_unpaid_orders() from public, anon, authenticated;
grant execute on function expire_unpaid_orders() to service_role;

-- ------------------------------------------------------ row level security
alter table profiles enable row level security;
alter table store_settings enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table shipping_rates enable row level security;
alter table discount_codes enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_payments enable row level security;
alter table order_events enable row level security;
alter table updates enable row level security;

-- Public (anonymous) read access: catalogue and public updates only.
-- No policy exists for profiles, store_settings, discount_codes, orders,
-- order_items, order_payments or order_events, so the browser key cannot
-- read or write them. Server code uses the service role key, which bypasses RLS.
create policy "public reads active categories" on categories
  for select to anon, authenticated
  using (is_active);

create policy "public reads active products" on products
  for select to anon, authenticated
  using (status = 'active');

create policy "public reads images of active products" on product_images
  for select to anon, authenticated
  using (exists (
    select 1 from products p where p.id = product_images.product_id and p.status = 'active'
  ));

create policy "public reads variants of active products" on product_variants
  for select to anon, authenticated
  using (exists (
    select 1 from products p where p.id = product_variants.product_id and p.status = 'active'
  ));

create policy "public reads active shipping rates" on shipping_rates
  for select to anon, authenticated
  using (is_active);

create policy "public reads published public updates" on updates
  for select to anon, authenticated
  using (audience = 'public' and is_published);

-- ------------------------------------------------------- storage notes
-- Create one PUBLIC bucket named "product-images" in the Supabase dashboard.
-- Uploads happen through server code (service role). Do not add an
-- anonymous upload policy.
