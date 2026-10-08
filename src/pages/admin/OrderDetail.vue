<script setup lang="ts">
import { Check, FileHeart, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrderForm from '@/components/admin/OrderForm.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import Modal from '@/components/ui/Modal.vue'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import { orderService } from '@/services/orders'
import type { OrderInput } from '@/services/orders'
import { invitationService } from '@/services/invitations'
import { useCustomerStore } from '@/stores/customer'
import { useInvitationStore } from '@/stores/invitation'
import { useOrderStore } from '@/stores/order'
import { usePaymentStore } from '@/stores/payment'
import { themeList } from '@/themes'
import type { InvitationData, Order, PaymentMethod } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { coupleLabel } from '@/utils/invitation'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)
const toast = useToast()
const customers = useCustomerStore()
const invitations = useInvitationStore()
const orders = useOrderStore()
const payments = usePaymentStore()

const order = ref<Order | null>(null)
const inv = ref<InvitationData | null>(null)
const loading = ref(true)
const editOpen = ref(false)
const saving = ref(false)
const payOpen = ref(false)
const paySaving = ref(false)
const toDeletePay = ref<string | null>(null)
const making = ref(false)
const makeOpen = ref(false)
const makeTitle = ref('')

const formInitial = ref<OrderInput>({ customer_id: '', invitation_id: null, theme: themeList[0]!.id, amount: 0, paid: 0, status: 'pending', due_date: '', notes: '' })
const payForm = ref({ amount: 0, method: 'transfer' as PaymentMethod, paid_at: new Date().toISOString().slice(0, 10), note: '' })
const methods: PaymentMethod[] = ['transfer', 'ewallet', 'cash', 'other']

async function reload() {
  order.value = await orderService.get(id)
  inv.value = order.value?.invitation_id ? await invitationService.get(order.value.invitation_id) : null
  if (order.value) await payments.load(order.value.id)
}

onMounted(async () => {
  try {
    await Promise.all([customers.load(), invitations.load(), orders.load()])
    await reload()
    if (!order.value) router.replace('/admin/orders')
  } finally {
    loading.value = false
  }
})

const customerName = computed(() => (order.value ? (customers.byId(order.value.customer_id)?.name ?? '—') : ''))
const remaining = computed(() => (order.value ? Math.max(0, order.value.amount - order.value.paid) : 0))
const isPaidOff = computed(() => !!order.value && order.value.paid >= order.value.amount)
const isPublished = computed(() => inv.value?.status === 'published')

const steps = computed(() => [
  { label: copy.orders.steps[0], done: true, hint: `${customerName.value} · ${order.value ? formatCurrency(order.value.amount) : ''}` },
  { label: copy.orders.steps[1], done: !!order.value?.invitation_id, hint: inv.value ? coupleLabel(inv.value) : copy.orders.noInvitation },
  { label: copy.orders.steps[2], done: isPublished.value, hint: inv.value ? (isPublished.value ? copy.orders.publishedShort : copy.orders.draftShort) : '—' },
  { label: copy.orders.steps[3], done: !!order.value?.delivered_at, hint: order.value?.delivered_at ? formatDateTime(order.value.delivered_at) : copy.orders.notDelivered },
])

function openMake() {
  if (!order.value) return
  makeTitle.value = customerName.value === '—' ? '' : customerName.value
  makeOpen.value = true
}

async function makeInvitation() {
  if (!order.value || !makeTitle.value.trim()) return
  making.value = true
  try {
    const created = await invitations.create(order.value.customer_id, makeTitle.value.trim(), order.value.theme)
    const updated = await orderService.update(order.value.id, {
      customer_id: order.value.customer_id, invitation_id: created.id, theme: order.value.theme,
      amount: order.value.amount, paid: order.value.paid, status: order.value.status,
      due_date: order.value.due_date, notes: order.value.notes,
    })
    order.value = updated
    inv.value = created
    makeOpen.value = false
    toast.success(copy.orders.createdGoBuilder)
    router.push(`/admin/invitations/${created.id}/edit`)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  } finally {
    making.value = false
  }
}

