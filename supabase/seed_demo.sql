-- Demo seed: 1 customer + 1 published invitation. Run in SQL editor after 001–007.
-- Idempotent (on conflict do nothing / fixed UUIDs).

insert into customers (id, name, phone, email, notes) values
  ('11111111-1111-4111-8111-111111111111', 'Contoh Mempelai', '081234567890', 'contoh@example.com', 'Data contoh — hapus bila tidak perlu.')
on conflict (id) do nothing;

insert into invitations (id, customer_id, title, slug, status, theme, greeting, opening_text, closing_text, published_at) values
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111',
   'Demo & Contoh', 'demo-contoh', 'published', 'classic',
   'Assalamualaikum Warahmatullahi Wabarakatuh',
   'Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Anda ke pernikahan kami.',
   'Merupakan kehormatan bagi kami atas kehadiran dan doa restu Anda.',
   now())
on conflict (id) do nothing;

insert into invitation_couples (invitation_id, role, name, nickname, father, mother) values
  ('22222222-2222-4222-8222-222222222222', 'groom', 'Demo Pratama', 'Demo', 'Bapak Contoh', 'Ibu Contoh'),
  ('22222222-2222-4222-8222-222222222222', 'bride', 'Contoh Lestari', 'Contoh', 'Bapak Teladan', 'Ibu Teladan')
on conflict (invitation_id, role) do nothing;

insert into invitation_events (invitation_id, position, name, event_date, start_time, end_time, venue, address) values
  ('22222222-2222-4222-8222-222222222222', 0, 'Resepsi', current_date + 30, '11:00', '14:00', 'Gedung Contoh', 'Jl. Contoh No. 1')
on conflict do nothing;

insert into invitation_settings (invitation_id, sections, rsvp_deadline, show_in_portfolio) values
  ('22222222-2222-4222-8222-222222222222',
   '{"couple": true, "date": true, "countdown": true, "profile": true, "story": true, "events": true, "maps": false, "gallery": false, "rsvp": true, "messages": true, "gift": false}',
   current_date + 23, false)
on conflict (invitation_id) do nothing;

-- Verify:
-- select slug, status from invitations where id = '22222222-2222-4222-8222-222222222222';
