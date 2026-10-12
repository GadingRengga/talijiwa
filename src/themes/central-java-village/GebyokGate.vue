<script setup lang="ts">
import { gsap } from 'gsap'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/composables/useAnimation'
import { GEBYOK_OPENING, cjvAssets } from './assets'

/**
 * Theme-private gebyok show for central-java-village.
 * The opener card (names, guest, CTA) lives in the 30% content column; this
 * component is only the show: hidden until play(), then the tableau assembles
 * (mountain, monuments, floor, seat, lamp, frame), the camera dollies through
 * the gate opening, and the parent fades the cover to reveal the photo hero.
 */
const props = withDefaults(
  defineProps<{
    couple: string
    date: string
    guest: string
    mode: 'overlay' | 'static'
    interactive?: boolean
  }>(),
  { interactive: false },
)
const emit = defineEmits<{ open: []; finished: [] }>()

const root = ref<HTMLElement | null>(null)
const ready = ref(false)
const started = ref(false)
const reduced = prefersReducedMotion()

function onHidden() {
  root.value?.classList.toggle('cjv-paused', document.hidden)
}

function srcset(name: string): string {
  return cjvAssets[name]?.variants.map((v) => `${v.src} ${v.width}w`).join(', ') ?? ''
}
/** Largest variant — main tableau layers. */
function src(name: string): string {
  const a = cjvAssets[name]
  return a?.variants[0]?.src ?? ''
}
function dims(name: string): { width: number; height: number } {
  const a = cjvAssets[name]
  return { width: a?.width ?? 800, height: a?.height ?? 600 }
}
const interactive = computed(() => props.mode === 'overlay' || props.interactive)

// Brief preloader; the tableau preloads behind it without blocking.
onMounted(() => {
  window.setTimeout(() => {
    ready.value = true
  }, 350)
  if (props.mode === 'static' && !props.interactive) return
  for (const n of ['bg-village-mountain', 'gebyok-frame', 'hanging-lamp', 'clouds', 'monument-pair', 'pelaminan-seat', 'wedding-floor']) {
    const img = new Image()
    img.decoding = 'async'
    img.src = cjvAssets[n]?.variants[0]?.src ?? ''
  }
  document.addEventListener('visibilitychange', onHidden)
  onHidden()
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onHidden)
})

