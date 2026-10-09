<script setup lang="ts">
import { FileHeart, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrderForm from '@/components/admin/OrderForm.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import Modal from '@/components/ui/Modal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import { useCustomerStore } from '@/stores/customer'
import { useInvitationStore } from '@/stores/invitation'
import { useOrderStore } from '@/stores/order'
import { themeList } from '@/themes'
import type { Order, PaymentStatus } from '@/types'
import type { OrderInput } from '@/services/orders'
import { formatCurrency, formatDate } from '@/utils/format'
import { coupleLabel } from '@/utils/invitation'

const store = useOrderStore()
const customers = useCustomerStore()
const invitations = useInvitationStore()
const toast = useToast()
const router = useRouter()
const route = useRoute()

const query = ref('')
const filter = ref<'all' | PaymentStatus>('all')
const editing = ref<Order | null>(null)
const formOpen = ref(false)
const saving = ref(false)
const toDelete = ref<Order | null>(null)
const formInitial = ref<OrderInput>({
  customer_id: '', invitation_id: null, tier: 'basic', theme: themeList[0]!.id,
  amount: 0, paid: 0, status: 'pending', due_date: '', notes: '',
})

const statuses: PaymentStatus[] = ['pending', 'dp', 'paid', 'cancelled']
const today = new Date().toISOString().slice(0, 10)

onMounted(async () => {
  await Promise.all([store.load(), customers.load(), invitations.load()])
  if (route.query.new === '1') {
    openCreate(typeof route.query.customer === 'string' ? route.query.customer : '')
    router.replace({ query: {} })
  }
})

const customerName = (id: string) => customers.byId(id)?.name ?? '—'
const invitationName = (id: string | null) => {
  if (!id) return copy.orders.noInvitation
  const inv = invitations.items.find((i) => i.id === id)
  return inv ? coupleLabel(inv) : '—'
}
const isOverdue = (o: Order) => o.status !== 'paid' && o.status !== 'cancelled' && o.due_date !== '' && o.due_date < today

const receivable = computed(() => store.items.filter((o) => o.status !== 'cancelled').reduce((n, o) => n + Math.max(0, o.amount - o.paid), 0))
const overdueCount = computed(() => store.items.filter(isOverdue).length)
const activeCount = computed(() => store.items.filter((o) => o.status === 'pending' || o.status === 'dp').length)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const rows = store.items.filter(
    (o) =>
      (filter.value === 'all' || o.status === filter.value) &&
      (!q || [customerName(o.customer_id), invitationName(o.invitation_id), o.notes].some((v) => v.toLowerCase().includes(q))),
  )
  return [...rows].sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))
})

const pager = usePagination(10)
watch([query, filter], () => pager.reset())
const paged = computed(() => pager.paginate(filtered.value))

function openCreate(customerId = '') {
  editing.value = null
  formInitial.value = {
    customer_id: customerId, invitation_id: null, tier: 'basic', theme: themeList[0]!.id,
    amount: 0, paid: 0, status: 'pending', due_date: '', notes: '',
  }
  formOpen.value = true
}

function openEdit(o: Order) {
  editing.value = o
  formInitial.value = {
    customer_id: o.customer_id, invitation_id: o.invitation_id, tier: o.tier, theme: o.theme,
    amount: o.amount, paid: o.paid, status: o.status, due_date: o.due_date, notes: o.notes,
  }
  formOpen.value = true
}

