<script setup lang="ts">
import { reactive, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormField from '@/components/ui/FormField.vue'
import { copy } from '@/config/copy'
import { themeList } from '@/themes'
import type { Customer, InvitationData, PaymentStatus } from '@/types'
import type { OrderInput } from '@/services/orders'
import { coupleLabel } from '@/utils/invitation'

const props = defineProps<{
  initial: OrderInput
  customers: Customer[]
  invitations: InvitationData[]
  saving: boolean
}>()
const emit = defineEmits<{ submit: [value: OrderInput] }>()

const statuses: PaymentStatus[] = ['pending', 'dp', 'paid', 'cancelled']
const form = reactive<OrderInput>({ ...props.initial })

watch(
  () => props.initial,
  (v) => Object.assign(form, v),
)

const forCustomer = () => props.invitations.filter((i) => !form.customer_id || i.customer_id === form.customer_id)

function onCustomer() {
  if (form.invitation_id && !forCustomer().some((i) => i.id === form.invitation_id)) form.invitation_id = null
}

function submit() {
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
      <select :id="id" v-model="form.customer_id" class="field-input" required @change="onCustomer">
        <option value="" disabled>Pilih pelanggan</option>
        <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </FormField>
    <div class="grid gap-4 sm:grid-cols-2">
      <FormField :label="copy.orders.invitation" optional v-slot="{ id }">
        <select :id="id" v-model="form.invitation_id" class="field-input">
          <option :value="null">{{ copy.orders.noInvitation }}</option>
          <option v-for="i in forCustomer()" :key="i.id" :value="i.id">{{ coupleLabel(i) }}</option>
        </select>
      </FormField>
      <FormField :label="copy.orders.theme" v-slot="{ id }">
        <select :id="id" v-model="form.theme" class="field-input">
          <option v-for="t in themeList" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </FormField>
    </div>
    <div class="grid gap-4 sm:grid-cols-3">
      <FormField :label="copy.orders.amount" v-slot="{ id }"><input :id="id" v-model.number="form.amount" type="number" min="0" class="field-input" /></FormField>
      <FormField :label="copy.orders.paid" v-slot="{ id }"><input :id="id" v-model.number="form.paid" type="number" min="0" class="field-input" /></FormField>
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
