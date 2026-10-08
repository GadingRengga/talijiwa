<script setup lang="ts">
import { Archive, Copy, ExternalLink, MoreHorizontal, Pencil, Plus, Rocket, Search, Trash2, CopyPlus, EyeOff } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { usePagination } from '@/composables/usePagination'
import { useClipboard } from '@/composables/useClipboard'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import { useCustomerStore } from '@/stores/customer'
import { useInvitationStore } from '@/stores/invitation'
import { useOrderStore } from '@/stores/order'
import { getTheme } from '@/themes'
import type { InvitationData, InvitationStatus } from '@/types'
import { formatDate } from '@/utils/format'
import { coupleLabel, placeholderImage, publicUrl, publishErrors, weddingDate } from '@/utils/invitation'

const store = useInvitationStore()
const customers = useCustomerStore()
const orders = useOrderStore()
const toast = useToast()
const router = useRouter()
const { copy: copyText } = useClipboard()

const query = ref('')
const filter = ref<'all' | InvitationStatus>('all')
const toDelete = ref<InvitationData | null>(null)
const filters: { key: 'all' | InvitationStatus; label: string }[] = [
  { key: 'all', label: copy.invitations.statuses.all }, { key: 'draft', label: copy.invitations.statuses.draft }, { key: 'published', label: copy.invitations.statuses.published }, { key: 'archived', label: copy.invitations.statuses.archived },
]

onMounted(() => Promise.all([store.load(), customers.load(), orders.load()]))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return store.items.filter((i) => (filter.value === 'all' || i.status === filter.value) && (!q || [coupleLabel(i), i.slug, customerName(i)].some((v) => v.toLowerCase().includes(q))))
})
const pager = usePagination(9)
watch([query, filter], () => pager.reset())
const paged = computed(() => pager.paginate(filtered.value))
const customerName = (i: InvitationData) => customers.byId(i.customer_id)?.name ?? '—'
const orderFor = (id: string) => orders.items.find((o) => o.invitation_id === id)
const thumb = (i: InvitationData) => i.gallery.find((g) => g.is_cover)?.url || i.gallery[0]?.url || placeholderImage(coupleLabel(i), getTheme(i.theme).swatches[3], getTheme(i.theme).swatches[2])

