<script setup lang="ts">
import { Music2, Pause } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps<{ url: string }>()
const audio = ref<HTMLAudioElement | null>(null)
const playing = ref(false)

/** Called after a user gesture. Browsers may still block it; we fail silently and show Play. */
async function play() {
  try {
    await audio.value?.play()
    playing.value = true
  } catch {
    playing.value = false
  }
}
function toggle() {
  if (playing.value) {
    audio.value?.pause()
    playing.value = false
  } else {
    void play()
  }
}
defineExpose({ play })
</script>

<template>
  <div v-if="props.url">
    <audio ref="audio" :src="props.url" loop preload="none" />
    <button
      type="button"
      class="inv-btn fixed z-40 !size-11 !rounded-full !p-0 shadow-lg"
      style="bottom: max(1.25rem, env(safe-area-inset-bottom)); right: max(1.25rem, env(safe-area-inset-right))"
      :aria-label="playing ? 'Jeda musik' : 'Putar musik'"
      :style="playing ? { animation: 'inv-spin 4s linear infinite' } : undefined"
      @click="toggle"
    >
      <Pause v-if="playing" class="size-5" />
      <Music2 v-else class="size-5" />
    </button>
  </div>
</template>
