<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, XCircle } from 'lucide-vue-next'
import { computed, inject, ref, watch } from 'vue'
import BuilderSection from './BuilderSection.vue'
import AppButton from '@/components/ui/AppButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { BUILDER_KEY } from '@/composables/useBuilder'
import { copy } from '@/config/copy'
import { orderService } from '@/services/orders'
import type { InvitationData, Order } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/format'

const inv = defineModel<InvitationData>({ required: true })
const emit = defineEmits<{ jump: [section: string] }>()
const b = inject(BUILDER_KEY)!
const url = computed(() => `${window.location.origin}/invite/${inv.value.slug}`)

// Linked order (if any): warn — don't block — when it isn't paid off.
const linkedOrder = ref<Order | null>(null)
watch(
  () => inv.value.id,
  async (id) => {
    try {
      linkedOrder.value = await orderService.getByInvitation(id)
    } catch {
      linkedOrder.value = null
    }
  },
  { immediate: true },
)
const unpaid = computed(() => {
  const o = linkedOrder.value
  return o && o.paid < o.amount ? Math.max(0, o.amount - o.paid) : 0
})
</script>

<template>
  <BuilderSection :title="copy.builder.sections.publish" :description="copy.builder.publish.desc">
    <div class="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div class="space-y-1">
        <StatusBadge :status="inv.status" />
        <p v-if="inv.published_at && inv.status === 'published'" class="text-xs text-muted">{{ copy.builder.publish.publishedAt }} {{ formatDateTime(inv.published_at) }}</p>
        <p v-else class="text-xs text-muted">{{ copy.builder.publish.draftNote }}</p>
      </div>
      <AppButton v-if="!b.isPublished.value" :loading="b.publishing.value" :disabled="!b.canPublish.value" @click="b.publish()">{{ copy.common.publish }}</AppButton>
      <AppButton v-else variant="secondary" :loading="b.publishing.value" @click="b.unpublish()">{{ copy.common.unpublish }}</AppButton>
    </div>

    <div>
      <h3 class="mb-2 text-sm font-semibold">{{ copy.builder.publish.checklist }}</h3>
      <ul v-if="b.issues.value.length" class="space-y-2">
        <li v-for="(i, n) in b.issues.value" :key="n">
          <button type="button" class="card flex w-full items-start gap-3 p-3 text-left hover:bg-paper" @click="emit('jump', i.section)">
            <XCircle v-if="i.level === 'error'" class="mt-0.5 size-4 shrink-0 text-danger" />
            <AlertTriangle v-else class="mt-0.5 size-4 shrink-0 text-warn" />
            <span class="text-sm">{{ i.message }}</span>
          </button>
        </li>
      </ul>
      <p v-else class="card flex items-center gap-2 p-3 text-sm"><CheckCircle2 class="size-4 text-sage" /> {{ copy.builder.publish.allGood }}</p>
      <p v-if="unpaid" class="card flex items-start gap-2 border-warn/40 bg-warn-soft p-3 text-sm text-warn" role="status">
        <AlertTriangle class="mt-0.5 size-4 shrink-0" />
        <span>{{ copy.orders.unpaidWarning }} {{ formatCurrency(unpaid) }}. {{ copy.builder.publish.stillCanPublish }}</span>
      </p>
    </div>

    <div class="space-y-2">
      <h3 class="text-sm font-semibold">{{ copy.builder.publish.linkTitle }}</h3>
      <div class="flex gap-2">
        <input :value="url" readonly class="field-input" :aria-label="copy.builder.publish.linkTitle" @focus="($event.target as HTMLInputElement).select()" />
        <AppButton variant="secondary" :aria-label="copy.common.copyLink" @click="b.copyPublicLink()"><Copy class="size-4" /></AppButton>
        <a :href="`/admin/invitations/${inv.id}/preview`" target="_blank" rel="noopener" class="inline-flex items-center rounded-lg border border-line bg-panel px-3 hover:bg-paper" :aria-label="copy.common.preview"><ExternalLink class="size-4" /></a>
      </div>
      <p v-if="!b.isPublished.value" class="text-xs text-muted">{{ copy.builder.publish.guestParamNote }} <code>?to=Nama%20Tamu</code> {{ copy.builder.publish.guestParamNote2 }}</p>
    </div>
  </BuilderSection>
</template>
