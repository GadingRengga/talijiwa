<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { company, whatsappLink } from '@/config/company'
import { copy } from '@/config/copy'

const route = useRoute()
const open = ref(false)
watch(() => route.fullPath, () => (open.value = false))

const links = [
  { to: '/', label: 'Beranda' },
  { to: '/about', label: 'Tentang' },
  { to: '/templates', label: 'Template' },
  { to: '/services', label: 'Layanan' },
  { to: '/portfolio', label: 'Portofolio' },
  { to: '/contact', label: 'Kontak' },
]
</script>

<template>
  <div class="min-h-dvh bg-paper">
    <header class="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <RouterLink to="/" class="font-display text-2xl font-semibold tracking-tight">{{ company.company_name }}</RouterLink>
        <nav class="hidden items-center gap-6 md:flex" aria-label="Menu utama">
          <RouterLink v-for="l in links" :key="l.to" :to="l.to" class="text-sm text-muted hover:text-ink" active-class="!text-ink">
            {{ l.label }}
          </RouterLink>
          <RouterLink to="/pasangan/masuk" class="text-sm text-muted hover:text-ink" active-class="!text-ink">
            {{ copy.company.coupleLogin }}
          </RouterLink>
          <a :href="whatsappLink()" target="_blank" rel="noopener" class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            Pesan Sekarang
          </a>
        </nav>
        <button class="rounded-lg p-1.5 md:hidden" :aria-label="open ? 'Tutup menu' : 'Buka menu'" @click="open = !open">
          <component :is="open ? X : Menu" class="size-5" />
        </button>
      </div>
      <nav v-if="open" class="space-y-1 border-t border-line px-4 py-3 md:hidden" aria-label="Menu utama">
        <RouterLink v-for="l in links" :key="l.to" :to="l.to" class="block rounded-lg px-3 py-2 text-sm hover:bg-black/5">{{ l.label }}</RouterLink>
        <RouterLink to="/pasangan/masuk" class="block rounded-lg px-3 py-2 text-sm hover:bg-black/5">{{ copy.company.coupleLogin }}</RouterLink>
      </nav>
    </header>
    <RouterView />
    <footer class="border-t border-line py-8 text-center text-sm text-muted">
      <p>© {{ new Date().getFullYear() }} {{ company.company_name }}. {{ company.address }}</p>
    </footer>
  </div>
</template>
