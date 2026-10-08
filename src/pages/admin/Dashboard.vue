<script setup lang="ts">
import { Eye, FileHeart, MessageSquareHeart, Send, Users, UsersRound, Globe } from 'lucide-vue-next'
import { nextTick, onMounted, ref } from 'vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import StatCard from '@/components/ui/StatCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAnimation } from '@/composables/useAnimation'
import { copy } from '@/config/copy'
import { useAnalyticsStore } from '@/stores/analytics'
import { useInvitationStore } from '@/stores/invitation'
import { coupleLabel } from '@/utils/invitation'
import { formatDateTime } from '@/utils/format'

const analytics = useAnalyticsStore()
const invitations = useInvitationStore()
const grid = ref<HTMLElement | null>(null)
const { stagger } = useAnimation()

onMounted(async () => {
  await Promise.all([analytics.loadDashboard(), invitations.load()])
  await nextTick()
  if (grid.value) stagger(Array.from(grid.value.querySelectorAll('[data-stat]')))
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="font-display text-3xl font-semibold">{{ copy.nav.dashboard }}</h1>
      <p class="text-sm text-muted">{{ copy.dashboard.subtitle }}</p>
    </div>

    <LoadingState v-if="analytics.loading && !analytics.stats" />
    <div v-else-if="analytics.stats" ref="grid" class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      <StatCard :label="copy.dashboard.stats.customers" :value="analytics.stats.customers" :icon="Users" />
      <StatCard :label="copy.dashboard.stats.invitations" :value="analytics.stats.invitations" :icon="FileHeart" />
      <StatCard :label="copy.dashboard.stats.published" :value="analytics.stats.published" :icon="Globe" />
      <StatCard :label="copy.dashboard.stats.rsvps" :value="analytics.stats.rsvps" :icon="Send" />
      <StatCard :label="copy.dashboard.stats.guests" :value="analytics.stats.guests" :icon="UsersRound" />
      <StatCard :label="copy.dashboard.stats.messages" :value="analytics.stats.messages" :icon="MessageSquareHeart" />
      <StatCard :label="copy.dashboard.stats.views" :value="analytics.stats.views" :icon="Eye" />
    </div>

    <section>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold">{{ copy.dashboard.recent }}</h2>
        <RouterLink to="/admin/invitations" class="text-sm font-medium text-brand hover:underline">{{ copy.dashboard.viewAll }}</RouterLink>
      </div>
      <EmptyState v-if="invitations.loaded && !invitations.items.length" :message="copy.empty.invitations" />
      <ul v-else class="card divide-y divide-line">
        <li v-for="i in invitations.items.slice(0, 5)" :key="i.id">
          <RouterLink :to="`/admin/invitations/${i.id}/edit`" class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-paper">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ coupleLabel(i) }}</p>
              <p class="text-xs text-muted">{{ copy.dashboard.updatedAt }} {{ formatDateTime(i.updated_at) }}</p>
            </div>
            <StatusBadge :status="i.status" />
          </RouterLink>
        </li>
      </ul>
    </section>
    <p class="text-xs text-muted"><RouterLink to="/admin/analytics" class="font-medium text-brand hover:underline">{{ copy.dashboard.analyticsLink }}</RouterLink></p>
  </div>
</template>
