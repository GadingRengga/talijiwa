# Theming

Tema adalah data. Satu `ThemeDefinition` menghasilkan CSS variables `--inv-*` yang dipakai seluruh komponen undangan.

## Token

`bg, surface, text, muted, accent, accentContrast, border, fontHeading, fontBody, radius, coverOverlay`, ditambah `decor` (`float | petals | sparkle | none`) dan `swatches` (empat warna untuk kartu pemilih).

| Tema | Dekorasi | Palet |
|---|---|---|
| Romantic Floral | petals (kelopak jatuh) | blush, krem, sage, mawar |

## Menambah tema

1. `src/themes/<id>/index.ts`:
   ```ts
   export const sunset: ThemeDefinition = { id: 'sunset', name: 'Sunset', description: '…', decor: 'float', swatches: [...], tokens: { ... } }
   ```
2. Tambahkan `'sunset'` ke `ThemeId` (`types/index.ts`).
3. Daftarkan di `src/themes/index.ts` (`themes` record). Pemilih tema, builder, dan renderer ikut otomatis.
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
