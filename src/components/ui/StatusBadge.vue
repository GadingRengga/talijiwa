<script setup lang="ts">
import { computed } from 'vue'
import { copy } from '@/config/copy'
import type { InvitationStatus } from '@/types'

const props = defineProps<{ status: InvitationStatus }>()
const map = {
  draft: { label: copy.invitations.statuses.draft, cls: 'bg-warn-soft text-warn' },
  published: { label: copy.invitations.statuses.published, cls: 'bg-sage-soft text-sage' },
  archived: { label: copy.invitations.statuses.archived, cls: 'bg-line text-muted' },
} as const
const info = computed(() => map[props.status])
</script>

<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" :class="info.cls">
    {{ info.label }}
  </span>
</template>
