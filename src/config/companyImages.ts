/**
 * Company photo manifest. Satu-satunya sumber daftar foto company profile.
 *
 * Cara pakai: taruh file dengan NAMA PERSIS di `src/assets/company/`, push,
 * rebuild — halaman otomatis memakai foto baru (URL ber-hash via Vite).
 * File belum ada = fallback gradien elegan (tidak ada gambar rusak).
 */
export interface CompanyImageSlot {
  /** Nama file persis di `src/assets/company/`. */
  file: string
  /** Alt bahasa Indonesia untuk SEO + aksesibilitas. */
  alt: string
  width: number
  height: number
}

export const COMPANY_IMAGES = {
  hero: { file: 'hero-couple.jpg', alt: 'Pasangan pengantin Indonesia berbusana krem di taman sore hari', width: 1600, height: 1000 },
  featureRsvp: { file: 'feature-rsvp.jpg', alt: 'Tangan memegang ponsel menampilkan konfirmasi kehadiran undangan digital', width: 900, height: 1100 },
  featureDesign: { file: 'feature-design.jpg', alt: 'Laptop menampilkan desain undangan pernikahan di atas meja kerja', width: 900, height: 1100 },
  featureShare: { file: 'feature-share.jpg', alt: 'Ponsel menampilkan chat WhatsApp berisi tautan undangan dan kode QR', width: 900, height: 1100 },
  catFloral: { file: 'theme-floral.jpg', alt: 'Contoh undangan digital tema floral di atas kain sutra', width: 800, height: 1000 },
  catAdat: { file: 'theme-adat.jpg', alt: 'Contoh undangan digital tema adat di atas kayu dengan bunga melati', width: 800, height: 1000 },
  catLuxury: { file: 'theme-luxury.jpg', alt: 'Contoh undangan digital tema mewah hitam emas dengan lilin', width: 800, height: 1000 },
  catModern: { file: 'theme-modern.jpg', alt: 'Contoh undangan digital tema modern minimalis di latar terang', width: 800, height: 1000 },
  about: { file: 'about-team.jpg', alt: 'Suasana studio kerja Talijiwa yang hangat', width: 1200, height: 800 },
} as const satisfies Record<string, CompanyImageSlot>

export type CompanyImageKey = keyof typeof COMPANY_IMAGES

/** Slot yang memakai ulang file slot lain (tanpa foto tambahan). */
export const COMPANY_IMAGE_ALIAS: Record<string, CompanyImageKey> = {
  catKlasik: 'hero',
  cta: 'hero',
  servicesBanner: 'catLuxury',
}

const modules = import.meta.glob<string>('../assets/company/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byFile: Record<string, string> = {}
for (const [path, url] of Object.entries(modules)) {
  const name = path.split('/').pop()
  if (name) byFile[name] = url
}

/** URL publik file, atau null bila file belum ditaruh. */
export function companyImageUrl(file: string): string | null {
  return byFile[file] ?? null
}

/** Meta + URL terpecahkan untuk satu slot (alias mengikuti slot aslinya). */
export function companyImage(key: string): (CompanyImageSlot & { src: string | null }) | null {
  const real = (COMPANY_IMAGE_ALIAS[key] ?? key) as CompanyImageKey
  const meta = (COMPANY_IMAGES as Record<string, CompanyImageSlot>)[real]
  if (!meta) return null
  return { ...meta, src: companyImageUrl(meta.file) }
}