async function save(input: OrderInput) {
  if (!input.customer_id) return void toast.error(copy.orders.makeFailed)
  saving.value = true
  try {
    if (editing.value) await store.update(editing.value.id, input)
    else await store.create(input)
    toast.success(copy.orders.saved)
    formOpen.value = false
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  const o = toDelete.value
  toDelete.value = null
  if (!o) return
  try {
    await store.remove(o.id)
    toast.success(copy.orders.deleted)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  }
}

const statusClass = (s: PaymentStatus) =>
  s === 'paid' ? 'bg-sage-soft text-sage' : s === 'dp' ? 'bg-brand-soft text-brand' : s === 'cancelled' ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-3xl font-semibold">{{ copy.orders.title }}</h1>
        <p class="text-sm text-muted">{{ store.items.length }} {{ copy.orders.countUnit }} · {{ copy.orders.subtitle }}</p>
      </div>
      <AppButton @click="openCreate()"><Plus class="size-4" /> {{ copy.orders.add }}</AppButton>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div class="card p-3 text-center sm:p-4"><p class="text-lg font-semibold tabular-nums sm:text-2xl">{{ formatCurrency(receivable) }}</p><p class="text-xs text-muted">{{ copy.orders.receivable }}</p></div>
      <div class="card p-3 text-center sm:p-4"><p class="text-xl font-semibold tabular-nums sm:text-2xl">{{ activeCount }}</p><p class="text-xs text-muted">{{ copy.orders.activeOrders }}</p></div>
      <div class="card p-3 text-center sm:p-4" :class="overdueCount ? 'border-danger/50' : ''"><p class="text-xl font-semibold tabular-nums sm:text-2xl" :class="overdueCount ? 'text-danger' : ''">{{ overdueCount }}</p><p class="text-xs text-muted">{{ copy.orders.overdue }}</p></div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative w-full flex-1 sm:min-w-60 sm:max-w-sm">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input v-model="query" class="field-input !pl-9" :placeholder="copy.orders.searchPh" :aria-label="copy.orders.searchAria" />
      </div>
      <div class="flex flex-wrap gap-1" role="group" :aria-label="copy.orders.filterAria">
        <button type="button" class="rounded-full border px-3 py-1.5 text-[13px] font-medium" :class="filter === 'all' ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'" :aria-pressed="filter === 'all'" @click="filter = 'all'">{{ copy.common.all }}</button>
        <button v-for="s in statuses" :key="s" type="button" class="rounded-full border px-3 py-1.5 text-[13px] font-medium" :class="filter === s ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'" :aria-pressed="filter === s" @click="filter = s">{{ copy.orders.statuses[s] }}</button>
      </div>
    </div>

    <LoadingState v-if="store.loading && !store.loaded" />
    <EmptyState v-else-if="!store.items.length" :message="copy.empty.orders"><AppButton @click="openCreate()">{{ copy.orders.add }}</AppButton></EmptyState>
    <p v-else-if="!filtered.length" class="py-8 text-center text-sm text-muted">{{ copy.orders.noMatch }}</p>

    <ul v-else class="card divide-y divide-line">
      <li v-for="o in paged.rows" :key="o.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <RouterLink :to="`/admin/orders/${o.id}`" class="min-w-0 flex-1 basis-48 hover:underline">
          <p class="truncate text-sm font-medium">{{ customerName(o.customer_id) }}
            <span v-if="isOverdue(o)" class="ml-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">{{ copy.orders.overdue }}</span>
          </p>
          <p class="truncate text-xs text-muted">{{ invitationName(o.invitation_id) }}{{ o.due_date ? ` · ${copy.orders.dueDate} ${formatDate(o.due_date)}` : '' }}</p>
        </RouterLink>
        <div class="text-right">
          <p class="text-sm font-semibold tabular-nums">{{ formatCurrency(o.amount) }}</p>
          <p class="text-xs text-muted">{{ copy.orders.remainingOf }} {{ formatCurrency(Math.max(0, o.amount - o.paid)) }}</p>
        </div>
        <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(o.status)">{{ copy.orders.statuses[o.status] }}</span>
        <div class="flex">
          <RouterLink :to="`/admin/orders/${o.id}`" class="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-medium text-muted hover:bg-paper"><FileHeart class="size-3.5" /> {{ copy.orders.detail }}</RouterLink>
          <button type="button" class="rounded-lg p-2 text-muted hover:bg-black/5" :aria-label="`${copy.common.edit} ${customerName(o.customer_id)}`" @click="openEdit(o)"><Pencil class="size-4" /></button>
          <button type="button" class="rounded-lg p-2 text-danger hover:bg-danger-soft" :aria-label="`${copy.orders.deleteAria} ${customerName(o.customer_id)}`" @click="toDelete = o"><Trash2 class="size-4" /></button>
        </div>
      </li>
    </ul>
    <Pagination :page="paged.page" :total="paged.total" @prev="pager.prev()" @next="pager.next()" />

    <Modal :open="formOpen" :title="editing ? copy.orders.edit : copy.orders.add" @close="formOpen = false">
      <OrderForm :initial="formInitial" :customers="customers.items" :invitations="invitations.items" :saving="saving" @submit="save">
        <template #cancel><AppButton variant="secondary" @click="formOpen = false">{{ copy.common.cancel }}</AppButton></template>
      </OrderForm>
    </Modal>
    <ConfirmDialog :open="!!toDelete" :title="copy.orders.deleteTitle" :message="copy.orders.deleteMessage" :confirm-label="copy.common.delete" @confirm="confirmDelete" @cancel="toDelete = null" />
  </div>
</template>
