import type { ThemeDefinition } from '@/types'
import { cjvAssets } from './assets'
import './theme.css'

function src(name: string, pick: number): string {
  const a = cjvAssets[name]
  if (!a) return ''
  const v = a.variants.find((x) => x.width === pick) ?? a.variants[0]
  return v?.src ?? ''
}

/**
 * Central Java Village: a golden-hour Javanese village behind a carved gebyok
 * gate. Cream paper panels, antique gold accents, jasmine decor.
 * Decorative gold (#C9A24A family) is display-only; functional text/links use
 * the AA-safe accent. Right-side corners mirror the left artwork in CSS.
 */
export const centralJavaVillage: ThemeDefinition = {
  id: 'central-java-village',
  name: 'Central Java Village',
  description: 'Melati, Gebyok & Pegunungan Jawa Tengah',
  tokens: {
    bg: '#FBF4E3',
    surface: '#FFFAEF',
    text: '#3A2A1A',
    muted: '#7A6248',
    accent: '#8A6A22',
    accentContrast: '#ffffff',
    border: '#E0CFA5',
    fontHeading: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '20px',
    coverOverlay:
      'linear-gradient(180deg, rgba(58,42,26,.55), rgba(58,42,26,.25) 35%, rgba(58,42,26,.30) 65%, rgba(58,42,26,.62))',
  },
  decor: 'petals',
  intro: 'gebyok',
  reveal: 'rise',
  ornament: 'gebyok-gate',
  // No bgImage: the village scene lives in the cover gate + side hero only.
  // (Setting bgImage would tile the mountain behind every section via
  // themeStyle() and bury the text on narrow screens.)
  coverImage: src('bg-village-mountain', 1280),
  sidePanel: true,
  swatches: ['#FBF4E3', '#FFFAEF', '#3A2A1A', '#8A6A22'],
}
