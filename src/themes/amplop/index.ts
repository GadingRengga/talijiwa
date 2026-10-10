import type { ThemeDefinition } from '@/types'

export const amplop: ThemeDefinition = {
  id: 'amplop',
  name: 'Amplop Romantis',
  description: 'Amplop 3D terbuka dengan perspektif realistis memunculkan undangan, nuansa blush lembut.',
  intro: 'envelope',
  reveal: 'rise',
  decor: 'petals',
  swatches: ['#fbeeea', '#ffffff', '#b5535f', '#e9b8b4'],
  tokens: {
    bg: '#fbeeea', surface: '#fffaf8', text: '#4a2a2e', muted: '#8a6a6c', accent: '#b5535f', accentContrast: '#ffffff', border: '#efd2cf',
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '10px',
    coverOverlay: 'linear-gradient(180deg, rgba(74,42,46,.2), rgba(74,42,46,.75))',
  },
}
