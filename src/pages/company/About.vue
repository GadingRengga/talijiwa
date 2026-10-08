<script setup lang="ts">
import { ref } from 'vue'
import CompanyImage from '@/components/company/CompanyImage.vue'
import { useScrollReveal } from '@/composables/useAnimation'
import { useSeo } from '@/composables/useSeo'
import { company, whatsappLink } from '@/config/company'
import { copy } from '@/config/copy'
import { SITE } from '@/config/seoPrerender'

const page = ref<HTMLElement | null>(null)
useScrollReveal(page, () => 'rise')
useSeo().apply({ title: copy.site.aboutTitle, description: copy.site.aboutDescription, path: '/about', image: `${SITE}/og-share.jpg` })
</script>

<template>
  <main ref="page" class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <div class="grid items-center gap-10 lg:grid-cols-2">
      <div>
        <h1 class="font-display text-4xl font-semibold">{{ copy.company.aboutHeading }}</h1>
        <div class="mt-4 space-y-4 text-sm leading-relaxed text-muted">
          <p v-for="p in copy.company.aboutStory" :key="p">{{ p }}</p>
        </div>
        <a :href="whatsappLink()" target="_blank" rel="noopener" class="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">{{ copy.company.chatWhatsapp }}</a>
      </div>
      <CompanyImage slot="about" frame-class="rounded-3xl shadow-lg" />
    </div>

    <section class="mt-16" data-reveal>
      <h2 class="text-center font-display text-3xl font-semibold">{{ copy.company.valuesTitle }}</h2>
      <ul class="mt-8 grid gap-5 sm:grid-cols-3">
        <li v-for="v in copy.company.values" :key="v.title" class="card p-6 text-center transition-transform duration-300 hover:-translate-y-1">
          <h3 class="font-display text-xl font-semibold text-brand">{{ v.title }}</h3>
          <p class="mt-2 text-sm text-muted">{{ v.desc }}</p>
        </li>
      </ul>
      <p class="mt-10 text-center text-sm text-muted">{{ company.company_name }} · {{ company.address }} · Melayani seluruh Indonesia.</p>
    </section>
  </main>
</template>
