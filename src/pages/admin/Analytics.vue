<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BarChart from '@/components/admin/BarChart.vue'
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
  <div class="space-y-8">
    <h1 class="font-display text-3xl font-semibold">{{ copy.nav.analytics }}</h1>
    <LoadingState v-if="loading" />
    <template v-else-if="stats">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Pelanggan" :value="stats.customers" :icon="Users" />
        <StatCard label="Undangan" :value="stats.invitations" :icon="FileHeart" />
        <StatCard label="Undangan terbit" :value="stats.published" :icon="Globe" />
        <StatCard label="Total RSVP" :value="stats.rsvps" :icon="Send" />
        <StatCard label="Tamu hadir" :value="stats.guests" :icon="UsersRound" />
        <StatCard label="Ucapan" :value="stats.messages" :icon="MessageSquareHeart" />
        <StatCard label="Dilihat" :value="stats.views" :icon="Eye" />
      </div>
      <section class="card p-4 sm:p-5">
        <h2 class="mb-4 text-base font-semibold">14 hari terakhir</h2>
        <BarChart :points="points" label="Grafik dilihat dan RSVP 14 hari terakhir" />
      </section>
    </template>
  </div>
</template>
