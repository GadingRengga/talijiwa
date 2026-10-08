<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { copy } from '@/config/copy'

const props = defineProps<{ target: Date }>()
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const diff = computed(() => Math.max(0, props.target.getTime() - now.value))
const done = computed(() => diff.value <= 0)
const units = computed(() => {
  const s = Math.floor(diff.value / 1000)
  return [
    { key: 'd', label: copy.invitation.days, value: Math.floor(s / 86400) },
    { key: 'h', label: copy.invitation.hours, value: Math.floor((s % 86400) / 3600) },
    { key: 'm', label: copy.invitation.minutes, value: Math.floor((s % 3600) / 60) },
    { key: 's', label: copy.invitation.seconds, value: s % 60 },
  ]
})
</script>

<template>
  <p v-if="done" class="inv-heading text-3xl inv-accent">{{ copy.invitation.todayIsTheDay }}</p>
  <div v-else class="grid grid-cols-4 gap-1.5 sm:gap-2" role="timer" aria-live="off">
    <div v-for="u in units" :key="u.key" class="inv-card min-w-0 px-1 py-2 sm:py-3">
      <div class="relative h-8 overflow-hidden sm:h-9">
        <Transition name="tick" mode="out-in">
          <span :key="u.value" class="inv-heading block text-2xl tabular-nums sm:text-3xl">{{ String(u.value).padStart(2, '0') }}</span>
        </Transition>
      </div>
      <p class="inv-muted text-xs">{{ u.label }}</p>
    </div>
  </div>
</template>

<style scoped>
.tick-enter-active,
.tick-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.tick-enter-from {
  transform: translateY(40%);
  opacity: 0;
}
.tick-leave-to {
  transform: translateY(-40%);
  opacity: 0;
}
</style>