function openEdit() {
  if (!order.value) return
  formInitial.value = {
    customer_id: order.value.customer_id, invitation_id: order.value.invitation_id, theme: order.value.theme,
    amount: order.value.amount, paid: order.value.paid, status: order.value.status,
    due_date: order.value.due_date, notes: order.value.notes,
  }
  editOpen.value = true
}

async function saveEdit(input: OrderInput) {
  if (!order.value) return
  saving.value = true
  try {
    order.value = await orderService.update(order.value.id, input)
    await reload()
    editOpen.value = false
    toast.success(copy.orders.saved)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  } finally {
    saving.value = false
  }
}

async function savePayment() {
  if (!order.value) return
  paySaving.value = true
  try {
    await payments.record(order.value.id, { ...payForm.value })
    order.value = await orderService.get(order.value.id)
    payOpen.value = false
    payForm.value = { amount: 0, method: 'transfer', paid_at: new Date().toISOString().slice(0, 10), note: '' }
    toast.success(copy.orders.paymentSaved)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  } finally {
    paySaving.value = false
  }
}

async function confirmDeletePay() {
  const pid = toDeletePay.value
  toDeletePay.value = null
  if (!pid || !order.value) return
  try {
    await payments.remove(pid)
    order.value = await orderService.get(order.value.id)
    toast.success(copy.orders.paymentDeleted)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  }
}

async function markDelivered() {
  if (!order.value) return
  try {
    order.value = await orderService.setDelivered(order.value.id, true)
    toast.success(copy.orders.delivered)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  }
}

const statusClass = (s: string) =>
  s === 'paid' ? 'bg-sage-soft text-sage' : s === 'dp' ? 'bg-brand-soft text-brand' : s === 'cancelled' ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'
</script>

