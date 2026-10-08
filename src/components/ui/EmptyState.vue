<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <div class="rounded-xl border border-dashed border-line px-6 py-10 text-center">
    <p class="mx-auto max-w-sm text-sm text-muted">{{ message }}</p>
    <div v-if="$slots.default" class="mt-4 flex justify-center"><slot /></div>
  </div>
</template>
