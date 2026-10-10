import type { ThemeDefinition } from '@/types'

export const celestial: ThemeDefinition = {
  id: 'celestial',
  name: 'Celestial',
  description: 'Kartu 3D terbalik mengungkap langit malam berbintang yang berkelip, nuansa ungu keperakan.',
  intro: 'flip',
  reveal: 'stagger',
  ornament: 'stars',
  decor: 'none',
  swatches: ['#0a0e23','#e9e6ff','#b79cff','#262a55'],
  tokens: {
    bg: '#0a0e23', surface: '#121734', text: '#e9e6ff', muted: '#9a9cc4', accent: '#b79cff', accentContrast: '#0a0e23', border: '#262a55',
    fontHeading: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '8px',
    coverOverlay: 'linear-gradient(180deg, rgba(10,14,35,.2), rgba(10,14,35,.9))',
  },
}
