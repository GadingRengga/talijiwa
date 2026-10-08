import type { ThemeDefinition, ThemeId } from '@/types'
import { classic } from './classic'
import { minimal } from './minimal'
import { floral } from './floral'
import { luxury } from './luxury'
import { gerbang } from './gerbang'
import { amplop } from './amplop'
import { sinematik } from './sinematik'
import { garden } from './garden'
import { jawa } from './jawa'
import { celestial } from './celestial'
import { watercolor } from './watercolor'

/** Register new themes here. Nothing else needs to change. */
export const themes: Record<ThemeId, ThemeDefinition> = { classic, minimal, floral, luxury, gerbang, amplop, sinematik, garden, jawa, celestial, watercolor }
export const themeList: ThemeDefinition[] = Object.values(themes)

export function getTheme(id: string): ThemeDefinition {
  return themes[id as ThemeId] ?? classic
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
