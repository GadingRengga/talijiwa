<script setup lang="ts">
import { Eye, EyeOff, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
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
const pager = usePagination(10)
const paged = computed(() => pager.paginate(items.value))

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
    <EmptyState v-else-if="!items.length" :message="copy.empty.messages" />
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
          <button type="button" class="rounded-lg p-2 text-danger hover:bg-danger-soft" :aria-label="`Hapus ucapan ${m.name}`" @click="toDelete = m"><Trash2 class="size-4" /></button>
        </div>
      </li>
    </ul>
    <Pagination :page="paged.page" :total="paged.total" @prev="pager.prev()" @next="pager.next()" />
    <ConfirmDialog :open="!!toDelete" title="Hapus ucapan?" message="Ucapan ini akan dihapus permanen." confirm-label="Hapus" @confirm="confirmDelete" @cancel="toDelete = null" />
  </div>
</template>
