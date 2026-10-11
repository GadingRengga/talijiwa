# Prompt Pembuatan Tema (untuk AI eksternal tanpa akses repo)

File ini berisi prompt siap-copy ke AI lain yang tidak bisa melihat project.
AI eksternal hanya perlu menghasilkan **1 objek data** — integrasi dilakukan di sini
(lihat `THEMING.md`).

## Cara pakai

1. Ganti 4 slot `[KURUNG]` di prompt bawah sesuai tema yang kamu mau.
2. Copy seluruh isi blok `---` ke AI lain.
3. Terima outputnya (satu `export const`), simpan, lalu ikuti
   "Integrasi balik" di paling bawah.

---

```
Buatkan SATU file TypeScript data-only untuk tema undangan pernikahan digital.

KONTEKS
- Tema adalah 1 objek `ThemeDefinition`. Renderer memakai CSS variables
  `--inv-*` dari `tokens`, jadi kamu TIDAK perlu menulis komponen/CSS.
- Output HANYA kode TypeScript, tanpa penjelasan.

BENTUK WAJIB (ikuti persis, jangan tambah/hapus field):
\```ts
import type { ThemeDefinition } from '@/types'

export const [ID]: ThemeDefinition = {
  id: '[ID]',
  name: '[NAMA_TEMA]',
  description: '[1 kalimat Bahasa Indonesia]',
  intro: '[INTRO]',
  reveal: '[REVEAL]',
  ornament: '[ORNAMENT]',
  decor: '[DECOR]',
  swatches: ['[hex1]', '[hex2]', '[hex3]', '[hex4]'],
  tokens: {
    bg: '[hex]',
    surface: '[hex]',
    text: '[hex]',
    muted: '[hex]',
    accent: '[hex]',
    accentContrast: '[hex]',
    border: '[hex]',
    fontHeading: '[FONT_HEADING]',
    fontBody: '[FONT_BODY]',
    radius: '[RADIUS]',
    coverOverlay: '[OVERLAY]',
  },
}
\```

NILAI YANG BOLEH DIPAKAI (jangan mengarang di luar ini):
- intro: 'slide' | 'door' | 'curtain' | 'envelope' | 'zoom' | 'bloom' | 'gunungan' | 'iris' | 'split' | 'blossom' | 'flip' | 'cube'
- reveal: 'fade' | 'rise' | 'stagger' | 'mask'
- ornament: 'garden' | 'batik' | 'stars' | 'wash' | 'frame' | 'lines' | 'bouquet' | 'shine' | 'jawa'
- decor: 'float' | 'petals' | 'sparkle' | 'none'
- fontHeading: "'Playfair Display', Georgia, serif" ATAU "'Cormorant Garamond', Georgia, serif"
- fontBody: "'Inter', system-ui, sans-serif"
- radius: '2px' | '4px' | '12px' | '999px'
- swatches: tepat 4 hex (bg, surface, text, accent — urutan itu)
- coverOverlay: 'linear-gradient(180deg, [accent-dengan-alpha-.25], [text-dengan-alpha-.75])'
  contoh: 'linear-gradient(180deg, rgba(74,52,38,.25), rgba(74,52,38,.75))'

PERMINTAAN SAYA:
- id: '[ID]'
- name: '[NAMA_TEMA]'
- Gaya/palet: [GAYA_PALET, contoh: "sage green + krem, nuansa adat Sunda yang tenang"]
- Mood intro/ornament: [MOOD, contoh: "khidmat, tidak ramai — decor none, ornament lines"]

ATURAN:
1. Semua warna format hex 6 digit (#rrggbb).
2. Kontras text/bg dan accentContrast/accent harus lolos WCAG AA
   (rasio ≥ 4.5:1 untuk teks isi).
3. muted = versi pudar dari text, border = versi terang dari accent.
4. description 1 kalimat Bahasa Indonesia, tanpa kata "modern" bila gayanya tradisional.
5. Jangan output selain kode.
```

---

## Slot yang harus diganti

| Slot | Contoh |
|---|---|
| `[ID]` | `sunda` (lowercase, tanpa spasi) |
| `[NAMA_TEMA]` | `Adat Sunda` |
| `[GAYA_PALET]` | `sage green + krem, nuansa adat Sunda yang tenang` |
| `[MOOD]` | `khidmat — decor none, ornament lines` |

## Validasi sebelum dipakai (30 detik)

- [ ] Field persis seperti bentuk wajib, `id` == nama variabel.
- [ ] `intro/reveal/ornament/decor` ada di daftar nilai boleh.
- [ ] `swatches` tepat 4 hex.

## Integrasi balik (di repo ini)

1. Simpan sebagai `src/themes/<id>/index.ts`.
2. Tambah `'<id>'` ke `ThemeId` (`src/types/index.ts`).
3. Daftarkan di `src/themes/index.ts` (`themes` record).
4. Database: `alter type theme_id add value '<id>'`.

Detail: `THEMING.md`.
