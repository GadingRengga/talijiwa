<script setup lang="ts">
import { useSeo } from '@/composables/useSeo'
import { company, whatsappLink } from '@/config/company'

import { copy } from '@/config/copy'

useSeo().apply({ title: copy.site.aboutTitle, description: copy.site.aboutDescription, path: '/about' })
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <h1 class="font-display text-4xl font-semibold">Tentang Kami</h1>
    <div class="mt-4 space-y-4 text-sm leading-relaxed text-muted">
      <p>{{ company.company_name }} adalah layanan pembuatan undangan pernikahan digital. Kami mengerjakan desain, teks, galeri, RSVP, ucapan, amplop digital, hingga tautan siap kirim — Anda terima beres dan tinggal sebarkan ke tamu lewat WhatsApp.</p>
      <p>Setiap pasangan mendapat dashboard pantauan: siapa yang hadir, siapa yang berhalangan, ucapan yang masuk, dan konfirmasi hadiah — diperbarui otomatis tanpa perlu bertanya.</p>
      <p>Kami berbasis di {{ company.address }} dan melayani seluruh Indonesia.</p>
    </div>
    <a :href="whatsappLink()" target="_blank" rel="noopener" class="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">Chat via WhatsApp</a>
  </main>
</template>
