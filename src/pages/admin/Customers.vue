<script setup lang="ts">
import { Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import CustomerForm from '@/components/admin/CustomerForm.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import Modal from '@/components/ui/Modal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import type { CustomerInput } from '@/services/customers'
import { useCustomerStore } from '@/stores/customer'
import { useInvitationStore } from '@/stores/invitation'
import type { Customer } from '@/types'

const store = useCustomerStore()
const invitations = useInvitationStore()
const toast = useToast()
const query = ref('')
const editing = ref<Customer | null>(null)
const formOpen = ref(false)
const saving = ref(false)
const toDelete = ref<Customer | null>(null)

onMounted(() => Promise.all([store.load(), invitations.load()]))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? store.items.filter((c) => [c.name, c.phone, c.email].some((v) => v.toLowerCase().includes(q))) : store.items
})
const pager = usePagination(10)
watch(query, () => pager.reset())
const paged = computed(() => pager.paginate(filtered.value))
const countFor = (id: string) => invitations.items.filter((i) => i.customer_id === id).length

function openCreate() {
  editing.value = null
  formOpen.value = true
}
function openEdit(c: Customer) {
  editing.value = c
  formOpen.value = true
}
async function save(input: CustomerInput) {
  saving.value = true
  try {
    if (editing.value) await store.update(editing.value.id, input)
    else await store.create(input)
    toast.success('Pelanggan disimpan')
    formOpen.value = false
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  } finally {
    saving.value = false
  }
}
async function confirmDelete() {
  const c = toDelete.value
  toDelete.value = null
  if (!c) return
  try {
    await store.remove(c.id)
    toast.success('Pelanggan dihapus')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-3xl font-semibold">{{ copy.nav.customers }}</h1>
        <p class="text-sm text-muted">{{ store.items.length }} pelanggan</p>
      </div>
      <AppButton @click="openCreate"><Plus class="size-4" /> Tambah pelanggan</AppButton>
    </div>

    <div class="relative max-w-sm">
      <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input v-model="query" class="field-input !pl-9" placeholder="Cari nama, telepon, atau email" aria-label="Cari pelanggan" />
    </div>

    <LoadingState v-if="store.loading && !store.loaded" />
    <EmptyState v-else-if="!store.items.length" :message="copy.empty.customers"><AppButton @click="openCreate">Tambah pelanggan</AppButton></EmptyState>
    <p v-else-if="!filtered.length" class="py-8 text-center text-sm text-muted">Tidak ada pelanggan yang cocok dengan “{{ query }}”.</p>
    <ul v-else class="card divide-y divide-line">
      <li v-for="c in paged.rows" :key="c.id" class="flex items-center justify-between gap-3 px-4 py-3">
        <RouterLink :to="`/admin/customers/${c.id}`" class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium hover:underline">{{ c.name }}</p>
          <p class="truncate text-xs text-muted">{{ [c.phone, c.email].filter(Boolean).join(' · ') || 'Tanpa kontak' }}</p>
        </RouterLink>
        <span class="hidden text-xs text-muted sm:block">{{ countFor(c.id) }} undangan</span>
        <div class="flex">
          <button type="button" class="rounded-lg p-2 text-muted hover:bg-black/5" :aria-label="`Edit ${c.name}`" @click="openEdit(c)"><Pencil class="size-4" /></button>
          <button type="button" class="rounded-lg p-2 text-danger hover:bg-danger-soft" :aria-label="`Hapus ${c.name}`" @click="toDelete = c"><Trash2 class="size-4" /></button>
        </div>
      </li>
    </ul>
    <Pagination :page="paged.page" :total="paged.total" @prev="pager.prev()" @next="pager.next()" />

    <Modal :open="formOpen" :title="editing ? 'Edit pelanggan' : 'Tambah pelanggan'" @close="formOpen = false">
      <CustomerForm :customer="editing" :saving="saving" @submit="save" @cancel="formOpen = false" />
    </Modal>
    <ConfirmDialog :open="!!toDelete" title="Hapus pelanggan?" :message="`${toDelete?.name ?? ''} akan dihapus permanen. Pelanggan yang masih punya undangan tidak bisa dihapus.`" confirm-label="Hapus" @confirm="confirmDelete" @cancel="toDelete = null" />
  </div>
</template>
