<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormField from '@/components/ui/FormField.vue'
import RupiahInput from '@/components/ui/RupiahInput.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { copy } from '@/config/copy'
import { useToast } from '@/composables/useToast'
import { useCatalogStore } from '@/stores/catalog'
import type { Customer, InvitationData, InvitationTier, PaymentStatus } from '@/types'
import type { OrderInput } from '@/services/orders'
import { formatCurrency } from '@/utils/format'
import { allowedThemes, coupleLabel, isCustomAmount } from '@/utils/invitation'

const props = defineProps<{
  initial: OrderInput
  customers: Customer[]
  invitations: InvitationData[]
  saving: boolean
}>()
const emit = defineEmits<{ submit: [value: OrderInput] }>()

const toast = useToast()
const catalog = useCatalogStore()
onMounted(() => catalog.load())

const statuses: PaymentStatus[] = ['pending', 'dp', 'paid', 'cancelled']
const tiers: InvitationTier[] = ['basic', 'premium', 'luxury']
const form = reactive<OrderInput>({ ...props.initial })

watch(
  () => props.initial,
  (v) => Object.assign(form, v),
)

const customerOptions = computed(() => props.customers.map((c) => ({ value: c.id as string | null, label: c.name, hint: c.phone || c.email || undefined })))
const forCustomer = () => props.invitations.filter((i) => !form.customer_id || i.customer_id === form.customer_id)
const invitationOptions = computed(() => [
  { value: null as string | null, label: copy.orders.noInvitation },
  ...forCustomer().map((i) => ({ value: i.id as string | null, label: coupleLabel(i), hint: i.slug })),
])
const themeOptions = computed(() =>
  catalog.rows
    .filter((r) => r.tier === form.tier && r.is_active)
    .map((r) => ({
      value: r.theme as string | null,
      label: r.name,
      hint: `${r.code} · ${formatCurrency(catalog.tierPrices[r.tier] > 0 ? catalog.tierPrices[r.tier] : r.price)}`,
    })),
)
const tierPrice = computed(() => catalog.tierPrices[form.tier] ?? 0)
const customAmount = computed(() => isCustomAmount(form.amount, catalog.tierPrices))

function onCustomer() {
  if (form.invitation_id && !forCustomer().some((i) => i.id === form.invitation_id)) form.invitation_id = null
}

function onTier() {
  const allowed = allowedThemes(form.tier, catalog.rows)
  if (!allowed.includes(form.theme)) {
    const fallback = catalog.rows.find((r) => r.tier === form.tier && r.is_active)?.theme
    if (fallback) {
      form.theme = fallback
      toast.success(copy.orders.themeResetToTier)
    }
  }
  form.amount = tierPrice.value
}

function syncAmountToTier() {
  form.amount = tierPrice.value
}

function submit() {
  const allowed = allowedThemes(form.tier, catalog.rows)
  if (!allowed.includes(form.theme)) {
    toast.error(copy.orders.themeNotInTier)
    return
  }
  emit('submit', {
    ...form,
    amount: Math.max(0, Math.round(form.amount) || 0),
    paid: Math.max(0, Math.round(form.paid) || 0),
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <FormField :label="copy.orders.customer" v-slot="{ id }">
      <SearchableSelect :id="id" v-model="form.customer_id" :options="customerOptions" :placeholder="copy.orders.selectCustomer" @update:model-value="onCustomer" />
    </FormField>
    <div class="grid gap-4 sm:grid-cols-2">
      <FormField :label="copy.orders.tier" v-slot="{ id }">
        <select :id="id" v-model="form.tier" class="field-input" @change="onTier">
          <option v-for="t in tiers" :key="t" :value="t">{{ copy.orders.tiers[t] }} · {{ formatCurrency(catalog.tierPrices[t] ?? 0) }}</option>
        </select>
      </FormField>
      <FormField :label="copy.orders.invitation" optional v-slot="{ id }">
        <SearchableSelect :id="id" v-model="form.invitation_id" :options="invitationOptions" :placeholder="copy.orders.noInvitation" />
      </FormField>
      <FormField :label="copy.orders.theme" v-slot="{ id }" :hint="`${copy.orders.themeTierHint} ${copy.orders.tiers[form.tier]}`">
        <SearchableSelect :id="id" v-model="form.theme" :options="themeOptions" :placeholder="copy.orders.selectTheme" />
      </FormField>
    </div>
    <div class="grid gap-4 sm:grid-cols-3">
      <FormField :label="copy.orders.amount" v-slot="{ id }" :hint="copy.orders.amountFromTier">
        <RupiahInput :id="id" v-model="form.amount" :aria-label="copy.orders.amount" />
        <p class="mt-1 text-xs tabular-nums text-muted">{{ formatCurrency(form.amount) }}</p>
        <p v-if="customAmount" class="mt-1 flex items-center gap-2 text-xs text-muted">
          {{ copy.orders.customAmount }} <button type="button" class="font-medium text-brand hover:underline" @click="syncAmountToTier">{{ copy.orders.syncToTier }}</button>
        </p>
      </FormField>
      <FormField :label="copy.orders.paid" v-slot="{ id }">
        <RupiahInput :id="id" v-model="form.paid" :aria-label="copy.orders.paid" />
        <p class="mt-1 text-xs tabular-nums text-muted">{{ formatCurrency(form.paid) }}</p>
      </FormField>
      <FormField :label="copy.orders.status" v-slot="{ id }">
        <select :id="id" v-model="form.status" class="field-input">
          <option v-for="s in statuses" :key="s" :value="s">{{ copy.orders.statuses[s] }}</option>
        </select>
      </FormField>
    </div>
    <FormField :label="copy.orders.dueDate" optional v-slot="{ id }"><input :id="id" v-model="form.due_date" type="date" class="field-input" /></FormField>
    <FormField :label="copy.orders.notes" optional v-slot="{ id }"><textarea :id="id" v-model="form.notes" rows="2" class="field-input" /></FormField>
    <div class="flex justify-end gap-2">
      <slot name="cancel" />
      <AppButton type="submit" :loading="saving">{{ copy.common.save }}</AppButton>
    </div>
  </form>
</template>
