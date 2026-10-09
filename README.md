# Talijiwa

Sistem internal untuk bisnis **undangan pernikahan digital** (bukan SaaS): satu pemilik, satu admin.

Tiga area dalam satu aplikasi Vue 3:

| Area | Route | Status |
|---|---|---|
| Admin panel | `/login`, `/admin/*` | Pelanggan, pesanan + pembayaran, undangan, **builder lengkap**, RSVP/ucapan/hadiah, analitik, tema, pengaturan situs |
| Company profile | `/`, `/templates`, `/portfolio`, … | Lengkap + foto + animasi + SEO prerender |
| Undangan publik | `/invite/:slug` | Berfungsi: cover GSAP, 11 bagian, 11 tema, RSVP, ucapan, amplop digital |
| Portal pasangan | `/pasangan/*` | Read-only: pantauan hadir, ucapan, hadiah (magic link) |

> Data memakai **mock lokal** (`localStorage`) bila `VITE_USE_MOCK=true`. Adapter Supabase di `src/services/*` sudah lengkap (auth, customers, invitations, rsvp, analytics, orders, katalog, konten, storage); isi `.env` dan jalankan migrasi `001…015` untuk mode produksi.

## Menjalankan

```bash
npm install
cp .env.example .env      # VITE_USE_MOCK=true sudah cukup untuk mencoba
npm run dev               # http://localhost:5173
```

Login admin (mode mock): `admin@talijiwa.id` / `admin123`

Skrip lain: `npm run typecheck`, `npm run build` (`vite-ssg`: 6 halaman company di-prerender jadi HTML statis + meta/OG/canonical/JSON-LD per halaman), `npm run preview`, `npm test` (vitest, util murni).

## Deploy (hosting statis)

`dist/` berisi `index.html` + `about/contact/portfolio/services/templates.html` (prerender) + `robots.txt` + `sitemap.xml` (dibangkitkan saat build) + `_redirects` + `_headers`.
`public/_redirects` menangani SPA fallback (`/invite/*`, `/admin/*`, `/pasangan/*` → `/index.html`).
Domain produksi: `SITE_URL=https://domain-anda.com npm run build` (default `https://talijiwa.id`);
samakan juga `Sitemap:` di `public/robots.txt`. Worker preview WA: isi `workers/wa-preview.js` lalu paste ke dashboard Cloudflare (lihat file).

## Yang bisa dicoba sekarang

1. Login → **Undangan** → buka **Raka & Sinta** (draf) → isi data di builder.
2. Demo terbit: `/invite/demo-classic`, `/invite/demo-minimal`, `/invite/demo-floral`, `/invite/demo-luxury`.
3. Sapaan tamu: `/invite/demo-classic?to=Bapak%20Andi`.
4. Reset data mock: hapus key `talijiwa:mock:v1` di localStorage.

## Struktur

```
src/
├── components/{admin,builder,company,invitation,ui}
├── composables/      useBuilder, useAnimation, useClipboard, useSeo, useToast
├── config/           company.ts (info bisnis), copy.ts (semua teks Indonesia)
├── layouts/          AdminLayout, PublicLayout
├── pages/{auth,admin,company,invitation}
├── router/ stores/ types/ utils/
├── services/         customers, invitations, rsvp, analytics, orders, payments, catalog, content, storage, mock, supabase
├── themes/           11 tema (+ registry)
supabase/migrations/  001_schema … 011_rebrand (+ seed_demo.sql, bootstrap_admin.sql)
docs/                 ARCHITECTURE, BUILDER, THEMING, DATABASE, COMPANY_PHOTOS, WA_PREVIEW
project.md            konteks untuk AI coding assistant
```

## Dokumentasi

- [`project.md`](./project.md): aturan dan konteks proyek (berikan ke AI assistant).
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): lapisan, alur data, konvensi.
- [`docs/BUILDER.md`](./docs/BUILDER.md): cara kerja builder dan cara menambah section.
- [`docs/THEMING.md`](./docs/THEMING.md): cara menambah tema.
- [`docs/DATABASE.md`](./docs/DATABASE.md): skema, RLS, storage, admin pertama.

## Beralih ke Supabase (produksi)

1. Buat project Supabase, **matikan sign-up publik** (Authentication → Providers → Email → *Allow new users to sign up* off).
2. Jalankan `supabase/migrations/001…015` berurutan (opsional: `seed_demo.sql`).
3. Buat user admin di Authentication, lalu daftarkan sebagai admin (`supabase/bootstrap_admin.sql`, lihat `docs/DATABASE.md`).
4. **Aktifkan Anonymous sign-ins** (Authentication → Providers → Anonymous) — wajib untuk login pasangan via kode.
5. Isi `.env`: `VITE_USE_MOCK=false`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. **Jangan pernah** memakai service role key di frontend.

## Yang belum ada / belum diuji

- Belum diuji di HP asli; yang sudah diverifikasi: `vue-tsc` bersih, `vite build` sukses, dan audit headless (tanpa error console, tanpa overflow, reduced-motion patuh).
- Uji RLS manual (`docs/DATABASE.md`) tetap wajib sebelum produksi; uji API lolos 12/12 (2026-10-07).
- Upload gambar di mode mock menyimpan data URL terkompresi di localStorage (kuota ±5 MB). Mode produksi memakai Supabase Storage.
- Link preview WhatsApp: kode edge function + worker siap (`docs/WA_PREVIEW.md`, `workers/wa-preview.js`), tinggal deploy manual.
