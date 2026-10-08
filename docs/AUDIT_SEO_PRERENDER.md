# Audit Rendering & SEO — Talijiwa (Vue + Vite + vite-ssg, bukan Nuxt)

Tanggal audit: 2026-10-08. Metode: baca kode/konfigurasi aktual + inspeksi output `dist/`.
Catatan rute: undangan publik di app ini adalah **`/invite/:slug`** (bukan `/undangan/:slug`).
Semua jawaban di bawah memakai rute aktual; `/undangan/andi-rina` dibaca sebagai `/invite/andi-rina`.

---

## 1. Prerendering

**Library:** `vite-ssg@28.3.0` (devDependency). Bukan plugin Vite biasa — build dijalankan
via `npm run build` = `vue-tsc --noEmit && vite-ssg build` (`package.json`).

**Konfigurasi:** `vite.config.ts` → `ssgOptions`:

```ts
ssgOptions: {
  includedRoutes: (paths) => paths.map((p) => (p.startsWith('/') ? p : `/${p}`)).filter((p) => PRERENDER_ROUTES.includes(p)),
  onPageRendered: (route, html) => injectPrerenderMeta(route, html),
}
```

Daftar + injeksi meta: `src/config/seoPrerender.ts` (`PRERENDER_ROUTES`, `SITE`, `injectPrerenderMeta`).
Entry: `src/main.ts` memakai `ViteSSG(App, { routes }, setup)`; rute diekspor dari
`src/router/index.ts` (`export const routes`, guard via `registerGuards`).

**Route yang benar-benar diprerender (terbukti di output build, 6 halaman):**
`/`, `/about`, `/contact`, `/portfolio`, `/services`, `/templates`.

**Route dinamis `/invite/:slug` TIDAK diprerender.** Buktinya:
- `PRERENDER_ROUTES` hanya berisi 6 path statis (`seoPrerender.ts`).
- `dist/` tidak berisi HTML per slug (lihat bagian 2).
- `DefaultIncludedRoutes` bawaan vite-ssg pun mengecualikan path berparameter (`:`/`*`).

**Konsekuensi:**
- SEO: halaman undangan tidak punya konten di HTML awal → tidak terindeks bermakna,
  tidak dapat rich result, dan `sitemap.xml` memang tidak mencantumkannya (benar begitu).
- Direct URL: tetap bisa dibuka **user** asal hosting me-rewrite ke `index.html`
  (SPA fallback — yang saat ini **belum ada konfigurasinya di repo**, lihat bagian 7/11).

## 2. Hasil build (aktual, bukan contoh)

```
dist/
├── index.html        (34 KB — Beranda, prerender)
├── about.html        (5 KB)
├── contact.html      (4 KB)
├── portfolio.html    (4 KB)
├── services.html     (9 KB)
├── templates.html    (51 KB)
├── assets/           (JS/CSS ter-split per route)
├── robots.txt        (statis dari public/)
├── sitemap.xml       (statis dari public/)
├── favicon.svg
└── logo.svg
```

**Berbeda dari contoh di pertanyaan:** file berbentuk datar (`templates.html`, bukan
`template/index.html`) dan **tidak ada** folder `undangan/<slug>/index.html` karena
rute undangan tidak diprerender. Pola datar ini tetap valid untuk Cloudflare Pages
(clean URL `/templates` → `templates.html`).

Isi terverifikasi: `index.html` mengandung hero + FAQ + JSON-LD organisasi;
`templates.html` berisi 10 kartu tema aktif + harga (data live dari Supabase saat build —
tema `classic` yang dinonaktifkan di katalog otomatis hilang dari HTML). Setiap halaman
membawa `<title>`, meta description, canonical, dan OG unik via `onPageRendered`.

## 3. Dynamic SEO per undangan (runtime, bukan prerender)

Halaman undangan (`src/pages/invitation/PublicInvitation.vue` + `InvitationRenderer.vue`)
mengisi SEO **saat browser membuka halaman** via `src/composables/useSeo.ts`:

