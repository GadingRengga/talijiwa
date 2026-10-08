<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { copy } from '@/config/copy'
import { invitationService } from '@/services/invitations'
import { rsvpService } from '@/services/rsvp'
import type { GiftConfirmation, InvitationData } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { coupleLabel } from '@/utils/invitation'

const route = useRoute()
const id = String(route.params.id)
const inv = ref<InvitationData | null>(null)
const items = ref<GiftConfirmation[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    inv.value = await invitationService.get(id)
    items.value = await rsvpService.listGiftConfirmations(id)
  } finally {
    loading.value = false
  }
})

const total = computed(() => items.value.reduce((n, g) => n + (g.amount ?? 0), 0))
const pager = usePagination(10)
const paged = computed(() => pager.paginate(items.value))
const giftTypeLabel = (t: GiftConfirmation['gift_type']) => copy.giftsAdmin.types[t]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="font-display text-3xl font-semibold">{{ copy.giftsAdmin.title }}</h1>
      <p class="text-sm text-muted">{{ inv ? coupleLabel(inv) : '…' }} · {{ items.length }} konfirmasi · {{ copy.giftsAdmin.total }} {{ formatCurrency(total) }}</p>
    </div>

    <LoadingState v-if="loading" />
    <template v-else>
      <section v-if="inv?.gifts.length">
        <h2 class="mb-2 text-sm font-semibold">{{ copy.giftsAdmin.accounts }}</h2>
        <ul class="grid gap-3 sm:grid-cols-2">
          <li v-for="a in inv.gifts" :key="a.id" class="card p-4">
            <p class="text-xs text-muted">{{ copy.giftsAdmin.kinds[a.kind] }} · {{ a.provider }}</p>
            <p class="mt-1 break-all font-semibold tabular-nums">{{ a.number }}</p>
            <p class="text-xs text-muted">{{ copy.giftsAdmin.holderPrefix }} {{ a.holder }}</p>
          </li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-semibold">{{ copy.giftsAdmin.confirmations }}</h2>
        <EmptyState v-if="!items.length" :message="copy.empty.giftConfirmations" />
        <ul v-else class="card divide-y divide-line">
          <li v-for="g in paged.rows" :key="g.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
            <div class="min-w-0 flex-1 basis-48">
              <p class="truncate text-sm font-medium">{{ g.name }}</p>
              <p class="truncate text-xs text-muted">{{ giftTypeLabel(g.gift_type) }} · {{ formatDateTime(g.created_at) }}</p>
              <p v-if="g.message" class="mt-0.5 truncate text-xs text-muted">“{{ g.message }}”</p>
            </div>
            <span class="text-sm font-semibold tabular-nums">{{ g.amount == null ? '—' : formatCurrency(g.amount) }}</span>
          </li>
        </ul>
        <Pagination :page="paged.page" :total="paged.total" @prev="pager.prev()" @next="pager.next()" />
      </section>
    </template>
  </div>
</template>
