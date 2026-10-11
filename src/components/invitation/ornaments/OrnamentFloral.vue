<script setup lang="ts">
// Floral #1 ornament (rebuilt from zero): blush bouquet symbols + garlands,
// pure inline SVG, no image assets. Corner clusters sway; garlands stay still.
</script>

<template>
  <div class="orn" aria-hidden="true">
    <svg width="0" height="0" style="position: absolute" aria-hidden="true">
      <defs>
        <g id="fl-pt">
          <path d="M50 52C28 44 24 10 50 4C76 10 72 44 50 52Z" fill="color-mix(in srgb, var(--inv-accent) 45%, var(--inv-surface))" />
          <path d="M50 50C38 42 36 22 50 16C64 22 62 42 50 50Z" fill="var(--inv-accent)" />
          <path d="M50 50V10" stroke="color-mix(in srgb, var(--inv-accent) 60%, var(--inv-text))" stroke-width="1.2" />
        </g>
        <g id="fl-lp">
          <path d="M50 52C36 36 38 12 50 2C62 12 64 36 50 52Z" fill="var(--inv-surface)" stroke="color-mix(in srgb, var(--inv-accent) 40%, var(--inv-surface))" stroke-width="1.4" />
          <path d="M50 50V14" stroke="color-mix(in srgb, var(--inv-accent) 40%, var(--inv-surface))" />
        </g>
        <symbol id="fl-geo" viewBox="0 0 100 100">
          <use href="#fl-pt" /><use href="#fl-pt" transform="rotate(72 50 50)" /><use href="#fl-pt" transform="rotate(144 50 50)" /><use href="#fl-pt" transform="rotate(216 50 50)" /><use href="#fl-pt" transform="rotate(288 50 50)" />
          <circle cx="50" cy="50" r="7" fill="color-mix(in srgb, var(--inv-accent) 65%, var(--inv-text))" /><circle cx="50" cy="50" r="2.6" fill="var(--inv-surface)" />
        </symbol>
        <symbol id="fl-lily" viewBox="0 0 100 100">
          <use href="#fl-lp" /><use href="#fl-lp" transform="rotate(60 50 50)" /><use href="#fl-lp" transform="rotate(120 50 50)" /><use href="#fl-lp" transform="rotate(180 50 50)" /><use href="#fl-lp" transform="rotate(240 50 50)" /><use href="#fl-lp" transform="rotate(300 50 50)" />
          <circle cx="50" cy="50" r="6" fill="var(--inv-accent)" /><circle cx="50" cy="50" r="2.4" fill="color-mix(in srgb, var(--inv-accent) 70%, var(--inv-text))" />
        </symbol>
        <symbol id="fl-rose" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="color-mix(in srgb, var(--inv-accent) 55%, var(--inv-text))" />
          <circle cx="50" cy="50" r="32" fill="var(--inv-accent)" />
          <path d="M50 20C74 24 80 50 60 62C44 72 28 56 40 44C48 34 62 40 57 49" fill="none" stroke="color-mix(in srgb, var(--inv-accent) 50%, var(--inv-text))" stroke-width="3.2" stroke-linecap="round" />
          <path d="M22 54C24 74 44 84 62 80" fill="none" stroke="var(--inv-surface)" stroke-width="2.4" opacity="0.7" />
          <circle cx="50" cy="50" r="11" fill="color-mix(in srgb, var(--inv-accent) 60%, var(--inv-text))" />
        </symbol>
        <symbol id="fl-leaf" viewBox="0 0 60 120">
          <path d="M30 118V6" stroke="color-mix(in srgb, var(--inv-accent) 75%, var(--inv-text))" stroke-width="2" />
          <g fill="color-mix(in srgb, var(--inv-accent) 65%, var(--inv-surface))">
            <ellipse cx="14" cy="30" rx="13" ry="5.5" transform="rotate(-35 14 30)" /><ellipse cx="46" cy="42" rx="13" ry="5.5" transform="rotate(35 46 42)" />
            <ellipse cx="14" cy="58" rx="13" ry="5.5" transform="rotate(-35 14 58)" /><ellipse cx="46" cy="70" rx="13" ry="5.5" transform="rotate(35 46 70)" />
            <ellipse cx="14" cy="86" rx="13" ry="5.5" transform="rotate(-35 14 86)" /><ellipse cx="46" cy="98" rx="13" ry="5.5" transform="rotate(35 46 98)" />
            <ellipse cx="30" cy="10" rx="5" ry="11" />
          </g>
        </symbol>
        <symbol id="fl-bud" viewBox="0 0 40 60">
          <path d="M20 58 C20 44, 20 32, 20 22" stroke="color-mix(in srgb, var(--inv-accent) 75%, var(--inv-text))" stroke-width="2" />
          <path d="M20 24C10 20 8 8 20 2C32 8 30 20 20 24Z" fill="var(--inv-accent)" />
          <path d="M20 24C15 21 14 13 20 9C26 13 25 21 20 24Z" fill="color-mix(in srgb, var(--inv-accent) 45%, var(--inv-surface))" />
        </symbol>
      </defs>
    </svg>
    <!-- TOP GARLAND (static) -->
    <div class="orn-floral-band orn-floral-band-top">
      <svg viewBox="0 0 400 60" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">
        <use href="#fl-leaf" x="18" y="2" width="26" height="52" opacity="0.8" />
        <use href="#fl-geo" x="52" y="6" width="48" height="48" />
        <use href="#fl-bud" x="104" y="14" width="22" height="34" />
        <use href="#fl-lily" x="128" y="8" width="44" height="44" />
        <use href="#fl-leaf" x="176" y="2" width="26" height="52" opacity="0.8" />
        <use href="#fl-rose" x="206" y="6" width="48" height="48" />
        <use href="#fl-bud" x="258" y="14" width="22" height="34" />
        <use href="#fl-geo" x="282" y="8" width="44" height="44" />
        <use href="#fl-leaf" x="330" y="2" width="26" height="52" opacity="0.8" />
        <use href="#fl-lily" x="356" y="10" width="40" height="40" />
      </svg>
    </div>
    <!-- BOTTOM GARLAND (static, mirrored) -->
    <div class="orn-floral-band orn-floral-band-bottom">
      <svg viewBox="0 0 400 60" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">
        <use href="#fl-leaf" x="18" y="2" width="26" height="52" opacity="0.8" />
        <use href="#fl-rose" x="52" y="6" width="48" height="48" />
        <use href="#fl-bud" x="104" y="14" width="22" height="34" />
        <use href="#fl-geo" x="128" y="8" width="44" height="44" />
        <use href="#fl-leaf" x="176" y="2" width="26" height="52" opacity="0.8" />
        <use href="#fl-lily" x="206" y="6" width="48" height="48" />
        <use href="#fl-bud" x="258" y="14" width="22" height="34" />
        <use href="#fl-rose" x="282" y="8" width="44" height="44" />
        <use href="#fl-leaf" x="330" y="2" width="26" height="52" opacity="0.8" />
        <use href="#fl-geo" x="356" y="10" width="40" height="40" />
      </svg>
    </div>
    <!-- CORNER CLUSTERS (sway) -->
    <div class="orn-floral" style="left: 0; top: 12%; width: 96px; animation-delay: 0.4s;">
      <svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
        <use href="#fl-leaf" x="20" y="10" width="60" height="180" />
        <use href="#fl-geo" x="6" y="0" width="46" height="46" />
        <use href="#fl-rose" x="54" y="54" width="38" height="38" />
        <use href="#fl-lily" x="12" y="100" width="36" height="36" />
        <use href="#fl-bud" x="60" y="110" width="24" height="36" />
      </svg>
    </div>
    <div class="orn-floral" style="right: 0; top: 26%; width: 88px; animation-delay: 1.5s; animation-duration: 7s;">
      <svg class="orn-floral-mirror" viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
        <use href="#fl-leaf" x="20" y="10" width="60" height="180" />
        <use href="#fl-lily" x="6" y="4" width="44" height="44" />
        <use href="#fl-geo" x="54" y="60" width="38" height="38" />
        <use href="#fl-rose" x="12" y="104" width="36" height="36" />
        <use href="#fl-bud" x="58" y="112" width="24" height="36" />
      </svg>
    </div>
    <div class="orn-floral" style="left: 0; bottom: 10%; width: 88px; animation-delay: 2.3s; animation-duration: 5.4s;">
      <svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
        <use href="#fl-leaf" x="25" y="5" width="50" height="140" />
        <use href="#fl-rose" x="8" y="8" width="42" height="42" />
        <use href="#fl-geo" x="52" y="66" width="40" height="40" />
      </svg>
    </div>
    <div class="orn-floral" style="right: 0; bottom: 16%; width: 88px; animation-delay: 0.9s; animation-duration: 6.6s;">
      <svg class="orn-floral-mirror" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
        <use href="#fl-leaf" x="25" y="5" width="50" height="140" />
        <use href="#fl-lily" x="8" y="8" width="42" height="42" />
        <use href="#fl-rose" x="52" y="66" width="40" height="40" />
      </svg>
    </div>
  </div>
</template>