/** Opener CTA tap: assemble the tableau, dolly through, hand off. */
function play() {
  if (started.value || !ready.value) return
  started.value = true
  emit('open') // user gesture: the page starts music from here
  const r = root.value
  if (reduced || !r) return void emit('finished')
  const q = (s: string) => r.querySelector<HTMLElement>(s)
  const frame = q('.cjv-frame')!
  const box = r.getBoundingClientRect()
  const rect = frame.getBoundingClientRect()
  const openW = Math.max(1, rect.width * GEBYOK_OPENING.w)
  const openH = Math.max(1, rect.height * GEBYOK_OPENING.h)
  const S = Math.max(box.width / openW, box.height / openH) * 1.15
  // Dolly target: the measured walk-through center, not a hardcoded guess.
  const origin = `${((GEBYOK_OPENING.x + GEBYOK_OPENING.w / 2) * 100).toFixed(1)}% ${((GEBYOK_OPENING.y + GEBYOK_OPENING.h / 2) * 100).toFixed(1)}%`
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => emit('finished') })
  // Beat 1 (0–1.3s): the tableau assembles — scenery, floor, monuments,
  // seat, lamp drop, frame settles.
  tl.to(q('.cjv-tableau'), { autoAlpha: 1, duration: 0.4 }, 0)
  tl.fromTo(q('.cjv-bg'), { scale: 1.06 }, { scale: 1, duration: 1.3, ease: 'power2.out' }, 0)
  tl.fromTo(q('.cjv-floor'), { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.1)
  tl.fromTo(q('.cjv-monuments'), { y: 80, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.2)
  tl.fromTo(q('.cjv-seat'), { y: 100, scale: 0.92, autoAlpha: 0 }, { y: 0, scale: 1, duration: 0.8 }, 0.3)
  tl.fromTo(q('.cjv-lamp'), { y: -120, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, 0.4)
  tl.fromTo(
    frame,
    { scale: 1.06, autoAlpha: 0, transformOrigin: origin },
    { scale: 1, autoAlpha: 1, transformOrigin: origin, duration: 0.8 },
    0.45,
  )
  // Beat 2 (1.3–3.0s): slow push, then fast dolly through the opening with
  // parallax mid-layers + gold bloom handoff.
  tl.to(frame, { scale: 1.12, transformOrigin: origin, duration: 0.7, ease: 'power2.inOut' }, 1.3)
  tl.to(frame, { scale: S, transformOrigin: origin, duration: 1.1, ease: 'power3.in' }, 2.0)
  tl.to([q('.cjv-seat'), q('.cjv-monuments'), q('.cjv-floor')], { scale: 1.3, transformOrigin: '50% 70%', duration: 1.1, ease: 'power3.in' }, 2.0)
  tl.to(q('.cjv-lamp'), { yPercent: -130, duration: 0.8, ease: 'power2.in' }, 1.5)
  tl.fromTo(q('.cjv-bloom'), { autoAlpha: 0 }, { autoAlpha: 0.55, yoyo: true, repeat: 1, duration: 0.45 }, 2.3)
  tl.to([q('.cjv-tableau'), frame], { autoAlpha: 0, duration: 0.5, ease: 'power1.in' }, 2.5)
}

/** Builder replay: back to hidden. */
function reset() {
  started.value = false
  if (!root.value) return
  // Only GSAP-owned props: the static layout lives in style attributes and
  // class-based opacity (tableau starts hidden) and must survive the reset.
  gsap.set(root.value.querySelectorAll('.cjv-tableau, .cjv-bg, .cjv-floor, .cjv-monuments, .cjv-seat, .cjv-lamp, .cjv-frame, .cjv-clouds-l, .cjv-clouds-r, .cjv-bloom'), {
    clearProps: 'opacity,visibility,transform,filter',
  })
}
defineExpose({ play, reset })
</script>

<template>
  <!-- Invisible until the opener CTA starts the show; visibility:hidden also
       keeps it from swallowing taps meant for the hero/content behind it. -->
  <div ref="root" class="cjv-gate absolute inset-0 overflow-hidden" :class="{ 'pointer-events-none': !interactive, 'cjv-leaving': started, invisible: !started }">
    <div class="cjv-tableau absolute inset-0 opacity-0" aria-hidden="true">
      <div class="absolute inset-0" style="background: linear-gradient(180deg, #BFE0F0 0%, #EDE3C8 34%, #FBF4E3 60%)" />
      <img
        class="cjv-bg absolute inset-0 size-full"
        :src="src('bg-village-mountain')"
        :srcset="srcset('bg-village-mountain')"
        sizes="100vw"
        alt=""
        draggable="false"
        decoding="async"
        :width="dims('bg-village-mountain').width"
        :height="dims('bg-village-mountain').height"
        style="object-fit: cover; object-position: 50% 62%; pointer-events: none; user-select: none"
      />
      <img
        v-for="side in ['l', 'r']"
        :key="side"
        :class="`cjv-clouds cjv-clouds-${side} absolute inset-x-0 top-[5%] w-full`"
        :src="src('clouds')"
        :srcset="srcset('clouds')"
        sizes="100vw"
        alt=""
        draggable="false"
        decoding="async"
        :width="dims('clouds').width"
        :height="dims('clouds').height"
        style="pointer-events: none; user-select: none"
      />
      <img
        class="cjv-monuments absolute inset-x-0 bottom-[16%] mx-auto w-[min(88%,40rem)]"
        :src="src('monument-pair')"
        :srcset="srcset('monument-pair')"
        sizes="90vw"
        alt=""
        draggable="false"
        decoding="async"
        :width="dims('monument-pair').width"
        :height="dims('monument-pair').height"
        style="object-fit: contain; pointer-events: none; user-select: none"
      />
      <img
        class="cjv-floor absolute inset-x-0 bottom-0 h-[22%] w-full"
        :src="src('wedding-floor')"
        :srcset="srcset('wedding-floor')"
        sizes="100vw"
        alt=""
        draggable="false"
        decoding="async"
        :width="dims('wedding-floor').width"
        :height="dims('wedding-floor').height"
        style="object-fit: cover; object-position: 50% 100%; pointer-events: none; user-select: none"
      />
      <img
        class="cjv-seat absolute inset-x-0 bottom-[15%] mx-auto w-[min(58%,24rem)]"
        :src="src('pelaminan-seat')"
        :srcset="srcset('pelaminan-seat')"
        sizes="60vw"
        alt=""
        draggable="false"
        decoding="async"
        :width="dims('pelaminan-seat').width"
        :height="dims('pelaminan-seat').height"
        style="object-fit: contain; pointer-events: none; user-select: none"
      />
      <img
        class="cjv-lamp absolute left-1/2 top-[9%]"
        :src="src('hanging-lamp')"
        :srcset="srcset('hanging-lamp')"
        sizes="30vw"
        alt=""
        draggable="false"
        decoding="async"
        :width="dims('hanging-lamp').width"
        :height="dims('hanging-lamp').height"
        style="width: min(26%, 180px); transform: translateX(-50%); pointer-events: none; user-select: none"
      />
      <img
        class="cjv-frame absolute left-1/2 top-[3svh]"
        :src="src('gebyok-frame')"
        :srcset="srcset('gebyok-frame')"
        sizes="100vw"
        alt=""
        draggable="false"
        decoding="async"
        fetchpriority="high"
        :width="dims('gebyok-frame').width"
        :height="dims('gebyok-frame').height"
        style="width: min(94%, 34rem); max-height: 92svh; object-fit: contain; transform: translateX(-50%); pointer-events: none; user-select: none"
      />
      <div
        class="cjv-bloom absolute left-1/2 top-1/2 size-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
        style="background: radial-gradient(circle, rgba(235,213,155,.9), transparent 60%); pointer-events: none"
      />
    </div>

    <!-- preloader: brief, tableau preloads behind it without blocking -->
    <div v-if="!ready" class="absolute inset-0 z-10 grid place-items-center" style="background: #FBF4E3" role="status" aria-label="Memuat undangan">
      <div class="cjv-ring" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
.cjv-ring {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid rgba(201, 162, 74, 0.25);
  border-top-color: #c9a24a;
  animation: cjv-spin 1s linear infinite;
}
@keyframes cjv-spin {
  to {
    transform: rotate(360deg);
  }
}
/* idle loops: soft bg drift, cloud drift, lamp pendulum */
.cjv-bg {
  animation: cjv-kenburns 30s ease-in-out infinite alternate;
  will-change: transform;
}
@keyframes cjv-kenburns {
  from {
    transform: scale(1.02);
  }
  to {
    transform: scale(1.08);
  }
}
.cjv-clouds-l {
  animation: cjv-drift-l 90s linear infinite alternate;
}
.cjv-clouds-r {
  animation: cjv-drift-r 140s linear infinite alternate;
  opacity: 0.85;
}
@keyframes cjv-drift-l {
  from {
    transform: translateX(-6vw);
  }
  to {
    transform: translateX(6vw);
  }
}
@keyframes cjv-drift-r {
  from {
    transform: translateX(5vw);
  }
  to {
    transform: translateX(-5vw);
  }
}
.cjv-lamp {
  animation: cjv-pendulum 5.5s ease-in-out infinite alternate;
  transform-origin: top center;
}
@keyframes cjv-pendulum {
  from {
    rotate: -1.8deg;
  }
  to {
    rotate: 1.8deg;
  }
}
/* GSAP owns transforms during the sequence: kill the loops once started. */
.cjv-leaving .cjv-bg,
.cjv-leaving .cjv-clouds,
.cjv-leaving .cjv-lamp {
  animation: none;
}
.cjv-paused .cjv-bg,
.cjv-paused .cjv-clouds,
.cjv-paused .cjv-lamp {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .cjv-bg,
  .cjv-clouds,
  .cjv-lamp,
  .cjv-ring {
    animation: none;
  }
}
@media (min-aspect-ratio: 1/1) {
  .cjv-frame {
    width: auto !important;
    height: 88svh;
  }
}
</style>
