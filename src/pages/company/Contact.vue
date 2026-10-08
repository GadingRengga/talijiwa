<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref } from 'vue'
import CompanyImage from '@/components/company/CompanyImage.vue'
import { useScrollReveal } from '@/composables/useAnimation'
import { useSeo } from '@/composables/useSeo'
import { company, whatsappLink } from '@/config/company'
import { copy } from '@/config/copy'
import { SITE } from '@/config/seoPrerender'
import { useContentStore } from '@/stores/content'

const page = ref<HTMLElement | null>(null)
useScrollReveal(page, () => 'rise')
useSeo().apply({ title: copy.site.contactTitle, description: copy.site.aboutDescription, path: '/contact', image: `${SITE}/og-share.jpg` })

const content = useContentStore()
const loadData = () => content.load(false).catch(() => undefined)
onServerPrefetch(loadData)
onMounted(loadData)
const contactText = computed(() => content.text('contact_text', 'Hubungi kami lewat WhatsApp untuk memesan undangan.'))
</script>

<template>
  <main ref="page" class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <div class="grid items-center gap-10 lg:grid-cols-2">
      <div data-reveal>
        <h1 class="font-display text-4xl font-semibold">{{ copy.company.contactHeading }}</h1>
        <p class="mt-3 text-muted">{{ contactText }}</p>
        <ul class="mt-6 space-y-3 text-sm">
          <li class="card flex items-center justify-between gap-3 p-4">
            <span class="text-muted">WhatsApp</span>
            <a :href="whatsappLink()" target="_blank" rel="noopener" class="font-semibold text-brand hover:underline">{{ company.whatsapp }}</a>
          </li>
          <li class="card flex items-center justify-between gap-3 p-4">
            <span class="text-muted">Email</span>
            <a :href="`mailto:${company.email}`" class="font-semibold text-brand hover:underline">{{ company.email }}</a>
          </li>
          <li class="card flex items-center justify-between gap-3 p-4">
            <span class="text-muted">Instagram</span>
            <span class="font-semibold">@{{ company.instagram }}</span>
          </li>
          <li class="card flex items-center justify-between gap-3 p-4">
            <span class="text-muted">Alamat</span>
            <span class="text-right font-medium">{{ company.address }}</span>
          </li>
          <li class="card flex items-center justify-between gap-3 p-4">
            <span class="text-muted">Jam layanan</span>
            <span class="font-medium">{{ copy.company.contactHours }}</span>
          </li>
        </ul>
        <a :href="whatsappLink()" target="_blank" rel="noopener" class="mt-6 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark">{{ copy.company.chatWhatsapp }}</a>
      </div>
      <CompanyImage slot="cta" frame-class="rounded-b-3xl rounded-t-[999px] border-4 border-[#b99a5b]/30 shadow-xl" />
    </div>
  </main>
</template>
