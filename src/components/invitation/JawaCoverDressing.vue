<script setup lang="ts">
import btflyOrange from '@/assets/images/btfly-orange.webp'
import btflyPurple from '@/assets/images/btfly-purple.webp'

// Cover dressing exclusive to the Jawa theme: janur fronds swaying on both
// sides, two butterflies crossing the cover, a batik wash at the edges and
// a light sweep over the carvings. Replaces the cover sparkle layer while
// mounted (sections keep their decor). Pure DOM/SVG, transform/opacity only.
</script>

<template>
  <div class="jw-dress" aria-hidden="true">
    <svg class="jw-wash" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <pattern id="jw-wash-kawung" width="46" height="46" patternUnits="userSpaceOnUse">
          <circle class="ln" cx="23" cy="23" r="13" />
          <circle class="fl" cx="23" cy="23" r="2.6" />
          <circle class="ln" cx="0" cy="0" r="13" />
          <circle class="ln" cx="46" cy="0" r="13" />
          <circle class="ln" cx="0" cy="46" r="13" />
          <circle class="ln" cx="46" cy="46" r="13" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="400" height="800" fill="url(#jw-wash-kawung)" />
    </svg>
    <div class="jw-janur jw-janur-l">
      <svg viewBox="0 0 120 400" focusable="false">
        <path class="stem" d="M70 400 C60 300 78 220 64 130 C58 90 62 50 72 12" />
        <g class="leaf">
          <ellipse cx="42" cy="332" rx="20" ry="6" transform="rotate(-30 42 332)" />
          <ellipse cx="90" cy="332" rx="20" ry="6" transform="rotate(30 90 332)" />
          <ellipse cx="41" cy="277" rx="19" ry="6" transform="rotate(-30 41 277)" />
          <ellipse cx="91" cy="277" rx="19" ry="6" transform="rotate(30 91 277)" />
          <ellipse cx="42" cy="222" rx="18" ry="6" transform="rotate(-30 42 222)" />
          <ellipse cx="90" cy="222" rx="18" ry="6" transform="rotate(30 90 222)" />
          <ellipse cx="41" cy="167" rx="17" ry="5.5" transform="rotate(-30 41 167)" />
          <ellipse cx="91" cy="167" rx="17" ry="5.5" transform="rotate(30 91 167)" />
          <ellipse cx="42" cy="117" rx="15" ry="5" transform="rotate(-30 42 117)" />
          <ellipse cx="90" cy="117" rx="15" ry="5" transform="rotate(30 90 117)" />
          <ellipse cx="70" cy="22" rx="6" ry="15" />
        </g>
      </svg>
    </div>
    <div class="jw-janur jw-janur-r">
      <svg viewBox="0 0 120 400" focusable="false">
        <path class="stem" d="M70 400 C60 300 78 220 64 130 C58 90 62 50 72 12" />
        <g class="leaf">
          <ellipse cx="42" cy="332" rx="20" ry="6" transform="rotate(-30 42 332)" />
          <ellipse cx="90" cy="332" rx="20" ry="6" transform="rotate(30 90 332)" />
          <ellipse cx="41" cy="277" rx="19" ry="6" transform="rotate(-30 41 277)" />
          <ellipse cx="91" cy="277" rx="19" ry="6" transform="rotate(30 91 277)" />
          <ellipse cx="42" cy="222" rx="18" ry="6" transform="rotate(-30 42 222)" />
          <ellipse cx="90" cy="222" rx="18" ry="6" transform="rotate(30 90 222)" />
          <ellipse cx="41" cy="167" rx="17" ry="5.5" transform="rotate(-30 41 167)" />
          <ellipse cx="91" cy="167" rx="17" ry="5.5" transform="rotate(30 91 167)" />
          <ellipse cx="42" cy="117" rx="15" ry="5" transform="rotate(-30 42 117)" />
          <ellipse cx="90" cy="117" rx="15" ry="5" transform="rotate(30 90 117)" />
          <ellipse cx="70" cy="22" rx="6" ry="15" />
        </g>
      </svg>
    </div>
    <span class="jw-fly jw-fly-1"><img :src="btflyOrange" alt="" decoding="async" /></span>
    <span class="jw-fly jw-fly-2"><img :src="btflyPurple" alt="" decoding="async" /></span>
    <div class="jw-sheen" />
  </div>
</template>
