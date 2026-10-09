import type { InvitationTier, ThemeCatalogEntry, ThemeCategory, ThemeId } from '@/types'
import { commit, clone, db, delay } from '../mock/db'
import { requireSupabase, useMock } from '../supabase/client'

function sortCatalog(rows: ThemeCatalogEntry[]): ThemeCatalogEntry[] {
  return [...rows].sort((a, b) => a.position - b.position)
}

function toApp(r: Record<string, unknown>): ThemeCatalogEntry {
  return {
    theme: r.theme as ThemeId,
    code: (r.code as string) ?? '',
    is_active: (r.is_active as boolean) ?? true,
    price: Number(r.price ?? 0),
    position: Number(r.position ?? 0),
    category: (r.category as ThemeCategory) ?? 'modern',
    tier: (r.tier as InvitationTier) ?? 'basic',
  }
}

const TIER_PRICE_FALLBACK: Record<InvitationTier, number> = { basic: 149000, premium: 199000, luxury: 249000 }

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
  async update(theme: ThemeId, patch: Partial<Pick<ThemeCatalogEntry, 'is_active' | 'price' | 'position' | 'category' | 'tier'>>): Promise<ThemeCatalogEntry> {
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
  /**
   * Master prices per tier (NEW orders only). Mock keeps them in siteSettings
   * (`tier_price_basic|premium|luxury`) so no mock schema change is needed.
   */
  async tierPrices(): Promise<Record<InvitationTier, number>> {
    if (useMock) {
      const s = db().siteSettings
      return delay({
        basic: Number(s.tier_price_basic ?? TIER_PRICE_FALLBACK.basic),
        premium: Number(s.tier_price_premium ?? TIER_PRICE_FALLBACK.premium),
        luxury: Number(s.tier_price_luxury ?? TIER_PRICE_FALLBACK.luxury),
      })
    }
    try {
      const { data, error } = await requireSupabase().from('tier_prices').select('*')
      if (error) throw error
      const out = { ...TIER_PRICE_FALLBACK }
      for (const r of (data ?? []) as { tier: InvitationTier; price: number }[]) out[r.tier] = Number(r.price ?? 0)
      return out
    } catch {
      // Migration 014 not deployed yet: fall back to per-theme mode (price 0 = use theme price).
      return { basic: 0, premium: 0, luxury: 0 }
    }
  },
  /**
   * Set the master price of a tier. In Supabase mode this also syncs every
   * theme of that tier so per-theme rows stay identical (single source shown
   * everywhere). Never touches orders: amounts are snapshots.
   */
  async setTierPrice(tier: InvitationTier, price: number): Promise<Record<InvitationTier, number>> {
    const clean = Math.max(0, Math.round(price) || 0)
    if (useMock) {
      const data = db()
      data.siteSettings[`tier_price_${tier}`] = String(clean)
      for (const row of data.themeCatalog) {
        if (row.tier === tier) row.price = clean
      }
      commit()
      return delay(await this.tierPrices())
    }
    const sb = requireSupabase()
    const { error } = await sb.from('tier_prices').upsert({ tier, price: clean }, { onConflict: 'tier' })
    if (error) throw new Error(error.message)
    // Keep per-theme rows identical for this tier (display fallback + legacy readers).
    const { error: syncError } = await sb.from('theme_catalog').update({ price: clean }).eq('tier', tier)
    if (syncError) throw new Error(syncError.message)
    return this.tierPrices()
  },
}
