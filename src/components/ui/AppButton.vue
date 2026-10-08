<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    loading?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', loading: false, type: 'button' },
)

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap'
  const size = props.size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-sm'
  const variant = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'bg-panel text-ink border border-line hover:bg-paper',
    ghost: 'text-ink hover:bg-black/5',
    danger: 'bg-danger text-white hover:opacity-90',
  }[props.variant]
  return `${base} ${size} ${variant}`
})
</script>

<template>
  <button :type="type" :class="classes" :disabled="loading">
    <Loader2 v-if="loading" class="size-4 animate-spin" aria-hidden="true" />
    <slot />
  </button>
</template>
