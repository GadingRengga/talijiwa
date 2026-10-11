<script setup lang="ts">
import bouquet from '@/assets/images/floral-bouquet-1.webp'
import garland from '@/assets/images/floral-garland-1.webp'
import hanging from '@/assets/images/floral-hanging-1.webp'
import sprig from '@/assets/images/floral-sprig-1.webp'

// Floral #1 ornament: full asset composition (all user AI assets).
// Hanging canopy + bottom bouquets sway; garlands, sprigs and the readability
// veil stay still (viding-style). Loops: 3 + petals 9 = 12 (budget 14).
</script>

<template>
  <div class="orn" aria-hidden="true">
    <!-- Readability veil: soft surface glow keeps centered text legible -->
    <div class="orn-floral-veil" />
    <!-- Hanging canopy (sways gently) -->
    <div class="orn-floral-hanging" style="animation-delay: 0.5s;">
      <img :src="hanging" alt="" decoding="async" />
    </div>
    <!-- Top garland strip (static frame) -->
    <div class="orn-floral-strip orn-floral-strip-top">
      <img :src="garland" alt="" decoding="async" />
    </div>
    <!-- Bottom garland strip (static frame, mirrored) -->
    <div class="orn-floral-strip orn-floral-strip-bottom">
      <img :src="garland" alt="" decoding="async" />
    </div>
    <!-- Side sprigs (static greenery) -->
    <div class="orn-floral-side orn-floral-side-l">
      <img :src="sprig" alt="" decoding="async" />
    </div>
    <div class="orn-floral-side orn-floral-side-r">
      <img class="orn-floral-mirror" :src="sprig" alt="" decoding="async" />
    </div>
    <!-- Bottom corner bouquets (sway) -->
    <div class="orn-floral orn-floral-bl" style="animation-delay: 0.9s; animation-duration: 5.4s;">
      <img :src="bouquet" alt="" decoding="async" />
    </div>
    <div class="orn-floral orn-floral-br" style="animation-delay: 2.1s; animation-duration: 6.6s;">
      <img :src="bouquet" alt="" decoding="async" />
    </div>
  </div>
</template>
