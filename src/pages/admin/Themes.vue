<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { onMounted } from 'vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import ThemeBanner from '@/components/invitation/ThemeBanner.vue'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import { THEME_CATEGORIES, useCatalogStore } from '@/stores/catalog'
import type { InvitationTier } from '@/types'
import { formatCurrency } from '@/utils/format'

const store = useCatalogStore()
const toast = useToast()
const tiers: InvitationTier[] = ['basic', 'premium', 'luxury']

onMounted(() => store.load())

async function run(fn: () => Promise<unknown>) {
  try {
    await fn()
    toast.success(copy.themes.saved)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
    await store.load(true)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="font-display text-3xl font-semibold">{{ copy.themes.title }}</h1>
      <p class="text-sm text-muted">{{ copy.themes.subtitle }}</p>
    </div>

    <LoadingState v-if="store.loading && !store.loaded" />
    <EmptyState v-else-if="!store.rows.length" :message="copy.themes.empty" />

    <ul v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="r in store.rows" :key="r.theme" class="card overflow-hidden" :class="r.is_active ? '' : 'opacity-70'">
        <div class="h-36"><ThemeBanner :theme="r.theme" :active="false" /></div>
        <div class="space-y-3 p-4">
          <div>
            <p class="font-semibold">{{ r.name }}</p>
            <p class="text-xs text-muted">{{ r.description }}</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-xs text-muted">{{ copy.themes.category }}</span>
              <select :value="r.category" class="field-input" :aria-label="`${copy.themes.category} ${r.name}`" @change="run(() => store.setCategory(r.theme, ($event.target as HTMLSelectElement).value as typeof r.category))">
                <option v-for="c in THEME_CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-1 block text-xs text-muted">{{ copy.themes.tier }}</span>
              <select :value="r.tier" class="field-input" :aria-label="`${copy.themes.tier} ${r.name}`" @change="run(() => store.setTier(r.theme, ($event.target as HTMLSelectElement).value as InvitationTier))">
                <option v-for="t in tiers" :key="t" :value="t">{{ copy.orders.tiers[t] }}</option>
              </select>
            </label>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <label class="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                :checked="r.is_active"
                class="size-4 shrink-0 accent-[var(--color-brand)]"
                :aria-label="`${copy.themes.active}: ${r.name}`"
                @change="run(() => store.setActive(r.theme, ($event.target as HTMLInputElement).checked))"
              />
              <span class="text-sm">{{ copy.themes.active }}</span>
            </label>
          </div>
          <label class="block">
            <span class="mb-1 block text-xs text-muted">{{ copy.themes.price }}</span>
            <span class="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1000"
                :value="r.price"
                class="field-input tabular-nums"
                :aria-label="`${copy.themes.price} ${r.name}`"
                @change="run(() => store.setPrice(r.theme, Number(($event.target as HTMLInputElement).value)) )"
              />
            </span>
            <span class="mt-1 block text-xs text-muted">{{ formatCurrency(r.price) }}</span>
          </label>
        </div>
      </li>
    </ul>
    <p v-if="store.loading" class="flex items-center gap-2 text-xs text-muted"><Loader2 class="size-3 animate-spin" /> {{ copy.themes.saving }}</p>
  </div>
</template>
