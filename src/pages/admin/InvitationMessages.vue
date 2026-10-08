<script setup lang="ts">
import { Eye, EyeOff, Search, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import { invitationService } from '@/services/invitations'
import { rsvpService } from '@/services/rsvp'
import type { GuestMessage, InvitationData } from '@/types'
import { formatDateTime } from '@/utils/format'
import { coupleLabel } from '@/utils/invitation'

const route = useRoute()
const id = String(route.params.id)
const toast = useToast()
const inv = ref<InvitationData | null>(null)
const items = ref<GuestMessage[]>([])
const loading = ref(true)
const toDelete = ref<GuestMessage | null>(null)
const query = ref('')
const pager = usePagination(10)
watch(query, () => pager.reset())
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? items.value.filter((m) => [m.name, m.message].some((v) => v.toLowerCase().includes(q))) : items.value
})
const paged = computed(() => pager.paginate(filtered.value))

async function reload() {
  items.value = await rsvpService.listMessages(id, false)
}

onMounted(async () => {
  try {
    inv.value = await invitationService.get(id)
    await reload()
  } finally {
    loading.value = false
  }
})

async function toggle(m: GuestMessage) {
  try {
    await rsvpService.setMessageVisible(m.id, !m.is_visible)
    m.is_visible = !m.is_visible
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  }
}

async function confirmDelete() {
  const m = toDelete.value
  toDelete.value = null
  if (!m) return
  try {
    await rsvpService.removeMessage(m.id)
    items.value = items.value.filter((x) => x.id !== m.id)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="font-display text-3xl font-semibold">{{ copy.messagesAdmin.title }}</h1>
      <p class="text-sm text-muted">{{ inv ? coupleLabel(inv) : '…' }} · {{ items.length }} ucapan</p>
    </div>

    <LoadingState v-if="loading" />
    <div v-else-if="items.length" class="relative max-w-sm">
      <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input v-model="query" class="field-input !pl-9" :placeholder="copy.messagesAdmin.searchPh" :aria-label="copy.messagesAdmin.searchAria" />
    </div>
    <EmptyState v-if="!loading && !items.length" :message="copy.empty.messages" />
    <p v-else-if="!loading && !filtered.length" class="py-8 text-center text-sm text-muted">{{ copy.messagesAdmin.noMatch }}</p>
    <ul v-else class="card divide-y divide-line">
      <li v-for="m in paged.rows" :key="m.id" class="flex items-start gap-3 px-4 py-3" :class="m.is_visible ? '' : 'opacity-60'">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">{{ m.name }} <span v-if="!m.is_visible" class="ml-1 rounded-full bg-warn-soft px-2 py-0.5 text-[11px] text-warn">{{ copy.messagesAdmin.hidden }}</span></p>
          <p class="mt-0.5 whitespace-pre-line text-sm">{{ m.message }}</p>
          <p class="mt-1 text-xs text-muted">{{ formatDateTime(m.created_at) }}</p>
        </div>
        <div class="flex shrink-0">
          <button type="button" class="rounded-lg p-2 text-muted hover:bg-black/5" :aria-label="m.is_visible ? `${copy.messagesAdmin.hide}: ${m.name}` : `${copy.messagesAdmin.show}: ${m.name}`" @click="toggle(m)">
            <EyeOff v-if="m.is_visible" class="size-4" /><Eye v-else class="size-4" />
          </button>
          <button type="button" class="rounded-lg p-2 text-danger hover:bg-danger-soft" :aria-label="`${copy.common.delete} ${copy.messagesAdmin.title.toLowerCase()} ${m.name}`" @click="toDelete = m"><Trash2 class="size-4" /></button>
        </div>
      </li>
    </ul>
    <Pagination :page="paged.page" :total="paged.total" @prev="pager.prev()" @next="pager.next()" />
    <ConfirmDialog :open="!!toDelete" :title="copy.messagesAdmin.deleteTitle" :message="copy.messagesAdmin.deleteMsg" :confirm-label="copy.common.delete" @confirm="confirmDelete" @cancel="toDelete = null" />
  </div>
</template>
