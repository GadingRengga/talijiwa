/** Single source of truth for business info. Do not hardcode these elsewhere. */
export const company = {
  company_name: 'Talijiwa',
  company_description: 'Layanan undangan pernikahan digital yang elegan, interaktif, dan mudah dibagikan.',
  logo: '/logo.svg',
  favicon: '/favicon.svg',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER ?? '6281234567890',
  email: 'halo@talijiwa.id',
  instagram: 'talijiwa.id',
  address: 'Surakarta, Jawa Tengah, Indonesia',
  siteUrl: import.meta.env.VITE_SITE_URL ?? 'http://localhost:5173',
} as const

export function whatsappLink(message = 'Halo, saya tertarik memesan undangan pernikahan digital.'): string {
  return `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`
}
