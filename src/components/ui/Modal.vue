<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { ref, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (open) => {
    const el = dialog.value
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  },
  { flush: 'post' },
)
</script>

<template>
  <dialog ref="dialog" class="m-auto w-[min(94vw,32rem)] rounded-2xl border border-line bg-panel p-0 text-ink shadow-xl backdrop:bg-black/40" @cancel.prevent="emit('close')" @click.self="emit('close')">
    <div v-if="open">
      <header class="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 class="text-base font-semibold">{{ title }}</h2>
        <button type="button" class="rounded-lg p-1 text-muted hover:bg-black/5" aria-label="Tutup" @click="emit('close')"><X class="size-5" /></button>
      </header>
      <div class="p-5"><slot /></div>
    </div>
  </dialog>
</template>
