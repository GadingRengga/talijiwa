-- Orders (pesanan pelanggan) + theme catalog (aktif/harga per tema).

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete restrict,
  invitation_id uuid references invitations (id) on delete set null,
  theme text not null default 'classic',
  amount int not null default 0 check (amount >= 0),
  paid int not null default 0 check (paid >= 0),
  status text not null default 'pending' check (status in ('pending', 'dp', 'paid', 'cancelled')),
  due_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists theme_catalog (
  theme text primary key,
  is_active boolean not null default true,
  price int not null default 0 check (price >= 0),
  position int not null default 0
);

create index if not exists orders_customer_id_idx on orders (customer_id);
create index if not exists orders_invitation_id_idx on orders (invitation_id);

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders for each row execute function set_updated_at();

-- RLS: admin full access; public may read the theme catalog (Templates page).
alter table orders enable row level security;
alter table theme_catalog enable row level security;

drop policy if exists "admin all" on orders;
drop policy if exists "admin all" on theme_catalog;
create policy "admin all" on orders for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin all" on theme_catalog for all to authenticated using (is_admin()) with check (is_admin());

grant select on theme_catalog to anon;
drop policy if exists "public read catalog" on theme_catalog;
create policy "public read catalog" on theme_catalog for select to anon, authenticated using (true);

-- Seed: one row per code theme (prices are placeholders; edit in admin → Tema).
insert into theme_catalog (theme, is_active, price, position) values
  ('classic', true, 149000, 1),
  ('minimal', true, 149000, 2),
  ('floral', true, 149000, 3),
  ('luxury', true, 249000, 4),
  ('gerbang', true, 199000, 5),
  ('amplop', true, 199000, 6),
  ('sinematik', true, 199000, 7),
  ('garden', true, 149000, 8),
  ('jawa', true, 199000, 9),
  ('celestial', true, 199000, 10),
  ('watercolor', true, 149000, 11)
on conflict (theme) do nothing;
