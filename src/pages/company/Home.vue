<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useAnimation } from '@/composables/useAnimation'
import { useSeo } from '@/composables/useSeo'
import { whatsappLink } from '@/config/company'
import { copy } from '@/config/copy'
import { useCatalogStore } from '@/stores/catalog'
import { useContentStore } from '@/stores/content'
import { getTheme, themeList } from '@/themes'

const hero = ref<HTMLElement | null>(null)
const { slideUp } = useAnimation()
const seo = useSeo()
const catalog = useCatalogStore()
const content = useContentStore()
onMounted(() => hero.value && slideUp(Array.from(hero.value.children), { stagger: 0.12, y: 24 }))
// Top-level await: content is rendered during SSR/prerender, not only on mount.
await Promise.allSettled([catalog.load(), content.load(false)])
onMounted(async () => {
  seo.apply({
    title: content.text('seo_title', copy.site.homeTitle),
    description: content.text('seo_description', copy.site.homeDescription),
    path: '/',
  })
  seo.setJsonLd('org', {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Talijiwa',
    description: 'Layanan undangan pernikahan digital yang elegan, interaktif, dan mudah dibagikan.',
    address: { '@type': 'PostalAddress', addressLocality: 'Surakarta', addressRegion: 'Jawa Tengah', addressCountry: 'ID' },
  })
  seo.setJsonLd('faq', {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  })
})

const cards = computed(() =>
  catalog.loaded
    ? catalog.active.map((r) => ({ id: r.theme, name: r.name, description: r.description, swatches: getTheme(r.theme).swatches }))
    : themeList.map((x) => ({ id: x.id, name: x.name, description: x.description, swatches: x.swatches })),
)

const heroTitle = computed(() => content.text('hero_title', 'Undangan Pernikahan Digital yang Elegan dan Berkesan'))
const heroSubtitle = computed(() => content.text('hero_subtitle', 'Buat momen spesial Anda semakin berkesan dengan undangan digital yang indah, interaktif, dan mudah dibagikan.'))
const demo = (id: string) => `/invite/demo-${id}`
</script>

<template>
  <main>
    <section class="mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
      <div ref="hero">
        <h1 class="font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{{ heroTitle }}</h1>
        <p class="mx-auto mt-5 max-w-xl text-muted">{{ heroSubtitle }}</p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <RouterLink to="/templates" class="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">Lihat Template</RouterLink>
          <a :href="whatsappLink()" target="_blank" rel="noopener" class="rounded-lg border border-line bg-panel px-5 py-2.5 text-sm font-medium hover:bg-paper">Pesan Sekarang</a>
        </div>
      </div>
    </section>
    <section class="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <h2 class="mb-6 font-display text-3xl font-semibold">Template</h2>
      <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="t in cards" :key="t.id" class="card overflow-hidden">
          <div class="flex h-28"><span v-for="c in t.swatches" :key="c" class="flex-1" :style="{ background: c }" /></div>
          <div class="space-y-1 p-4"><p class="font-semibold">{{ t.name }}</p><p class="text-xs text-muted">{{ t.description }}</p><RouterLink :to="demo(t.id)" class="inline-block pt-1 text-sm font-medium text-brand hover:underline">Lihat Demo</RouterLink></div>
        </li>
      </ul>
    </section>

    <section v-if="content.testimonials.length" class="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <h2 class="mb-6 text-center font-display text-3xl font-semibold">Kata mereka</h2>
      <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="t in content.testimonials" :key="t.id" class="card p-5">
          <p class="flex items-center gap-1 text-sm text-warn" :aria-label="`Rating ${t.rating} dari 5`">
            <Star v-for="n in t.rating" :key="n" class="size-3.5" fill="currentColor" aria-hidden="true" />
          </p>
          <p class="mt-2 text-sm leading-relaxed">“{{ t.message }}”</p>
          <p class="mt-3 text-sm font-semibold">{{ t.name }}</p>
        </li>
      </ul>
    </section>

    <section v-if="content.faqs.length" class="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <h2 class="mb-6 text-center font-display text-3xl font-semibold">Pertanyaan umum</h2>
      <ul class="space-y-3">
        <li v-for="f in content.faqs" :key="f.id" class="card p-5">
          <h3 class="text-sm font-semibold">{{ f.question }}</h3>
          <p class="mt-1.5 text-sm text-muted">{{ f.answer }}</p>
        </li>
      </ul>
    </section>
  </main>
</template>
