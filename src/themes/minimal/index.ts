import type { ThemeDefinition } from '@/types'

export const minimal: ThemeDefinition = {
  id: 'minimal',
  name: 'Minimal Modern',
  description: 'Putih bersih, hitam tegas, dan ruang kosong yang lega.',
  intro: 'split',
  reveal: 'rise',
  ornament: 'lines',
  decor: 'none',
  swatches: ['#ffffff', '#111111', '#8a8a8a', '#e9e2d6'],
  tokens: {
    bg: '#ffffff',
    surface: '#f5f3ef',
    text: '#111111',
    muted: '#7a7a7a',
    accent: '#111111',
    accentContrast: '#ffffff',
    border: '#e4e0d8',
    fontHeading: "'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '0px',
    coverOverlay: 'linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.6))',
  },
}
