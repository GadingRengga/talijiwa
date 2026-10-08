<script setup lang="ts">
import { ArrowDownWideNarrow, Download, Search } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { copy } from '@/config/copy'
import { invitationService } from '@/services/invitations'
import { rsvpService } from '@/services/rsvp'
import type { Attendance, InvitationData, Rsvp } from '@/types'
import { formatDateTime } from '@/utils/format'
import { coupleLabel } from '@/utils/invitation'

const route = useRoute()
const id = String(route.params.id)
const inv = ref<InvitationData | null>(null)
const items = ref<Rsvp[]>([])
const loading = ref(true)
const query = ref('')
const filter = ref<'all' | Attendance>('all')
const sort = ref<'newest' | 'name'>('newest')

onMounted(async () => {
  try {
    inv.value = await invitationService.get(id)
    items.value = await rsvpService.listRsvps(id)
  } finally {
    loading.value = false
  }
})

const attending = computed(() => items.value.filter((r) => r.attendance === 'attending'))
const guests = computed(() => attending.value.reduce((n, r) => n + r.guest_count, 0))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const rows = items.value.filter(
    (r) => (filter.value === 'all' || r.attendance === filter.value) && (!q || [r.name, r.message].some((v) => v.toLowerCase().includes(q))),
  )
  return rows.sort((a, b) => (sort.value === 'name' ? a.name.localeCompare(b.name, 'id') : b.created_at.localeCompare(a.created_at)))
})

const pager = usePagination(15)
watch([query, filter], () => pager.reset())
const paged = computed(() => pager.paginate(filtered.value))

function downloadCsv() {
  const head = ['Nama', 'WhatsApp', 'Kehadiran', 'Jumlah', 'Pesan', 'Waktu']
  const esc = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`
  const lines = filtered.value.map((r) =>
    [r.name, r.whatsapp, r.attendance === 'attending' ? 'Hadir' : 'Tidak hadir', r.guest_count, r.message, r.created_at].map(esc).join(','),
  )
  const blob = new Blob([`\uFEFF${head.join(',')}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `rsvp-${inv.value?.slug ?? 'undangan'}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="font-display text-3xl font-semibold">{{ copy.rsvpAdmin.title }}</h1>
      <p class="text-sm text-muted">{{ inv ? coupleLabel(inv) : '…' }} · {{ attending.length }} hadir · {{ guests }} {{ copy.rsvpAdmin.guests }}</p>
    </div>

    <LoadingState v-if="loading" />
    <template v-else>
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ attending.length }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.attending }}</p></div>
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ items.length - attending.length }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.notAttending }}</p></div>
        <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ guests }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.guests }}</p></div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="relative w-full flex-1 sm:min-w-60 sm:max-w-sm">
          <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input v-model="query" class="field-input !pl-9" :placeholder="copy.rsvpAdmin.search" aria-label="Cari RSVP" />
        </div>
        <div class="flex flex-wrap gap-1" role="group" aria-label="Filter kehadiran">
          <button type="button" class="rounded-full border px-3 py-1.5 text-[13px] font-medium" :class="filter === 'all' ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'" @click="filter = 'all'">Semua</button>
          <button type="button" class="rounded-full border px-3 py-1.5 text-[13px] font-medium" :class="filter === 'attending' ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'" @click="filter = 'attending'">{{ copy.rsvpAdmin.attending }}</button>
          <button type="button" class="rounded-full border px-3 py-1.5 text-[13px] font-medium" :class="filter === 'not_attending' ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'" @click="filter = 'not_attending'">{{ copy.rsvpAdmin.notAttending }}</button>
        </div>
        <div class="flex gap-1" role="group" aria-label="Urutkan">
          <button type="button" class="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[13px] font-medium text-muted hover:text-ink" @click="sort = sort === 'newest' ? 'name' : 'newest'">
            <ArrowDownWideNarrow class="size-3.5" /> {{ sort === 'newest' ? 'Terbaru' : 'Nama A–Z' }}
          </button>
          <button type="button" class="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[13px] font-medium text-muted hover:text-ink" @click="downloadCsv">
            <Download class="size-3.5" /> CSV
          </button>
        </div>
      </div>

      <EmptyState v-if="!items.length" :message="copy.empty.rsvps" />
      <p v-else-if="!filtered.length" class="py-8 text-center text-sm text-muted">Tidak ada yang cocok.</p>
      <ul v-else class="card divide-y divide-line">
        <li v-for="r in paged.rows" :key="r.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
          <div class="min-w-0 flex-1 basis-48">
            <p class="truncate text-sm font-medium">{{ r.name }}</p>
            <p class="truncate text-xs text-muted">{{ r.whatsapp }} · {{ formatDateTime(r.created_at) }}</p>
            <p v-if="r.message" class="mt-0.5 truncate text-xs text-muted">“{{ r.message }}”</p>
          </div>
          <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="r.attendance === 'attending' ? 'bg-sage-soft text-sage' : 'bg-danger-soft text-danger'">
            {{ r.attendance === 'attending' ? `${copy.rsvpAdmin.attending} · ${r.guest_count}` : copy.rsvpAdmin.notAttending }}
          </span>
        </li>
      </ul>
      <Pagination :page="paged.page" :total="paged.total" @prev="pager.prev()" @next="pager.next()" />
    </template>
  </div>
</template>
