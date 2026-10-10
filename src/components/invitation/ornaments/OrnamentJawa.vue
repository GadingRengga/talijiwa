<script setup lang="ts">
// Adat Jawa ornament: detailed gunungan wayang watermark + batik kawung pattern.
// All SVG is inline (no HTTP requests), animations are transform/opacity only.
</script>

<template>
  <div class="orn" aria-hidden="true">
    <!-- BATIK KAWUNG BACKGROUND -->
    <div class="orn-batik-detailed">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="kawung-detail" width="60" height="60" patternUnits="userSpaceOnUse">
            <g transform="translate(30,30)" fill="none" stroke="var(--inv-accent)" stroke-width="1.1" opacity="0.7">
              <ellipse cx="0" cy="-14" rx="9" ry="16" />
              <ellipse cx="14" cy="0" rx="9" ry="16" transform="rotate(90)" />
              <ellipse cx="0" cy="14" rx="9" ry="16" />
              <ellipse cx="-14" cy="0" rx="9" ry="16" transform="rotate(90)" />
              <circle cx="0" cy="0" r="3.5" fill="var(--inv-accent)" stroke="none" opacity="0.5" />
            </g>
            <circle cx="0" cy="0" r="1.8" fill="var(--inv-accent)" opacity="0.35" />
            <circle cx="60" cy="0" r="1.8" fill="var(--inv-accent)" opacity="0.35" />
            <circle cx="0" cy="60" r="1.8" fill="var(--inv-accent)" opacity="0.35" />
            <circle cx="60" cy="60" r="1.8" fill="var(--inv-accent)" opacity="0.35" />
            <circle cx="21" cy="21" r="0.8" fill="var(--inv-accent)" opacity="0.25" />
            <circle cx="39" cy="21" r="0.8" fill="var(--inv-accent)" opacity="0.25" />
            <circle cx="21" cy="39" r="0.8" fill="var(--inv-accent)" opacity="0.25" />
            <circle cx="39" cy="39" r="0.8" fill="var(--inv-accent)" opacity="0.25" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#kawung-detail)" />
      </svg>
    </div>
    <!-- GUNUNGAN WAYANG -->
    <div class="orn-gunungan">
      <svg viewBox="0 0 400 700" xmlns="http://www.w3.org/2000/svg" fill="none">
        <!-- Outline utama -->
        <path class="orn-draw" pathLength="1" d="M200 8 C215 65,248 145,298 245 C332 320,354 400,358 468 C361 528,356 578,347 618 C337 654,322 674,302 690 L98 690 C78 674,63 654,53 618 C44 578,39 528,42 468 C46 400,68 320,102 245 C152 145,185 65,200 8Z" stroke="var(--inv-accent)" stroke-width="2.2" opacity="0.7" />
        <!-- Border dalam -->
        <path class="orn-draw orn-d2" pathLength="1" d="M200 28 C213 78,242 152,288 248 C320 320,340 395,344 460 C347 516,343 564,335 602 C326 634,313 654,296 668 L104 668 C87 654,74 634,65 602 C57 564,53 516,56 460 C60 395,80 320,112 248 C158 152,187 78,200 28Z" stroke="var(--inv-accent)" stroke-width="0.8" opacity="0.4" />
        <!-- Isen cecek -->
        <g fill="var(--inv-accent)" opacity="0.3">
          <circle v-for="n in 24" :key="'isen-'+n" :cx="200 + Math.cos((n/24)*Math.PI*2)*168" :cy="350 + Math.sin((n/24)*Math.PI*2)*320" r="1.2" />
        </g>
        <!-- Pohon Kehidupan: batang -->
        <path d="M198 560 L198 260" stroke="var(--inv-accent)" stroke-width="3.5" opacity="0.5" />
        <path d="M202 560 L202 260" stroke="var(--inv-accent)" stroke-width="1.5" opacity="0.3" />
        <path d="M196 500 L204 495 M196 460 L204 455 M196 420 L204 415 M196 380 L204 375 M196 340 L204 335" stroke="var(--inv-accent)" stroke-width="0.6" opacity="0.25" />
        <!-- Cabang -->
        <path d="M198 320 C170 310,140 290,118 265" stroke="var(--inv-accent)" stroke-width="2" opacity="0.45" />
        <path d="M198 390 C165 380,130 365,108 340" stroke="var(--inv-accent)" stroke-width="2" opacity="0.45" />
        <path d="M198 460 C170 455,145 445,125 425" stroke="var(--inv-accent)" stroke-width="1.8" opacity="0.4" />
        <path d="M202 320 C230 310,260 290,282 265" stroke="var(--inv-accent)" stroke-width="2" opacity="0.45" />
        <path d="M202 390 C235 380,270 365,292 340" stroke="var(--inv-accent)" stroke-width="2" opacity="0.45" />
        <path d="M202 460 C230 455,255 445,275 425" stroke="var(--inv-accent)" stroke-width="1.8" opacity="0.4" />
        <!-- Foliage -->
        <g opacity="0.4" fill="var(--inv-accent)">
          <ellipse v-for="(f,fi) in [[118,258],[108,333],[125,418],[140,280],[125,355],[145,438]]" :key="'lf'+fi" :cx="f[0]" :cy="f[1]" rx="10" ry="6" :transform="`rotate(${-20+fi*15} ${f[0]} ${f[1]})`" />
          <ellipse v-for="(f,fi) in [[282,258],[292,333],[275,418],[260,280],[275,355],[255,438]]" :key="'rf'+fi" :cx="f[0]" :cy="f[1]" rx="10" ry="6" :transform="`rotate(${20-fi*15} ${f[0]} ${f[1]})`" />
        </g>
        <!-- Buah -->
        <g fill="var(--inv-accent)" opacity="0.5">
          <circle cx="130" cy="270" r="3" /><circle cx="115" cy="345" r="2.5" /><circle cx="135" cy="428" r="2.5" />
          <circle cx="270" cy="270" r="3" /><circle cx="285" cy="345" r="2.5" /><circle cx="265" cy="428" r="2.5" />
        </g>
        <!-- Binatang: Harimau (kanan bawah) -->
        <g opacity="0.35" fill="var(--inv-accent)" transform="translate(265,470) scale(0.8)">
          <path d="M0,20 L2,12 L5,14 L8,8 L12,10 L15,5 L18,8 L22,6 L26,10 L30,8 L32,12 L34,10 L36,14 L35,18 L33,22 L30,24 L28,22 L25,26 L22,24 L18,28 L14,24 L10,26 L7,22 L4,24 Z" />
          <path d="M0,20 C-4,18 -6,14 -5,10" stroke="var(--inv-accent)" stroke-width="1.5" fill="none" />
        </g>
        <!-- Monyet (kiri tengah) -->
        <g opacity="0.3" fill="var(--inv-accent)" transform="translate(120,370) scale(0.7)">
          <circle cx="8" cy="4" r="5" /><ellipse cx="8" cy="16" rx="6" ry="9" />
          <path d="M4,22 L2,30 L5,30 L6,24" /><path d="M12,22 L14,30 L11,30 L10,24" />
          <path d="M2,14 C-2,10 -3,16 -1,20" stroke="var(--inv-accent)" stroke-width="1.2" fill="none" />
          <path d="M14,22 C20,20 22,14 20,10 C18,6 14,8 14,12" stroke="var(--inv-accent)" stroke-width="1.2" fill="none" />
        </g>
        <!-- Burung (kanan atas) -->
        <g opacity="0.35" fill="var(--inv-accent)" transform="translate(265,290) scale(0.6)">
          <ellipse cx="10" cy="10" rx="7" ry="4" /><circle cx="17" cy="8" r="3" />
          <path d="M3,10 C-5,4 -8,2 -10,0 M3,10 C-3,2 -5,0 -6,-3" stroke="var(--inv-accent)" stroke-width="1.5" fill="none" />
          <path d="M18,8 L22,7 L18,9" /><path d="M3,12 L-2,16" stroke="var(--inv-accent)" stroke-width="1" />
        </g>
        <!-- Ular Naga membelit batang -->
        <path d="M190 520 C185 500,195 480,210 470 C225 460,210 440,190 430 C170 420,185 400,205 395 C225 390,210 375,195 370" stroke="var(--inv-accent)" stroke-width="2.5" opacity="0.35" fill="none" stroke-linecap="round" />
        <g opacity="0.35" fill="var(--inv-accent)" transform="translate(192,365) scale(0.7)">
          <ellipse cx="4" cy="4" rx="6" ry="4" /><circle cx="9" cy="2" r="2" /><path d="M10,2 L14,0 L10,4" />
        </g>
        <!-- Pintu Gerbang -->
        <rect x="155" y="570" width="12" height="80" fill="var(--inv-accent)" opacity="0.3" rx="2" />
        <rect x="233" y="570" width="12" height="80" fill="var(--inv-accent)" opacity="0.3" rx="2" />
        <rect x="150" y="564" width="22" height="8" fill="var(--inv-accent)" opacity="0.35" rx="2" />
        <rect x="228" y="564" width="22" height="8" fill="var(--inv-accent)" opacity="0.35" rx="2" />
        <path d="M161 572 C161 548,185 535,200 535 C215 535,239 548,239 572" stroke="var(--inv-accent)" stroke-width="2.5" opacity="0.35" fill="none" />
        <rect x="170" y="585" width="26" height="55" fill="var(--inv-accent)" opacity="0.15" rx="1" />
        <rect x="204" y="585" width="26" height="55" fill="var(--inv-accent)" opacity="0.15" rx="1" />
        <path d="M183 585 L183 640 M217 585 L217 640 M170 612 L196 612 M204 612 L230 612" stroke="var(--inv-accent)" stroke-width="0.6" opacity="0.2" />
        <!-- Dwarapala kiri -->
        <g opacity="0.3" fill="var(--inv-accent)" transform="translate(128,575) scale(0.65)">
          <ellipse cx="15" cy="35" rx="10" ry="16" /><circle cx="15" cy="12" r="8" /><path d="M8,8 L15,0 L22,8" />
          <line x1="28" y1="10" x2="35" y2="40" stroke="var(--inv-accent)" stroke-width="3" /><circle cx="35" cy="42" r="4" />
          <rect x="8" y="48" width="6" height="18" rx="2" /><rect x="18" y="48" width="6" height="18" rx="2" />
        </g>
        <!-- Dwarapala kanan -->
        <g opacity="0.3" fill="var(--inv-accent)" transform="translate(272,575) scale(-0.65,0.65)">
          <ellipse cx="15" cy="35" rx="10" ry="16" /><circle cx="15" cy="12" r="8" /><path d="M8,8 L15,0 L22,8" />
          <line x1="28" y1="10" x2="35" y2="40" stroke="var(--inv-accent)" stroke-width="3" /><circle cx="35" cy="42" r="4" />
          <rect x="8" y="48" width="6" height="18" rx="2" /><rect x="18" y="48" width="6" height="18" rx="2" />
        </g>
        <!-- Base/plinth -->
        <rect x="95" y="668" width="210" height="14" fill="var(--inv-accent)" opacity="0.2" rx="2" />
        <g fill="var(--inv-accent)" opacity="0.25">
          <polygon v-for="n in 14" :key="'tt'+n" :points="`${100+(n-1)*15},682 ${107+(n-1)*15},674 ${114+(n-1)*15},682`" />
        </g>
        <g transform="translate(200,675)" opacity="0.35">
          <circle r="4" fill="var(--inv-accent)" />
          <ellipse v-for="n in 6" :key="'bf'+n" cx="0" cy="-7" rx="3" ry="5" :transform="`rotate(${n*60})`" fill="var(--inv-accent)" opacity="0.5" />
        </g>
        <!-- Floral fill -->
        <g fill="var(--inv-accent)" opacity="0.25">
          <g v-for="(fl,fi) in [[160,320],[240,320],[155,490],[245,490],[200,300],[175,550],[225,550],[140,440],[260,440],[200,650]]" :key="'fl'+fi" :transform="`translate(${fl[0]},${fl[1]})`">
            <circle r="2" />
            <ellipse v-for="n in 5" :key="n" cx="0" cy="-4" rx="1.8" ry="3" :transform="`rotate(${n*72})`" opacity="0.6" />
          </g>
        </g>
        <g fill="var(--inv-accent)" opacity="0.2">
          <ellipse v-for="(lf,li) in [[170,350,25],[230,350,-25],[165,520,30],[235,520,-30],[200,260,0],[148,465,35],[252,465,-35]]" :key="'lfl'+li" :cx="lf[0]" :cy="lf[1]" rx="6" ry="3" :transform="`rotate(${lf[2]} ${lf[0]} ${lf[1]})`" />
        </g>
      </svg>
    </div>
    <!-- CORNER ORNAMENTS — motif batik mini -->
    <svg v-for="c in ['tl','tr','bl','br']" :key="c" :class="['orn-corner', `orn-corner-${c}`]" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path class="orn-d" pathLength="1" d="M4 76 C4 40,12 20,30 12 C42 7,56 6,76 4" stroke="var(--inv-accent)" stroke-width="1.4" opacity="0.45" />
      <path class="orn-d" pathLength="1" d="M14 76 C14 46,20 28,34 20 C44 15,56 14,76 14" stroke="var(--inv-accent)" stroke-width="0.7" opacity="0.3" />
      <g transform="translate(28,28)" opacity="0.35" fill="var(--inv-accent)">
        <ellipse cx="0" cy="-5" rx="3" ry="5.5" /><ellipse cx="5" cy="0" rx="3" ry="5.5" transform="rotate(90)" />
        <ellipse cx="0" cy="5" rx="3" ry="5.5" /><ellipse cx="-5" cy="0" rx="3" ry="5.5" transform="rotate(90)" />
        <circle r="1.5" />
      </g>
      <circle cx="20" cy="55" r="1.5" fill="var(--inv-accent)" opacity="0.3" />
      <circle cx="55" cy="20" r="1.5" fill="var(--inv-accent)" opacity="0.3" />
    </svg>
  </div>
</template>
