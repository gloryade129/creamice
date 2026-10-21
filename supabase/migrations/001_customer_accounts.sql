-- Customer accounts. Run this once in the Supabase SQL editor after
-- schema.sql. Guest checkout does not depend on it, but `/account`,
-- saved addresses and signed-in order history do.
--
-- RLS stays on with no policies: the browser never reads these tables.
-- Server code checks the Supabase session and then uses the service role.

create table if not exists customers (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists customers_email_idx on customers (lower(email));
drop trigger if exists customers_updated on customers;
create trigger customers_updated before update on customers
  for each row execute function set_updated_at();

create table if not exists customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists customer_addresses_customer_idx
  on customer_addresses (customer_id, created_at);

alter table customers enable row level security;
alter table customer_addresses enable row level security;

-- Nullable: guest orders keep working, and orders placed before a customer
-- signed in can be linked later if the owner chooses to.
alter table orders
  add column if not exists customer_id uuid references customers (id) on delete set null;
create index if not exists orders_customer_idx on orders (customer_id, created_at desc);

-- Only one default address per customer.
create unique index if not exists customer_addresses_one_default_idx
  on customer_addresses (customer_id)
  where is_default;
