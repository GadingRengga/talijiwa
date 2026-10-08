<script setup lang="ts">
import { computed } from 'vue'
import type { OrnamentKind } from '@/types'

const props = defineProps<{ kind: OrnamentKind }>()

// Deterministic star field via box-shadow: 1 element, many stars, cheap to animate (opacity only).
function field(n: number, seed: number) {
  return Array.from({ length: n }, (_, i) => {
    const r = (k: number) => (Math.sin((i + 1) * k + seed) + 1) / 2
    return `${(r(12.9) * 100).toFixed(1)}vw ${(r(78.2) * 100).toFixed(1)}vh 0 0 var(--inv-text)`
  }).join(',')
}
const stars = computed(() => [field(36, 1), field(22, 7)])
const batikMask = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48' fill='none' stroke='black' stroke-width='1.2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Ccircle cx='36' cy='12' r='10'/%3E%3Ccircle cx='12' cy='36' r='10'/%3E%3Ccircle cx='36' cy='36' r='10'/%3E%3Ccircle cx='24' cy='24' r='3' fill='black'/%3E%3C/svg%3E\")"
</script>

<template>
  <div class="orn" aria-hidden="true">
    <template v-if="kind === 'garden'">
      <svg v-for="c in ['tl', 'br']" :key="c" :class="['orn-vine', `orn-vine-${c}`]" viewBox="0 0 140 320" fill="none" stroke="var(--inv-accent)" stroke-width="1.6" stroke-linecap="round">
        <path class="orn-draw" d="M4 0 C 70 40, 10 120, 80 170 S 40 262, 118 316" />
        <path class="orn-draw orn-d2" d="M40 62 C 70 54, 92 70, 104 94 M26 128 C 54 128, 76 144, 82 168 M60 214 C 84 206, 104 214, 118 236" />
        <circle class="orn-bud" cx="104" cy="94" r="5" fill="var(--inv-accent)" stroke="none" /><circle class="orn-bud" cx="82" cy="168" r="4" fill="var(--inv-accent)" stroke="none" /><circle class="orn-bud" cx="118" cy="236" r="5" fill="var(--inv-accent)" stroke="none" />
      </svg>
    </template>
    <template v-else-if="kind === 'frame'">
      <svg v-for="c in ['tl', 'tr', 'bl', 'br']" :key="c" :class="['orn-corner', `orn-corner-${c}`]" viewBox="0 0 80 80" fill="none" stroke="var(--inv-accent)" stroke-width="1.4" stroke-linecap="round">
        <path class="orn-d" pathLength="1" d="M4 76 V14 Q4 4 14 4 H76" /><path class="orn-d" pathLength="1" d="M14 76 V26 Q14 14 26 14 H76" /><circle cx="26" cy="26" r="2.4" fill="var(--inv-accent)" stroke="none" />
      </svg>
    </template>
    <template v-else-if="kind === 'lines'"><i class="orn-vline orn-vline-l" /><i class="orn-vline orn-vline-r" /></template>
    <template v-else-if="kind === 'bouquet'">
      <svg v-for="c in ['tr', 'bl']" :key="c" :class="['orn-bouquet', `orn-bouquet-${c}`]" viewBox="0 0 120 120" fill="none">
        <path class="orn-d" pathLength="1" d="M118 2 C 90 30, 70 60, 54 96" stroke="var(--inv-accent)" stroke-width="1.4" stroke-linecap="round" />
        <g class="orn-flower"><ellipse v-for="n in 6" :key="n" cx="54" cy="84" rx="7" ry="15" :transform="`rotate(${n * 60} 54 96)`" fill="var(--inv-accent)" opacity=".45" /><circle cx="54" cy="96" r="5" fill="var(--inv-accent)" /></g>
        <g class="orn-flower orn-flower-2"><ellipse v-for="n in 5" :key="n" cx="96" cy="26" rx="5" ry="11" :transform="`rotate(${n * 72} 96 36)`" fill="var(--inv-accent)" opacity=".4" /><circle cx="96" cy="36" r="3.5" fill="var(--inv-accent)" /></g>
      </svg>
    </template>
    <template v-else-if="kind === 'shine'">
      <i class="orn-gline orn-gline-t" /><i class="orn-gline orn-gline-b" /><i class="orn-sweep" />
    </template>
    <div v-else-if="kind === 'batik'" class="orn-batik" :style="{ WebkitMaskImage: batikMask, maskImage: batikMask }" />
    <template v-else-if="kind === 'stars'">
      <i class="orn-star orn-star-a" :style="{ boxShadow: stars[0] }" />
      <i class="orn-star orn-star-b" :style="{ boxShadow: stars[1] }" />
    </template>
    <template v-else-if="kind === 'wash'">
      <i class="orn-wash orn-wash-a" /><i class="orn-wash orn-wash-b" /><i class="orn-wash orn-wash-c" />
    </template>
  </div>
</template>
