<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref } from 'vue'
import ThemeBanner from '@/components/invitation/ThemeBanner.vue'
import { useSeo } from '@/composables/useSeo'
import { copy } from '@/config/copy'
import { THEME_CATEGORIES, useCatalogStore } from '@/stores/catalog'
import { themeList } from '@/themes'
import { formatCurrency } from '@/utils/format'

useSeo().apply({ title: copy.site.templatesTitle, description: copy.site.templatesDescription, path: '/templates' })
const store = useCatalogStore()
const loadData = () => store.load().catch(() => undefined)
onServerPrefetch(loadData)
onMounted(loadData)

const category = ref('all')
const cards = computed(() => {
  const rows = store.loaded
    ? store.active.map((r) => ({ id: r.theme, name: r.name, description: r.description, price: r.price, category: r.category as string }))
    : themeList.map((t) => ({ id: t.id, name: t.name, description: t.description, price: 0, category: 'modern' }))
  return category.value === 'all' ? rows : rows.filter((r) => r.category === category.value)
})
const categoryLabel = (c: string) => THEME_CATEGORIES.find((x) => x.id === c)?.label ?? c
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <h1 class="font-display text-4xl font-semibold">Template</h1>
    <p class="mt-2 text-muted">Pilih tampilan yang paling sesuai dengan suasana pernikahan Anda.</p>
    <div class="mt-6 flex flex-wrap gap-1" role="group" aria-label="Filter kategori">
      <button type="button" class="rounded-full border px-3 py-1.5 text-[13px] font-medium" :class="category === 'all' ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'" @click="category = 'all'">Semua</button>
      <button v-for="c in THEME_CATEGORIES" :key="c.id" type="button" class="rounded-full border px-3 py-1.5 text-[13px] font-medium" :class="category === c.id ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'" @click="category = c.id">{{ c.label }}</button>
    </div>
    <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <li v-for="t in cards" :key="t.id" class="card overflow-hidden">
        <div class="h-52 [&_h1]:!text-3xl [&_.inv-btn]:!hidden"><ThemeBanner :theme="t.id" :active="false" /></div>
        <div class="space-y-1 p-4">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold">{{ t.name }}</p>
            <p v-if="t.price > 0" class="shrink-0 text-sm font-semibold text-brand tabular-nums">{{ formatCurrency(t.price) }}</p>
          </div>
          <p class="text-xs text-muted">{{ categoryLabel(t.category) }} · {{ t.description }}</p>
          <RouterLink :to="`/invite/demo-${t.id}`" class="inline-block pt-1 text-sm font-medium text-brand hover:underline">Lihat Demo</RouterLink>
        </div>
      </li>
    </ul>
    <p v-if="!cards.length" class="mt-8 text-sm text-muted">Belum ada template pada kategori ini.</p>
  </main>
</template>
