<script setup lang="ts">
import { copy } from '@/config/copy'
</script>

<template>
  <main class="grid min-h-[60dvh] place-items-center px-6 text-center">
    <div>
      <h1 class="font-display text-4xl font-semibold">{{ copy.company.notFoundTitle }}</h1>
      <p class="mt-2 text-sm text-muted">{{ copy.company.notFoundSubtitle }}</p>
      <RouterLink to="/" class="mt-5 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">{{ copy.company.backHome }}</RouterLink>
    </div>
  </main>
</template>
