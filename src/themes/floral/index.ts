import type { ThemeDefinition } from '@/types'

export const floral: ThemeDefinition = {
  id: 'floral',
  name: 'Romantic Floral',
  description: 'Blush, sage, dan mawar dengan kelopak yang melayang pelan.',
  intro: 'blossom',
  reveal: 'rise',
  ornament: 'bouquet',
  decor: 'petals',
  swatches: ['#fbeeee', '#fffaf6', '#8aa190', '#c4687b'],
  tokens: {
    bg: '#fbeeee',
    surface: '#fffaf6',
    text: '#4b3b3f',
    muted: '#8f7b80',
    accent: '#c4687b',
    accentContrast: '#ffffff',
    border: '#f0d4d8',
    fontHeading: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '18px',
    coverOverlay: 'linear-gradient(180deg, rgba(138,161,144,.25), rgba(75,59,63,.7))',
  },
}
