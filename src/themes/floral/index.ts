import type { ThemeDefinition } from '@/types'
import floralCover from '@/assets/images/floral-cover-1.webp'

export const floral: ThemeDefinition = {
  id: 'floral',
  name: 'Romantic Floral',
  description: 'Gerbang bunga 3D yang terbuka ke bingkai nama, foto, lalu undangan.',
  intro: 'gate3d',
  reveal: 'rise',
  ornament: 'floral',
  decor: 'petals',
  coverImage: floralCover,
  swatches: ['#fbeeee', '#fffaf6', '#4b3b3f', '#a94e63'],
  tokens: {
    bg: '#fbeeee',
    surface: '#fffaf6',
    text: '#4b3b3f',
    muted: '#6f5f64',
    accent: '#a94e63',
    accentContrast: '#ffffff',
    border: '#f0d4d8',
    fontHeading: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '18px',
    coverOverlay: 'linear-gradient(180deg, rgba(75,59,63,.72), rgba(75,59,63,.55) 32%, rgba(75,59,63,.72) 66%, rgba(75,59,63,.85))',
  },
}
