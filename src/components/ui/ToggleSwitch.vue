<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
defineProps<{ label: string; description?: string }>()
</script>

<template>
  <label class="flex cursor-pointer items-start justify-between gap-4 py-2">
    <span class="min-w-0">
      <span class="block text-sm font-medium text-ink">{{ label }}</span>
      <span v-if="description" class="block text-xs text-muted">{{ description }}</span>
    </span>
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :aria-label="label"
      class="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
      :class="model ? 'bg-sage' : 'bg-line'"
      @click="model = !model"
    >
      <span
        class="inline-block size-5 rounded-full bg-white shadow transition-transform"
        :class="model ? 'translate-x-[22px]' : 'translate-x-0.5'"
      />
    </button>
  </label>
</template>
