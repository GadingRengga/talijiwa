-- Reusable access codes (credential-style) + per-tier prices + fixed theme codes.
--
-- Login contract change: codes are NO LONGER single-use. `redeem_access_code`
-- stays for backwards compatibility, but new logins validate via
-- `validate_access_code` which never deactivates. The admin keeps every code
-- attached to its order, so a forgotten code is recovered from OrderDetail.

-- 1. Track last usage without deactivating.
alter table access_codes add column if not exists last_used_at timestamptz;

-- 2. Read-only validation: reusable credential, no state change except last_used_at.
-- Returns the linked customer/order/tier when the (code, email) pair is valid.
create or replace function validate_access_code(p_code text, p_email text)
returns table (customer_id uuid, order_id uuid, tier text)
language plpgsql security definer set search_path = public as $$
declare
  r access_codes%rowtype;
  v_email text := lower(trim(p_email));
begin
  if v_email = '' or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Masukkan alamat email yang valid.';
  end if;
  select * into r from access_codes where code = upper(trim(p_code));
  if not found then
    raise exception 'Kode tidak ditemukan. Periksa kembali kode dari admin.';
  end if;
  if not r.is_active then
    raise exception 'Kode dinonaktifkan. Hubungi admin.';
  end if;
  if r.expires_at is not null and r.expires_at < now() then
    raise exception 'Kode sudah kedaluwarsa. Hubungi admin.';
  end if;
  if exists (select 1 from orders where id = r.order_id and status = 'cancelled') then
    raise exception 'Pesanan terkait kode ini dibatalkan. Hubungi admin.';
  end if;
  -- First login binds the email; later logins must reuse the same email.
  if r.redeemed_email = '' then
    update customers set email = v_email, updated_at = now()
      where id = r.customer_id and (email = '' or lower(email) = v_email);
    if not found then
      raise exception 'Kode ini terdaftar untuk pelanggan lain.';
    end if;
    update access_codes
      set redeemed_email = v_email, redeemed_at = now(), last_used_at = now()
      where code = r.code;
  else
    if lower(r.redeemed_email) <> v_email then
      raise exception 'Kode ini terdaftar untuk email lain.';
    end if;
    update access_codes set last_used_at = now() where code = r.code;
  end if;
  return query select r.customer_id, r.order_id, r.tier;
end $$;

-- 3. Per-tier prices: master for NEW orders only (never retroactive).
-- orders.amount is a snapshot taken at creation; changing a tier price
-- must never UPDATE existing orders.
create table if not exists tier_prices (
  tier text primary key check (tier in ('basic', 'premium', 'luxury')),
  price int not null default 0 check (price >= 0),
  updated_at timestamptz not null default now()
);

insert into tier_prices (tier, price) values
  ('basic', 149000),
  ('premium', 199000),
  ('luxury', 249000)
on conflict (tier) do nothing;

alter table tier_prices enable row level security;
drop policy if exists "admin all" on tier_prices;
create policy "admin all" on tier_prices for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "public read tier prices" on tier_prices;
create policy "public read tier prices" on tier_prices for select to anon, authenticated using (true);
grant select on tier_prices to anon;

-- 4. Fixed short code per theme (stable reference for admin/WA, not editable).
alter table theme_catalog add column if not exists code text;
update theme_catalog set code = m.code from (values
  ('classic', 'CLS'), ('minimal', 'MNM'), ('floral', 'FLR'),
  ('garden', 'GRD'), ('watercolor', 'WTR'),
  ('gerbang', 'GRB'), ('amplop', 'AMP'), ('sinematik', 'SNM'),
  ('jawa', 'JWA'), ('celestial', 'CLT'),
  ('luxury', 'LUX')
) as m(theme, code) where theme_catalog.theme = m.theme and theme_catalog.code is null;
