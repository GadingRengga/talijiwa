# project.md — konteks untuk AI coding assistant

Baca file ini sebelum mengubah kode. Ringkas, tegas, dan selalu diperbarui bila keputusan berubah.

## Produk

**Talijiwa**: sistem internal satu pemilik untuk bisnis undangan pernikahan digital.
Alur: admin login → buat pelanggan → buat undangan → isi data di builder → pratinjau → publikasikan → salin tautan → kirim ke pelanggan. Tamu membuka `/invite/:slug` tanpa login.

**Bukan SaaS.** Jangan membuat: subscription, pricing plan, billing, multi-tenant, white label, organisasi/tim.

**Portal pasangan (disetujui, belum dibangun).** Pasangan yang menikah mendapat dashboard sendiri: pantau saja (hadir / tidak hadir / belum respons, ucapan, amplop, salin tautan + QR, minta revisi via WA). Masuk via magic link email; satu akun melihat semua undangannya. Pasangan **tidak boleh** mengedit isi undangan. Membutuhkan peran `customer` di `profiles` + RLS pemilik + area `/pasangan/*` (fase sendiri). Auth admin memeriksa `role === 'admin'` agar pintu ini gampang dibuka nanti.

## Stack

Vue 3 (`<script setup>`) · TypeScript strict · Vite · Vue Router · Pinia · Tailwind CSS v4 · GSAP · lucide-vue-next · Zod · Supabase (Auth, PostgreSQL, Storage; belum terhubung).

## Aturan bahasa (wajib)

- Kode, identifier, komentar, commit, dokumentasi teknis: **English**.
- Semua teks yang dilihat pengguna: **Bahasa Indonesia**, dan disimpan di `src/config/copy.ts` (jangan hardcode di komponen baru bila teksnya dipakai ulang atau penting).
- Format Indonesia: `Intl` dengan `id-ID` (`formatDate`, `formatCurrency` di `utils/format.ts`), zona waktu dengan label WIB/WITA/WIT.
- Teks yang dikutip di spesifikasi (mis. "Buka Undangan", "Salin Nomor", "Undangan tidak ditemukan") dipakai **persis**.

## Aturan arsitektur

1. Komponen tidak memanggil Supabase langsung. Akses data lewat `src/services/*`; service memilih mock atau Supabase lewat `useMock`.
2. State kecil tetap lokal. Pinia hanya untuk state lintas halaman (`auth`, `customer`, `invitation`, `analytics`, `theme`).
3. Satu model data undangan: `InvitationData` (`types/index.ts`). Builder mengedit salinan (`draft`), renderer membaca data yang sama.
4. `InvitationRenderer` dipakai di **dua tempat**: halaman publik (`mode="public"`) dan pratinjau builder (`mode="preview"`). Jangan membuat renderer kedua.
5. Tema = data (`ThemeDefinition`) → CSS variables `--inv-*`. Komponen undangan hanya memakai variabel itu (class `.inv-*` di `assets/invitation.css`). Tidak ada warna tema yang di-hardcode di komponen.
6. Menambah tema/section/fitur undangan tidak boleh mengubah banyak kode lama: daftarkan di registry, bukan menyisipkan `if`.
7. Jangan over-engineer. Sederhana, mudah dikembangkan.

## Konvensi

