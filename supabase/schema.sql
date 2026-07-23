-- ============================================
-- MunkavédelmiShop - Supabase séma (v1)
-- Futtatás: Supabase Dashboard → SQL Editor → New query → beillesztés → Run
-- ============================================

-- Kulcs-érték tár: a storage.js kollekciói (termék-módosítások, custom termékek,
-- készlet-történet, blog, beszállító értesítések) egy-egy jsonb dokumentumként
create table if not exists kv_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Rendelések: soronként, hogy két egyidejű vevő ne írja felül egymást
create table if not exists orders (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- Row Level Security
-- Az anon kulcs CSAK a publikus kulcsokat olvashatja, írni semmit nem tud.
-- Minden írás a Netlify Functions-ön keresztül megy (service_role kulccsal,
-- ami megkerüli az RLS-t): place-order.js (vevő) és admin-api.js (admin).
-- ============================================

alter table kv_store enable row level security;
alter table orders enable row level security;

drop policy if exists "public kv read" on kv_store;
create policy "public kv read" on kv_store
  for select
  using (key in ('ms_product_overrides', 'ms_custom_products', 'ms_blog_posts'));

-- Az orders táblára szándékosan NINCS anon policy: se olvasás, se írás.
