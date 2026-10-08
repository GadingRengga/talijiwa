import type { ThemeCatalogEntry, ThemeCategory, ThemeId } from '@/types'
import { commit, clone, db, delay } from '../mock/db'
import { requireSupabase, useMock } from '../supabase/client'

function sortCatalog(rows: ThemeCatalogEntry[]): ThemeCatalogEntry[] {
  return [...rows].sort((a, b) => a.position - b.position)
}

function toApp(r: Record<string, unknown>): ThemeCatalogEntry {
  return {
    theme: r.theme as ThemeId,
    is_active: (r.is_active as boolean) ?? true,
    price: Number(r.price ?? 0),
    position: Number(r.position ?? 0),
    category: (r.category as ThemeCategory) ?? 'modern',
  }
}

export const themeCatalogService = {
  /** All entries (admin). */
  async list(): Promise<ThemeCatalogEntry[]> {
    if (useMock) return delay(clone(sortCatalog(db().themeCatalog)))
    const { data, error } = await requireSupabase().from('theme_catalog').select('*').order('position')
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(toApp)
  },
  /** Visible entries for the public Templates page. */
  async listActive(): Promise<ThemeCatalogEntry[]> {
    if (useMock) return delay(clone(sortCatalog(db().themeCatalog.filter((r) => r.is_active))))
    const { data, error } = await requireSupabase().from('theme_catalog').select('*').eq('is_active', true).order('position')
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(toApp)
  },
  async update(theme: ThemeId, patch: Partial<Pick<ThemeCatalogEntry, 'is_active' | 'price' | 'position' | 'category'>>): Promise<ThemeCatalogEntry> {
    if (useMock) {
      const row = db().themeCatalog.find((r) => r.theme === theme)
      if (!row) throw new Error('Tema tidak ditemukan.')
      Object.assign(row, patch)
      commit()
      return delay(clone(row))
    }
    const { data, error } = await requireSupabase().from('theme_catalog').update(patch).eq('theme', theme).select('*').single()
    if (error) throw new Error(error.message)
    return toApp(data as Record<string, unknown>)
  },
}
