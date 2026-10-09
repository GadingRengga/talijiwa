<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BarChart from '@/components/admin/BarChart.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { Eye, FileHeart, MessageSquareHeart, Send, Users, UsersRound, Globe } from 'lucide-vue-next'
import { copy } from '@/config/copy'
import { analyticsService } from '@/services/analytics'
import type { DashboardStats, DayPoint } from '@/services/analytics'
import { useAnalyticsStore } from '@/stores/analytics'

const analytics = useAnalyticsStore()
const stats = ref<DashboardStats | null>(null)
const points = ref<DayPoint[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [s, p] = await Promise.all([analyticsService.dashboard(), analyticsService.series(14)])
    stats.value = s
    points.value = p
    await analytics.loadDashboard()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="copy.nav.analytics" />
    <LoadingState v-if="loading" />
    <template v-else-if="stats">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <StatCard :label="copy.dashboard.stats.customers" :value="stats.customers" :icon="Users" />
        <StatCard :label="copy.dashboard.stats.invitations" :value="stats.invitations" :icon="FileHeart" />
        <StatCard :label="copy.dashboard.stats.published" :value="stats.published" :icon="Globe" />
        <StatCard :label="copy.dashboard.stats.rsvps" :value="stats.rsvps" :icon="Send" />
        <StatCard :label="copy.dashboard.stats.guests" :value="stats.guests" :icon="UsersRound" />
        <StatCard :label="copy.dashboard.stats.messages" :value="stats.messages" :icon="MessageSquareHeart" />
        <StatCard :label="copy.dashboard.stats.views" :value="stats.views" :icon="Eye" />
      </div>
      <section class="card p-4 sm:p-5">
        <h2 class="mb-4 text-base font-semibold">{{ copy.analytics.rangeTitle }}</h2>
        <BarChart :points="points" :label="`${copy.analytics.chartLabel} ${copy.analytics.rangeTitle.toLowerCase()}`" />
      </section>
    </template>
  </div>
</template>
