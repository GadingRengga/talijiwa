<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'

const props = defineProps<{ label: string; presets: string[]; followLabel: string; customLabel: string }>()
const value = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between gap-2">
      <p class="text-[13px] font-medium">{{ label }}</p>
      <button v-if="value" type="button" class="inline-flex shrink-0 items-center gap-1 text-xs text-muted hover:text-ink" @click="value = ''">
        <RotateCcw class="size-3" /> {{ followLabel }}
      </button>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="c in presets"
        :key="c"
        type="button"
        :aria-label="`Warna ${c}`"
        :aria-pressed="value === c"
        class="size-9 rounded-full border-2 transition-transform hover:scale-110"
        :class="value === c ? 'border-ink' : 'border-white shadow'"
        :style="{ background: c }"
        @click="value = c"
      />
      <label
        class="relative inline-flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line text-sm text-muted"
        :title="customLabel"
      >
        +<input
          type="color"
          :value="value || props.presets[0] || '#000000'"
          class="absolute inset-0 size-full cursor-pointer opacity-0"
          :aria-label="customLabel"
          @input="value = ($event.target as HTMLInputElement).value"
        />
      </label>
    </div>
    <slot />
  </div>
</template>
