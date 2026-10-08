<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import BarChart from '@/components/admin/BarChart.vue'
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
    <div>
      <h1 class="font-display text-3xl font-semibold">Analitik</h1>
      <p class="text-sm text-muted">{{ inv ? coupleLabel(inv) : '…' }}</p>
    </div>
    <LoadingState v-if="loading" />
    <template v-else>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ totalViews }}</p><p class="text-xs text-muted">Dilihat (14 hari)</p></div>
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ attending }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.attending }}</p></div>
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ notAttending }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.notAttending }}</p></div>
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ guests }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.guests }}</p></div>
      </div>
      <section class="card p-4 sm:p-5">
        <h2 class="mb-4 text-base font-semibold">14 hari terakhir</h2>
        <BarChart :points="points" label="Grafik dilihat dan RSVP undangan ini" />
      </section>
      <RouterLink :to="`/admin/invitations/${id}/rsvp`" class="text-sm font-medium text-brand hover:underline">Lihat daftar RSVP →</RouterLink>
    </template>
  </div>
</template>
