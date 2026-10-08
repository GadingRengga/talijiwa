<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import { computed, onMounted, onServerPrefetch, ref } from 'vue'
import CompanyImage from '@/components/company/CompanyImage.vue'
import { useAnimation, useScrollReveal } from '@/composables/useAnimation'
import { useSeo } from '@/composables/useSeo'
import { whatsappLink } from '@/config/company'
import { copy } from '@/config/copy'
import { SITE } from '@/config/seoPrerender'
import { useCatalogStore } from '@/stores/catalog'
import { useContentStore } from '@/stores/content'
import { invitationService } from '@/services/invitations'
import { getTheme, themeList } from '@/themes'

const hero = ref<HTMLElement | null>(null)
const page = ref<HTMLElement | null>(null)
const { slideUp, fadeIn } = useAnimation()
const seo = useSeo()
const catalog = useCatalogStore()
const content = useContentStore()
useScrollReveal(page, () => 'rise')

const loadData = async () => {
  const [, inv] = await Promise.allSettled([
    Promise.all([catalog.load(), content.load(false)]),
    invitationService.list().catch(() => []),
  ])
  slugs.value = new Set(((inv.status === 'fulfilled' ? inv.value : []) as { slug: string }[]).map((i) => i.slug))
}
onServerPrefetch(loadData)
onMounted(async () => {
  await loadData()
  if (hero.value) {
    slideUp(Array.from(hero.value.querySelectorAll('[data-hero-text]')), { stagger: 0.12, y: 24 })
    const photo = hero.value.querySelector('[data-hero-photo]')
    if (photo) fadeIn(photo, { duration: 1.1 })
  }
  seo.apply({
    title: content.text('seo_title', copy.site.homeTitle),
    description: content.text('seo_description', copy.site.homeDescription),
    path: '/',
    image: `${SITE}/og-share.jpg`,
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
const stats = computed(() => [
  { value: `${catalog.loaded ? catalog.active.length : themeList.length} tema`, label: 'Pilihan tema elegan' },
  { value: '1–3 hari', label: 'Pengerjaan cepat' },
  { value: '24/7', label: 'Undangan selalu online' },
])
const monogram = (name: string) => name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('')
const slugs = ref<Set<string>>(new Set())
const demoSlug = (id: string) => `demo-${id}`
</script>

<template>
  <main ref="page">
    <!-- Hero -->
    <section class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:py-24">
      <div ref="hero">
        <p data-hero-text class="inline-block rounded-full border border-[#b99a5b]/40 bg-[#b99a5b]/10 px-4 py-1.5 text-xs font-medium tracking-widest text-[#8a6d3f]">{{ copy.company.badge }}</p>
        <h1 data-hero-text class="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{{ heroTitle }}</h1>
        <p data-hero-text class="mt-5 max-w-xl text-muted">{{ heroSubtitle }}</p>
        <div data-hero-text class="mt-8 flex flex-wrap gap-3">
          <RouterLink to="/templates" class="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">{{ copy.company.viewTemplates }}</RouterLink>
          <a :href="whatsappLink()" target="_blank" rel="noopener" class="rounded-lg border border-line bg-panel px-5 py-2.5 text-sm font-medium hover:bg-paper">{{ copy.company.orderNow }}</a>
        </div>
        <div data-hero-text class="mt-10 grid max-w-md grid-cols-3 gap-4">
          <div v-for="s in stats" :key="s.label">
            <p class="font-display text-2xl font-semibold text-ink sm:text-3xl">{{ s.value }}</p>
            <p class="mt-1 text-xs text-muted">{{ s.label }}</p>
          </div>
        </div>
      </div>
      <div data-hero-photo>
        <CompanyImage slot="hero" :eager="true" frame-class="rounded-b-3xl rounded-t-[999px] border-4 border-[#b99a5b]/30 shadow-xl" />
      </div>
    </section>

    <!-- Fitur -->
    <section class="mx-auto max-w-6xl px-4 pb-20 sm:px-6" data-reveal>
      <h2 class="font-display text-3xl font-semibold">{{ copy.company.featuresTitle }}</h2>
      <p class="mt-2 text-muted">{{ copy.company.featuresSubtitle }}</p>
      <ul class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="f in copy.company.features" :key="f.title" class="card group overflow-hidden transition-transform duration-300 hover:-translate-y-1">
          <div class="aspect-[4/3] overflow-hidden">
            <CompanyImage :slot="f.slot" frame-class="h-full w-full rounded-none transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div class="p-5">
            <h3 class="font-semibold">{{ f.title }}</h3>
            <p class="mt-1.5 text-sm text-muted">{{ f.desc }}</p>
          </div>
        </li>
      </ul>
    </section>

    <!-- Cara pesan -->
    <section class="border-y border-line/70 bg-panel/60" data-reveal>
      <div class="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 class="text-center font-display text-3xl font-semibold">{{ copy.company.stepsTitle }}</h2>
        <ol class="mt-8 grid gap-4 sm:grid-cols-2">
          <li v-for="(s, i) in copy.company.steps" :key="s" class="flex gap-4 rounded-2xl border border-line bg-panel p-5">
            <span class="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-display text-lg font-semibold text-white">{{ i + 1 }}</span>
            <p class="pt-1.5 text-sm leading-relaxed">{{ s }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Template favorit -->
    <section class="mx-auto max-w-6xl px-4 py-20 sm:px-6" data-reveal>
      <div class="mb-6 flex items-end justify-between gap-4">
        <h2 class="font-display text-3xl font-semibold">{{ copy.company.featuredTitle }}</h2>
        <RouterLink to="/templates" class="shrink-0 text-sm font-medium text-brand hover:underline">{{ copy.company.viewAll }}</RouterLink>
      </div>
      <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="t in cards.slice(0, 4)" :key="t.id" class="card group overflow-hidden transition-transform duration-300 hover:-translate-y-1">
          <div class="flex h-28"><span v-for="c in t.swatches" :key="c" class="flex-1" :style="{ background: c }" /></div>
          <div class="space-y-1 p-4"><p class="font-semibold">{{ t.name }}</p><p class="text-xs text-muted">{{ t.description }}</p><RouterLink v-if="slugs.has(demoSlug(t.id))" :to="`/invite/${demoSlug(t.id)}`" class="inline-block pt-1 text-sm font-medium text-brand hover:underline">{{ copy.company.viewDemo }}</RouterLink><RouterLink v-else to="/portfolio" class="inline-block pt-1 text-sm font-medium text-brand hover:underline">{{ copy.company.viewSample }}</RouterLink></div>
        </li>
      </ul>
    </section>

    <!-- Testimoni -->
    <section v-if="content.testimonials.length" class="mx-auto max-w-6xl px-4 pb-20 sm:px-6" data-reveal>
      <h2 class="mb-6 text-center font-display text-3xl font-semibold">{{ copy.site.testimonialsTitle }}</h2>
      <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="t in content.testimonials" :key="t.id" class="card p-5">
          <p class="flex items-center gap-1 text-sm text-warn" :aria-label="`Rating ${t.rating} dari 5`">
            <Star v-for="n in t.rating" :key="n" class="size-3.5" fill="currentColor" aria-hidden="true" />
          </p>
          <p class="mt-2 text-sm leading-relaxed">“{{ t.message }}”</p>
          <p class="mt-3 flex items-center gap-2.5">
            <span aria-hidden="true" class="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft font-display text-sm font-semibold text-brand">{{ monogram(t.name) }}</span>
            <span class="text-sm font-semibold">{{ t.name }}</span>
          </p>
        </li>
      </ul>
    </section>

    <!-- FAQ -->
    <section v-if="content.faqs.length" class="mx-auto max-w-3xl px-4 pb-20 sm:px-6" data-reveal>
      <h2 class="mb-6 text-center font-display text-3xl font-semibold">{{ copy.site.faqTitle }}</h2>
      <ul class="space-y-3">
        <li v-for="f in content.faqs" :key="f.id" class="card overflow-hidden">
          <details class="faq-item group">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              {{ f.question }}
              <span aria-hidden="true" class="grid size-7 shrink-0 place-items-center rounded-full border border-line text-lg leading-none text-muted transition-transform duration-300 group-open:rotate-45">+</span>
            </summary>
            <div class="faq-body grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 group-open:grid-rows-[1fr]">
              <p class="overflow-hidden px-5 text-sm leading-relaxed text-muted"><span class="block pb-5">{{ f.answer }}</span></p>
            </div>
          </details>
        </li>
      </ul>
    </section>

    <!-- CTA final -->
    <section class="mx-auto max-w-6xl px-4 pb-20 sm:px-6" data-reveal>
      <div class="grid items-center gap-8 overflow-hidden rounded-3xl border border-[#b99a5b]/30 bg-gradient-to-br from-[#fbf6ec] to-[#f1e4cd] p-8 sm:p-12 lg:grid-cols-2">
        <div>
          <h2 class="font-display text-3xl font-semibold sm:text-4xl">{{ copy.company.finalTitle }}</h2>
          <p class="mt-3 text-muted">{{ copy.company.finalSubtitle }}</p>
          <a :href="whatsappLink()" target="_blank" rel="noopener" class="mt-6 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark">{{ copy.company.orderNow }}</a>
        </div>
        <CompanyImage slot="cta" frame-class="rounded-3xl shadow-lg" />
      </div>
    </section>
  </main>
</template>
