-- Couple portal (read-only monitoring): ownership by matching auth email to customers.email.
-- Admin flow per couple: create the auth user in the dashboard, make sure customers.email matches,
-- then the magic link (signInWithOtp) signs them in. No profiles row needed for customers.

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'customer'));

-- Which customer belongs to the current user (null when none).
create or replace function my_customer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from customers where lower(email) = lower(auth.jwt() ->> 'email') limit 1;
$$;

create or replace function owns_invitation(inv uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from invitations where id = inv and customer_id = my_customer_id());
$$;

-- Owner: read own customer row, own invitations and their guest data. No writes.
drop policy if exists "owner read own customer" on customers;
drop policy if exists "owner read invitations" on invitations;
drop policy if exists "owner read couples" on invitation_couples;
drop policy if exists "owner read events" on invitation_events;
drop policy if exists "owner read stories" on invitation_stories;
drop policy if exists "owner read gallery" on invitation_gallery;
drop policy if exists "owner read gifts" on gift_accounts;
drop policy if exists "owner read settings" on invitation_settings;
drop policy if exists "owner read rsvps" on rsvps;
drop policy if exists "owner read messages" on guest_messages;
drop policy if exists "owner read gift confirmations" on gift_confirmations;
drop policy if exists "owner read views" on invitation_views;

create policy "owner read own customer" on customers for select to authenticated using (lower(email) = lower(auth.jwt() ->> 'email'));
create policy "owner read invitations" on invitations for select to authenticated using (customer_id = my_customer_id());
create policy "owner read couples" on invitation_couples for select to authenticated using (owns_invitation(invitation_id));
create policy "owner read events" on invitation_events for select to authenticated using (owns_invitation(invitation_id));
create policy "owner read stories" on invitation_stories for select to authenticated using (owns_invitation(invitation_id));
create policy "owner read gallery" on invitation_gallery for select to authenticated using (owns_invitation(invitation_id));
create policy "owner read gifts" on gift_accounts for select to authenticated using (owns_invitation(invitation_id));
create policy "owner read settings" on invitation_settings for select to authenticated using (owns_invitation(invitation_id));
create policy "owner read rsvps" on rsvps for select to authenticated using (owns_invitation(invitation_id));
create policy "owner read messages" on guest_messages for select to authenticated using (owns_invitation(invitation_id));
create policy "owner read gift confirmations" on gift_confirmations for select to authenticated using (owns_invitation(invitation_id));
create policy "owner read views" on invitation_views for select to authenticated using (owns_invitation(invitation_id));
