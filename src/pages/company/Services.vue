<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref } from 'vue'
import CompanyImage from '@/components/company/CompanyImage.vue'
import { useScrollReveal } from '@/composables/useAnimation'
import { useSeo } from '@/composables/useSeo'
import { company, whatsappLink } from '@/config/company'
import { copy } from '@/config/copy'
import { SITE } from '@/config/seoPrerender'
import { useCatalogStore } from '@/stores/catalog'
import { useContentStore } from '@/stores/content'
import { formatCurrency } from '@/utils/format'

const page = ref<HTMLElement | null>(null)
useScrollReveal(page, () => 'rise')
useSeo().apply({ title: copy.site.servicesTitle, description: copy.site.servicesDescription, path: '/services', image: `${SITE}/og-share.jpg` })
const catalog = useCatalogStore()
const content = useContentStore()
const loadData = () => Promise.allSettled([catalog.load(), content.load(false)])
onServerPrefetch(loadData)
onMounted(loadData)

const prices = computed(() => catalog.active.map((t) => t.price).filter((p) => p > 0))
const minPrice = computed(() => (prices.value.length ? Math.min(...prices.value) : 0))
const premiumPrice = computed(() => {
  const premium = catalog.active.filter((t) => t.category === 'adat' || t.category === 'mewah').map((t) => t.price).filter((p) => p > 0)
  return premium.length ? Math.min(...premium) : minPrice.value
})
const tierPrice = (kind: 'all' | 'premium') => {
  const p = kind === 'premium' ? premiumPrice.value : minPrice.value
  return p > 0 ? `${copy.company.priceFrom} ${formatCurrency(p)}` : copy.company.priceAsk
}
</script>

<template>
  <main ref="page" class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <div class="grid items-center gap-10 lg:grid-cols-2">
      <div>
        <h1 class="font-display text-4xl font-semibold">{{ copy.company.servicesHeading }}</h1>
        <p class="mt-3 max-w-xl text-muted">{{ copy.company.servicesSubtitle }}</p>
        <a :href="whatsappLink()" target="_blank" rel="noopener" class="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">{{ copy.company.orderNow }}</a>
      </div>
      <CompanyImage slot="servicesBanner" frame-class="rounded-3xl shadow-lg" />
    </div>

    <section class="mt-16" data-reveal>
      <h2 class="text-center font-display text-3xl font-semibold">{{ copy.company.tiersTitle }}</h2>
      <ul class="mt-8 grid gap-5 lg:grid-cols-3">
        <li v-for="(t, i) in copy.company.tiers" :key="t.name" class="card relative flex flex-col p-6 transition-transform duration-300 hover:-translate-y-1" :class="i === 0 ? 'border-[#b99a5b]/60 ring-1 ring-[#b99a5b]/40' : ''">
          <p v-if="i === 0" class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white">{{ copy.company.tierPopular }}</p>
          <h3 class="font-display text-2xl font-semibold">{{ t.name }}</h3>
          <p class="mt-1 text-sm text-muted">{{ t.desc }}</p>
          <p class="mt-3 font-display text-3xl font-semibold text-brand tabular-nums">{{ i === 2 ? copy.company.tierCustomCta : tierPrice(i === 1 ? 'premium' : 'all') }}</p>
          <ul class="mt-4 flex-1 space-y-2">
            <li v-for="f in t.features" :key="f" class="flex gap-2 text-sm text-muted"><span aria-hidden="true" class="text-brand">✓</span>{{ f }}</li>
          </ul>
          <a :href="whatsappLink(copy.company.tierInterest.replace('{name}', t.name))" target="_blank" rel="noopener" class="mt-5 rounded-lg border border-line bg-panel px-4 py-2.5 text-center text-sm font-medium hover:bg-paper">{{ copy.company.chooseTier }} {{ t.name }}</a>
        </li>
      </ul>
    </section>

    <section class="mx-auto mt-16 max-w-3xl" data-reveal>
      <h2 class="mb-6 text-center font-display text-3xl font-semibold">{{ copy.company.stepsTitle }}</h2>
      <ol class="space-y-3">
        <li v-for="(s, i) in copy.company.steps" :key="s" class="card flex gap-3 p-4">
          <span class="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft font-display text-sm font-semibold text-brand">{{ i + 1 }}</span>
          <p class="pt-1.5 text-sm">{{ s }}</p>
        </li>
      </ol>
      <div class="mt-8 text-center">
        <a :href="whatsappLink()" target="_blank" rel="noopener" class="inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">{{ copy.company.orderNow }}</a>
        <p class="mt-2 text-xs text-muted">{{ company.address }}</p>
      </div>
    </section>
  </main>
</template>
