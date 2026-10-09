<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { copy } from '@/config/copy'
import { myCustomerId } from '@/services/auth'
import { invitationService } from '@/services/invitations'
import { rsvpService } from '@/services/rsvp'
import type { InvitationData } from '@/types'
import { formatDate } from '@/utils/format'
import { coupleLabel, weddingDate } from '@/utils/invitation'

interface Row {
  inv: InvitationData
  attending: number
  notAttending: number
  guests: number
}

const rows = ref<Row[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const customerId = await myCustomerId()
    if (!customerId) return
    const invs = await invitationService.listByCustomer(customerId)
    rows.value = await Promise.all(
      invs.map(async (inv) => {
        const rsvps = await rsvpService.listRsvps(inv.id)
        const attending = rsvps.filter((r) => r.attendance === 'attending')
        return {
          inv,
          attending: attending.length,
          notAttending: rsvps.length - attending.length,
          guests: attending.reduce((n, r) => n + r.guest_count, 0),
        }
      }),
    )
  } finally {
    loading.value = false
  }
})

const totals = computed(() => ({
  attending: rows.value.reduce((n, r) => n + r.attending, 0),
  guests: rows.value.reduce((n, r) => n + r.guests, 0),
}))
</script>

<template>
  <main class="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
    <div>
      <h1 class="font-display text-3xl font-semibold">{{ copy.couple.dashboardTitle }}</h1>
      <p class="text-sm text-muted">{{ copy.couple.dashboardSubtitle }}</p>
    </div>

    <LoadingState v-if="loading" />
    <template v-else>
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ rows.length }}</p><p class="text-xs text-muted">{{ copy.couple.invitationUnit }}</p></div>
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ totals.attending }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.attending }}</p></div>
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ totals.guests }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.guests }}</p></div>
      </div>

      <EmptyState v-if="!rows.length" :message="copy.couple.waitingAdmin" />
      <p v-if="rows.length" class="text-sm text-muted">{{ copy.couple.singleReady }}</p>
      <ul v-if="rows.length" class="card divide-y divide-line">
        <li v-for="r in rows" :key="r.inv.id" class="flex items-center justify-between gap-3 px-4 py-3">
          <RouterLink :to="`/pasangan/undangan/${r.inv.id}`" class="min-w-0 flex-1 hover:underline">
            <p class="truncate text-sm font-medium">{{ coupleLabel(r.inv) }}</p>
            <p class="text-xs text-muted">{{ formatDate(weddingDate(r.inv)) }} · {{ r.attending }} {{ copy.rsvpAdmin.attending.toLowerCase() }} · {{ r.guests }} {{ copy.rsvpAdmin.guests }}</p>
          </RouterLink>
          <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" :class="r.inv.status === 'published' ? 'bg-sage-soft text-sage' : 'bg-warn-soft text-warn'">
            {{ r.inv.status === 'published' ? copy.couple.publishedShort : copy.couple.draftShort }}
          </span>
          <RouterLink :to="`/pasangan/undangan/${r.inv.id}/kelola`"><AppButton size="sm" variant="secondary">{{ copy.couple.manageCta }}</AppButton></RouterLink>
        </li>
      </ul>
    </template>
  </main>
</template>
