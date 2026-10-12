import type { ThemeDefinition } from '@/types'
import jawaBg from '@/assets/images/bg-jawa-classic.jpg'

// Adat Jawa: classic gold-on-cream. Artwork: parchment background + gunungan
// gate tableau + janur/butterfly ornaments (all from assets, zero SVG drawing).
export const jawa: ThemeDefinition = {
  id: 'jawa',
  name: 'Adat Jawa',
  description: 'Gerbang gunungan asli yang merekah ke bingkai nama, foto, lalu undangan.',
  intro: 'gunungan',
  reveal: 'rise',
  ornament: 'jawa',
  decor: 'sparkle',
  bgImage: jawaBg,
  swatches: ['#f3e8d3', '#fbf5e8', '#3d2417', '#9a6b1e'],
  tokens: {
    bg: '#f3e8d3',
    surface: '#fbf5e8',
    text: '#3d2417',
    muted: '#7a6353',
    accent: '#9a6b1e',
    accentContrast: '#ffffff',
    border: '#ddc9a8',
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '14px',
    coverOverlay: 'linear-gradient(180deg, rgba(61,36,23,.68), rgba(61,36,23,.5) 34%, rgba(61,36,23,.68) 66%, rgba(61,36,23,.84))',
  },
}
