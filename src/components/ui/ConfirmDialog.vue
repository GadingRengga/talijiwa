<script setup lang="ts">
import { ref, watch } from 'vue'
import AppButton from './AppButton.vue'
import { copy } from '@/config/copy'

const props = withDefaults(
  defineProps<{ open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean }>(),
  { confirmLabel: 'Ya, lanjutkan', danger: true },
)
const emit = defineEmits<{ confirm: []; cancel: [] }>()
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
  <dialog
    ref="dialog"
    class="m-auto w-[min(92vw,26rem)] rounded-2xl border border-line bg-panel p-0 text-ink shadow-xl backdrop:bg-black/40"
    @cancel.prevent="emit('cancel')"
    @click.self="emit('cancel')"
  >
    <div class="space-y-2 p-6">
      <h2 class="text-base font-semibold">{{ title }}</h2>
      <p class="text-sm text-muted">{{ message }}</p>
    </div>
    <div class="flex justify-end gap-2 border-t border-line px-6 py-3">
      <AppButton variant="secondary" size="sm" @click="emit('cancel')">{{ copy.common.cancel }}</AppButton>
      <AppButton :variant="danger ? 'danger' : 'primary'" size="sm" @click="emit('confirm')">{{ confirmLabel }}</AppButton>
    </div>
  </dialog>
</template>
