<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', loading: false, disabled: false, type: 'button' },
)

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 whitespace-nowrap active:translate-y-px'
  const size = props.size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2.5 text-sm'
  const variant = {
    primary: 'bg-gradient-to-b from-brand to-brand-dark text-white shadow-md shadow-brand/25 hover:shadow-lg hover:shadow-brand/30 hover:brightness-110',
    secondary: 'bg-panel text-ink border border-line shadow-sm hover:bg-paper hover:border-brand/30',
    ghost: 'text-ink hover:bg-black/5',
    danger: 'bg-gradient-to-b from-danger to-[#8f2a24] text-white shadow-md shadow-danger/25 hover:brightness-110',
  }[props.variant]
  return `${base} ${size} ${variant}`
})
</script>

<template>
  <button :type="type" :class="classes" :disabled="loading || disabled">
    <Loader2 v-if="loading" class="size-4 animate-spin" aria-hidden="true" />
    <slot />
  </button>
</template>
