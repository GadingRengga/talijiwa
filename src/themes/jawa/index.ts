import type { ThemeDefinition } from '@/types'

export const jawa: ThemeDefinition = {
  id: 'jawa',
  name: 'Adat Jawa',
  description: 'Gunungan membuka undangan, latar batik kawung bergerak halus, tulisan tersingkap seperti dilukis.',
  intro: 'gunungan',
  reveal: 'mask',
  ornament: 'batik',
  decor: 'none',
  swatches: ['#f3e6cf','#fbf3e2','#9a5b24','#4a2c17'],
  tokens: {
    bg: '#f3e6cf', surface: '#fbf3e2', text: '#4a2c17', muted: '#7d6144', accent: '#9a5b24', accentContrast: '#fbf3e2', border: '#d9bf94',
    fontHeading: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '2px',
    coverOverlay: 'linear-gradient(180deg, rgba(74,44,23,.25), rgba(74,44,23,.85))',
  },
}