| Elemen | Status | Sumber data |
|---|---|---|
| `<title>` unik | ✅ | `seo_title` atau `"Label — Wedding Invitation"` (`coupleLabel`: judul/nickname) |
| meta description unik | ✅ | `seo_description` atau `"Undangan pernikahan Label."` |
| canonical URL | ✅ | `path: /invite/:slug` → `origin + path` |
| OG title/description | ✅ | sama seperti title/description |
| OG image | ✅ bersyarat | foto `is_cover` (dilewati bila `data:`) |
| Twitter Card | ✅ | `summary_large_image` + title/desc/image |
| favicon | ✅ | statis `/favicon.svg` dari `index.html` |
| structured data/schema.org | ❌ | tidak ada JSON-LD per undangan |
| `robots` noindex | ✅ | undangan preview admin / `seo_noindex` |

Kuncinya: semua ini ditulis dengan `document.*` **setelah JS jalan**. Lihat bagian 5–6
untuk siapa yang bisa melihatnya dan siapa yang tidak.

## 4. Supabase + prerender (dua waktu berbeda)

**Data undangan (`/invite/:slug`): diambil saat browser membuka halaman (runtime).**
`PublicInvitation.load()` dipanggil di `onMounted` → `invitationService.getBySlug` →
Supabase (atau mock). Build tidak tahu-menahu soal undangan.

**Data halaman company: diambil DUA kali.**
1. **Saat build** — halaman company memakai top-level `await` di `<script setup>`
   (`Home/Templates/Portfolio/Services/Contact`), sehingga render SSR vite-ssg menunggu
   Supabase lalu menuangkannya ke HTML statis.
2. **Saat browser membuka halaman** — `onMounted`/setup client memuat ulang dari
   Supabase/store dan memperbarui DOM (hidrasi + refresh).

**Jika data berubah setelah deploy:**
- Undangan (nama/foto/tanggal/lokasi/cerita): **langsung terlihat** di load berikutnya.
  Tidak perlu rebuild. Lifecycle: builder save → Supabase → public fetch saat buka.
- Konten company (CMS/katalog): pengunjung JS **langsung melihat baru** (fetch ulang),
  tetapi **crawler melihat versi basi** (snapshot build) sampai rebuild/redeploy.

**Fallback client-side:** ada di semua halaman company (`store.load().catch(...)`,
`Promise.allSettled`, `try/finally` + `EmptyState`). Build tidak pernah gagal hanya
karena Supabase tidak terjangkau — halaman ter-render kosong/parsial lalu diisi client.

## 5. Simulasi crawler Google → `/invite/andi-rina`

Asumsi hosting sudah me-rewrite ke `index.html` (tanpa itu: 404, lihat bagian 7).

**HTML awal yang diterima:** file `dist/index.html` = **halaman Beranda hasil prerender**
(judul "Undangan Pernikahan Digital Elegan — Talijiwa", hero, daftar template, FAQ,
canonical `https://talijiwa.id/`). Router client kemudian menukar ke halaman undangan.

- Nama pengantin di HTML awal? **Tidak.** Muncul setelah JS fetch Supabase + render.
- Tanggal/lokasi di HTML awal? **Tidak.**
- Meta SEO undangan di HTML awal? **Tidak** — yang ada meta Beranda (bahkan menyesatkan:
  canonical menunjuk `/`).
- Butuh JavaScript? **Ya, 100%.** Tanpa JS, crawler hanya melihat Beranda.

Googlebot *dapat* mengeksekusi JS (dengan antrean render + batas waktu), sehingga halaman
undangan **mungkin** terindeks parsial-terlambat — tidak dapat diandalkan untuk konten
yang berubah cepat, dan praktis tidak memberi peringkat untuk query nama pasangan.

## 6. Social sharing (WhatsApp/Facebook/Telegram) → `/invite/andi-rina`

**Tidak bisa, dari HTML statis.** Crawler sosmed tidak menjalankan JavaScript:

- Judul pasangan? ❌ (dapat judul generik Beranda)
- Deskripsi? ❌ (deskripsi Beranda)
- Foto utama? ❌ (tidak ada `og:image` undangan di HTML awal)

**Satu-satunya jalan yang sudah disiapkan repo:** Edge Function
`supabase/functions/invite-preview/index.ts` — menyajikan HTML `og:*` per slug untuk
crawler lalu me-redirect manusia ke undangan asli. Status: **kode selesai, belum deploy**
(petunjuk: `docs/WA_PREVIEW.md`). Sampai di-deploy + crawler diarahkan ke sana,
preview share WA/FB/Telegram tidak berfungsi.

## 7. Routing: SPA vs direct vs crawler (`/invite/andi-rina`)

