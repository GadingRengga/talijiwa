<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref } from 'vue'
import CompanyImage from '@/components/company/CompanyImage.vue'
import { useScrollReveal } from '@/composables/useAnimation'
import { useSeo } from '@/composables/useSeo'
import { whatsappLink } from '@/config/company'
import { copy } from '@/config/copy'
import { SITE } from '@/config/seoPrerender'
import LoadingState from '@/components/ui/LoadingState.vue'
import { invitationService } from '@/services/invitations'
import { getTheme } from '@/themes'
import type { InvitationData } from '@/types'
import { formatDate } from '@/utils/format'
import { coupleLabel, placeholderImage, weddingDate } from '@/utils/invitation'

const page = ref<HTMLElement | null>(null)
useScrollReveal(page, () => 'rise')
useSeo().apply({ title: copy.site.portfolioTitle, description: copy.site.portfolioDescription, path: '/portfolio', image: `${SITE}/og-share.jpg` })

const all = ref<InvitationData[]>([])
const loading = ref(true)
const items = computed(() => all.value.filter((i) => i.status === 'published' && i.settings.show_in_portfolio))
const thumb = (i: InvitationData) => i.gallery.find((g) => g.is_cover)?.url || placeholderImage(coupleLabel(i))

const loadData = async () => {
  try {
    all.value = await invitationService.list()
  } catch {
    all.value = []
  } finally {
    loading.value = false
  }
}
onServerPrefetch(loadData)
onMounted(loadData)
</script>

<template>
  <main ref="page" class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <h1 class="font-display text-4xl font-semibold">{{ copy.company.portfolioHeading }}</h1>
    <p class="mt-2 text-muted">{{ copy.company.portfolioSubtitle }}</p>
    <LoadingState v-if="loading" />
    <div v-else-if="!items.length" class="mx-auto mt-10 max-w-2xl text-center" data-reveal>
      <CompanyImage slot="cta" frame-class="mx-auto aspect-[8/5] max-w-md rounded-3xl shadow-lg" />
      <p class="mt-6 text-muted">{{ copy.company.portfolioEmpty }}</p>
      <a :href="whatsappLink()" target="_blank" rel="noopener" class="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">{{ copy.company.orderNow }}</a>
    </div>
    <ul v-else class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-reveal>
      <li v-for="i in items" :key="i.id" class="card group overflow-hidden transition-transform duration-300 hover:-translate-y-1">
        <div class="aspect-[4/3] overflow-hidden">
          <img :src="thumb(i)" :alt="coupleLabel(i)" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" width="640" height="480" loading="lazy" decoding="async" />
        </div>
        <div class="space-y-1 p-4">
          <p class="font-semibold">{{ coupleLabel(i) }}</p>
          <p class="text-xs text-muted">{{ formatDate(weddingDate(i)) }} · {{ getTheme(i.theme).name }}</p>
          <RouterLink :to="`/invite/${i.slug}`" class="inline-block pt-1 text-sm font-medium text-brand hover:underline">{{ copy.company.viewInvitation }}</RouterLink>
        </div>
      </li>
    </ul>
  </main>
</template>
