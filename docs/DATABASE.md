# Database (Supabase / PostgreSQL)

Migration: `supabase/migrations/001_schema.sql`, `002_rls.sql`, `003_storage.sql`. Jalankan berurutan. **Belum diuji di database sungguhan**; jalankan di project Supabase kosong dan lakukan uji RLS di bawah sebelum dipakai.

## Tabel

`profiles` → `customers` → `invitations` → (`invitation_couples`, `invitation_events`, `invitation_stories`, `invitation_gallery`, `gift_accounts`, `invitation_settings`, `rsvps`, `guest_messages`, `gift_confirmations`, `invitation_views`).

`orders` (customer + invitation opsional + harga + status bayar) dan `theme_catalog` (aktif/harga/kategori per tema) ada di `007_orders_catalog.sql`.

`008_content.sql`: `theme_catalog.category` (`klasik|modern|floral|adat|mewah`), `site_settings` (konten + SEO beranda), `testimonials`, `faqs`.

`009_payments.sql`: `payments` (jejak bayar per order, admin-only) + `orders.delivered_at` (tanda link terkirim).

- Semua PK UUID. Hapus undangan → child ikut terhapus (`cascade`). Hapus pelanggan yang masih punya undangan → ditolak (`restrict`).
- `invitations.slug` unik, format `^[a-z0-9]+(-[a-z0-9]+)*$`, 3–60 karakter.
- Maksimal satu foto cover per undangan (partial unique index).
- Index: `invitations.customer_id`, `status`, dan `invitation_id` di setiap tabel anak.

## Matriks akses (RLS)

| Tabel | Admin | Publik (anon) |
|---|---|---|
| customers | CRUD | — |
| invitations | CRUD | SELECT jika `published` |
| couples / events / stories / gallery / gift_accounts / settings | CRUD | SELECT jika undangan `published` |
| rsvps | CRUD | INSERT saja (undangan `published`) |
| guest_messages | CRUD | SELECT `is_visible` + INSERT (undangan `published`) |
| gift_confirmations | CRUD | INSERT saja |
| invitation_views | CRUD | INSERT saja |
| orders | CRUD | — |
| theme_catalog | CRUD | SELECT semua (filter aktif di klien) |
| site_settings | CRUD | SELECT semua |
| testimonials | CRUD | SELECT semua (filter tampil di klien) |
| faqs | CRUD | SELECT semua (filter tampil di klien) |
| profiles | baca baris sendiri | — |

Tambahan: hak kolom (`grant insert (kolom…)`) membatasi kolom yang bisa ditulis anon, sehingga anon tidak bisa mengisi `id`, `created_at`, atau `is_visible = false`. Konsekuensi: panggilan insert dari klien **tidak boleh** memakai `.select()`/`returning`, karena anon tidak punya SELECT pada tabel tersebut.

## Admin pertama

Sign-up publik harus dimatikan. Buat user di Authentication → Users, lalu jalankan di SQL editor:

```sql
insert into profiles (id, full_name) values ('<uuid-user-auth>', 'Nama Admin');
```

Tidak ada trigger yang otomatis menjadikan user baru sebagai admin (sengaja).

## Storage

Bucket publik `invitation-images` (maks 5 MB, JPEG/PNG/WebP). Path: `invitations/{invitation_id}/{cover|couple|gallery}/<file>`. Baca publik; tulis/ubah/hapus hanya admin. Saat menghapus undangan atau foto, hapus juga objek storage-nya (Fase 2: lewat service, atau Edge Function pembersih).

## Uji RLS (wajib sebelum produksi)

Dengan klien `anon`:

- [ ] `select * from customers` → kosong/ditolak
- [ ] `select * from invitations where status = 'draft'` → kosong
- [ ] `update invitations set title = 'x'` → ditolak
- [ ] `select * from rsvps` / `gift_confirmations` / `invitation_views` → ditolak
- [ ] insert RSVP ke undangan **draf** → ditolak; ke undangan terbit → berhasil
- [ ] insert `guest_messages` dengan `is_visible = false` → ditolak
- [ ] insert `rsvps` dengan `whatsapp = 'abc'` atau `guest_count = 99` → ditolak oleh constraint

Dengan user terautentikasi non-admin (bukan di `profiles`): semua tabel bisnis harus tetap tertutup.

## Catatan adapter (`src/services/*`)

- Foto (`photo_path`, `image_path`) menyimpan path Storage atau URL/dataURL apa adanya; saat dibaca, path relatif diubah menjadi URL publik bucket `invitation-images`. Unggahan baru dari builder masuk ke `invitations/{id}/{couple|gallery}/<uuid>.jpg` (`services/storage`); file lama dihapus saat foto diganti/dihapus, dan seluruh folder undangan dihapus saat undangan dihapus.
- `getBySlug` sebagai anon hanya melihat undangan terbit (RLS), sehingga tautan draf tampil sebagai "tidak ditemukan", bukan "belum dipublikasikan".
- Hapus undangan mengandalkan `cascade` DB + `storageService.removeInvitationFolder`.

## Hal yang sengaja belum ada

- Rate limit sisi server untuk insert publik (disarankan Edge Function atau pg_net/cron + tabel counter).
- RPC/view statistik dashboard dan grafik harian (Fase 4).
- `seed.sql` demo (Fase 2; saat ini seed ada di `src/services/mock/seed.ts`).
