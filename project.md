# project.md — konteks untuk AI coding assistant

Baca file ini sebelum mengubah kode. Ringkas, tegas, dan selalu diperbarui bila keputusan berubah.

## Produk

**Talijiwa**: sistem internal satu pemilik untuk bisnis undangan pernikahan digital.
Alur: admin login → buat pelanggan → buat undangan → isi data di builder → pratinjau → publikasikan → salin tautan → kirim ke pelanggan. Tamu membuka `/invite/:slug` tanpa login.

**Bukan SaaS.** Jangan membuat: subscription, pricing plan, billing, multi-tenant, white label, organisasi/tim.

**Portal pasangan (disetujui, dibangun).** Pasangan yang menikah mendapat dashboard sendiri: pantau (hadir / tidak hadir / belum respons, ucapan, amplop, salin tautan + QR, minta revisi via WA) **dan edit isi undangannya sendiri via full builder** (tema dikunci sesuai paket order, boleh publish sendiri). 1 undangan dibuat admin saat order; pasangan **tidak bisa** menambah, menghapus, atau menduplikat undangan. Masuk via magic link email **atau tukar kode akses sekali pakai dari admin**; satu akun melihat semua undangannya. Membutuhkan peran `customer` di `profiles` + RLS pemilik + area `/pasangan/*`. Auth admin memeriksa `role === 'admin'` agar pintu ini gampang dibuka nanti.

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
- Dilarang top-level `await` di `<script setup>` halaman: bikin hidrasi macet tanpa error (pernah blank total). Ambil data via `onServerPrefetch` (SSR) + `onMounted` (klien).
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
- [x] **Fase 3 — Data admin**: halaman RSVP (cari/filter/sortir/unduh CSV), Ucapan (cari/sembunyi/tampil/hapus), Hadiah per undangan (read-only, sengaja); Pesanan order-centric (detail + stepper Pesanan→Undangan→Publish→Serah terima, tabel `payments`, status otomatis, warning publish bila belum lunas, migrasi `009`, judul undangan via modal) dan Tema (aktif/harga/kategori → tampil di Templates); pagination + analitik per undangan; kartu Undangan tertaut ke RSVP/Ucapan/Hadiah/Analitik; rute `invitations/create` dan `ComingSoon` dihapus (satu pintu via Pesanan). Teks Indonesia admin+builder terpusat di `copy.ts`; `npm test` (vitest) mengunci util format/invitation.
- [x] **Fase 5 — Company profile (parsial)**: hero/testimoni/FAQ/kontak/SEO beranda dikelola di Pengaturan (`site_settings`, `testimonials`, `faqs`, migrasi `008`); filter kategori di Templates. Sisa: halaman layanan/portofolio kaya, SEO per halaman penuh.
- Catatan domain: **Pesanan ≠ Undangan** (sengaja dua menu). Pesanan = transaksi uang (pelanggan, total, terbayar, status, tenggat). Undangan = produk digital (tautan `/invite/:slug`). Satu pesanan melahirkan nol/satu undangan via tombol "Buat undangan".
- [x] **Fase 4 — Analitik**: grafik 14 hari (dilihat + RSVP, SVG tanpa lib) di `/admin/analytics` dan per undangan (`InvitationAnalytics`), kartu tamu hadir; service `analytics.series()`.
- [x] **Fase 5 — Company profile**: Beranda (hero foto arch + fitur + langkah + template + testimoni monogram + FAQ akordeon + CTA), Template (foto kategori + harga + demo-link aman), Portofolio (empty-state elegan), Layanan (tier jujur dari katalog + proses), Tentang (foto + nilai), Kontak (kartu info + jam). Foto via manifest `config/companyImages.ts` (`src/assets/company/`, glob + fallback gradien; prompt di `docs/COMPANY_PHOTOS.md`; `public/og-share.jpg` untuk meta). Animasi GSAP reuse (`slideUp`/`fadeIn`/`useScrollReveal`, reduced-motion patuh). SEO: og:image global, alt ID, dimensi+lazy, JSON-LD org/FAQ.
- [x] **Fase 6 — Polish (parsial)**: pagination semua list admin; preview WA via `workers/wa-preview.js` (paste ke dashboard CF, tanpa CLI) + `supabase/functions/invite-preview` + `docs/WA_PREVIEW.md`; `public/_redirects` + `_headers`; satu sumber SEO (`copy.site`); dimensi/lazy/fetchpriority gambar; `sitemap.xml` dinamis dari `SITE_URL` env. Sisa: pecah renderer, Lighthouse ≥90 di perangkat nyata.
- [x] **Fase 7 — Portal pasangan (kode selesai)**: magic link, area `/pasangan/*` (dashboard pantau + detail + kelola via full builder: hadir/tidak/belum-respons, ucapan, hadiah, salin tautan, revisi via WA), RLS pemilik berbasis email (migrasi `010`). Tinggal dijalankan user: `010` + tambah Site URL `/pasangan` di Auth URL config + buat user pasangan per pelanggan.
- [x] **Fase 8 — Paket + kelola mandiri (Opsi B hirarkis, kode selesai)**: paket `basic|premium|luxury` di order/undangan/katalog (`allowedThemes()`: premium buka basic+premium, luxury buka semua; hanya tema aktif); admin atur paket per tema di Tema, buat kode akses `TJ-XXXX-XXXX` (wajib **lunas + undangan sudah dibuat admin**) di detail order; customer tukar kode di `/pasangan/masuk`. **Aturan struktural**: pelanggan **tidak bisa** tambah/hapus/duplikat undangan — 1 undangan dibuat admin saat order; customer hanya bisa edit isi (termasuk ganti tema sesuai paket) + pantau; `invitationService.create/remove/duplicate` digate admin. Migrasi `012_tier_codes.sql` (tier + `access_codes` + RLS owner tulis-isi saja, tanpa insert/delete/link undangan + RPC redeem). Tinggal dijalankan user: `012` di SQL editor. Uji: `npm test` 20/20.
- [x] **Fase 10 — Portal couple dibedakan (2026-10-09)**: `/pasangan/masuk` kode akses + email sebagai pintu utama (magic-link jadi fallback); header `Portal Pasangan` + badge; builder couple hanya 9 section isi (`COUPLE_BUILDER_KEYS`: couple/events/gallery/music/theme/rsvp/messages/gift/publish, tanpa basic/seo/share/story) via `BuilderSidebar :keys`; `SectionPublish` sembunyikan nominal order untuk couple + tautan pratinjau ke `/invite/:slug` (bukan `/admin/...`); link admin di `SectionRsvp/Messages/Gift` hanya tampil untuk admin. Couple boleh edit isi + ganti tema sesuai tier + pantau tamu/ucapan/hadiah; tidak boleh hapus/duplikat/tambah undangan, tidak bisa buka customer/order/admin. `typecheck` bersih, `test` 20/20, `build` sukses.
- [x] **Fase 11 — Kode login reusable + tier harga + form rapi (2026-10-09)**: **login couple kode+email tanpa verifikasi, reusable** (`accessCodeService.loginWithCode` → RPC `validate_access_code`, sesi lokal `talijiwa:code-session`, fallback RPC redeem lama bila `014` belum jalan; `stores/auth.loginWithCode` bersihkan sesi admin agar tak mental ke `/admin`). **Tema grouping per tier** di `Themes.vue` (3 grup + form harga paket `RupiahInput`; `theme_catalog.code` kode fixed CLS/MNM/… + `tier_prices`). **OrderForm**: tema difilter `allowedThemes(tier)` + reset saat ganti tier, `amount` otomatis harga tier (non-retroaktif, badge harga khusus + tombol Samakan), select pakai `SearchableSelect` (customer/invitation/tema) + `RupiahInput` (amount/paid/bayar). **OrderDetail diperkaya**: tema+kode, tautan, tanggal publish, Hari-H + hitung mundur, daftar acara, stat tamu/ucapan/hadiah, kode reusable + last_used. Migrasi `014_code_tier.sql`. Helper `resolveThemePrice/parseRupiah/isCustomAmount` + 6 test baru. `typecheck` bersih, `test` 24/24, `build` sukses.
- [x] **Fase 9 — Audit hardening (2026-10-09)**: perbaiki `PublicLayout` typo (`coupleLoginRouterLink` → `coupleLogin`, menu mobile samakan); `workers/wa-preview.js` valid JS + secret via env dashboard (tidak ada hardcode URL/key); pembayaran atomik via RPC `record_payment`/`remove_payment` (`009`, service pakai `rpc()`); rate-limit publik ganda (throttle klien `utils/rateLimit.ts` + RPC `check_public_rate_limit`, migrasi `013`) + throttle view 30 detik; analitik agregasi server `invitation_daily_series` (fallback path lama bila RPC belum deploy); `CountdownTimer` hemat baterai (berhenti saat done/hidden); error panel hanya dev; test rate-limit baru. `typecheck` bersih, `test` 20/20, `build` sukses, `npm audit` 0 high+.


## Cara menambah…

- **Tema baru**: `docs/THEMING.md`.
- **Section builder baru**: `docs/BUILDER.md`.
- **Section undangan baru**: tambah key di `SECTION_KEYS` + label di `sectionLabels` + blok `<section data-sec="…">` di renderer + default di `defaultSettings()`.

## Definition of done (per perubahan)

- `npm run typecheck` dan `npm run build` lulus.
- Teks baru berbahasa Indonesia dan terpusat.
- Tidak ada `v-html` dengan data pengguna; reduced-motion tetap bekerja.
- Dokumen terkait (file ini / `docs/*`) diperbarui bila keputusan atau struktur berubah.
