# Invitation Builder

Halaman: `src/pages/admin/InvitationEdit.vue`. Logika: `src/composables/useBuilder.ts`. Form: `src/components/builder/Section*.vue`.

## Layout

```
≥1280px   [ Sidebar | Form | Pratinjau ]
1024–1279 [ Sidebar | Form atau Pratinjau (tab) ]
<1024     [ Chip bagian ]  Form atau Pratinjau (tab)
```

Header: kembali, judul, status simpan, tab Edit/Pratinjau, pratinjau penuh, salin tautan, Simpan, Publikasikan.

## State machine

```
load ─► saved ─(edit)─► dirty ─(1.5 dtk / Ctrl+S)─► saving ─► saved
                                                     └────► error
```

- `draft` = salinan kerja dari `invitationService.get`. Satu deep watcher menandai `dirty` dan menjadwalkan autosave (debounce 1.5 dtk). Flag `ready` mencegah watcher terpicu oleh proses load/save.
- `save()` memvalidasi slug (format + belum dipakai), memanggil `invitationService.save`, lalu `store.replace`.
- Meninggalkan halaman: `onBeforeRouteLeave` mencoba menyimpan dulu; jika masih belum tersimpan → `confirm`. `beforeunload` melindungi penutupan tab.

## Slug

- Otomatis dari judul (`slugify`) selama belum diedit manual. Mengedit slug mengunci sinkronisasi; tombol **Ikuti judul** mengembalikannya.
- Ketersediaan dicek debounce 400 ms (`slugState`: idle / checking / ok / taken / invalid). Kata dicadangkan ada di `RESERVED_SLUGS`.

## Publikasi

`issues` (computed) memuat `error` (memblokir) dan `warning`:

| Level | Aturan |
|---|---|
| error | judul, slug valid dan tersedia |
| error | nama kedua mempelai |
| error | ≥1 acara dengan tanggal dan tempat |
| error | musik aktif tetapi tautan kosong |
| warning | foto mempelai belum lengkap |
| warning | galeri kosong (cover memakai gambar bawaan) |

Daftar di bagian **Publikasi** dapat diklik untuk melompat ke bagian yang bermasalah. `publish()` menyimpan dulu, lalu `store.setStatus(id, 'published')`.

## Pratinjau langsung

`InvitationRenderer` (mode `preview`) membaca `draft` yang sama secara reaktif. Tanpa gerbang cover, tanpa animasi scroll, form dinonaktifkan. Memilih bagian di sidebar menggulirkan pratinjau ke blok terkait (`previewTarget` di `InvitationEdit.vue`).

## Menambah section builder

1. Buat `components/builder/SectionXyz.vue`:
   ```vue
   <script setup lang="ts">
   const inv = defineModel<InvitationData>({ required: true })
   // opsional: const b = inject(BUILDER_KEY)!
   </script>
   <template><BuilderSection title="…">…</BuilderSection></template>
   ```
2. Tambah key ke `BuilderKey` dan daftar `items` di `BuilderSidebar.vue`, label di `copy.builder.sections`.
3. Daftarkan di `views` dan (opsional) `previewTarget` pada `InvitationEdit.vue`.
4. Bila butuh data baru: tambah field di `types/index.ts`, default di `utils/invitation.ts`, dan kolom/tabel di migration.

## Komponen yang dipakai ulang

`ImageUploader` (satu foto, drag-drop, kompres), `GalleryManager` (multi-upload, drag-urut, tombol geser, cover), `EventEditor`, `StoryEditor`, `ThemeSelector`, `FormField` (label + error + hint), `ToggleSwitch`.

## Gaya, urutan, dan pratinjau interaktif

- `settings.style` (`accent`, `text`, `muted`, `surface`, `font`, `fontBody`, `headingScale`, `animation`, `intro`) dan `settings.section_order` disimpan di `invitation_settings` (migration `005`). Keduanya opsional: data lama tetap valid (`resolveStyle` / `resolveOrder` di `utils/invitation.ts`).
- Bagian **Tema & gaya** (`SectionTheme.vue`) memakai satu alur scroll: Tema → pratinjau gaya live → Teks (warna + font judul/isi + ukuran) → Aksen → Latar kartu → Animasi → Urutan. Warni via `StyleColorInput.vue` (preset tema + kurasi + custom, tombol "Ikuti tema" per field).
- Renderer menerapkan override sebagai CSS variables; urutan section memakai `order` pada wrapper flex. Tingkat animasi `light` mematikan ornamen dan pembuka khusus, `off` mematikan semua gerakan.
- Pratinjau: pilihan Ponsel/Tablet, tombol Putar ulang (memutar pembuka lalu mengembalikannya), dan klik blok untuk membuka form yang sesuai (`pickMap` di `InvitationEdit.vue`).

## Undo/redo, crop, bagikan, panduan

- `composables/useHistory.ts`: riwayat draft (digabung per 500 ms; status/published_at/updated_at tidak ikut dikembalikan). Pintasan Ctrl+Z, Ctrl+Shift+Z/Ctrl+Y (tidak aktif saat mengetik di input), Alt+←/→ pindah bagian.
- `ImageCropper.vue`: potong foto (seret, zoom, panah keyboard) untuk foto mempelai, kisah, dan galeri.
- Bagian **Bagikan** (`SectionShare.vue`): tautan `?to=Nama` per tamu, pesan WhatsApp bertemplate, QR (pustaka `qrcode`, dimuat saat dibutuhkan). Disimpan di `settings.guest_names` / `share_template` (migration `006`).
- Musik: tautan Google Drive otomatis diubah menjadi tautan unduhan langsung; galat putar ditampilkan. Aplikasi tidak menyertakan pustaka lagu (lisensi).
- Urutan section memakai pointer events (mouse, sentuh, pena) + tombol panah dan pengumuman `aria-live`.
- Mengganti tema mengembalikan warna aksen khusus ke palet tema baru (bisa diurungkan).
