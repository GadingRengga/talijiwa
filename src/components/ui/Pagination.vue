<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

defineProps<{ page: number; total: number }>()
const emit = defineEmits<{ prev: []; next: [] }>()
</script>

<template>
  <nav v-if="total > 1" class="flex items-center justify-center gap-3 pt-2" aria-label="Halaman">
    <button type="button" class="rounded-lg border border-line p-2 text-muted hover:bg-paper disabled:opacity-30" :disabled="page <= 1" aria-label="Halaman sebelumnya" @click="emit('prev')"><ChevronLeft class="size-4" /></button>
    <span class="text-xs text-muted" role="status">Halaman {{ page }} dari {{ total }}</span>
    <button type="button" class="rounded-lg border border-line p-2 text-muted hover:bg-paper disabled:opacity-30" :disabled="page >= total" aria-label="Halaman berikutnya" @click="emit('next')"><ChevronRight class="size-4" /></button>
  </nav>
</template>
