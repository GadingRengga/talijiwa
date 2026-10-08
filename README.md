# Talijiwa

Sistem internal untuk bisnis **undangan pernikahan digital** (bukan SaaS): satu pemilik, satu admin.

Tiga area dalam satu aplikasi Vue 3:

| Area | Route | Status |
|---|---|---|
| Admin panel | `/login`, `/admin/*` | Pelanggan, undangan, **builder lengkap**, dashboard dasar |
| Company profile | `/`, `/templates`, `/portfolio`, … | Kerangka (Home, Templates, Portfolio berfungsi; sisanya placeholder) |
| Undangan publik | `/invite/:slug` | Berfungsi: cover GSAP, 11 bagian, 4 tema, RSVP, ucapan, amplop digital |

> Saat ini semua data memakai **mock lokal** (`localStorage`). Skema Supabase + RLS sudah ada di `supabase/migrations`, tetapi adapter Supabase di `src/services/*` belum ditulis (Fase 2).

## Menjalankan

```bash
npm install
cp .env.example .env      # VITE_USE_MOCK=true sudah cukup untuk mencoba
npm run dev               # http://localhost:5173
```

Login admin (mode mock): `admin@talijiwa.id` / `admin123`

Skrip lain: `npm run typecheck`, `npm run build` (`vite-ssg`: 6 halaman company di-prerender jadi HTML statis + meta/OG/canonical/JSON-LD per halaman), `npm run preview`.

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
├── services/         customers, invitations, rsvp, analytics, mock, supabase
└── themes/           classic, minimal, floral, luxury (+ registry)
supabase/migrations/  001_schema, 002_rls, 003_storage
docs/                 ARCHITECTURE, BUILDER, THEMING, DATABASE
project.md            konteks untuk AI coding assistant
```

## Dokumentasi

- [`project.md`](./project.md): aturan dan konteks proyek (berikan ke AI assistant).
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): lapisan, alur data, konvensi.
- [`docs/BUILDER.md`](./docs/BUILDER.md): cara kerja builder dan cara menambah section.
- [`docs/THEMING.md`](./docs/THEMING.md): cara menambah tema.
- [`docs/DATABASE.md`](./docs/DATABASE.md): skema, RLS, storage, admin pertama.

## Beralih ke Supabase (Fase 2)

1. Buat project Supabase, **matikan sign-up publik** (Authentication → Providers → Email → *Allow new users to sign up* off).
2. Jalankan `supabase/migrations/001…003` berurutan.
3. Buat user admin di Authentication, lalu daftarkan sebagai admin (lihat `docs/DATABASE.md`).
4. Isi `.env`: `VITE_USE_MOCK=false`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. **Jangan pernah** memakai service role key di frontend.
5. Tulis adapter Supabase di `src/services/*` (titik masuknya sudah ditandai `notImplemented`).

## Yang belum ada / belum diuji

- Belum diuji di browser sungguhan atau di HP asli; yang sudah diverifikasi: `vue-tsc` bersih dan `vite build` sukses.
- SQL di `supabase/migrations` belum dijalankan di database; uji RLS sebelum dipakai (lihat `docs/DATABASE.md`).
- Upload gambar di mode mock menyimpan data URL terkompresi di localStorage (kuota ±5 MB). Supabase Storage menggantikannya di Fase 2.
- Halaman RSVP, Ucapan, Hadiah, Analitik, dan Pengaturan masih `ComingSoon`; service-nya sudah siap.
- Link preview WhatsApp (SPA tidak dirender crawler) butuh prerender atau edge function; belum dikerjakan.
