import type { ThemeDefinition } from '@/types'

export const sinematik: ThemeDefinition = {
  id: 'sinematik',
  name: 'Cinematic Night',
  description: 'Panel 3D berputar ke samping mengungkap malam sinematik, biru tua dengan kilau bintang.',
  intro: 'cube',
  reveal: 'stagger',
  decor: 'sparkle',
  swatches: ['#0c1424', '#e8edf7', '#7fa8ff', '#1d2b4a'],
  tokens: {
    bg: '#0c1424', surface: '#14203a', text: '#e8edf7', muted: '#9aa8c4', accent: '#7fa8ff', accentContrast: '#0c1424', border: '#1d2b4a',
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '6px',
    coverOverlay: 'linear-gradient(180deg, rgba(12,20,36,.25), rgba(12,20,36,.92))',
  },
}