<template>
  <div class="space-y-6">
    <LoadingState v-if="loading" />
    <template v-else-if="order">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="font-display text-3xl font-semibold">{{ customerName }}</h1>
          <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(order.status)">{{ copy.orders.statuses[order.status] }}</span>
            <span class="tabular-nums">{{ formatCurrency(order.paid) }} / {{ formatCurrency(order.amount) }}</span>
            <span v-if="order.due_date">· {{ copy.orders.dueDate }} {{ formatDate(order.due_date) }}</span>
          </p>
        </div>
        <AppButton variant="secondary" size="sm" @click="openEdit"><Pencil class="size-4" /> {{ copy.orders.editOrder }}</AppButton>
      </div>

      <!-- Stepper -->
      <ol class="card grid gap-1 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
        <li v-for="(s, i) in steps" :key="s.label" class="flex items-center gap-3 rounded-lg p-2" :class="s.done ? '' : 'bg-paper'">
          <span class="grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold" :class="s.done ? 'bg-sage text-white' : 'bg-line text-muted'">
            <Check v-if="s.done" class="size-4" /><span v-else>{{ i + 1 }}</span>
          </span>
          <span class="min-w-0"><span class="block truncate text-sm font-semibold">{{ s.label }}</span><span class="block truncate text-xs text-muted">{{ s.hint }}</span></span>
        </li>
      </ol>

      <!-- Step actions -->
      <div class="card space-y-3 p-4">
        <div v-if="!order.invitation_id" class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm">{{ copy.orders.noInvitationYet }}</p>
          <AppButton size="sm" @click="openMake"><FileHeart class="size-4" /> {{ copy.orders.makeInvitation }}</AppButton>
        </div>
        <div v-else class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm">{{ copy.orders.invitationIs }} <span class="font-semibold">{{ inv ? coupleLabel(inv) : '…' }}</span> · {{ inv?.status === 'published' ? copy.orders.publishedShort : copy.orders.draftShort }}</p>
          <RouterLink :to="`/admin/invitations/${order.invitation_id}/edit`"><AppButton size="sm" variant="secondary"><FileHeart class="size-4" /> {{ copy.orders.openBuilder }}</AppButton></RouterLink>
        </div>
        <p v-if="order.invitation_id && !isPaidOff" class="flex items-start gap-2 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn" role="status">
          {{ copy.orders.unpaidWarning }} {{ formatCurrency(remaining) }}.
        </p>
        <div v-if="order.invitation_id && !order.delivered_at" class="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p class="text-sm">{{ copy.orders.handoverAsk }}</p>
          <AppButton size="sm" variant="secondary" @click="markDelivered"><Check class="size-4" /> {{ copy.orders.markDelivered }}</AppButton>
        </div>
        <p v-else-if="order.delivered_at" class="border-t border-line pt-3 text-sm text-sage">✓ {{ copy.orders.delivered }} · {{ formatDateTime(order.delivered_at) }}</p>
      </div>

      <!-- Payments -->
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold">{{ copy.orders.payments }} · <span class="tabular-nums">{{ formatCurrency(order.paid) }}</span></h2>
          <AppButton size="sm" @click="payOpen = true"><Plus class="size-4" /> {{ copy.orders.recordPayment }}</AppButton>
        </div>
        <p v-if="!payments.items.length" class="py-4 text-center text-sm text-muted">{{ copy.orders.noPayments }}</p>
        <ul v-else class="card divide-y divide-line">
          <li v-for="p in payments.items" :key="p.id" class="flex items-center justify-between gap-3 px-4 py-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold tabular-nums">{{ formatCurrency(p.amount) }} <span class="font-normal text-muted">· {{ copy.orders.methods[p.method] }}</span></p>
              <p class="truncate text-xs text-muted">{{ formatDate(p.paid_at) }}{{ p.note ? ` · ${p.note}` : '' }}</p>
            </div>
            <button type="button" class="rounded-lg p-2 text-danger hover:bg-danger-soft" :aria-label="copy.orders.deletePayment" @click="toDeletePay = p.id"><Trash2 class="size-4" /></button>
          </li>
        </ul>
      </section>

      <Modal :open="makeOpen" :title="copy.orders.makeInvitation" @close="makeOpen = false">
        <form class="space-y-4" @submit.prevent="makeInvitation">
          <FormField :label="copy.orders.invitationTitle" v-slot="{ id }"><input :id="id" v-model="makeTitle" class="field-input" placeholder="Raka & Sinta" maxlength="80" required /></FormField>
          <div class="flex justify-end gap-2">
            <AppButton variant="secondary" @click="makeOpen = false">{{ copy.common.cancel }}</AppButton>
            <AppButton type="submit" :loading="making">{{ copy.orders.makeInvitation }}</AppButton>
          </div>
        </form>
      </Modal>

      <Modal :open="editOpen" :title="copy.orders.edit" @close="editOpen = false">
        <OrderForm :initial="formInitial" :customers="customers.items" :invitations="invitations.items" :saving="saving" @submit="saveEdit">
          <template #cancel><AppButton variant="secondary" @click="editOpen = false">{{ copy.common.cancel }}</AppButton></template>
        </OrderForm>
      </Modal>

      <Modal :open="payOpen" :title="copy.orders.recordPayment" @close="payOpen = false">
        <form class="space-y-4" @submit.prevent="savePayment">
          <FormField :label="copy.orders.paymentAmount" v-slot="{ id }"><input :id="id" v-model.number="payForm.amount" type="number" min="1" class="field-input" required /></FormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField :label="copy.orders.paymentMethod" v-slot="{ id }">
              <select :id="id" v-model="payForm.method" class="field-input">
                <option v-for="m in methods" :key="m" :value="m">{{ copy.orders.methods[m] }}</option>
              </select>
            </FormField>
            <FormField :label="copy.orders.paymentDate" v-slot="{ id }"><input :id="id" v-model="payForm.paid_at" type="date" class="field-input" /></FormField>
          </div>
          <FormField :label="copy.orders.paymentNote" optional v-slot="{ id }"><input :id="id" v-model="payForm.note" class="field-input" :placeholder="copy.orders.payNotePh" /></FormField>
          <div class="flex justify-end gap-2">
            <AppButton variant="secondary" @click="payOpen = false">{{ copy.common.cancel }}</AppButton>
            <AppButton type="submit" :loading="paySaving">{{ copy.common.save }}</AppButton>
          </div>
        </form>
      </Modal>
      <ConfirmDialog :open="!!toDeletePay" :title="copy.orders.deletePaymentTitle" :message="copy.orders.deletePaymentMsg" :confirm-label="copy.common.delete" @confirm="confirmDeletePay" @cancel="toDeletePay = null" />
    </template>
  </div>
</template>
