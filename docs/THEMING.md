# Theming

Tema adalah data. Satu `ThemeDefinition` menghasilkan CSS variables `--inv-*` yang dipakai seluruh komponen undangan.

Roster saat ini: **kosong** (reset 2026-10-12 — `floral` + `jawa` dihapus total, gambar di `src/assets/images/` dipertahankan). Tema dibangun ulang satu per satu dari pola aset baru:

```text
src/assets/images/{theme}/{theme}-{motif}-{slot}[-{pos}]-{nn}.webp
```

Contoh: `src/assets/images/jawa-village/jawa-village-jasmine-corner-tl-01.webp`.
Satu manifest per tema (`src/themes/<id>/assets.ts`) adalah source of truth agar AI tidak menebak path.

## Token

`bg, surface, text, muted, accent, accentContrast, border, fontHeading, fontBody, radius, coverOverlay`, ditambah `decor` (`float | petals | sparkle | none`) dan `swatches` (empat warna untuk kartu pemilih).

| Tema | Dekorasi | Palet |
|---|---|---|
| _(kosong — tema pertama: `jawa-village`)_ | `none` | netral krem/emas |

## Menambah tema

1. `src/themes/<id>/index.ts` + `src/themes/<id>/assets.ts` (manifest impor WebP pola baru).
2. Daftarkan di `src/themes/index.ts` (`themes` record). `ThemeId`/`OrnamentKind` bebas (string) — tidak perlu edit `types/index.ts`. Pemilih tema, builder, dan renderer ikut otomatis.
4. Bila butuh ornamen khusus: tambah kind ke `OrnamentKind`, buat `ornaments/OrnamentX.vue`, daftarkan di `ornaments/types.ts`, tambah CSS `orn-x-*` di `assets/invitation.css`.
5. Database: `insert into theme_catalog (theme, code, tier, category, is_active, price, position) values ('sunset', '…', 'basic', '…', true, 149000, N)` (kolom `theme` bertipe text, tanpa enum).
6. Bila memakai font baru, tambahkan di `index.html` (Google Fonts) atau self-host.

## Aturan

- Komponen undangan tidak boleh memakai warna literal dari tema; pakai `var(--inv-*)` atau class `.inv-*`.
- Pastikan kontras teks/latar memenuhi WCAG AA di setiap tema.
- Dekorasi harus ringan: ≤14 elemen, hanya `transform`/`opacity`, disembunyikan saat `prefers-reduced-motion`.

## Style overrides (builder)

`InvitationStyle` (`types/index.ts`) menyimpan override per undangan di `invitation_settings.style` (jsonb, semua field opsional, kosong = ikuti tema):

`accent, text, muted, surface` (hex) · `font` (judul) · `fontBody` (isi, tanpa script) · `headingScale` (`s | m | l`, class `inv-h-*` di `invitation.css`) · `animation` · `intro`.

Renderer menerapkan override sebagai CSS variables (pola yang sama seperti `accent`). Mengganti tema mereset `accent/text/muted/surface` ke palet tema baru (bisa diurungkan). Kontras teks/latar diperiksa langsung di builder (`contrastRatio`, warning bila rendah).

## Font

Heading: Playfair Display / Cormorant Garamond. Body: Inter. Disetel per tema lewat `fontHeading` dan `fontBody`. Untuk performa produksi, pertimbangkan self-host dan subset.

## Tema: central-java-village (2026-10-12)

Aset sumber `src/assets/images/central-java-village-theme/` (15 PNG, ~30 MB, dipertahankan).
Hasil `node scripts/optimize-cjv-assets.mjs` (butuh `cwebp` di PATH, tanpa dependensi npm)
ke `src/assets/images/central-java-village/` (28 WebP q82 frame / q78 decor, ~5,9 MB):

| Nama | Asal | Ukuran deliver |
|---|---|---|
| `bg-village-mountain` | `bg-village-montaine.PNG` (typo diperbaiki) | 1536×1024, canvas penuh (25px transparan di atas → gradasi sky di bawahnya) |
| `clouds` | `claude.PNG` (nama menyesatkan) | 2119×711 |
| `gebyok-frame` | `gebyok-jasmine.PNG` | 1312×1199, **canvas tidak di-trim** |
| `hanging-lamp` | `java-hanging-lamp.PNG` | 1247×1204 |
| `crown-ornament` | `mahkota-ornamen.PNG` | 1742×832 |
| `jasmine-pair-top` | `jasmine-decoration.PNG` | 1268×1223 |
| `jasmine-corner-tl` | `jasmine-top-left-decoration.PNG` | 1219×1216 (sisi kanan mirror via CSS) |
| `jasmine-corner-bl` | `jasmine-bottom-left-decoration.PNG` | 1192×1317 |
| `batik-leaf-bl` | `batik-flower-bottom-left.PNG` | 1009×1198 |
| `flower-strand` | `flower ronce.PNG` (spasi dihapus) | 616×1536, menempel tepi kiri |
| `ronce-tassel` | `ronce-jasmine.PNG` | 682×1538 |
| `monument-pair` | `wedding-jasmine-monument.PNG` | 1535×964 |
| `pelaminan-seat` | `wedding-seat.PNG` | 1494×991 |
| `wedding-floor` | `wedding-place.PNG` | 1536×730 (296px kosong di atas di-trim) |

`jasmine-top-right-decoration.PNG` (RGB, tanpa alpha) **tidak dipakai**.

Konstanta terukur (`assets.ts`, diverifikasi skrip, bukan kira-kira):
`GEBYOK_OPENING = { x: 0.19, y: 0.245, w: 0.62, h: 0.735 }` (fraksi canvas 1312×1199,
terbuka di bawah); `SEAT_BALUSTRADE_Y = 0.666`; `FLOOR_TOP_Y = 0.479` (fraksi gambar
_deliver_ yang sudah di-trim). Kritis 768/480 ≈ 483 KB (≤ 1,2 MB); total ≤ 6 MB.

Struktur: `src/themes/central-java-village/` (`index.ts` definisi, `assets.ts`
manifest generate, `GebyokGate.vue` intro privat-tema, `theme.css` seluruh dressing
section via `.inv-t-central-java-village` + `data-sec`, tanpa `bgImage` (adegan desa
hanya di gate + hero, bukan tile di belakang teks). Gate 2 fase: kartu pembuka
(nama + tamu + tombol) di atas kolom konten 30% → tap merakit tableau
(gunung, monumen, floor, pelaminan, lampion, gebyok, asal zoom dari tengah
`GEBYOK_OPENING`) → serah terima ke foto mempelai di hero 70%. Hero sampul persisten
`inv-side` (opt-in `sidePanel`, render generik di renderer, sama di builder /
preview / publik): hero atas di container < 64rem, sticky 70% + konten 30% di
≥ 64rem via container query (ikut lebar frame device, bukan viewport). Tambahan
renderer: cabang `gebyok` di `InvitationCover`, class `inv-content` + kondisi
cover statis (sidePanel menyembunyikannya di preview non-Uji agar tak duplikat
hero), dan class `inv-petal/inv-drop/inv-spark` di `DecorLayer` agar
bisa di-style per tema. Demo: `/invite/demo-central-java-village` + migrasi `020`.

Ekstensi whitelist (dilaporkan, minimal): `IntroKind + 'gebyok'`, label builder
"Gerbang gebyok", `ThemeDefinition.sidePanel?: boolean`, satu copy key
`invitation.gateEyebrow`. `decor` reuse `petals`; `reveal` reuse `rise`;
`ornament` string bebas (`gebyok-gate`); font reuse yang sudah dimuat
(Cormorant Garamond + Great Vibes + Inter).
