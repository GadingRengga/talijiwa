<script setup lang="ts">
import btflyOrange from '@/assets/images/btfly-orange.webp'
import btflyPurple from '@/assets/images/btfly-purple.webp'
import janurSide from '@/assets/images/janur-side.webp'

// Adat Jawa ornament: asset composition (janur penjor panels + butterflies).
// Janur sways, butterflies cross on flight paths (2 loops each: path + flap).
// Butterfly PNGs carry a black backdrop, dropped with screen blend.
</script>

<template>
  <div class="orn" aria-hidden="true">
    <div class="orn-jawa-veil" />
    <div class="orn-jawa-janur orn-jawa-jl">
      <img :src="janurSide" alt="" decoding="async" />
    </div>
    <div class="orn-jawa-janur orn-jawa-jr">
      <img class="orn-floral-mirror" :src="janurSide" alt="" decoding="async" />
    </div>
    <span class="orn-jawa-fly orn-jawa-fly1"><img :src="btflyOrange" alt="" decoding="async" /></span>
    <span class="orn-jawa-fly orn-jawa-fly2"><img :src="btflyPurple" alt="" decoding="async" /></span>
    <svg class="orn-jawa-band" viewBox="0 0 1200 84" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <pattern id="jw-kawung" width="56" height="56" patternUnits="userSpaceOnUse">
          <circle class="ln" cx="28" cy="28" r="16" />
          <circle class="fl" cx="28" cy="28" r="3.5" />
          <circle class="ln" cx="0" cy="0" r="16" />
          <circle class="ln" cx="56" cy="0" r="16" />
          <circle class="ln" cx="0" cy="56" r="16" />
          <circle class="ln" cx="56" cy="56" r="16" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="1200" height="84" fill="url(#jw-kawung)" />
      <rect class="rule" x="0" y="4" width="1200" height="2" />
      <rect class="rule" x="0" y="78" width="1200" height="2" />
    </svg>
  </div>
</template>
