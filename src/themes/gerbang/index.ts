import type { ThemeDefinition } from '@/types'

export const gerbang: ThemeDefinition = {
  id: 'gerbang',
  name: 'Gerbang Kayu',
  description: 'Pintu kayu ganda yang terbuka perlahan, teks muncul bertahap saat digulir.',
  intro: 'door',
  reveal: 'stagger',
  decor: 'float',
  swatches: ['#2b1d14', '#f2e6d0', '#c9a15a', '#5a3b25'],
  tokens: {
    bg: '#2b1d14', surface: '#36261b', text: '#f2e6d0', muted: '#c2b08f', accent: '#c9a15a', accentContrast: '#2b1d14', border: '#5a3b25',
    fontHeading: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '4px',
    coverOverlay: 'linear-gradient(180deg, rgba(43,29,20,.3), rgba(43,29,20,.88))',
  },
}
