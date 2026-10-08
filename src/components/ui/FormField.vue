<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ label: string; hint?: string; error?: string; optional?: boolean }>()
const id = useId()
</script>

<template>
  <div class="space-y-1.5">
    <label :for="id" class="flex items-baseline justify-between text-[13px] font-medium text-ink">
      <span>{{ label }}</span>
      <span v-if="optional" class="text-xs font-normal text-muted">opsional</span>
    </label>
    <slot :id="id" :invalid="!!error" />
    <p v-if="error" class="text-xs text-danger" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-muted">{{ hint }}</p>
  </div>
</template>
