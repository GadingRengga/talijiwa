-- Daftarkan user berikut sebagai admin. Jalankan di Supabase Dashboard → SQL editor.
-- User: admin@wedding.com (id terverifikasi dari hasil login API).

insert into profiles (id, full_name)
values ('4f3852f8-e93e-40fa-a11f-b725e6dfcb92', 'Admin')
on conflict (id) do nothing;

-- Verifikasi (harus 1 baris, role = admin):
select id, full_name, role, created_at from profiles;
