import type { ThemeDefinition } from '@/types'

export const classic: ThemeDefinition = {
  id: 'classic',
  name: 'Classic Elegant',
  description: 'Krem hangat dengan aksen emas lembut dan tipografi serif klasik.',
  intro: 'curtain',
  reveal: 'mask',
  ornament: 'frame',
  decor: 'float',
  swatches: ['#f6efe3', '#ffffff', '#4a3426', '#b99a5b'],
  tokens: {
    bg: '#f6efe3',
    surface: '#fffdf8',
    text: '#4a3426',
    muted: '#8a7566',
    accent: '#b99a5b',
    accentContrast: '#ffffff',
    border: '#e4d6bd',
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '4px',
    coverOverlay: 'linear-gradient(180deg, rgba(74,52,38,.25), rgba(74,52,38,.75))',
  },
}
