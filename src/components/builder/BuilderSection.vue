<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <!-- Title lives in the shell header strip; sections render only their description + fields. -->
  <section class="space-y-4">
    <p v-if="description" class="text-[13px] leading-relaxed text-muted">{{ description }}</p>
    <slot />
  </section>
</template>
