<script setup lang="ts">
import { computed } from 'vue'
import type { DecorKind } from '@/types'

const props = defineProps<{ kind: DecorKind }>()

// Deterministic pseudo-random so SSR/preview stays stable between renders.
const items = computed(() => {
  if (props.kind === 'none') return []
  const count = props.kind === 'sparkle' ? 14 : 9
  return Array.from({ length: count }, (_, i) => {
    const r = (n: number) => ((Math.sin((i + 1) * n) + 1) / 2)
    return {
      left: `${Math.round(r(12.9) * 96)}%`,
      size: props.kind === 'sparkle' ? 3 + Math.round(r(4.1) * 4) : 10 + Math.round(r(4.1) * 12),
      delay: `${(r(7.7) * 10).toFixed(1)}s`,
      duration: `${(props.kind === 'sparkle' ? 3 + r(2.3) * 3 : 12 + r(2.3) * 10).toFixed(1)}s`,
      dx: `${Math.round((r(9.1) - 0.5) * 120)}px`,
      top: `${Math.round(r(3.3) * 95)}%`,
    }
  })
})

function style(it: (typeof items.value)[number]) {
  const base = { left: it.left, width: `${it.size}px`, height: `${it.size}px`, '--dx': it.dx } as Record<string, string>
  if (props.kind === 'sparkle') {
    return {
      ...base,
      top: it.top,
      background: 'var(--inv-accent)',
      borderRadius: '50%',
      boxShadow: '0 0 8px var(--inv-accent)',
      animation: `inv-twinkle ${it.duration} ease-in-out ${it.delay} infinite`,
    }
  }
  return {
    ...base,
    background: props.kind === 'petals' ? 'var(--inv-accent)' : 'var(--inv-border)',
    borderRadius: props.kind === 'petals' ? '80% 0 80% 0' : '50%',
    opacity: '0',
    animation: `inv-drift ${it.duration} linear ${it.delay} infinite`,
  }
}
</script>

<template>
  <div v-if="kind !== 'none'" class="inv-decor" aria-hidden="true">
    <i v-for="(it, n) in items" :key="n" :style="style(it)" />
  </div>
</template>
