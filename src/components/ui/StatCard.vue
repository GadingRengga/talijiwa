<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{ label: string; value: number | string; icon: Component }>()
</script>

<template>
  <div class="card flex min-w-0 items-center gap-3 p-3 sm:gap-4 sm:p-4" data-stat>
    <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
      <component :is="icon" class="size-5" aria-hidden="true" />
    </span>
    <div class="min-w-0">
      <p class="text-xl font-semibold leading-none tabular-nums sm:text-2xl">{{ value }}</p>
      <p class="mt-1 truncate text-xs text-muted">{{ label }}</p>
    </div>
  </div>
</template>
