<script setup lang="ts">
import { useRoute } from 'vue-router'
import ThemeBanner from '@/components/invitation/ThemeBanner.vue'

// Embed: <iframe src="https://domain/embed/banner/gerbang?couple=Raka%20%26%20Sinta&date=20%20Des%202026">
const route = useRoute()
const q = (k: string) => (typeof route.query[k] === 'string' ? (route.query[k] as string) : undefined)
</script>

<template>
  <div class="h-dvh w-full"><ThemeBanner :theme="String(route.params.theme)" :couple="q('couple')" :date="q('date')" /></div>
</template>
