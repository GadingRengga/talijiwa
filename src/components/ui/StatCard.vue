<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{ label: string; value: number | string; icon: Component }>()
</script>

<template>
  <div
    class="card group relative flex min-w-0 items-center gap-3 overflow-hidden p-3 transition-all duration-200 hover:-translate-y-0.5 hover:[box-shadow:var(--shadow-pop)] sm:gap-4 sm:p-4"
    data-stat
  >
    <div
      class="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-brand-soft opacity-60 transition-transform duration-200 group-hover:scale-150"
      aria-hidden="true"
    />
    <span class="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/25">
      <component :is="icon" class="size-5" aria-hidden="true" />
    </span>
    <div class="relative min-w-0">
      <p class="truncate font-display text-2xl font-bold leading-none tabular-nums tracking-tight sm:text-[1.7rem]">{{ value }}</p>
      <p class="mt-1.5 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{{ label }}</p>
    </div>
  </div>
</template>
