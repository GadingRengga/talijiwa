import type { ThemeDefinition } from '@/types'

export const garden: ThemeDefinition = {
  id: 'garden',
  name: 'Garden Bloom',
  description: 'Kelopak bunga yang mekar membuka undangan, dengan sulur tanaman yang tergambar perlahan.',
  intro: 'bloom',
  reveal: 'rise',
  ornament: 'garden',
  decor: 'petals',
  swatches: ['#f4f1e8','#fffdf8','#6f8f72','#d98a94'],
  tokens: {
    bg: '#f4f1e8', surface: '#fffdf8', text: '#34443a', muted: '#6d7d70', accent: '#5f8564', accentContrast: '#ffffff', border: '#d5ddcc',
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '14px',
    coverOverlay: 'linear-gradient(180deg, rgba(52,68,58,.15), rgba(52,68,58,.72))',
  },
}
