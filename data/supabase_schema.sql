-- =====================================================================
-- BRAND COLLECTION — SUPABASE DATABASE SETUP (free tier)
-- How to use: Supabase dashboard > SQL Editor > New query >
-- paste this whole file > click RUN. It is safe to run more than once.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. ADMIN EMAILS
-- Only people whose (confirmed) login email is in this list are admins.
-- Change the email below if your admin email is different.
-- ---------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key
);
insert into public.admin_emails(email) values ('mabbasansaari77@gmail.com')
on conflict do nothing;
alter table public.admin_emails enable row level security;
-- (no policies = nobody can read or change it from the website)

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select exists (
    select 1 from auth.users u
    join public.admin_emails a on lower(a.email) = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. CUSTOMER PROFILES (one row per customer account)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  city text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id,
          left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120),
          left(coalesce(new.raw_user_meta_data->>'phone', ''), 30))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. PRODUCTS
-- Main fields are real columns (used for prices/stock checks).
-- Everything else (images, sizes, colors, description...) lives in "data".
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  slug text unique,
  name text not null,
  category text not null default 'men',
  price numeric not null check (price >= 0),
  sale_price numeric check (sale_price is null or sale_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists "products: public read" on public.products;
create policy "products: public read" on public.products
  for select using (is_active or public.is_admin());
drop policy if exists "products: admin write" on public.products;
create policy "products: admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. COUPONS (checked on the server at checkout)
-- ---------------------------------------------------------------------
create table if not exists public.coupons (
  code text primary key,
  discount_percent numeric,
  discount_amount numeric,
  free_shipping boolean not null default false,
  min_spend numeric not null default 0,
  active boolean not null default true
);
alter table public.coupons enable row level security;
drop policy if exists "coupons: public read active" on public.coupons;
create policy "coupons: public read active" on public.coupons
  for select using (active or public.is_admin());
drop policy if exists "coupons: admin write" on public.coupons;
create policy "coupons: admin write" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.coupons(code, discount_percent, discount_amount, free_shipping, min_spend) values
  ('NEO10', 10, null, false, 5000),
  ('FIRSTDROP', null, 1000, false, 8000),
  ('FREESHIP', null, null, true, 3000)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 5. STORE SETTINGS (banners, shipping, public = everyone can read; admin = private)
-- ---------------------------------------------------------------------
create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.store_settings enable row level security;
drop policy if exists "settings: public read" on public.store_settings;
create policy "settings: public read" on public.store_settings
  for select using (key in ('banners', 'shipping', 'public') or public.is_admin());
drop policy if exists "settings: admin write" on public.store_settings;
create policy "settings: admin write" on public.store_settings
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.store_settings(key, value) values
  ('shipping', '{"freeShippingThreshold":5000,"standardShippingFee":250,"codHandlingFee":150}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 6. ORDERS
-- Customers can NOT insert directly. Orders are created only through the
-- place_order() function below, which re-checks prices and stock.
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  city text not null,
  address text not null,
  notes text,
  items jsonb not null,
  subtotal numeric not null,
  shipping_fee numeric not null default 0,
  cod_fee numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null,
  coupon_code text,
  payment_method text not null default 'cod',
  status text not null default 'Order Placed & Verified',
  courier text default 'TCS Express Pakistan',
  tracking_number text,
  estimated_delivery text default '3-4 Business Days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_created_idx on public.orders(created_at desc);
alter table public.orders enable row level security;

-- remove the old unsafe policy from the first version (it let anyone read all orders)
drop policy if exists "Public can track their order" on public.orders;
drop policy if exists "Public can submit customer checkout orders" on public.orders;

drop policy if exists "orders: read own or admin" on public.orders;
create policy "orders: read own or admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders: admin update" on public.orders;
create policy "orders: admin update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders: admin insert" on public.orders;
create policy "orders: admin insert" on public.orders
  for insert with check (public.is_admin());
drop policy if exists "orders: admin delete" on public.orders;
create policy "orders: admin delete" on public.orders
  for delete using (public.is_admin());

-- Removes characters that could be used to inject code into the admin panel
create or replace function public.clean_text(t text, max_len int)
returns text language sql immutable as $$
  select left(trim(regexp_replace(coalesce(t, ''), '[<>"`''\\]|&#|javascript:', '', 'gi')), max_len);
$$;

-- Place an order safely (prices come from the database, not the browser)
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_items jsonb := '[]'::jsonb;
  v_item jsonb;
  v_prod public.products%rowtype;
  v_qty int;
  v_unit numeric;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_shipping numeric;
  v_cod numeric := 0;
  v_total numeric;
  v_ship jsonb;
  v_coupon public.coupons%rowtype;
  v_code text := upper(nullif(trim(payload->>'couponCode'), ''));
  v_pay text := coalesce(nullif(payload->>'paymentMethod', ''), 'cod');
  v_order_id text;
  v_name text := public.clean_text(payload->>'customerName', 120);
  v_phone text := public.clean_text(payload->>'phone', 30);
  v_city text := public.clean_text(payload->>'city', 60);
  v_address text := public.clean_text(payload->>'address', 400);
  v_count int := 0;
begin
  if length(v_name) < 2 or length(v_phone) < 7 or length(v_city) < 2 or length(v_address) < 5 then
    raise exception 'MISSING_DETAILS';
  end if;
  if v_pay not in ('cod', 'bank') then v_pay := 'cod'; end if;
  -- simple spam protection: max 3 orders per phone number in 10 minutes
  if (select count(*) from public.orders
      where right(regexp_replace(phone, '\D', '', 'g'), 10) = right(regexp_replace(v_phone, '\D', '', 'g'), 10)
        and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'TOO_MANY_ORDERS';
  end if;
  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(payload->'items') > 30 then
    raise exception 'TOO_MANY_ITEMS';
  end if;

  for v_item in select * from jsonb_array_elements(payload->'items') loop
    v_qty := greatest(1, least(20, coalesce((v_item->>'qty')::int, 1)));
    select * into v_prod from public.products
      where id = coalesce(v_item->>'productId', v_item->>'id') and is_active
      for update;
    if not found then
      raise exception 'PRODUCT_NOT_FOUND:%', coalesce(v_item->>'name', v_item->>'id');
    end if;
    if v_prod.stock < v_qty then
      raise exception 'OUT_OF_STOCK:%', v_prod.name;
    end if;
    v_unit := coalesce(v_prod.sale_price, v_prod.price);
    v_subtotal := v_subtotal + v_unit * v_qty;
    update public.products set stock = stock - v_qty, updated_at = now() where id = v_prod.id;
    v_items := v_items || jsonb_build_object(
      'id', v_prod.id, 'productId', v_prod.id, 'name', v_prod.name,
      'price', v_unit, 'qty', v_qty,
      'size', public.clean_text(v_item->>'size', 20),
      'color', public.clean_text(v_item->>'color', 60),
      'image', coalesce(v_prod.data->>'image', '')
    );
  end loop;

  select value into v_ship from public.store_settings where key = 'shipping';
  v_ship := coalesce(v_ship, '{"freeShippingThreshold":5000,"standardShippingFee":250,"codHandlingFee":150}');
  v_shipping := case when v_subtotal >= (v_ship->>'freeShippingThreshold')::numeric then 0
                     else (v_ship->>'standardShippingFee')::numeric end;

  if v_code is not null then
    select * into v_coupon from public.coupons where code = v_code and active;
    if found and v_subtotal >= v_coupon.min_spend then
      if v_coupon.discount_percent is not null then
        v_discount := round(v_subtotal * v_coupon.discount_percent / 100);
      elsif v_coupon.discount_amount is not null then
        v_discount := least(v_coupon.discount_amount, v_subtotal);
      end if;
      if v_coupon.free_shipping then v_shipping := 0; end if;
    else
      v_code := null;
    end if;
  end if;

  if v_pay = 'cod' then v_cod := (v_ship->>'codHandlingFee')::numeric; end if;
  v_total := greatest(0, v_subtotal - v_discount + v_shipping + v_cod);

  loop
    v_order_id := 'BC-' || (100000 + floor(random() * 900000))::int;
    exit when not exists (select 1 from public.orders where order_id = v_order_id);
    v_count := v_count + 1;
    if v_count > 20 then raise exception 'ORDER_ID_FAILED'; end if;
  end loop;

  insert into public.orders(order_id, user_id, customer_name, phone, email, city, address, notes,
    items, subtotal, shipping_fee, cod_fee, discount, total, coupon_code, payment_method,
    status, courier, tracking_number, estimated_delivery)
  values (v_order_id, auth.uid(), v_name, v_phone,
    nullif(public.clean_text(payload->>'email', 160), ''), v_city, v_address,
    nullif(public.clean_text(payload->>'notes', 400), ''),
    v_items, v_subtotal, v_shipping, v_cod, v_discount, v_total, v_code, v_pay,
    'Order Placed & Verified', 'TCS Express Pakistan', null, '3-4 Business Days');

  return jsonb_build_object(
    'orderId', v_order_id, 'date', to_char(now(), 'YYYY-MM-DD'),
    'customerName', v_name, 'phone', v_phone, 'city', v_city, 'address', v_address,
    'email', nullif(public.clean_text(payload->>'email', 160), ''), 'items', v_items, 'subtotal', v_subtotal,
    'shippingFee', v_shipping, 'codFee', v_cod, 'discount', v_discount, 'total', v_total,
    'paymentMethod', v_pay, 'status', 'Order Placed & Verified',
    'courier', 'TCS Express Pakistan', 'trackingNumber', null,
    'estimatedDelivery', '3-4 Business Days');
end;
$$;
revoke all on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- Track an order: needs order ID + the phone number used at checkout.
-- Returns only delivery info, never other customers' data.
create or replace function public.track_order(p_order_id text, p_phone text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'orderId', o.order_id, 'date', to_char(o.created_at, 'YYYY-MM-DD'),
    'customerName', split_part(o.customer_name, ' ', 1), 'city', o.city,
    'items', o.items, 'subtotal', o.subtotal, 'shippingFee', o.shipping_fee,
    'codFee', o.cod_fee, 'discount', o.discount, 'total', o.total,
    'paymentMethod', o.payment_method, 'status', o.status, 'courier', o.courier,
    'trackingNumber', o.tracking_number, 'estimatedDelivery', o.estimated_delivery)
  from public.orders o
  where o.order_id = upper(trim(p_order_id))
    and right(regexp_replace(o.phone, '\D', '', 'g'), 10) = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)
    and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 7
  limit 1;
$$;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. CONTACT MESSAGES & NEWSLETTER (anyone can send, only admin can read)
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text check (length(name) <= 120),
  email text check (length(email) <= 160),
  phone text check (length(phone) <= 30),
  subject text check (length(subject) <= 200),
  message text not null check (length(message) between 1 and 3000),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
drop policy if exists "messages: anyone can send" on public.messages;
create policy "messages: anyone can send" on public.messages for insert with check (true);
drop policy if exists "messages: admin read" on public.messages;
create policy "messages: admin read" on public.messages for select using (public.is_admin());

create table if not exists public.subscribers (
  email text primary key check (length(email) between 5 and 160),
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
drop policy if exists "subscribers: anyone can join" on public.subscribers;
create policy "subscribers: anyone can join" on public.subscribers for insert with check (true);
drop policy if exists "subscribers: admin read" on public.subscribers;
create policy "subscribers: admin read" on public.subscribers for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- 8. PRODUCT PHOTO STORAGE (1 GB free). Public can view, only admin uploads.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "images: public read" on storage.objects;
create policy "images: public read" on storage.objects
  for select using (bucket_id = 'product-images');
drop policy if exists "images: admin upload" on storage.objects;
create policy "images: admin upload" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "images: admin update" on storage.objects;
create policy "images: admin update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "images: admin delete" on storage.objects;
create policy "images: admin delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());


-- ---------------------------------------------------------------------
-- 9. ACCESS FOR THE WEBSITE (row level security above still applies)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.products, public.coupons, public.store_settings to anon, authenticated;
grant insert, update, delete on public.products, public.coupons, public.store_settings to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant insert on public.messages, public.subscribers to anon, authenticated;
grant select on public.messages, public.subscribers to authenticated;
revoke all on public.admin_emails from anon, authenticated;

-- Done. Next: sign up on your website's Account page (account.html) with the
-- admin email above and confirm the email. Then open the admin panel in the
-- same browser. If the products table is empty, your current products are
-- uploaded automatically the first time you open the admin panel.
