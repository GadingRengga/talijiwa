import type { ThemeDefinition } from '@/types'

export const watercolor: ThemeDefinition = {
  id: 'watercolor',
  name: 'Watercolor',
  description: 'Noda cat air pastel yang mengalir, undangan terbuka dengan iris lembut.',
  intro: 'iris',
  reveal: 'rise',
  ornament: 'wash',
  decor: 'none',
  swatches: ['#fdfaf6','#ffffff','#d98c8c','#a9c8d4'],
  tokens: {
    bg: '#fdfaf6', surface: '#ffffff', text: '#4b3f45', muted: '#8a7b82', accent: '#c9747f', accentContrast: '#ffffff', border: '#eadbd8',
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '18px',
    coverOverlay: 'linear-gradient(180deg, rgba(75,63,69,.1), rgba(75,63,69,.62))',
  },
}
