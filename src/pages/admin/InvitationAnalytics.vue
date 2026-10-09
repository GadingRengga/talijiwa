<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import BarChart from '@/components/admin/BarChart.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { analyticsService } from '@/services/analytics'
import type { DayPoint } from '@/services/analytics'
import { invitationService } from '@/services/invitations'
import { rsvpService } from '@/services/rsvp'
import type { InvitationData } from '@/types'
import { copy } from '@/config/copy'
import { coupleLabel } from '@/utils/invitation'

const route = useRoute()
const id = String(route.params.id)
const inv = ref<InvitationData | null>(null)
const points = ref<DayPoint[]>([])
const attending = ref(0)
const notAttending = ref(0)
const guests = ref(0)
const loading = ref(true)

onMounted(async () => {
  try {
    inv.value = await invitationService.get(id)
    const [p, rsvps] = await Promise.all([analyticsService.series(14, id), rsvpService.listRsvps(id)])
    points.value = p
    attending.value = rsvps.filter((r) => r.attendance === 'attending').length
    notAttending.value = rsvps.length - attending.value
    guests.value = rsvps.filter((r) => r.attendance === 'attending').reduce((n, r) => n + r.guest_count, 0)
  } finally {
    loading.value = false
  }
})

const totalViews = computed(() => points.value.reduce((n, p) => n + p.views, 0))
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="copy.nav.analytics" :subtitle="inv ? coupleLabel(inv) : '…'" />
    <LoadingState v-if="loading" />
    <p v-else-if="!inv" class="text-sm text-danger">{{ copy.invitation.notFound }}</p>
    <template v-else>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ totalViews }}</p><p class="text-xs text-muted">{{ copy.analytics.viewsDays }}</p></div>
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ attending }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.attending }}</p></div>
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ notAttending }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.notAttending }}</p></div>
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ guests }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.guests }}</p></div>
      </div>
      <section class="card p-4 sm:p-5">
        <h2 class="mb-4 text-base font-semibold">{{ copy.analytics.rangeTitle }}</h2>
        <BarChart :points="points" :label="copy.analytics.chartLabelOne" />
      </section>
      <nav class="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Data tamu">
        <RouterLink :to="`/admin/invitations/${id}/rsvp`" class="font-medium text-brand hover:underline">{{ copy.rsvpAdmin.title }} →</RouterLink>
        <RouterLink :to="`/admin/invitations/${id}/messages`" class="font-medium text-brand hover:underline">{{ copy.messagesAdmin.title }} →</RouterLink>
        <RouterLink :to="`/admin/invitations/${id}/gifts`" class="font-medium text-brand hover:underline">{{ copy.giftsAdmin.title }} →</RouterLink>
      </nav>
    </template>
  </div>
</template>
