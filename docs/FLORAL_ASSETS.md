# Aset PNG — Romantic Floral #1

Daftar gambar yang dibutuhkan untuk mengangkat Floral #1 dari ornamen SVG ke
aset asli. Prioritas berurutan — kirim nomor 1 dulu pun sudah bisa dipasang.

## 1. Buket sudut (prioritas tertinggi)

File: `floral-bouquet-1.png` — dipakai di 4 sudut (kanan di-mirror otomatis).

```
Lush corner bouquet of blush pink garden roses, white anemones and sage foliage, diagonal arrangement fitting a top-left corner, dense and premium, color palette: blush pink #c4687b, cream white #fffaf6, sage green #8aa190, deep warm brown #4b3b3f for outlines only, isolated on transparent background, no shadow, no text, no watermark, soft vintage botanical illustration style
```

## 2. Strip garland horizontal

File: `floral-garland-1.png` — dipakai sebagai bingkai atas + bawah (mirror).

```
Wide horizontal garland border of blush pink roses, white blossoms and sage green leaves, flowers clustered densely at left and right ends fading toward the center, romantic wedding invitation border, color palette: blush pink #c4687b, cream white #fffaf6, sage green #8aa190, isolated on transparent background, no shadow, no text, no watermark, soft vintage botanical illustration style
```

## 3. Tangkai daun sisi

File: `floral-sprig-1.png` — dipakai di sisi kiri–kanan.

```
Elegant vertical sprig of soft sage green eucalyptus and rose leaves with two small blush pink rosebuds, slender curved stem, wedding invitation side ornament, color palette: blush pink #c4687b, cream white #fffaf6, sage green #8aa190, isolated on transparent background, no shadow, no text, no watermark, soft vintage botanical illustration style
```

## 4. Dedaunan gantung atas

File: `floral-hanging-1.png` — dipakai sebagai kanopi menggantung dari atas.

```
Hanging wedding greenery: trailing sage vines, soft leaves and tiny white blossoms dangling downward from top edge, airy and light, color palette: sage green #8aa190, cream white #fffaf6, blush pink #c4687b accents only, isolated on transparent background, no shadow, no text, no watermark, soft vintage botanical illustration style
```

## Ketentuan seragam

- **Transparan beneran** — minta file PNG transparan. Tool yang bisa
  transparan langsung: DALL-E 3, Adobe Firefly, Recraft.
- **Midjourney** tidak bisa transparan — tambahkan
  `isolated on solid pure white background` dan kirim apa adanya
  (background terang masih aman di tema Floral).
- **1024px persegi** cukup untuk semua — komposisi/slicing via CSS.
- **Tanpa teks & watermark** di dalam gambar.

## Serah-terima

1. Simpan file ke `src/assets/images/` dengan nama persis di atas.
2. Beri tahu asisten — verifikasi alpha → kompres WebP → pasang ke ornamen.

## Status (2026-10-11)

Semua 5 aset diterima, terverifikasi, dan terpasang: buket sudut,
garland atas–bawah, tangkai sisi, kanopi gantung, cover default.
Total WebP ±645 KB (sumber PNG/JPG tetap tersimpan).

Bonus: `floral-cover-1.png` (bingkai 4-sudut transparan) → `floral-frame-1.webp`
(165 KB) dipakai sebagai gerbang cover sinematik.

## 5. Gambar opening/cover

File: `floral-cover-1.jpg` — latar cover full-screen (foto, tidak perlu transparan).
Cover kita menaruh teks putih di tengah + overlay gelap, jadi tengah harus kosong.

Prompt utama:

```
Romantic wedding invitation cover background, portrait orientation, lush blush pink roses and white anemones framing all four edges with trailing sage eucalyptus, large soft empty center in warm cream tones for text overlay, dreamy soft-focus, gentle vignette darker toward bottom third, color palette: blush pink #c4687b, cream #fffaf6, sage green #8aa190, no people, no text, no watermark, soft vintage botanical photography style
```

Varian alternatif (lebih gelap, teks lebih terbaca):

```
Moody romantic floral backdrop for wedding invitation, portrait orientation, dark sage green foliage background with glowing blush pink roses clustered at top and bottom edges, empty dark center for white text, cinematic soft light, color palette: deep green #3c4a3e shadows, blush pink #c4687b highlights, no people, no text, no watermark
```

Ketentuan: portrait 3:4 atau 2:3 (ideal 1024×1536, cover full-screen HP),
tengah kosong untuk nama mempelai + nama tamu + tombol, tanpa orang/teks.
