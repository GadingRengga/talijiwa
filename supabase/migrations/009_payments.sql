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

-- Transactional payment recording: insert the payment row and update the
-- order totals atomically. Called by admins only (is_admin gate inside).
create or replace function record_payment(
  p_order_id uuid,
  p_amount int,
  p_method text,
  p_paid_at date,
  p_note text
)
returns table (id uuid, order_id uuid, amount int, method text, paid_at date, note text)
language plpgsql security definer set search_path = public as $$
declare
  v_payment payments%rowtype;
  v_order orders%rowtype;
  v_paid int;
  v_status text;
begin
  if not is_admin() then
    raise exception 'Hanya admin yang bisa mencatat pembayaran.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Nominal pembayaran harus lebih dari 0.';
  end if;
  if p_method not in ('transfer', 'ewallet', 'cash', 'other') then
    raise exception 'Metode pembayaran tidak valid.';
  end if;
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan.';
  end if;
  insert into payments (order_id, amount, method, paid_at, note)
  values (p_order_id, p_amount, p_method, coalesce(p_paid_at, current_date), coalesce(p_note, ''))
  returning * into v_payment;
  v_paid := coalesce(v_order.paid, 0) + v_payment.amount;
  if v_order.status = 'cancelled' then
    v_status := 'cancelled';
  elsif v_paid >= coalesce(v_order.amount, 0) then
    v_status := 'paid';
  else
    v_status := 'dp';
  end if;
  update orders set paid = v_paid, status = v_status, updated_at = now() where id = p_order_id;
  return query select v_payment.id, v_payment.order_id, v_payment.amount, v_payment.method, v_payment.paid_at, v_payment.note;
end $$;

-- Transactional payment removal: delete the payment row and subtract it from
-- the order totals atomically. Called by admins only.
create or replace function remove_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_payment payments%rowtype;
  v_order orders%rowtype;
  v_paid int;
  v_status text;
begin
  if not is_admin() then
    raise exception 'Hanya admin yang bisa menghapus pembayaran.';
  end if;
  select * into v_payment from payments where id = p_payment_id;
  if not found then
    return;
  end if;
  select * into v_order from orders where id = v_payment.order_id for update;
  delete from payments where id = p_payment_id;
  if not found then
    -- the payment row itself holds the totals; without an order just delete it
    return;
  end if;
  v_paid := greatest(0, coalesce(v_order.paid, 0) - coalesce(v_payment.amount, 0));
  if v_order.status = 'cancelled' then
    v_status := 'cancelled';
  elsif v_paid >= coalesce(v_order.amount, 0) then
    v_status := 'paid';
  elsif v_paid > 0 then
    v_status := 'dp';
  else
    v_status := 'pending';
  end if;
  update orders set paid = v_paid, status = v_status, updated_at = now() where id = v_order.id;
end $$;
