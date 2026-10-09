<script setup lang="ts">
import { ArrowRight, X } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import { QUICK_EDITS } from './quickFields'
import type { BuilderKey } from './sections'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'

const props = defineProps<{ draft: InvitationData | null; sec: string; saveText: string }>()
const emit = defineEmits<{ close: []; openFull: [section: BuilderKey] }>()

const edit = computed(() => QUICK_EDITS[props.sec] ?? null)

function parentOf(path: (string | number)[]): Record<string | number, unknown> | null {
  let o: unknown = props.draft
  for (const k of path.slice(0, -1)) {
    if (o == null || typeof o !== 'object') return null
    o = (o as Record<string | number, unknown>)[k]
  }
  return o != null && typeof o === 'object' ? (o as Record<string | number, unknown>) : null
}

function getVal(path: (string | number)[]): string {
  const p = parentOf(path)
  const v = p?.[path[path.length - 1]!]
  return typeof v === 'string' ? v : ''
}

function setVal(path: (string | number)[], value: string) {
  const p = parentOf(path)
  if (p) p[path[path.length - 1]!] = value // same draft object: autosave + undo follow automatically
}

const available = computed(() => edit.value?.fields.filter((f) => parentOf(f.path) !== null) ?? [])

const panel = ref<HTMLElement | null>(null)
onMounted(() => {
  // Mobile: pop the keyboard straight away so editing starts on the canvas.
  if (typeof window === 'undefined' || !window.matchMedia('(max-width: 1279.98px)').matches) return
  void nextTick(() => panel.value?.querySelector('input, textarea') instanceof HTMLElement
    && (panel.value.querySelector('input, textarea') as HTMLElement).focus({ preventScroll: true }))
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true" :aria-label="edit ? copy.builder.sections[edit.section] : ''">
    <button type="button" class="absolute inset-0 bg-ink/50 backdrop-blur-[1px]" :aria-label="copy.common.close" @click="emit('close')" />
    <div ref="panel" class="card relative max-h-[82dvh] w-full overflow-y-auto p-5 sm:max-w-md" @keydown.escape="emit('close')">
      <span class="mx-auto mb-3 block h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="font-display text-lg font-bold tracking-tight">{{ edit ? copy.builder.sections[edit.section] : '' }}</h2>
          <p class="mt-0.5 text-xs text-muted">{{ saveText }}</p>
        </div>
        <button type="button" class="grid size-9 shrink-0 place-items-center rounded-xl text-muted hover:bg-black/5" :aria-label="copy.common.close" @click="emit('close')">
          <X class="size-5" aria-hidden="true" />
        </button>
      </div>

      <div v-if="edit && available.length" class="space-y-4">
        <FormField v-for="f in available" :key="f.path.join('.')" :label="f.label" v-slot="{ id }">
          <textarea v-if="f.kind === 'textarea'" :id="id" rows="3" class="field-input" :value="getVal(f.path)" @input="setVal(f.path, ($event.target as HTMLTextAreaElement).value)" />
          <input
            v-else
            :id="id"
            :type="f.kind === 'url' ? 'url' : f.kind"
            class="field-input"
            :placeholder="f.placeholder"
            inputmode="text"
            :value="getVal(f.path)"
            @input="setVal(f.path, ($event.target as HTMLInputElement).value)"
          />
        </FormField>
      </div>
      <p v-else class="rounded-xl bg-paper px-4 py-3 text-sm text-muted">{{ copy.builder.quickEmpty }}</p>

      <button
        v-if="edit"
        type="button"
        class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-semibold transition-colors hover:border-brand/40 hover:text-brand"
        @click="emit('openFull', edit.section)"
      >
        {{ copy.builder.quickOpenFull }} <ArrowRight class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