Router memakai `createWebHistory` (`src/router/index.ts`). SPA fallback dikonfigurasi
di `public/_redirects` (hanya rute dinamis → `/index.html 200`) + `netlify.toml`
(mirror, menang bila keduanya ada); header cache di `public/_headers`.

| Akses | Hasil |
|---|---|
| Navigasi dari SPA (klik link di app) | ✅ router client menukar halaman, fetch data, normal |
| Direct URL di browser (ketik/tempel link) | ⚠️ **hanya jalan jika hosting me-rewrite `/*` ke `/index.html`**; tanpa itu = 404 di host statis |
| Crawler (Google/WA) direct URL | ⚠️ dapat shell/indeks-Beranda (atau 404), bukan konten undangan — lihat bagian 5–6 |

Yang harus ditambahkan di hosting: rewrite semua path tak dikenal ke `/index.html`
(pola `/* /index.html 200`), dengan file prerender + aset tetap disajikan langsung.

## 8. Lifecycle perubahan data (lengkap)

**Konten undangan** (nama, foto, tanggal, lokasi, cerita, RSVP, ucapan, hadiah):
`builder save()` → tulis Supabase (baris + tabel anak + upload Storage `invitations/{id}/…`)
→ halaman publik `fetch` ulang setiap dibuka → **langsung live, tanpa build ulang**.
RSVP/ucapan/konfirmasi tamu: insert publik langsung ke Supabase → terbaca admin/pasangan
saat halaman data dibuka ulang. Foto lama dihapus dari Storage saat diganti/dihapus;
folder undangan dibersihkan saat undangan dihapus (`storageService`).

**Konten company** (hero, SEO, testimoni, FAQ, harga/aktif/kategori tema):
Pengaturan admin → Supabase → pengunjung berikutnya langsung melihat baru (fetch client) →
**crawler** baru melihat baru setelah `npm run build` + deploy ulang.

**Kode/template/desain:** build + deploy ulang seperti biasa.

## 9. Performance: apa yang benar-benar dihemat prerender

- **Ukuran HTML awal:** Beranda 34 KB, Templates 51 KB — konten sudah di dalamnya,
  bukan cangkang kosong. LCP halaman company membaik nyata (teks/hero tak menunggu JS).
- **JavaScript yang tetap diperlukan:** seluruh bundle SPA tetap diunduh
  (`index-*.js` ~278 KB total; chunk per route via lazy import). Tidak ada yang dibuang.
- **Hydration, bukan HTML mati:** vite-ssg menghidrasi — Vue me-mount di atas HTML
  prerender, lalu `onMounted` fetch ulang data (mungkin menggeser sedikit DOM bila data
  live beda dari snapshot build — CLS kecil yang wajar).
- **Core Web Vitals:** LCP company ✅ membaik (konten + hero di HTML; gambar cover dari
  Supabase Storage tetap perlu dioptimasi — tanpa `width/height` eksplisit di beberapa
  `<img>`). INP ➖ tidak berubah (interaksi = JS yang sama). Halaman `/invite/*` dan
  `/admin/*` tidak mendapat manfaat prerender sama sekali (tetap CSR penuh).

## 10. Skalabilitas

| Skala undangan | Penilaian |
|---|---|
| 100 / 1.000 / 10.000 | ✅ **Tetap masuk akal** — jumlah halaman prerender **tetap 6**, tidak tergantung jumlah undangan. Tidak ada bottleneck build dari sisi undangan. |

Satu-satunya yang tumbuh: baris Supabase + file Storage (tugas database, bukan build).
Pendekatan ini justru yang benar untuk skala: **jangan prerender undangan**.
Jika suatu hari tiap undangan butuh HTML statis (mis. 10.000 halaman), barulah muncul
bottleneck: waktu build × N + beban Supabase saat build + rebuild tiap ada edit —
saat itu solusinya ISR/edge-SSR per slug (atau Nuxt), bukan prerender penuh.

## 11. Deployment Cloudflare Pages Free — cocok?

| Syarat | Status |
|---|---|
| HTML statis langsung diserve | ✅ `*.html` + aset tanpa proses server |
| Clean URL (`/templates` → `templates.html`) | ✅ didukung Pages |
| Dynamic route (`/invite/x`, `/admin/*`, `/pasangan/*`) | ✅ fallback via `public/_redirects` (+ `netlify.toml`) |
| Worker/Function | ❌ tidak wajib untuk app; hanya bila memakai `invite-preview` sebagai Pages Function/Worker atau proxy bot (lihat `docs/WA_PREVIEW.md`) |
| Caching | ✅ `public/_headers`: HTML revalidate, `assets/*` immutable, robots/sitemap 1 jam |
| Batas Free | ✅ aman: 6 halaman statis, tanpa build berat, tanpa function wajib |

