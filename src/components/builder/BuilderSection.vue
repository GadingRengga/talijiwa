<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <section class="space-y-5">
    <header>
      <h2 class="font-display text-2xl font-semibold">{{ title }}</h2>
      <p v-if="description" class="mt-0.5 text-sm text-muted">{{ description }}</p>
    </header>
    <slot />
  </section>
</template>
