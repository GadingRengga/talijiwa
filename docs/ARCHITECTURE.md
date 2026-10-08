# Architecture

## Lapisan

```
pages/ ──► components/ ──► composables/ ──► stores/ ──► services/ ──► (mock | Supabase)
```

- **pages**: satu file per route; mengorkestrasi komponen dan memanggil store/service.
- **components**: `ui/` (generik), `admin/` (khusus admin), `builder/` (section form), `invitation/` (tampilan tamu), `company/`.
- **composables**: logika yang dibagi antar komponen (`useBuilder`, `useAnimation`, …).
- **stores (Pinia)**: cache daftar untuk lintas halaman. Pembacaan satu undangan di builder *tidak* lewat store; builder memegang `draft` sendiri lalu menyimpan lewat service dan memperbarui store (`store.replace`).
- **services**: satu-satunya pintu data. Setiap fungsi memanggil `guard()`/`notImplemented()` bila bukan mode mock.

## Pola service

```ts
export const invitationService = {
  async list() { guard('list'); return delay(clone(db().invitations)) },
  ...
}
```

Fase 2: ganti isi fungsi dengan pemanggilan `supabase` (dari `services/supabase/client.ts`) dan pertahankan tanda tangan fungsi. Komponen tidak berubah.

Pemetaan model frontend → tabel:

| `InvitationData` | Tabel |
|---|---|
| id, title, slug, status, theme, greeting, opening_text, closing_text | `invitations` |
| bride, groom | `invitation_couples` (role) |
| events | `invitation_events` |
| stories | `invitation_stories` |
| gallery | `invitation_gallery` |
| gifts | `gift_accounts` |
| settings | `invitation_settings` |

Adapter perlu menyatukan tabel-tabel itu menjadi satu `InvitationData` (dan memecahnya saat `save`). Simpan foto sebagai `image_path`, ubah ke URL publik saat membaca.

## Routing dan guard

- Rute `/admin/*` memakai `meta.requiresAuth`; `router.beforeEach` memeriksa `authStore` dan mengarahkan ke `/login?redirect=…`.
- Redirect pasca-login dibatasi ke path yang diawali `/admin` (mencegah open redirect).
- Semua halaman di-lazy-load (code splitting per route). Halaman publik tidak memuat kode admin.

## Undangan publik

`PublicInvitation.vue` → `invitationService.getBySlug` → status: `notfound` | `notpublished` (draf) | `unavailable` (arsip) | `ok`.
Halaman memakai `InvitationRenderer` (mode public), mengunci scroll sampai tamu menekan "Buka Undangan", memulai musik pada gesture itu, dan mencatat view (kecuali pratinjau admin).

Pratinjau admin (`/admin/invitations/:id/preview`) memakai komponen yang sama dengan `previewId`, sehingga draf pun bisa dilihat (dengan banner dan `noindex`).

## Keamanan (ringkas)

- RLS default-deny; admin = baris di `profiles`; publik hanya baca konten terbit dan insert-only ke tabel tamu (lihat `DATABASE.md`).
- Input tamu divalidasi di klien (UX) dan di DB (check constraint). Honeypot di setiap form publik; rate limit sisi server direkomendasikan (Edge Function) karena validasi klien bisa dilewati.
- Tidak ada `v-html` dengan data pengguna.

## Performa

- Route-level lazy loading; GSAP hanya dimuat oleh halaman yang memakainya.
- Gambar: kompres sisi klien (≤1000px, JPEG 0.72), `loading="lazy"`, `aspect-ratio` agar tanpa layout shift.
- Animasi hanya `transform`/`opacity`; dekorasi dijeda lewat `prefers-reduced-motion` (disembunyikan).
