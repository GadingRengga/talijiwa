<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { copy } from '@/config/copy'
</script>

<template>
  <div class="flex items-center justify-center gap-2 py-16 text-sm text-muted" role="status">
    <Loader2 class="size-4 animate-spin" aria-hidden="true" />
    {{ copy.common.loading }}
  </div>
</template>
