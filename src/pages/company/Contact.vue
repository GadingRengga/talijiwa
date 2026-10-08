<script setup lang="ts">
import { computed } from 'vue'
import { useSeo } from '@/composables/useSeo'
import { company, whatsappLink } from '@/config/company'
import { copy } from '@/config/copy'
import { useContentStore } from '@/stores/content'

useSeo().apply({ title: copy.site.contactTitle, description: copy.site.aboutDescription, path: '/contact' })

const content = useContentStore()
await content.load(false).catch(() => undefined)
const contactText = computed(() => content.text('contact_text', 'Hubungi kami lewat WhatsApp untuk memesan undangan.'))
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <h1 class="font-display text-4xl font-semibold">Kontak</h1>
    <p class="mt-3 text-muted">{{ contactText }}</p>
    <p class="mt-2 text-sm text-muted">{{ company.address }}</p>
    <a :href="whatsappLink()" target="_blank" rel="noopener" class="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">Chat via WhatsApp</a>
  </main>
</template>
