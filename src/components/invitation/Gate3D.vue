<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { prefersReducedMotion } from '@/composables/useAnimation'

/**
 * Neutral gate placeholder while the theme roster is empty.
 * The full WebGL gate returns with the first new theme; until then this
 * keeps InvitationCover compilable with zero image assets.
 */
const emit = defineEmits<{
  opened: []
  done: []
  skipped: []
}>()

defineExpose({ play })

let timer = 0

function play() {
  window.clearTimeout(timer)
  emit('opened')
  timer = window.setTimeout(() => emit('done'), 600)
}

onMounted(() => {
  if (prefersReducedMotion()) emit('skipped')
})

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div aria-hidden="true" />
</template>
