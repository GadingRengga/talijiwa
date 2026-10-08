# Link Preview WhatsApp (`/invite/:slug`)

Masalah: WhatsApp (dan crawler lain) tidak mengeksekusi Vue SPA, sehingga
tautan undangan tampil polos tanpa gambar/judul.

Solusi: Edge Function `invite-preview` (`supabase/functions/invite-preview/`)
menyajikan HTML kaya `og:*` untuk crawler, lalu me-redirect manusia ke
halaman undangan asli.

## Deploy

```bash
supabase functions deploy invite-preview
supabase secrets set SITE_URL=https://domain-anda.com
# SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY tersedia otomatis di Functions.
```

Fungsi menerima `?slug=`: `…/invite-preview?slug=raka-sinta`.

## Mengarahkan crawler ke fungsi

Pilih satu sesuai hosting:

1. **Vercel** (`vercel.json`): rewrite bersyarat user-agent bot —
   `"/invite/:slug"` → `"/api/invite-preview?slug=:slug"` (bungkus fungsi
   sebagai serverless, atau proxy ke URL Functions). Paling rapi: tautan
   yang disebar tetap `/invite/:slug`.
2. **Cloudflare Worker / reverse proxy**: jika UA mengandung
   `WhatsApp|facebookexternalhit|Twitterbot|TelegramBot`, proxy ke URL
   Functions; selain itu teruskan ke SPA.
3. **Tanpa kontrol hosting**: sebarkan URL fungsi langsung
   (`…/invite-preview?slug=…`). Pratinjau tampil, manusia tetap sampai ke
   undangan via redirect. Opsi darurat yang selalu bisa dipakai hari ini.

## Catatan

- Service role key hanya hidup di sisi server (function), tidak pernah ke browser.
- Cover diambil dari foto `is_cover`, fallback tanpa gambar bila kosong.
- Cache 1 jam (`max-age=3600`); setelah ganti cover, pratinjau baru
  mengikuti paling lambat 1 jam (atau redeploy/purge).
