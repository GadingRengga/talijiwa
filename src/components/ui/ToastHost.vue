<script setup lang="ts">
import { CheckCircle2, Info, XCircle } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
const icons = { success: CheckCircle2, error: XCircle, info: Info }
const tone = { success: 'text-sage', error: 'text-danger', info: 'text-brand' }
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
    <button
      v-for="t in toasts"
      :key="t.id"
      class="pointer-events-auto flex max-w-md items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm shadow-lg"
      @click="dismiss(t.id)"
    >
      <component :is="icons[t.type]" class="size-4 shrink-0" :class="tone[t.type]" aria-hidden="true" />
      <span class="text-left">{{ t.message }}</span>
    </button>
  </div>
</template>
