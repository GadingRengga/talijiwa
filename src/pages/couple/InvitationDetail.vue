<script setup lang="ts">
import { Check, Copy, MessageCircle } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useClipboard } from '@/composables/useClipboard'
import { useToast } from '@/composables/useToast'
import { company, whatsappLink } from '@/config/company'
import { copy } from '@/config/copy'
import { myCustomerId } from '@/services/auth'
import { invitationService } from '@/services/invitations'
import { rsvpService } from '@/services/rsvp'
import type { GiftConfirmation, GuestMessage, InvitationData, Rsvp } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { coupleLabel, publicUrl } from '@/utils/invitation'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { copy: copyText } = useClipboard()
const id = String(route.params.id)

const inv = ref<InvitationData | null>(null)
const rsvps = ref<Rsvp[]>([])
const messages = ref<GuestMessage[]>([])
const gifts = ref<GiftConfirmation[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const customerId = await myCustomerId()
    const data = await invitationService.get(id)
    if (!data || data.customer_id !== customerId) {
      router.replace({ name: 'couple-dashboard' })
      return
    }
    inv.value = data
    const [r, m, g] = await Promise.all([rsvpService.listRsvps(id), rsvpService.listMessages(id, true), rsvpService.listGiftConfirmations(id)])
    rsvps.value = r
    messages.value = m
    gifts.value = g
  } finally {
    loading.value = false
  }
})

const attending = computed(() => rsvps.value.filter((r) => r.attendance === 'attending'))
const guests = computed(() => attending.value.reduce((n, r) => n + r.guest_count, 0))
const invitedTotal = computed(() => (inv.value?.settings.guest_names ?? '').split('\n').map((s) => s.trim()).filter(Boolean).length)
const pending = computed(() => Math.max(0, invitedTotal.value - rsvps.value.length))
const giftTotal = computed(() => gifts.value.reduce((n, g) => n + (g.amount ?? 0), 0))
const link = computed(() => (inv.value ? publicUrl(inv.value.slug) : ''))

async function copyLink() {
  if (await copyText(link.value)) toast.success(copy.common.copied)
}
const revisionText = computed(() =>
  copy.couple.revisionMsg
    .replace('{company}', company.company_name)
    .replace('{couple}', inv.value ? coupleLabel(inv.value) : '')
    .replace('{link}', link.value),
)
</script>

<template>
  <main class="space-y-6">
    <LoadingState v-if="loading" />
    <template v-else-if="inv">
      <PageHeader :title="coupleLabel(inv)" :subtitle="inv.status === 'published' ? copy.couple.publishedShort : copy.couple.draftShort">
        <RouterLink :to="`/pasangan/undangan/${inv.id}/kelola`" class="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-125">{{ copy.couple.manageCta }}</RouterLink>
      </PageHeader>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="card p-3 text-center"><p class="text-xl font-semibold tabular-nums">{{ attending.length }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.attending }}</p></div>
        <div class="card p-3 text-center"><p class="text-xl font-semibold tabular-nums">{{ rsvps.length - attending.length }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.notAttending }}</p></div>
        <div class="card p-3 text-center"><p class="text-xl font-semibold tabular-nums">{{ invitedTotal ? pending : '—' }}</p><p class="text-xs text-muted">{{ copy.couple.pendingResponse }}</p></div>
        <div class="card p-3 text-center"><p class="text-xl font-semibold tabular-nums">{{ guests }}</p><p class="text-xs text-muted">{{ copy.rsvpAdmin.guests }}</p></div>
      </div>

      <section class="card space-y-3 p-4">
        <h2 class="text-sm font-semibold">{{ copy.couple.detailLink }}</h2>
        <p class="break-all text-xs text-muted">{{ link }}</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium hover:bg-paper" @click="copyLink"><Copy class="size-4" /> {{ copy.common.copyLink }}</button>
          <a :href="whatsappLink(revisionText)" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-lg bg-sage px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90"><MessageCircle class="size-4" /> {{ copy.couple.revisionCta }}</a>
        </div>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold">{{ copy.rsvpAdmin.title }} ({{ rsvps.length }})</h2>
        <EmptyState v-if="!rsvps.length" :message="copy.empty.rsvps" />
        <ul v-else class="card max-h-96 divide-y divide-line overflow-y-auto">
          <li v-for="r in rsvps" :key="r.id" class="flex items-center justify-between gap-3 px-4 py-2.5">
            <div class="min-w-0"><p class="truncate text-sm font-medium">{{ r.name }}</p><p class="text-xs text-muted">{{ formatDateTime(r.created_at) }}</p></div>
            <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" :class="r.attendance === 'attending' ? 'bg-sage-soft text-sage' : 'bg-danger-soft text-danger'">
              {{ r.attendance === 'attending' ? `${copy.rsvpAdmin.attending} · ${r.guest_count}` : copy.rsvpAdmin.notAttending }}
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold">{{ copy.messagesAdmin.title }} ({{ messages.length }})</h2>
        <EmptyState v-if="!messages.length" :message="copy.empty.messages" />
        <ul v-else class="card max-h-96 divide-y divide-line overflow-y-auto">
          <li v-for="m in messages" :key="m.id" class="px-4 py-2.5">
            <p class="text-sm font-medium">{{ m.name }}</p>
            <p class="mt-0.5 whitespace-pre-line text-sm text-muted">{{ m.message }}</p>
          </li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold">{{ copy.giftsAdmin.title }} · {{ formatCurrency(giftTotal) }}</h2>
        <EmptyState v-if="!gifts.length" :message="copy.empty.giftConfirmations" />
        <ul v-else class="card divide-y divide-line">
          <li v-for="g in gifts" :key="g.id" class="flex items-center justify-between gap-3 px-4 py-2.5">
            <p class="truncate text-sm font-medium">{{ g.name }}</p>
            <span class="shrink-0 text-sm font-semibold tabular-nums">{{ g.amount == null ? '—' : formatCurrency(g.amount) }}</span>
          </li>
        </ul>
      </section>

      <p v-if="rsvps.length" class="flex items-center gap-1.5 text-xs text-muted"><Check class="size-3.5 text-sage" /> {{ copy.couple.dataFresh }}</p>
    </template>
  </main>
</template>
