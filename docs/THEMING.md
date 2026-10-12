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
