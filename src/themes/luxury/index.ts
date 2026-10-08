import type { ThemeDefinition } from '@/types'

export const luxury: ThemeDefinition = {
  id: 'luxury',
  name: 'Luxury Gold',
  description: 'Hitam pekat dan gading dengan kilau emas yang halus.',
  intro: 'door',
  reveal: 'stagger',
  ornament: 'shine',
  decor: 'sparkle',
  swatches: ['#14100d', '#f3ecdc', '#d1ab5a', '#3a2a1c'],
  tokens: {
    bg: '#14100d',
    surface: '#1d1713',
    text: '#f3ecdc',
    muted: '#b3a58a',
    accent: '#d1ab5a',
    accentContrast: '#14100d',
    border: '#3a2a1c',
    fontHeading: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '2px',
    coverOverlay: 'linear-gradient(180deg, rgba(20,16,13,.35), rgba(20,16,13,.9))',
  },
}
