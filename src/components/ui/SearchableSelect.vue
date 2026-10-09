<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

export interface SearchOption {
  value: string | null
  label: string
  hint?: string
}

const props = withDefaults(
  defineProps<{ modelValue: string | null; options: SearchOption[]; id?: string; placeholder?: string; searchPlaceholder?: string; noMatch?: string; disabled?: boolean }>(),
  { id: undefined, placeholder: 'Pilih…', searchPlaceholder: 'Ketik untuk mencari…', noMatch: 'Tidak ada yang cocok.', disabled: false },
)
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const open = ref(false)
const query = ref('')
const root = ref<HTMLElement | null>(null)
const listId = `ss-${Math.random().toString(36).slice(2, 8)}`

const selected = computed(() => props.options.find((o) => o.value === props.modelValue) ?? null)
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(q))
})

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}

watch(open, (v) => {
  if (v) {
    query.value = ''
    document.addEventListener('click', onDocClick)
  } else {
    document.removeEventListener('click', onDocClick)
  }
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

function toggle() {
  if (!props.disabled) open.value = !open.value
}
function pick(value: string | null) {
  emit('update:modelValue', value)
  open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
  if (e.key === 'Enter' && open.value && filtered.value.length === 1) pick(filtered.value[0]!.value)
}
</script>

<template>
  <div ref="root" class="relative" @keydown="onKey">
    <button
      :id="id"
      type="button"
      class="field-input flex w-full items-center justify-between gap-2 text-left"
      :disabled="disabled"
      :aria-expanded="open"
      :aria-controls="listId"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="min-w-0 flex-1 truncate" :class="selected ? '' : 'text-muted'">{{ selected?.label ?? placeholder }}</span>
      <ChevronDown class="size-4 shrink-0 text-muted" aria-hidden="true" />
    </button>
    <div v-if="open" class="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-line bg-panel shadow-lg">
      <div class="border-b border-line p-2">
        <input v-model="query" class="field-input !py-1.5 text-sm" :placeholder="searchPlaceholder" aria-label="Cari pilihan" />
      </div>
      <ul :id="listId" role="listbox" class="max-h-56 overflow-y-auto p-1">
        <li v-if="!filtered.length" class="px-3 py-2 text-sm text-muted">{{ noMatch }}</li>
        <li v-for="o in filtered" :key="String(o.value)">
          <button
            type="button"
            role="option"
            :aria-selected="o.value === modelValue"
            class="flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm hover:bg-paper"
            :class="o.value === modelValue ? 'bg-brand-soft/60 font-medium text-brand' : ''"
            @click="pick(o.value)"
          >
            <span class="truncate">{{ o.label }}</span>
            <span v-if="o.hint" class="truncate text-xs text-muted">{{ o.hint }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
