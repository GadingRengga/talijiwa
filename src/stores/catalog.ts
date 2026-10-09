import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { InvitationTier, ThemeCategory, ThemeId } from '@/types'
import { themeCatalogService } from '@/services/catalog'
import { getTheme } from '@/themes'

export const THEME_CATEGORIES: { id: ThemeCategory; label: string }[] = [
  { id: 'klasik', label: 'Klasik' },
  { id: 'modern', label: 'Modern' },
  { id: 'floral', label: 'Floral' },
  { id: 'adat', label: 'Adat' },
  { id: 'mewah', label: 'Mewah' },
]

export interface CatalogRow {
  theme: ThemeId
  code: string
  name: string
  description: string
  is_active: boolean
  price: number
  position: number
  category: ThemeCategory
  tier: InvitationTier
}

export const useCatalogStore = defineStore('catalog', () => {
  const rows = ref<CatalogRow[]>([])
  const tierPrices = ref<Record<InvitationTier, number>>({ basic: 0, premium: 0, luxury: 0 })
  const loading = ref(false)
  const loaded = ref(false)

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const [entries, prices] = await Promise.all([themeCatalogService.list(), themeCatalogService.tierPrices()])
      rows.value = entries.map((e) => {
        const t = getTheme(e.theme)
        return { theme: e.theme, code: e.code || e.theme.toUpperCase().slice(0, 3), name: t.name, description: t.description, is_active: e.is_active, price: e.price, position: e.position, category: e.category, tier: e.tier }
      })
      tierPrices.value = prices
      loaded.value = true
    } finally {
      loading.value = false
    }
  }
  async function setActive(theme: ThemeId, active: boolean) {
    const updated = await themeCatalogService.update(theme, { is_active: active })
    rows.value = rows.value.map((r) => (r.theme === theme ? { ...r, is_active: updated.is_active } : r))
  }
  async function setPrice(theme: ThemeId, price: number) {
    const updated = await themeCatalogService.update(theme, { price: Math.max(0, Math.round(price) || 0) })
    rows.value = rows.value.map((r) => (r.theme === theme ? { ...r, price: updated.price } : r))
  }
  async function setCategory(theme: ThemeId, category: ThemeCategory) {
    const updated = await themeCatalogService.update(theme, { category })
    rows.value = rows.value.map((r) => (r.theme === theme ? { ...r, category: updated.category } : r))
  }
  async function setTier(theme: ThemeId, tier: InvitationTier) {
    const updated = await themeCatalogService.update(theme, { tier })
    rows.value = rows.value.map((r) => (r.theme === theme ? { ...r, tier: updated.tier } : r))
  }

  async function setTierPrice(tier: InvitationTier, price: number) {
    tierPrices.value = await themeCatalogService.setTierPrice(tier, price)
    // Master price applies to every theme of the tier (same price per tier).
    rows.value = rows.value.map((r) => (r.tier === tier ? { ...r, price: tierPrices.value[tier] ?? r.price } : r))
  }

  const byTier = (tier: InvitationTier) => rows.value.filter((r) => r.tier === tier)

  const active = computed(() => rows.value.filter((r) => r.is_active))

  return { rows, active, tierPrices, byTier, loading, loaded, load, setActive, setPrice, setCategory, setTier, setTierPrice }
})
