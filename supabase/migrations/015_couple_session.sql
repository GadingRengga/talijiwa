-- Pair the couple's code login with a Supabase session.
-- Code logins previously had NO Supabase Auth session, so every owner-read /
-- owner-write RLS policy (which requires `authenticated` + my_customer_id())
-- denied them: drafts, RSVPs and builder saves were invisible/failed.
--
-- Flow: client signs in anonymously -> validates code+email -> calls
-- link_couple_session(p_code, p_email) -> this function binds auth.uid() to
-- the customer. Requires Anonymous sign-ins enabled in Supabase Auth
-- (Authentication -> Providers -> Anonymous).

create table if not exists couple_links (
  auth_uid uuid primary key references auth.users (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists couple_links_customer_id_idx on couple_links (customer_id);

alter table couple_links enable row level security;
drop policy if exists "admin all" on couple_links;
create policy "admin all" on couple_links for all to authenticated using (is_admin()) with check (is_admin());
-- Owners may read their own link (no writes: only SECURITY DEFINER RPCs write).
drop policy if exists "owner read link" on couple_links;
create policy "owner read link" on couple_links for select to authenticated
  using (auth_uid = auth.uid() or customer_id = my_customer_id());

-- Bind the current anonymous session to a customer after validating the
-- credential pair (code + email). Reusable: re-running just re-links.
create or replace function link_couple_session(p_code text, p_email text)
returns table (customer_id uuid, order_id uuid, tier text)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  r access_codes%rowtype;
  v_email text := lower(trim(p_email));
begin
  if v_uid is null then
    raise exception 'Sesi tidak ditemukan. Coba muat ulang halaman lalu masuk lagi.';
  end if;
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
  insert into couple_links (auth_uid, customer_id) values (v_uid, r.customer_id)
    on conflict (auth_uid) do update set customer_id = excluded.customer_id;
  return query select r.customer_id, r.order_id, r.tier;
end $$;

-- my_customer_id(): linked anonymous sessions first, then legacy email match
-- (keeps magic-link logins working unchanged).
create or replace function my_customer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select l.customer_id from couple_links l where l.auth_uid = auth.uid() limit 1),
    (select id from customers where lower(email) = lower(auth.jwt() ->> 'email') limit 1)
  );
$$;
