<script setup lang="ts">
import { Copy, ExternalLink, FileHeart, Gift, Inbox, MessageCircle, MessageSquareHeart, Pencil, Send, UsersRound } from 'lucide-vue-next'
import { nextTick, onMounted, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import StatCard from '@/components/ui/StatCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAnimation } from '@/composables/useAnimation'
import { useClipboard } from '@/composables/useClipboard'
import { useToast } from '@/composables/useToast'
import { company, whatsappLink } from '@/config/company'
import { copy } from '@/config/copy'
import { rsvpService } from '@/services/rsvp'
import { useCoupleStore } from '@/stores/couple'
import type { GiftConfirmation, GuestMessage, InvitationData, Rsvp } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { coupleLabel, publicUrl, weddingDate } from '@/utils/invitation'

const couple = useCoupleStore()
const toast = useToast()
const { copy: copyText } = useClipboard()
const grid = ref<HTMLElement | null>(null)
const { stagger } = useAnimation()

const loading = ref(true)
const rsvps = ref<Rsvp[]>([])
const messages = ref<GuestMessage[]>([])
const gifts = ref<GiftConfirmation[]>([])
const invitedTotal = ref(0)

onMounted(async () => {
  try {
    // Force: invitations created by the admin after login must appear immediately.
    await couple.load(true)
    const primary = couple.primary
    if (primary) {
      const [r, m, g] = await Promise.all([
        rsvpService.listRsvps(primary.id),
        rsvpService.listMessages(primary.id, false),
        rsvpService.listGiftConfirmations(primary.id),
      ])
      rsvps.value = r
      messages.value = m
      gifts.value = g
      invitedTotal.value = (primary.settings.guest_names ?? '').split('\n').map((s) => s.trim()).filter(Boolean).length
    }
  } finally {
    loading.value = false
    await nextTick()
    if (grid.value) stagger(Array.from(grid.value.querySelectorAll('[data-stat]')))
  }
})

const attending = () => rsvps.value.filter((r) => r.attendance === 'attending')
const guestCount = () => attending().reduce((n, r) => n + r.guest_count, 0)
const pending = () => (invitedTotal.value ? Math.max(0, invitedTotal.value - rsvps.value.length) : null)
const giftTotal = () => gifts.value.reduce((n, g) => n + (g.amount ?? 0), 0)

async function copyLink(inv: InvitationData) {
  if (await copyText(publicUrl(inv.slug))) toast.success(copy.common.copied)
}
function revisionText(inv: InvitationData) {
  return copy.couple.revisionMsg
    .replace('{company}', company.company_name)
    .replace('{couple}', coupleLabel(inv))
    .replace('{link}', publicUrl(inv.slug))
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="font-display text-3xl font-semibold">{{ copy.couple.dashboardTitle }}</h1>
      <p class="text-sm text-muted">{{ copy.couple.dashboardSubtitle }}</p>
    </div>

    <LoadingState v-if="loading" />
    <template v-else-if="couple.primary">
      <div ref="grid" class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <StatCard :label="copy.couple.invitationUnit" :value="couple.items.length" :icon="FileHeart" />
        <StatCard :label="copy.rsvpAdmin.attending" :value="attending().length" :icon="Send" />
        <StatCard :label="copy.rsvpAdmin.notAttending" :value="rsvps.length - attending().length" :icon="Inbox" />
        <StatCard :label="copy.couple.pendingResponse" :value="pending() ?? '—'" :icon="MessageSquareHeart" />
        <StatCard :label="copy.rsvpAdmin.guests" :value="guestCount()" :icon="UsersRound" />
        <StatCard :label="copy.messagesAdmin.title" :value="messages.length" :icon="MessageSquareHeart" />
        <StatCard :label="copy.giftsAdmin.title" :value="formatCurrency(giftTotal())" :icon="Gift" />
        <StatCard :label="copy.couple.statusLabel" :value="couple.primary.status === 'published' ? copy.couple.publishedShort : copy.couple.draftShort" :icon="FileHeart" />
      </div>

      <section class="card space-y-4 p-4 sm:p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="truncate text-lg font-semibold">{{ coupleLabel(couple.primary) }}</h2>
              <StatusBadge :status="couple.primary.status" />
            </div>
            <p class="text-xs text-muted">{{ weddingDate(couple.primary) ? formatDate(weddingDate(couple.primary)) : '—' }} · {{ copy.couple.updatedAt }} {{ formatDateTime(couple.primary.updated_at) }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <RouterLink :to="`/pasangan/undangan/${couple.primary.id}/kelola`">
              <AppButton><Pencil class="size-4" /> {{ copy.couple.navManage }}</AppButton>
            </RouterLink>
            <RouterLink :to="`/pasangan/undangan/${couple.primary.id}`">
              <AppButton variant="secondary">{{ copy.couple.navDetail }}</AppButton>
            </RouterLink>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span class="min-w-0 flex-1 truncate font-mono text-xs text-muted">{{ publicUrl(couple.primary.slug) }}</span>
          <button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium hover:bg-paper" @click="copyLink(couple.primary)">
            <Copy class="size-4" /> {{ copy.common.copyLink }}
          </button>
          <a :href="publicUrl(couple.primary.slug)" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium hover:bg-paper">
            <ExternalLink class="size-4" /> {{ copy.common.preview }}
          </a>
          <a :href="whatsappLink(revisionText(couple.primary))" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-lg bg-sage px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90">
            <MessageCircle class="size-4" /> {{ copy.couple.revisionCta }}
          </a>
        </div>
      </section>
      <div class="grid gap-6 lg:grid-cols-2">
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-base font-semibold">{{ copy.rsvpAdmin.title }} ({{ rsvps.length }})</h2>
            <RouterLink :to="`/pasangan/undangan/${couple.primary.id}`" class="text-sm font-medium text-brand hover:underline">{{ copy.dashboard.viewAll }}</RouterLink>
          </div>
          <EmptyState v-if="!rsvps.length" :message="copy.empty.rsvps" />
          <ul v-else class="card divide-y divide-line">
            <li v-for="r in rsvps.slice(0, 5)" :key="r.id" class="flex items-center justify-between gap-3 px-4 py-2.5">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ r.name }}</p>
                <p class="text-xs text-muted">{{ formatDateTime(r.created_at) }}</p>
              </div>
              <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" :class="r.attendance === 'attending' ? 'bg-sage-soft text-sage' : 'bg-danger-soft text-danger'">
                {{ r.attendance === 'attending' ? `${copy.rsvpAdmin.attending} · ${r.guest_count}` : copy.rsvpAdmin.notAttending }}
              </span>
            </li>
          </ul>
        </section>
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-base font-semibold">{{ copy.messagesAdmin.title }} ({{ messages.length }})</h2>
            <RouterLink :to="`/pasangan/undangan/${couple.primary.id}`" class="text-sm font-medium text-brand hover:underline">{{ copy.dashboard.viewAll }}</RouterLink>
          </div>
          <EmptyState v-if="!messages.length" :message="copy.empty.messages" />
          <ul v-else class="card max-h-80 divide-y divide-line overflow-y-auto">
            <li v-for="m in messages.slice(0, 5)" :key="m.id" class="px-4 py-2.5">
              <p class="text-sm font-medium">{{ m.name }}</p>
              <p class="mt-0.5 line-clamp-2 whitespace-pre-line text-sm text-muted">{{ m.message }}</p>
            </li>
          </ul>
        </section>
      </div>

      <section v-if="couple.items.length > 1">
        <h2 class="mb-3 text-base font-semibold">{{ copy.couple.invitationUnit }} ({{ couple.items.length }})</h2>
        <ul class="card divide-y divide-line">
          <li v-for="i in couple.items" :key="i.id" class="flex items-center justify-between gap-3 px-4 py-3">
            <RouterLink :to="`/pasangan/undangan/${i.id}`" class="min-w-0 flex-1 hover:underline">
              <p class="truncate text-sm font-medium">{{ coupleLabel(i) }}</p>
            </RouterLink>
            <StatusBadge :status="i.status" />
            <RouterLink :to="`/pasangan/undangan/${i.id}/kelola`"><AppButton size="sm" variant="secondary">{{ copy.couple.manageCta }}</AppButton></RouterLink>
          </li>
        </ul>
      </section>
    </template>

    <EmptyState v-else :message="copy.couple.waitingAdmin">
      <a :href="whatsappLink()" target="_blank" rel="noopener" class="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
        <MessageCircle class="size-4" /> {{ copy.company.chatWhatsapp }}
      </a>
    </EmptyState>
  </div>
</template>
