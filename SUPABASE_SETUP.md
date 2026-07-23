# Supabase backend — beüzemelési útmutató

## Mi ez?

A v6.4-től az admin adatok (termék-módosítások, készlet, rendelések, blog) közös
Supabase adatbázisba kerülnek, így **bármelyik gépről ugyanazt látod**. Ha a
Supabase env változók nincsenek beállítva, az app a régi localStorage módban fut.

## Architektúra

- **Olvasás (publikus):** a kliens anon kulccsal olvassa a termék-módosításokat,
  custom termékeket és blogot (`kv_store` tábla, RLS-sel védve).
- **Rendelés leadás:** `place-order` Netlify Function — szerver-oldalon fut a
  FIFO készletcsökkentés, számlaszám-generálás és beszállító-értesítés.
- **Admin műveletek:** `admin-api` Netlify Function — jelszó-ellenőrzés után
  service_role kulccsal ír. Az admin jelszó NINCS benne a kliens bundle-ben.
- **Böngésző-lokális maradt:** kedvencek (wishlist), termék-nézettség.

## Beüzemelés (egyszeri)

### 1. SQL séma futtatása
Supabase Dashboard → **SQL Editor** → New query → másold be a
[`supabase/schema.sql`](supabase/schema.sql) teljes tartalmát → **Run**.

### 2. Netlify környezeti változók
Netlify Dashboard → Site settings → **Environment variables** → add hozzá:

| Változó | Érték |
|---|---|
| `REACT_APP_SUPABASE_URL` | `https://igyuadlwlzoeefhgbsrq.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | `sb_publishable_...` (publishable kulcs) |
| `SUPABASE_URL` | `https://igyuadlwlzoeefhgbsrq.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `sb_secret_...` (⚠️ TITKOS — Dashboard → API keys) |
| `ADMIN_PASSWORD` | az admin panel jelszava (⚠️ ne admin123 maradjon!) |

Majd **Deploys → Trigger deploy**, hogy az új env-ekkel épüljön.

### 3. Lokális fejlesztés
A `.env`-ben ugyanezek kellenek. A Functions lokálisan `netlify dev`-vel futnak
(`npm install -g netlify-cli`), sima `npm start` mellett a rendelés-mentés és az
admin írás nem működik (a publikus olvasás igen).

## Adatmodell

- `kv_store (key, value jsonb)` — kollekciónként egy dokumentum:
  `ms_product_overrides`, `ms_custom_products`, `ms_stock_history`,
  `ms_blog_posts`, `ms_supplier_notifications`
- `orders (id, data jsonb, created_at)` — rendelésenként egy sor

## Ismert korlátok (v1)

- A localStorage-ban lévő KORÁBBI admin adatok nem migrálódnak automatikusan.
- A riportok/statisztikák az app-indításkor betöltött cache-ből számolnak;
  frissítéshez oldal-újratöltés kell az admin panelen.
