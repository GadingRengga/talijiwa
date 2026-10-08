<script setup lang="ts">
import { computed } from 'vue'
import type { InvitationStatus } from '@/types'

const props = defineProps<{ status: InvitationStatus }>()
const map = {
  draft: { label: 'Draf', cls: 'bg-warn-soft text-warn' },
  published: { label: 'Terbit', cls: 'bg-sage-soft text-sage' },
  archived: { label: 'Arsip', cls: 'bg-line text-muted' },
} as const
const info = computed(() => map[props.status])
</script>

<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" :class="info.cls">
    {{ info.label }}
  </span>
</template>
