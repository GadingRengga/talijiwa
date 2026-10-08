<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormField from '@/components/ui/FormField.vue'
import { copy } from '@/config/copy'
import type { CustomerInput } from '@/services/customers'
import type { Customer } from '@/types'

const props = defineProps<{ customer?: Customer | null; saving?: boolean }>()
const emit = defineEmits<{ submit: [input: CustomerInput]; cancel: [] }>()

const form = reactive<CustomerInput>({ name: '', phone: '', email: '', notes: '' })
const errors = reactive({ name: '', email: '' })

watch(
  () => props.customer,
  (c) => Object.assign(form, { name: c?.name ?? '', phone: c?.phone ?? '', email: c?.email ?? '', notes: c?.notes ?? '' }),
  { immediate: true },
)

const nameInput = ref<HTMLInputElement | null>(null)
function submit() {
  errors.name = form.name.trim() ? '' : copy.customers.formNameError
  errors.email = !form.email || /^\S+@\S+\.\S+$/.test(form.email) ? '' : copy.customers.formEmailError
  if (errors.name || errors.email) return nameInput.value?.focus()
  emit('submit', { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), notes: form.notes.trim() })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <FormField :label="copy.customers.formName" :error="errors.name" v-slot="{ id, invalid }"><input :id="id" ref="nameInput" v-model="form.name" class="field-input" :aria-invalid="invalid" autocomplete="off" /></FormField>
    <div class="grid gap-4 sm:grid-cols-2">
      <FormField :label="copy.customers.formPhone" optional v-slot="{ id }"><input :id="id" v-model="form.phone" class="field-input" inputmode="tel" /></FormField>
      <FormField :label="copy.customers.formEmail" optional :error="errors.email" v-slot="{ id, invalid }"><input :id="id" v-model="form.email" type="email" class="field-input" :aria-invalid="invalid" /></FormField>
    </div>
    <FormField :label="copy.customers.formNotes" optional v-slot="{ id }"><textarea :id="id" v-model="form.notes" rows="3" class="field-input" /></FormField>
    <div class="flex justify-end gap-2 pt-1">
      <AppButton variant="secondary" @click="emit('cancel')">{{ copy.common.cancel }}</AppButton>
      <AppButton type="submit" :loading="saving">{{ copy.common.save }}</AppButton>
    </div>
  </form>
</template>
