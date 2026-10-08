-- Daftarkan user berikut sebagai admin. Jalankan di Supabase Dashboard → SQL editor.
-- Ganti UUID + nama di bawah dengan user Anda (Authentication → Users → salin UID).

insert into profiles (id, full_name)
values ('<uuid-user-auth>', 'Admin')
on conflict (id) do nothing;

-- Verifikasi (harus 1 baris, role = admin):
select id, full_name, role, created_at from profiles;
