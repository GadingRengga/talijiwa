-- Row Level Security. Default deny; admin = row in profiles; public = anon role.

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_published(inv uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from invitations where id = inv and status = 'published');
$$;

alter table profiles enable row level security;
alter table customers enable row level security;
alter table invitations enable row level security;
alter table invitation_couples enable row level security;
alter table invitation_events enable row level security;
alter table invitation_stories enable row level security;
alter table invitation_gallery enable row level security;
alter table gift_accounts enable row level security;
alter table invitation_settings enable row level security;
alter table rsvps enable row level security;
alter table guest_messages enable row level security;
alter table gift_confirmations enable row level security;
alter table invitation_views enable row level security;

-- Admin: full access to everything.
do $$
declare t text;
begin
  foreach t in array array['customers','invitations','invitation_couples','invitation_events','invitation_stories',
    'invitation_gallery','gift_accounts','invitation_settings','rsvps','guest_messages','gift_confirmations','invitation_views']
  loop
    execute format('create policy "admin all" on %I for all to authenticated using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

create policy "admin read own profile" on profiles for select to authenticated using (id = auth.uid());

-- Public: read published invitations and their content.
create policy "public read published" on invitations for select to anon, authenticated using (status = 'published');
create policy "public read couples" on invitation_couples for select to anon, authenticated using (is_published(invitation_id));
create policy "public read events" on invitation_events for select to anon, authenticated using (is_published(invitation_id));
create policy "public read stories" on invitation_stories for select to anon, authenticated using (is_published(invitation_id));
create policy "public read gallery" on invitation_gallery for select to anon, authenticated using (is_published(invitation_id));
create policy "public read gift accounts" on gift_accounts for select to anon, authenticated using (is_published(invitation_id));
create policy "public read settings" on invitation_settings for select to anon, authenticated using (is_published(invitation_id));
create policy "public read visible messages" on guest_messages for select to anon, authenticated using (is_visible and is_published(invitation_id));

-- Public: insert-only into guest-facing tables, and only for published invitations.
create policy "public insert rsvp" on rsvps for insert to anon, authenticated with check (is_published(invitation_id));
create policy "public insert message" on guest_messages for insert to anon, authenticated with check (is_published(invitation_id) and is_visible);
create policy "public insert gift confirmation" on gift_confirmations for insert to anon, authenticated with check (is_published(invitation_id));
create policy "public insert view" on invitation_views for insert to anon, authenticated with check (is_published(invitation_id));

-- Column-level privileges: anon can only write the columns the public forms send.
revoke all on all tables in schema public from anon;
grant select on invitations, invitation_couples, invitation_events, invitation_stories, invitation_gallery,
  gift_accounts, invitation_settings, guest_messages to anon;
grant insert (invitation_id, name, whatsapp, guest_count, attendance, message) on rsvps to anon;
grant insert (invitation_id, name, message) on guest_messages to anon;
grant insert (invitation_id, name, gift_type, amount, message) on gift_confirmations to anon;
grant insert (invitation_id, visitor_hash, user_agent, referrer) on invitation_views to anon;