async function guard(fn: () => Promise<unknown>, ok: string) {
  try {
    await fn()
    toast.success(ok)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  }
}
async function copyLink(i: InvitationData) {
  if (await copyText(publicUrl(i.slug))) toast.success(copy.builder.linkCopied)
}
function publish(i: InvitationData) {
  const errs = publishErrors(i)
  if (errs.length) return void toast.error(`${copy.invitations.cannotPublish} ${errs[0]}`)
  void guard(() => store.setStatus(i.id, 'published'), copy.builder.publishedToast)
}
async function duplicate(i: InvitationData) {
  try {
    const copyInv = await store.duplicate(i.id)
    toast.success(copy.invitations.duplicated)
    router.push(`/admin/invitations/${copyInv.id}/edit`)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  }
}
async function confirmDelete() {
  const i = toDelete.value
  toDelete.value = null
  if (i) await guard(() => store.remove(i.id), copy.invitations.deleted)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-3xl font-semibold">{{ copy.nav.invitations }}</h1>
        <p class="text-sm text-muted">{{ store.items.length }} {{ copy.invitations.unit }}</p>
      </div>
      <RouterLink to="/admin/orders?new=1"><AppButton><Plus class="size-4" /> {{ copy.orders.create }}</AppButton></RouterLink>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative w-full flex-1 sm:min-w-60 sm:max-w-sm">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input v-model="query" class="field-input !pl-9" :placeholder="copy.invitations.searchPh" :aria-label="copy.invitations.searchAria" />
      </div>
      <div class="flex flex-wrap gap-1" role="group" :aria-label="copy.invitations.filterAria">
        <button v-for="f in filters" :key="f.key" type="button" class="rounded-full border px-3 py-1.5 text-[13px] font-medium" :class="filter === f.key ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'" :aria-pressed="filter === f.key" @click="filter = f.key">{{ f.label }}</button>
      </div>
    </div>

    <LoadingState v-if="store.loading && !store.loaded" />
    <EmptyState v-else-if="!store.items.length" :message="copy.empty.invitations"><RouterLink to="/admin/orders?new=1"><AppButton>{{ copy.orders.create }}</AppButton></RouterLink></EmptyState>
    <p v-else-if="!filtered.length" class="py-8 text-center text-sm text-muted">{{ copy.invitations.noMatch }}</p>

    <ul v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="i in paged.rows" :key="i.id" class="card overflow-hidden">
        <RouterLink :to="`/admin/invitations/${i.id}/edit`" class="block"><img :src="thumb(i)" :alt="`Sampul ${coupleLabel(i)}`" class="aspect-[16/10] w-full object-cover" width="640" height="400" loading="lazy" decoding="async" /></RouterLink>
        <div class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <RouterLink :to="`/admin/invitations/${i.id}/edit`" class="block truncate font-semibold hover:underline">{{ coupleLabel(i) }}</RouterLink>
              <p class="truncate text-xs text-muted">{{ customerName(i) }} · {{ getTheme(i.theme).name }}</p>
            </div>
            <StatusBadge :status="i.status" />
          </div>
          <p class="truncate text-xs text-muted">/invite/{{ i.slug }}<span v-if="weddingDate(i)"> · {{ formatDate(weddingDate(i)) }}</span></p>
          <p v-if="orderFor(i.id)" class="truncate text-xs">
            <RouterLink to="/admin/orders" class="font-medium text-brand hover:underline">{{ copy.invitations.orderPrefix }} {{ copy.orders.statuses[orderFor(i.id)!.status] }}</RouterLink>
          </p>
          <nav class="flex flex-wrap gap-x-3 gap-y-1 text-xs" :aria-label="`Data tamu ${coupleLabel(i)}`">
            <RouterLink :to="`/admin/invitations/${i.id}/rsvp`" class="font-medium text-brand hover:underline">{{ copy.rsvpAdmin.title }}</RouterLink>
            <RouterLink :to="`/admin/invitations/${i.id}/messages`" class="font-medium text-brand hover:underline">{{ copy.messagesAdmin.title }}</RouterLink>
            <RouterLink :to="`/admin/invitations/${i.id}/gifts`" class="font-medium text-brand hover:underline">{{ copy.giftsAdmin.title }}</RouterLink>
            <RouterLink :to="`/admin/invitations/${i.id}/analytics`" class="font-medium text-brand hover:underline">{{ copy.nav.analytics }}</RouterLink>
          </nav>
          <div class="flex items-center gap-1.5">
            <RouterLink :to="`/admin/invitations/${i.id}/edit`" class="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90" :aria-label="`${copy.invitations.editAria} ${coupleLabel(i)}`"><Pencil class="size-3.5" /> {{ copy.common.edit }}</RouterLink>
            <a :href="`/admin/invitations/${i.id}/preview`" target="_blank" rel="noopener" class="rounded-lg border border-line p-2 text-muted hover:bg-paper" :aria-label="`${copy.common.preview} ${coupleLabel(i)}`"><ExternalLink class="size-3.5" /></a>
            <button type="button" class="rounded-lg border border-line p-2 text-muted hover:bg-paper" :aria-label="copy.invitations.copyAria" @click="copyLink(i)"><Copy class="size-3.5" /></button>
            <AppButton v-if="i.status !== 'published'" size="sm" variant="secondary" class="ml-auto" @click="publish(i)"><Rocket class="size-3.5" /> {{ copy.common.publish }}</AppButton>
            <AppButton v-else size="sm" variant="secondary" class="ml-auto" @click="guard(() => store.setStatus(i.id, 'draft'), copy.builder.unpublishedToast)"><EyeOff class="size-3.5" /> {{ copy.common.unpublish }}</AppButton>
            <details class="relative">
              <summary class="grid size-8 cursor-pointer list-none place-items-center rounded-lg border border-line text-muted hover:bg-paper" :aria-label="copy.invitations.moreActions"><MoreHorizontal class="size-4" /></summary>
              <div class="absolute bottom-full right-0 z-10 mb-1 w-44 rounded-xl border border-line bg-panel p-1 shadow-lg">
                <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-paper" @click="duplicate(i)"><CopyPlus class="size-4" /> {{ copy.invitations.duplicate }}</button>
                <button v-if="i.status !== 'archived'" type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-paper" @click="guard(() => store.setStatus(i.id, 'archived'), copy.invitations.archived)"><Archive class="size-4" /> {{ copy.invitations.archive }}</button>
                <button v-else type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-paper" @click="guard(() => store.setStatus(i.id, 'draft'), copy.invitations.backToDraft)"><Archive class="size-4" /> {{ copy.invitations.restoreDraft }}</button>
                <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft" @click="toDelete = i"><Trash2 class="size-4" /> {{ copy.common.delete }}</button>
              </div>
            </details>
          </div>
        </div>
      </li>
    </ul>

    <Pagination :page="paged.page" :total="paged.total" @prev="pager.prev()" @next="pager.next()" />

    <ConfirmDialog :open="!!toDelete" :title="copy.invitations.deleteTitle" :message="`“${toDelete ? coupleLabel(toDelete) : ''}” ${copy.invitations.deleteMsg}`" :confirm-label="copy.common.delete" @confirm="confirmDelete" @cancel="toDelete = null" />
  </div>
</template>