Urutan deploy yang benar: `npm run build` → publish `dist/` (redirect + header ikut)
→ (opsional) deploy `invite-preview` untuk share WA.

## 12. Kesimpulan

| Dimensi | Nilai | Alasan satu baris |
|---|---|---|
| SEO | 7/10 | Company on-page + prerender + CMS kuat; undangan tak terindeks; sitemap generik (tanpa domain final) |
| Performance | 7/10 | LCP company terbantu HTML 34–51 KB; bundle ~278 KB tetap penuh; INP tak berubah; gambar tanpa dimensi eksplisit |
| Social sharing | 3/10 | Hari ini 0 untuk undangan (crawler tak eksekusi JS); kode edge function siap tapi belum deploy |
| Scalability | 9/10 | 6 halaman statis selamanya; undangan runtime (tepat); minus kecil: seed/.migrations manual |
| Maintainability | 8/10 | Pola service mock↔Supabase rapi, registry tema, docs lengkap; minus: duplikasi string SEO (`copy.site` vs `seoPrerender.ts`) dan 2 sumber fallback konten |

**5 improvement terpenting tanpa Nuxt:**

1. **Deploy `invite-preview` + arahkan crawler** (WA share 0→berfungsi; satu-satunya penutup lubang sosial).
2. ~~Tambah `public/_redirects` + `public/_headers`~~ — selesai (`public/_redirects`, `netlify.toml`, `public/_headers`).
3. ~~Satukan sumber SEO~~ — selesai (`seoPrerender.ts` impor dari `copy.site`).
4. ~~Gambar `width/height` + `fetchpriority`/lazy~~ — selesai di undangan + company. Sisa: AVIF/WebP via Storage transform + ukur LCP/INP lapangan.
5. ~~Sitemap dinamis~~ — selesai (plugin Vite dari `SITE_URL` env). Sisa: daftarkan Search Console.

---

## Diagram lifecycle (build-time vs runtime)

```
                        ┌──────────────┐
                        │   Supabase   │
                        │ (DB+Storage) │
                        └──────┬───────┘
                               │
               ┌───────────────┴────────────────┐
               │  BUILD-TIME (npm run build)    │  ← terjadi SEKALI per deploy
               │  1. vite build (bundle SPA)    │
               │  2. vite-ssg render 6 rute     │
               │     (fetch Supabase via Node)  │
               │  3. injeksi title/meta/OG/     │
               │     canonical/JSON-LD          │
               └───────────────┬────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   dist/*.html+assets │  ← HTML company berisi konten
                    └──────────┬──────────┘   snapshot build + meta crawler
                               ▼
                    ┌─────────────────────┐
                    │  Hosting statis     │
                    │  (Netlify/CF Pages) │  ← serve file / fallback ke
                    │  + _redirects       │    index.html via rewrite
                    └──────┬──────┬───────┘
                           │      │
              ┌────────────┘      └──────────────┐
              ▼                                  ▼
   ┌─────────────────────┐            ┌─────────────────────┐
   │ Google / WA / FB    │            │   User (browser)    │
   │ (tanpa JS)          │            │                     │
   │ • company: HTML     │            │  RUNTIME (setiap    │
   │   penuh ✅           │            │  buka halaman)      │
   │ • /invite/*: shell  │            │  1. Vue hidrasi     │
   │   Beranda saja ❌    │            │  2. fetch Supabase  │
   │   (butuh invite-    │            │     (data FRESH)     │
   │   preview ✅ bila   │            │  3. render + SEO     │
   │   deploy)           │            │     runtime (useSeo) │
   └─────────────────────┘            └─────────────────────┘
```

**Ringkasnya:** Supabase→Build→HTML hanya untuk **6 halaman company** (sekali per deploy,
bisa basi untuk crawler). Supabase→Browser langsung untuk **semua data undangan dan
refresh company** (setiap kunjungan, selalu fresh). Cloudflare hanya menyerve; Google/WA
tanpa JS hanya melihat snapshot build (company ✅, undangan ❌ tanpa edge function);
user dengan JS selalu melihat data terbaru.
