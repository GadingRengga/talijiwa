<script setup lang="ts">
import { computed } from 'vue'
import { copy } from '@/config/copy'
import type { DayPoint } from '@/services/analytics'

const props = defineProps<{ points: DayPoint[]; label: string }>()
const max = computed(() => Math.max(1, ...props.points.map((p) => Math.max(p.views, p.rsvps))))
</script>

<template>
  <div>
    <div class="flex h-40 items-end gap-1.5" role="img" :aria-label="label">
      <div v-for="p in points" :key="p.date" class="flex min-w-0 flex-1 flex-col items-center justify-end gap-1 self-stretch" :title="`${p.label}: ${p.views} ${copy.analytics.seen.toLowerCase()}, ${p.rsvps} ${copy.analytics.rsvpSeries}`">
        <div class="flex w-full max-w-6 flex-1 items-end justify-center gap-0.5">
          <span class="w-full rounded-t bg-brand/80" :style="{ height: `${Math.max(p.views ? 4 : 0, (p.views / max) * 100)}%` }" />
          <span class="w-full rounded-t bg-sage/80" :style="{ height: `${Math.max(p.rsvps ? 4 : 0, (p.rsvps / max) * 100)}%` }" />
        </div>
        <span class="w-full truncate text-center text-[10px] text-muted">{{ p.label }}</span>
      </div>
    </div>
    <div class="mt-2 flex gap-4 text-xs text-muted">
      <span class="inline-flex items-center gap-1"><span class="size-2.5 rounded-sm bg-brand/80" /> {{ copy.analytics.seen }}</span>
      <span class="inline-flex items-center gap-1"><span class="size-2.5 rounded-sm bg-sage/80" /> {{ copy.analytics.rsvpSeries }}</span>
    </div>
  </div>
</template>
