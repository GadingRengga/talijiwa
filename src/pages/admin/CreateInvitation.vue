<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThemeSelector from '@/components/admin/ThemeSelector.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FormField from '@/components/ui/FormField.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import { useCustomerStore } from '@/stores/customer'
import { useInvitationStore } from '@/stores/invitation'
import { useThemeStore } from '@/stores/theme'
import { slugify } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const customers = useCustomerStore()
const invitations = useInvitationStore()
const themeStore = useThemeStore()
const toast = useToast()

const form = reactive({ customerId: typeof route.query.customer === 'string' ? route.query.customer : '', title: '' })
const errors = reactive({ customerId: '', title: '' })
const busy = ref(false)

onMounted(() => customers.load())

async function submit() {
  errors.customerId = form.customerId ? '' : 'Pilih pelanggan.'
  errors.title = form.title.trim() ? '' : 'Judul wajib diisi.'
  if (errors.customerId || errors.title) return
  busy.value = true
  try {
    const inv = await invitations.create(form.customerId, form.title.trim(), themeStore.selected)
    toast.success('Undangan dibuat. Lengkapi datanya di builder.')
    await router.replace(`/admin/invitations/${inv.id}/edit`)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="max-w-xl space-y-6">
    <div>
      <h1 class="font-display text-3xl font-semibold">Buat undangan</h1>
      <p class="text-sm text-muted">Pilih pelanggan, beri judul, lalu lanjutkan di builder.</p>
    </div>
    <LoadingState v-if="customers.loading && !customers.loaded" />
    <EmptyState v-else-if="!customers.items.length" :message="copy.empty.customers"><RouterLink to="/admin/customers"><AppButton>Ke daftar pelanggan</AppButton></RouterLink></EmptyState>
    <form v-else class="space-y-5" novalidate @submit.prevent="submit">
      <FormField label="Pelanggan" :error="errors.customerId" v-slot="{ id, invalid }">
        <select :id="id" v-model="form.customerId" class="field-input" :aria-invalid="invalid">
          <option value="" disabled>Pilih pelanggan</option>
          <option v-for="c in customers.items" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </FormField>
      <FormField label="Judul undangan" :error="errors.title" :hint="form.title ? `Alamat: /invite/${slugify(form.title)}` : 'Mis. Raka & Sinta'" v-slot="{ id, invalid }">
        <input :id="id" v-model="form.title" class="field-input" placeholder="Raka & Sinta" :aria-invalid="invalid" maxlength="80" />
      </FormField>
      <div class="space-y-2"><p class="text-[13px] font-medium">Tema awal</p><ThemeSelector v-model="themeStore.selected" /></div>
      <div class="flex gap-2"><AppButton type="submit" :loading="busy">Buat dan buka builder</AppButton><RouterLink to="/admin/invitations"><AppButton variant="secondary">{{ copy.common.cancel }}</AppButton></RouterLink></div>
    </form>
  </div>
</template>
