import type { ThemeDefinition } from '@/types'
import { centralJavaVillage } from './central-java-village'

/** Theme roster, rebuilt one theme at a time from the new asset pattern. */
export const themes: Record<string, ThemeDefinition> = {
  [centralJavaVillage.id]: centralJavaVillage,
}
export const themeList: ThemeDefinition[] = Object.values(themes)

/** Neutral fallback so the renderer/builder stay compilable with zero themes. */
const fallback: ThemeDefinition = {
  id: 'default',
  name: 'Default',
  description: 'Placeholder theme while the roster is rebuilt.',
  tokens: {
    bg: '#f6efe3',
    surface: '#fffaf6',
    text: '#3d2b2b',
    muted: '#7a6a6a',
    accent: '#9a6b1e',
    accentContrast: '#ffffff',
    border: '#e5d5b8',
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
    radius: '14px',
    coverOverlay: 'linear-gradient(180deg, rgba(61,43,43,.68), rgba(61,43,43,.5) 34%, rgba(61,43,43,.68) 66%, rgba(61,43,43,.84))',
  },
  decor: 'none',
  swatches: ['#f6efe3', '#fffaf6', '#3d2b2b', '#9a6b1e'],
}

export function getTheme(id: string): ThemeDefinition {
  return themes[id] ?? fallback
}

/** Convert theme tokens into CSS variables scoped to an invitation container. */
export function themeStyle(id: string): Record<string, string> {
  const t = getTheme(id).tokens
  return {
    '--inv-bg': t.bg,
    '--inv-surface': t.surface,
    '--inv-text': t.text,
    '--inv-muted': t.muted,
    '--inv-accent': t.accent,
    '--inv-accent-contrast': t.accentContrast,
    '--inv-border': t.border,
    '--inv-font-heading': t.fontHeading,
    '--inv-font-body': t.fontBody,
    '--inv-radius': t.radius,
    '--inv-cover-overlay': t.coverOverlay,
  }
}
