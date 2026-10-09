<script setup lang="ts">
import { computed } from 'vue'
import { copy } from '@/config/copy'
import type { InvitationStatus } from '@/types'

const props = defineProps<{ status: InvitationStatus }>()
const map = {
  draft: { label: copy.invitations.statuses.draft, cls: 'bg-warn-soft text-warn ring-warn/25', dot: 'bg-warn' },
  published: { label: copy.invitations.statuses.published, cls: 'bg-sage-soft text-sage ring-sage/25', dot: 'bg-sage' },
  archived: { label: copy.invitations.statuses.archived, cls: 'bg-black/[0.06] text-muted ring-black/10', dot: 'bg-muted' },
} as const
const info = computed(() => map[props.status])
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset" :class="info.cls">
    <span class="size-1.5 rounded-full" :class="info.dot" aria-hidden="true" />
    {{ info.label }}
  </span>
</template>
