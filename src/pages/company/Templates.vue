<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref } from 'vue'
import CompanyImage from '@/components/company/CompanyImage.vue'
import { COMPANY_IMAGE_ALIAS } from '@/config/companyImages'
import { useScrollReveal } from '@/composables/useAnimation'
import { useSeo } from '@/composables/useSeo'
import { copy } from '@/config/copy'
import { SITE } from '@/config/seoPrerender'
import { invitationService } from '@/services/invitations'
import { THEME_CATEGORIES, useCatalogStore } from '@/stores/catalog'
import { themeList } from '@/themes'
import { formatCurrency } from '@/utils/format'

const page = ref<HTMLElement | null>(null)
useScrollReveal(page, () => 'rise')
useSeo().apply({ title: copy.site.templatesTitle, description: copy.site.templatesDescription, path: '/templates', image: `${SITE}/og-share.jpg` })
const store = useCatalogStore()
const slugs = ref<Set<string>>(new Set())
const loadData = async () => {
  await store.load().catch(() => undefined)
  try {
    slugs.value = new Set((await invitationService.list()).map((i) => i.slug))
  } catch {
    slugs.value = new Set()
  }
}
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
/** Foto per kategori; klasik memakai ulang foto hero. */
const photoSlot = (c: string) => (c === 'klasik' ? COMPANY_IMAGE_ALIAS.catKlasik : `cat${c.charAt(0).toUpperCase()}${c.slice(1)}`)
const demoSlug = (id: string) => `demo-${id}`
</script>

<template>
  <main ref="page" class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <h1 class="font-display text-4xl font-semibold">{{ copy.company.templatesHeading }}</h1>
    <p class="mt-2 text-muted">{{ copy.company.templatesSubtitle }}</p>
    <div class="mt-6 flex flex-wrap gap-1" role="group" aria-label="Filter kategori">
      <button type="button" class="rounded-full border px-3 py-1.5 text-[13px] font-medium" :class="category === 'all' ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'" @click="category = 'all'">{{ copy.company.allCategories }}</button>
      <button v-for="c in THEME_CATEGORIES" :key="c.id" type="button" class="rounded-full border px-3 py-1.5 text-[13px] font-medium" :class="category === c.id ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'" @click="category = c.id">{{ c.label }}</button>
    </div>
    <ul class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
      <li v-for="t in cards" :key="t.id" class="card group overflow-hidden transition-transform duration-300 hover:-translate-y-1">
        <div class="aspect-[4/5] overflow-hidden">
          <CompanyImage :slot="photoSlot(t.category)" frame-class="h-full w-full rounded-none transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div class="space-y-1 p-4">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold">{{ t.name }}</p>
            <p v-if="t.price > 0" class="shrink-0 text-sm font-semibold text-brand tabular-nums">{{ formatCurrency(t.price) }}</p>
          </div>
          <p class="text-xs text-muted">{{ categoryLabel(t.category) }} · {{ t.description }}</p>
          <RouterLink v-if="slugs.has(demoSlug(t.id))" :to="`/invite/${demoSlug(t.id)}`" class="inline-block pt-1 text-sm font-medium text-brand hover:underline">{{ copy.company.viewDemo }}</RouterLink>
          <RouterLink v-else to="/portfolio" class="inline-block pt-1 text-sm font-medium text-brand hover:underline">{{ copy.company.viewSample }}</RouterLink>
        </div>
      </li>
    </ul>
    <p v-if="!cards.length" class="mt-8 text-sm text-muted">{{ copy.company.noTemplates }}</p>
  </main>
</template>
