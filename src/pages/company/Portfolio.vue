<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref } from 'vue'
import { useSeo } from '@/composables/useSeo'
import { copy } from '@/config/copy'
import LoadingState from '@/components/ui/LoadingState.vue'
import { invitationService } from '@/services/invitations'
import { getTheme } from '@/themes'
import type { InvitationData } from '@/types'
import { formatDate } from '@/utils/format'
import { coupleLabel, placeholderImage, weddingDate } from '@/utils/invitation'

useSeo().apply({ title: copy.site.portfolioTitle, description: copy.site.portfolioDescription, path: '/portfolio' })

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
  <main class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <h1 class="font-display text-4xl font-semibold">Portofolio</h1>
    <LoadingState v-if="loading" />
    <p v-else-if="!items.length" class="mt-6 text-sm text-muted">Belum ada undangan yang ditampilkan.</p>
    <ul v-else class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="i in items" :key="i.id" class="card overflow-hidden">
        <img :src="thumb(i)" :alt="coupleLabel(i)" class="aspect-[4/3] w-full object-cover" width="640" height="480" loading="lazy" decoding="async" />
        <div class="space-y-1 p-4">
          <p class="font-semibold">{{ coupleLabel(i) }}</p>
          <p class="text-xs text-muted">{{ formatDate(weddingDate(i)) }} · {{ getTheme(i.theme).name }}</p>
          <RouterLink :to="`/invite/${i.slug}`" class="inline-block pt-1 text-sm font-medium text-brand hover:underline">Lihat Undangan</RouterLink>
        </div>
      </li>
    </ul>
  </main>
</template>
