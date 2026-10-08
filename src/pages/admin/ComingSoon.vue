<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="max-w-lg space-y-3">
    <h1 class="font-display text-3xl font-semibold">{{ route.meta.title }}</h1>
    <p class="text-sm text-muted">Halaman ini dikerjakan di fase berikutnya. Strukturnya sudah disiapkan: route, service (<code>rsvpService</code>, <code>analyticsService</code>), dan tipe datanya.</p>
    <RouterLink to="/admin" class="inline-block text-sm font-medium text-brand hover:underline">Kembali ke dashboard</RouterLink>
  </div>
</template>
