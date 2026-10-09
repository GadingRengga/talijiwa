-- Price tiers (basic/premium/luxury) + customer access codes.

-- 1. Tier on invitations + orders. Existing rows stay basic.
alter table invitations add column if not exists tier text not null default 'basic'
  check (tier in ('basic', 'premium', 'luxury'));

alter table orders add column if not exists tier text not null default 'basic'
  check (tier in ('basic', 'premium', 'luxury'));

-- 2. Theme entitlement: each theme belongs to one tier; luxury unlocks everything below it.
alter table theme_catalog add column if not exists tier text not null default 'basic'
  check (tier in ('basic', 'premium', 'luxury'));

update theme_catalog set tier = m.tier from (values
  ('classic', 'basic'), ('minimal', 'basic'), ('floral', 'basic'),
  ('garden', 'basic'), ('watercolor', 'basic'),
  ('gerbang', 'premium'), ('amplop', 'premium'), ('sinematik', 'premium'),
  ('jawa', 'premium'), ('celestial', 'premium'),
  ('luxury', 'luxury')
) as m(theme, tier) where theme_catalog.theme = m.theme;

-- 3. Access codes: issued by admin after payment, redeemed by the customer.
create table if not exists access_codes (
  code text primary key check (code ~ '^[A-Z0-9-]{6,20}$'),
  customer_id uuid not null references customers (id) on delete cascade,
  order_id uuid not null references orders (id) on delete cascade,
  tier text not null default 'basic' check (tier in ('basic', 'premium', 'luxury')),
  is_active boolean not null default true,
  expires_at timestamptz,
  redeemed_email text not null default '',
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists access_codes_customer_id_idx on access_codes (customer_id);
create index if not exists access_codes_order_id_idx on access_codes (order_id);

alter table access_codes enable row level security;
drop policy if exists "admin all" on access_codes;
create policy "admin all" on access_codes for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "owner read codes" on access_codes;
create policy "owner read codes" on access_codes for select to authenticated using (customer_id = my_customer_id());

-- Owner may read their own orders (needed for the couple dashboard quota).
drop policy if exists "owner read orders" on orders;
create policy "owner read orders" on orders for select to authenticated using (customer_id = my_customer_id());

-- 4. Owner write: customers edit their own invitation content (no add/remove/duplicate).
-- The single invitation is created by the admin when making the order.
drop policy if exists "owner insert invitations" on invitations;
drop policy if exists "owner update invitations" on invitations;
drop policy if exists "owner insert couples" on invitation_couples;
drop policy if exists "owner update couples" on invitation_couples;
drop policy if exists "owner insert events" on invitation_events;
drop policy if exists "owner update events" on invitation_events;
drop policy if exists "owner delete events" on invitation_events;
drop policy if exists "owner insert stories" on invitation_stories;
drop policy if exists "owner update stories" on invitation_stories;
drop policy if exists "owner delete stories" on invitation_stories;
drop policy if exists "owner insert gallery" on invitation_gallery;
drop policy if exists "owner update gallery" on invitation_gallery;
drop policy if exists "owner delete gallery" on invitation_gallery;
drop policy if exists "owner insert gifts" on gift_accounts;
drop policy if exists "owner update gifts" on gift_accounts;
drop policy if exists "owner delete gifts" on gift_accounts;
drop policy if exists "owner upsert settings" on invitation_settings;

create policy "owner update invitations" on invitations for update to authenticated
  using (customer_id = my_customer_id()) with check (customer_id = my_customer_id());
create policy "owner insert couples" on invitation_couples for insert to authenticated
  with check (owns_invitation(invitation_id));
create policy "owner update couples" on invitation_couples for update to authenticated
  using (owns_invitation(invitation_id)) with check (owns_invitation(invitation_id));
create policy "owner insert events" on invitation_events for insert to authenticated
  with check (owns_invitation(invitation_id));
create policy "owner update events" on invitation_events for update to authenticated
  using (owns_invitation(invitation_id)) with check (owns_invitation(invitation_id));
create policy "owner delete events" on invitation_events for delete to authenticated
  using (owns_invitation(invitation_id));
create policy "owner insert stories" on invitation_stories for insert to authenticated
  with check (owns_invitation(invitation_id));
create policy "owner update stories" on invitation_stories for update to authenticated
  using (owns_invitation(invitation_id)) with check (owns_invitation(invitation_id));
create policy "owner delete stories" on invitation_stories for delete to authenticated
  using (owns_invitation(invitation_id));
create policy "owner insert gallery" on invitation_gallery for insert to authenticated
  with check (owns_invitation(invitation_id));
create policy "owner update gallery" on invitation_gallery for update to authenticated
  using (owns_invitation(invitation_id)) with check (owns_invitation(invitation_id));
create policy "owner delete gallery" on invitation_gallery for delete to authenticated
  using (owns_invitation(invitation_id));
create policy "owner insert gifts" on gift_accounts for insert to authenticated
  with check (owns_invitation(invitation_id));
create policy "owner update gifts" on gift_accounts for update to authenticated
  using (owns_invitation(invitation_id)) with check (owns_invitation(invitation_id));
create policy "owner delete gifts" on gift_accounts for delete to authenticated
  using (owns_invitation(invitation_id));
create policy "owner upsert settings" on invitation_settings for all to authenticated
  using (owns_invitation(invitation_id)) with check (owns_invitation(invitation_id));

-- Customers never delete whole invitations (admin-only). Draft delete policy removed.
drop policy if exists "owner delete draft invitations" on invitations;

-- Owner may no longer claim/link invitations: the single invitation is created by the admin.
drop policy if exists "owner link invitation" on orders;

-- 5. Customer image uploads under their own invitation folder.
-- Path shape is invitations/{uuid}/... so the 2nd segment is the invitation id.
drop policy if exists "owner upload invitation images" on storage.objects;
drop policy if exists "owner update invitation images" on storage.objects;
drop policy if exists "owner delete invitation images" on storage.objects;
create policy "owner upload invitation images" on storage.objects for insert to authenticated
  with check (bucket_id = 'invitation-images'
    and (is_admin() or (name ~ '^invitations/[0-9a-f-]{36}/' and owns_invitation(split_part(name, '/', 2)::uuid))));
create policy "owner update invitation images" on storage.objects for update to authenticated
  using (bucket_id = 'invitation-images'
    and (is_admin() or (name ~ '^invitations/[0-9a-f-]{36}/' and owns_invitation(split_part(name, '/', 2)::uuid))));
create policy "owner delete invitation images" on storage.objects for delete to authenticated
  using (bucket_id = 'invitation-images'
    and (is_admin() or (name ~ '^invitations/[0-9a-f-]{36}/' and owns_invitation(split_part(name, '/', 2)::uuid))));

-- 6. Redemption RPC: anonymous callers validate a code without reading the table.
create or replace function redeem_access_code(p_code text, p_email text)
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
    raise exception 'Kode sudah dipakai atau dinonaktifkan.';
  end if;
  if r.expires_at is not null and r.expires_at < now() then
    raise exception 'Kode sudah kedaluwarsa. Hubungi admin.';
  end if;
  if exists (select 1 from orders where id = r.order_id and status = 'cancelled') then
    raise exception 'Pesanan terkait kode ini dibatalkan. Hubungi admin.';
  end if;
  update customers set email = v_email, updated_at = now()
    where id = r.customer_id and (email = '' or lower(email) = v_email);
  if not found then
    raise exception 'Kode ini terdaftar untuk pelanggan lain.';
  end if;
  update access_codes
    set redeemed_email = v_email, redeemed_at = now(), is_active = false
    where code = r.code and is_active;
  if not found then
    raise exception 'Kode baru saja dipakai.';
  end if;
  return query select r.customer_id, r.order_id, r.tier;
end $$;
