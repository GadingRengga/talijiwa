<script setup lang="ts">
import { ArrowLeft, Plus } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { customerService } from '@/services/customers'
import { useInvitationStore } from '@/stores/invitation'
import { useOrderStore } from '@/stores/order'
import type { Customer } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { copy } from '@/config/copy'
import { coupleLabel, weddingDate } from '@/utils/invitation'

const route = useRoute()
const invitations = useInvitationStore()
const orders = useOrderStore()
const customer = ref<Customer | null>(null)
const loading = ref(true)
const mine = computed(() => invitations.items.filter((i) => i.customer_id === customer.value?.id))
const myOrders = computed(() => orders.items.filter((o) => o.customer_id === customer.value?.id))

onMounted(async () => {
  try {
    ;[customer.value] = await Promise.all([customerService.get(String(route.params.id)), invitations.load(), orders.load()])
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <RouterLink to="/admin/customers" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft class="size-4" /> {{ copy.customers.detailBack }}</RouterLink>
    <LoadingState v-if="loading" />
    <p v-else-if="!customer" class="text-sm text-danger">{{ copy.customers.detailMissing }}</p>
    <template v-else>
      <div>
        <h1 class="font-display text-3xl font-semibold">{{ customer.name }}</h1>
        <p class="text-sm text-muted">{{ copy.customers.detailSince }} {{ formatDateTime(customer.created_at) }}</p>
      </div>
      <dl class="card grid gap-4 p-4 text-sm sm:grid-cols-3">
        <div><dt class="text-xs text-muted">{{ copy.customers.detailPhone }}</dt><dd>{{ customer.phone || copy.customers.detailEmpty }}</dd></div>
        <div><dt class="text-xs text-muted">{{ copy.customers.detailEmail }}</dt><dd class="break-all">{{ customer.email || copy.customers.detailEmpty }}</dd></div>
        <div class="sm:col-span-3"><dt class="text-xs text-muted">{{ copy.customers.detailNotes }}</dt><dd class="whitespace-pre-line">{{ customer.notes || copy.customers.detailEmpty }}</dd></div>
      </dl>
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold">{{ copy.customers.detailOrders }}</h2>
          <RouterLink to="/admin/orders" class="text-sm font-medium text-brand hover:underline">{{ copy.customers.detailManageOrders }}</RouterLink>
        </div>
        <EmptyState v-if="!myOrders.length" :message="copy.empty.orders" />
        <ul v-else class="card divide-y divide-line">
          <li v-for="o in myOrders" :key="o.id">
            <RouterLink :to="`/admin/orders/${o.id}`" class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-paper">
              <p class="text-sm font-medium">{{ copy.orders.statuses[o.status] }} · <span class="tabular-nums">{{ formatCurrency(o.amount) }}</span></p>
              <p class="text-xs text-muted">{{ copy.orders.paidLabel }} <span class="tabular-nums">{{ formatCurrency(o.paid) }}</span></p>
            </RouterLink>
          </li>
        </ul>
      </section>
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold">{{ copy.customers.detailInvitations }}</h2>
          <RouterLink :to="`/admin/orders?new=1&customer=${customer.id}`" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"><Plus class="size-4" /> {{ copy.orders.create }}</RouterLink>
        </div>
        <EmptyState v-if="!mine.length" :message="copy.customers.detailNoInvitations" />
        <ul v-else class="card divide-y divide-line">
          <li v-for="i in mine" :key="i.id">
            <RouterLink :to="`/admin/invitations/${i.id}/edit`" class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-paper">
              <div class="min-w-0"><p class="truncate text-sm font-medium">{{ coupleLabel(i) }}</p><p class="text-xs text-muted">{{ formatDate(weddingDate(i)) || copy.customers.detailNoDate }}</p></div>
              <StatusBadge :status="i.status" />
            </RouterLink>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
