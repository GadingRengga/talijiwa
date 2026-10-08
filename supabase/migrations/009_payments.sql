-- Payment trail per order + handover flag.

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  amount int not null check (amount > 0),
  method text not null default 'transfer' check (method in ('transfer', 'ewallet', 'cash', 'other')),
  paid_at date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table orders add column if not exists delivered_at timestamptz;

create index if not exists payments_order_id_idx on payments (order_id);

alter table payments enable row level security;
drop policy if exists "admin all" on payments;
create policy "admin all" on payments for all to authenticated using (is_admin()) with check (is_admin());
