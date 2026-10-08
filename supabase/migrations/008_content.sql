-- Theme categories, manageable company content (settings/testimonials/faqs).

alter table theme_catalog add column if not exists category text not null default 'klasik'
  check (category in ('klasik', 'modern', 'floral', 'adat', 'mewah'));

update theme_catalog set category = m.category from (values
  ('classic', 'klasik'), ('minimal', 'modern'), ('floral', 'floral'),
  ('luxury', 'mewah'), ('gerbang', 'adat'), ('amplop', 'modern'),
  ('sinematik', 'modern'), ('garden', 'floral'), ('jawa', 'adat'),
  ('celestial', 'modern'), ('watercolor', 'floral')
) as m(theme, category) where theme_catalog.theme = m.theme;

create table if not exists site_settings (
  key text primary key,
  value text not null default ''
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  message text not null default '',
  rating int not null default 5 check (rating between 1 and 5),
  is_visible boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null default '',
  answer text not null default '',
  is_visible boolean not null default true,
  position int not null default 0
);

alter table site_settings enable row level security;
alter table testimonials enable row level security;
alter table faqs enable row level security;

drop policy if exists "admin all" on site_settings;
drop policy if exists "admin all" on testimonials;
drop policy if exists "admin all" on faqs;
create policy "admin all" on site_settings for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin all" on testimonials for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin all" on faqs for all to authenticated using (is_admin()) with check (is_admin());

-- Public marketing content is readable by everyone (client filters is_visible).
grant select on site_settings, testimonials, faqs to anon;
drop policy if exists "public read settings" on site_settings;
drop policy if exists "public read testimonials" on testimonials;
drop policy if exists "public read faqs" on faqs;
create policy "public read settings" on site_settings for select to anon, authenticated using (true);
create policy "public read testimonials" on testimonials for select to anon, authenticated using (true);
create policy "public read faqs" on faqs for select to anon, authenticated using (true);

insert into site_settings (key, value) values
  ('hero_title', 'Undangan Pernikahan Digital yang Elegan dan Berkesan'),
  ('hero_subtitle', 'Buat momen spesial Anda semakin berkesan dengan undangan digital yang indah, interaktif, dan mudah dibagikan.'),
  ('seo_title', 'Undangan Pernikahan Digital Elegan — Talijiwa'),
  ('seo_description', 'Buat undangan pernikahan digital yang indah, interaktif, dan mudah dibagikan lewat WhatsApp.'),
  ('contact_text', 'Ceritakan tanggal dan impian pernikahan Anda, kami bantu wujudkan undangannya.')
on conflict (key) do nothing;

insert into testimonials (name, message, rating, position) values
  ('Raka & Sinta', 'Undangannya bagus banget, tamu sampai tanya-tanya buatnya di mana!', 5, 1),
  ('Budi & Ayu', 'Pengerjaan cepat, revisi juga gampang. Puas banget!', 5, 2),
  ('Dimas & Rani', 'Fitur RSVP-nya membantu banget buat menghitung tamu yang hadir.', 5, 3);

insert into faqs (question, answer, position) values
  ('Berapa lama pengerjaannya?', 'Undangan jadi dalam 1–3 hari kerja setelah data dan foto lengkap kami terima.', 1),
  ('Bagaimana cara menyebar undangan?', 'Anda dapat tautan + QR + pesan WhatsApp siap kirim untuk setiap tamu.', 2),
  ('Apakah bisa revisi?', 'Bisa. Revisi ringan gratis selama masa pengerjaan, hubungi kami via WhatsApp.', 3),
  ('Apakah tamu perlu install aplikasi?', 'Tidak. Undangan terbuka langsung di browser HP maupun laptop.', 4),
  ('Bagaimana cara bayar?', 'Transfer bank atau e-wallet. DP 50% untuk mulai, pelunasan maksimal H-7 acara.', 5);