- Animasi hanya `transform` dan `opacity`; wajib patuh `prefers-reduced-motion` (`prefersReducedMotion()`, CSS global, `.inv-decor` disembunyikan).
- Konten dari tamu (`?to=`, RSVP, ucapan) **selalu dirender sebagai teks**. Dilarang `v-html` dengan data pengguna. `sanitizeGuestName()` membatasi panjang dan membuang karakter kontrol/`<>`.
- Jangan menyimpan IP mentah. `visitor_hash` = id acak per browser.
- Jangan pernah memakai Supabase service role key di frontend. Hanya `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
- Hindari watcher yang tidak perlu. Builder memakai satu deep watcher (`useBuilder`) untuk dirty-tracking.
- Gunakan `100dvh`, bukan `100vh`, untuk layar penuh di mobile.
- Aksesibilitas: label di setiap input (`FormField`), `aria-*` pada kontrol kustom, fokus terlihat, dialog memakai `<dialog>`.

## Peta kode

| Butuh… | Lihat |
|---|---|
| Info bisnis (nama, WA, email) | `config/company.ts` |
| Teks UI Indonesia | `config/copy.ts` |
| Tipe data | `types/index.ts` |
| State builder, autosave, publish | `composables/useBuilder.ts` |
| Halaman builder | `pages/admin/InvitationEdit.vue` + `components/builder/Section*.vue` |
| Render undangan | `components/invitation/InvitationRenderer.vue` |
| Tema | `themes/*`, `themes/index.ts` |
| Data mock + seed | `services/mock/*` |
| Skema DB + RLS | `supabase/migrations/*` |

## Status fase

- [x] **Fase 1 — Fondasi + builder + undangan publik**: scaffold, router + guard, layout admin, pelanggan, daftar/buat undangan, **builder (12 section, live preview, autosave)**, renderer 11 bagian, 4 tema, countdown, cover GSAP, musik, RSVP/ucapan/hadiah (mock), skema + RLS.
- [x] **Fase 2 — Adapter Supabase**: auth (admin + cek `role`, mock tetap jalan), services (customers, invitations 7-tabel, rsvp, analytics, orders, katalog tema), Storage (upload `invitations/{id}/{couple|gallery}/`, hapus file lama + folder saat hapus), migrasi `007` (orders + theme_catalog + seed), seed demo (`seed_demo.sql`), uji RLS penuh via API (12/12 lolos, 2026-10-07). Tinggal dijalankan user: `007` + `seed_demo.sql` (opsional) di SQL editor.
- [x] **Fase 3 — Data admin (parsial)**: halaman RSVP (cari/filter/sortir/unduh CSV), Ucapan (sembunyi/tampil/hapus), Hadiah per undangan; Pesanan order-centric (detail + stepper Pesanan→Undangan→Publish→Serah terima, tabel `payments`, status otomatis, warning publish bila belum lunas, migrasi `009`) dan Tema (aktif/harga/kategori → tampil di Templates). Sisa: pagination + analitik per undangan.
- [x] **Fase 5 — Company profile (parsial)**: hero/testimoni/FAQ/kontak/SEO beranda dikelola di Pengaturan (`site_settings`, `testimonials`, `faqs`, migrasi `008`); filter kategori di Templates. Sisa: halaman layanan/portofolio kaya, SEO per halaman penuh.
- Catatan domain: **Pesanan ≠ Undangan** (sengaja dua menu). Pesanan = transaksi uang (pelanggan, total, terbayar, status, tenggat). Undangan = produk digital (tautan `/invite/:slug`). Satu pesanan melahirkan nol/satu undangan via tombol "Buat undangan".
- [x] **Fase 4 — Analitik**: grafik 14 hari (dilihat + RSVP, SVG tanpa lib) di `/admin/analytics` dan per undangan (`InvitationAnalytics`), kartu tamu hadir; service `analytics.series()`.
- [x] **Fase 5 — Company profile**: Beranda (hero/testimoni/FAQ dari CMS), Layanan (harga dari katalog + cara pesan), Tentang, Kontak dinamis, SEO per halaman via `useSeo` + canonical + JSON-LD (org/FAQ), `robots.txt` + `sitemap.xml`, prerender SSG 6 halaman (`vite-ssg`, judul/meta disuntik per route). Dikelola di Pengaturan.
- [x] **Fase 6 — Polish (parsial)**: pagination semua list admin; preview WA via `workers/wa-preview.js` (paste ke dashboard CF, tanpa CLI) + `supabase/functions/invite-preview` + `docs/WA_PREVIEW.md`; `public/_redirects` + `_headers`; satu sumber SEO (`copy.site`); dimensi/lazy/fetchpriority gambar; `sitemap.xml` dinamis dari `SITE_URL` env. Sisa: pecah renderer, Lighthouse ≥90 di perangkat nyata.
- [x] **Fase 7 — Portal pasangan (kode selesai)**: magic link, area `/pasangan/*` read-only (dashboard + detail: hadir/tidak/belum-respons, ucapan, hadiah, salin tautan, revisi via WA), RLS pemilik berbasis email (migrasi `010`). Tinggal dijalankan user: `010` + tambah Site URL `/pasangan` di Auth URL config + buat user pasangan per pelanggan. grafik views/RSVP per hari, rincian kehadiran.


## Cara menambah…

- **Tema baru**: `docs/THEMING.md`.
- **Section builder baru**: `docs/BUILDER.md`.
- **Section undangan baru**: tambah key di `SECTION_KEYS` + label di `sectionLabels` + blok `<section data-sec="…">` di renderer + default di `defaultSettings()`.

## Definition of done (per perubahan)

- `npm run typecheck` dan `npm run build` lulus.
- Teks baru berbahasa Indonesia dan terpusat.
- Tidak ada `v-html` dengan data pengguna; reduced-motion tetap bekerja.
- Dokumen terkait (file ini / `docs/*`) diperbarui bila keputusan atau struktur berubah.
