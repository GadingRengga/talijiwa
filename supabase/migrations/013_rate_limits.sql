-- Server-side guards: public submission rate limits + cheap analytics aggregates.
-- Client-side throttling is UX-only; these RPCs are the real boundary.

create table if not exists public_rate_limits (
  key text primary key,
  count int not null default 0,
  window_start timestamptz not null default now()
);

alter table public_rate_limits enable row level security;

-- No direct access for anon/authenticated: only the SECURITY DEFINER RPC touches it.
-- (Admins can inspect via is_admin for abuse investigation.)
drop policy if exists "admin read rate limits" on public_rate_limits;
create policy "admin read rate limits" on public_rate_limits for select to authenticated using (is_admin());

-- Sliding-window counter: max `p_max` events per `p_window_seconds` per key.
-- Returns true when allowed (and records the event), false when limited.
create or replace function check_public_rate_limit(p_key text, p_max int default 5, p_window_seconds int default 60)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_row public_rate_limits%rowtype;
  v_cutoff timestamptz := now() - make_interval(secs => greatest(p_window_seconds, 1));
begin
  if p_key is null or p_key = '' then
    return false;
  end if;
  select * into v_row from public_rate_limits where key = p_key for update;
  if not found then
    insert into public_rate_limits (key, count, window_start) values (p_key, 1, now());
    return true;
  end if;
  if v_row.window_start < v_cutoff then
    update public_rate_limits set count = 1, window_start = now() where key = p_key;
    return true;
  end if;
  if v_row.count >= greatest(p_max, 1) then
    return false;
  end if;
  update public_rate_limits set count = v_row.count + 1 where key = p_key;
  return true;
end $$;

-- Daily aggregates for the analytics charts (single round-trip, cheap).
-- Respects the caller's visibility: admins see everything, owners see their own.
create or replace function invitation_daily_series(p_days int default 14, p_since date default current_date - 14, p_invitation_id uuid default null)
returns table (day date, views bigint, rsvps bigint, guests bigint)
language sql stable security definer set search_path = public as $$
  with days as (
    select generate_series(greatest(p_since, current_date - 365), current_date, '1 day'::interval)::date as day
  ),
  scoped_views as (
    select v.created_at::date as day
    from invitation_views v
    where v.created_at >= p_since::timestamptz
      and (p_invitation_id is null or v.invitation_id = p_invitation_id)
      and (is_admin() or owns_invitation(v.invitation_id))
  ),
  scoped_rsvps as (
    select r.created_at::date as day, r.attendance, r.guest_count
    from rsvps r
    where r.created_at >= p_since::timestamptz
      and (p_invitation_id is null or r.invitation_id = p_invitation_id)
      and (is_admin() or owns_invitation(r.invitation_id))
  )
  select
    d.day,
    (select count(*) from scoped_views v where v.day = d.day) as views,
    (select count(*) from scoped_rsvps r where r.day = d.day) as rsvps,
    (select coalesce(sum(r.guest_count), 0) from scoped_rsvps r where r.day = d.day and r.attendance = 'attending') as guests
  from days d
  order by d.day;
$$;
