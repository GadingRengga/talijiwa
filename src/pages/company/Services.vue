<script setup lang="ts">
import { onMounted, onServerPrefetch } from 'vue'
import { useSeo } from '@/composables/useSeo'
import { company, whatsappLink } from '@/config/company'
import { useCatalogStore } from '@/stores/catalog'
import { useContentStore } from '@/stores/content'
import { formatCurrency } from '@/utils/format'

import { copy } from '@/config/copy'

useSeo().apply({ title: copy.site.servicesTitle, description: copy.site.servicesDescription, path: '/services' })
const catalog = useCatalogStore()
const content = useContentStore()
const loadData = () => Promise.allSettled([catalog.load(), content.load(false)])
onServerPrefetch(loadData)
onMounted(loadData)
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <h1 class="font-display text-4xl font-semibold">Layanan & Harga</h1>
    <p class="mt-2 max-w-2xl text-muted">Satu harga per template, sudah termasuk semua fitur. Tanpa biaya tersembunyi.</p>

    <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="t in catalog.active" :key="t.theme" class="card space-y-2 p-5">
        <p class="font-semibold">{{ t.name }}</p>
        <p class="text-xs text-muted">{{ t.description }}</p>
        <p v-if="t.price > 0" class="font-display text-3xl font-semibold text-brand tabular-nums">{{ formatCurrency(t.price) }}</p>
        <RouterLink :to="`/invite/demo-${t.theme}`" class="inline-block text-sm font-medium text-brand hover:underline">Lihat demo →</RouterLink>
      </li>
    </ul>

    <section class="mx-auto mt-16 max-w-3xl">
      <h2 class="mb-6 text-center font-display text-3xl font-semibold">Cara pesan</h2>
      <ol class="space-y-3">
        <li v-for="(s, i) in ['Chat WhatsApp dan pilih template favorit Anda.', 'Kirim data + foto, kami garap 1–3 hari kerja.', 'Terima tautan + QR + pesan siap kirim ke tamu.', 'Pantau kehadiran tamu real-time dari dashboard pasangan.']" :key="i" class="card flex gap-3 p-4">
          <span class="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{{ i + 1 }}</span>
          <p class="text-sm">{{ s }}</p>
        </li>
      </ol>
      <div class="mt-8 text-center">
        <a :href="whatsappLink()" target="_blank" rel="noopener" class="inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">Pesan via WhatsApp</a>
        <p class="mt-2 text-xs text-muted">{{ company.address }}</p>
      </div>
    </section>
  </main>
</template>
