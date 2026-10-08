<script setup lang="ts">
import { gsap } from 'gsap'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { copy } from '@/config/copy'
import { prefersReducedMotion } from '@/composables/useAnimation'
import DecorLayer from './DecorLayer.vue'
import type { DecorKind, IntroKind } from '@/types'

const props = withDefaults(
  defineProps<{
    couple: string
    date: string
    guest: string
    image: string
    decor: DecorKind
    /** overlay = full-screen gate (public); static = plain block (builder / banner) */
    mode: 'overlay' | 'static'
    intro?: IntroKind
    /** Banner demo: plays the opening animation in a loop (static mode only) */
    loop?: boolean
    /** Banner only: pause the loop when false (e.g. card not hovered) */
    active?: boolean
    /** True for the real invitation cover (LCP image). */
    eager?: boolean
  }>(),
  { intro: 'slide', loop: false, active: true, eager: false },
)
const emit = defineEmits<{ open: [] }>()

const root = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const opening = ref(false)
const hidden = ref(false)
const folds = computed(() => (props.intro === 'curtain' ? 'repeating-linear-gradient(90deg, transparent 0 18px, rgba(0,0,0,.09) 18px 36px), ' : ''))
const panels = computed(() => !['slide', 'zoom'].includes(props.intro))
let loopTl: gsap.core.Timeline | undefined
let io: IntersectionObserver | undefined
let visible = true
const sync = () => (visible && props.active ? loopTl?.play() : loopTl?.pause())
watch(() => props.active, sync)

/** Builds the opening timeline for the chosen intro. `exit` = also remove the cover (public page). */
function build(tl: gsap.core.Timeline, exit: boolean) {
  const r = root.value!
  const q = (s: string) => r.querySelectorAll(s)
  tl.to(content.value, { opacity: 0, y: -24, scale: 0.97, duration: 0.6, ease: 'power2.in' })
  tl.to(q('.inv-decor > i'), { y: '-=60', opacity: 0, duration: 0.6, stagger: 0.02 }, '<')
  if (props.intro === 'door') {
    tl.to(q('.d-l'), { rotateY: -105, transformOrigin: 'left center', duration: 1.5, ease: 'power3.inOut' }, 0.3)
    tl.to(q('.d-r'), { rotateY: 105, transformOrigin: 'right center', duration: 1.5, ease: 'power3.inOut' }, 0.3)
    tl.to(q('.cover-img'), { scale: 1.12, duration: 1.8, ease: 'power2.out' }, 0.3)
  } else if (props.intro === 'curtain') {
    tl.to(q('.d-l'), { xPercent: -100, duration: 1.4, ease: 'power3.inOut' }, 0.3)
    tl.to(q('.d-r'), { xPercent: 100, duration: 1.4, ease: 'power3.inOut' }, 0.3)
  } else if (props.intro === 'envelope') {
    tl.to(q('.e-flap'), { rotateX: 180, transformOrigin: 'top center', duration: 0.9, ease: 'power2.inOut' }, 0.4)
    tl.to(q('.e-top'), { yPercent: -100, duration: 1.1, ease: 'power3.inOut' }, 1.3)
    tl.to(q('.e-bot'), { yPercent: 100, duration: 1.1, ease: 'power3.inOut' }, 1.3)
  } else if (props.intro === 'split') {
    tl.to(q('.s-line'), { opacity: 0, duration: 0.4 }, 0.3)
    tl.to(q('.s-t'), { yPercent: -100, duration: 1.3, ease: 'power4.inOut' }, 0.5)
    tl.to(q('.s-b'), { yPercent: 100, duration: 1.3, ease: 'power4.inOut' }, 0.5)
  } else if (props.intro === 'blossom') {
    tl.to(q('.f-p'), { scale: 3.6, rotate: '+=70', opacity: 0, duration: 1.5, ease: 'power2.in', stagger: 0.05 }, 0.3)
    tl.to(q('.f-c'), { scale: 14, opacity: 0, duration: 1.3, ease: 'power2.in' }, 0.3)
    tl.to(q('.veil'), { opacity: 0, duration: 1.1, ease: 'power1.inOut' }, 0.8)
  } else if (props.intro === 'bloom') {
    tl.to(q('.b-p'), { scale: 3.2, opacity: 0, duration: 1.5, ease: 'power2.in', stagger: 0.06 }, 0.3)
    tl.to(q('.veil'), { opacity: 0, duration: 1.1, ease: 'power1.inOut' }, 0.7)
  } else if (props.intro === 'gunungan') {
    tl.to(q('.g-leaf'), { scale: 5, opacity: 0, duration: 1.6, ease: 'power3.in' }, 0.3)
    tl.to(q('.veil'), { opacity: 0, duration: 1.1, ease: 'power1.inOut' }, 0.8)
  } else if (props.intro === 'iris') {
    tl.to(q('.veil'), { clipPath: 'circle(0% at 50% 50%)', duration: 1.6, ease: 'power3.inOut' }, 0.3)
  } else if (props.intro === 'zoom') {
    tl.to(q('.cover-img'), { scale: 1.6, duration: 1.6, ease: 'power2.in' }, 0.2)
  }
  if (exit) {
    if (props.intro === 'slide') tl.to(r, { yPercent: -100, duration: 0.9, ease: 'power3.inOut' }, '-=0.2')
    else tl.to(r, { opacity: 0, duration: 0.6, ease: 'power1.out' }, '-=0.1')
  }
}

let demoTl: gsap.core.Timeline | undefined
/** Builder preview: play the opening animation, then rewind it. */
function demo() {
  if (prefersReducedMotion() || !root.value || !content.value) return
  demoTl?.progress(0).kill()
  if (props.intro === 'split') gsap.fromTo(root.value.querySelectorAll('.ch'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 })
  const t = gsap.timeline({ onComplete: () => void gsap.delayedCall(0.9, () => void t.timeScale(1.8).reverse()) })
  demoTl = t
  build(t, false)
}
defineExpose({ demo })

function open() {
  if (opening.value) return
  opening.value = true
  emit('open') // the click is the user gesture needed to start music
  if (prefersReducedMotion() || !root.value || !content.value) {
    hidden.value = true
    return
  }
  const tl = gsap.timeline({ onComplete: () => (hidden.value = true) })
  build(tl, true)
}

onMounted(() => {
  // Minimal intro: couple name types in letter by letter.
  if (props.intro === 'split' && !prefersReducedMotion() && root.value) {
    gsap.from(root.value.querySelectorAll('.ch'), { opacity: 0, y: 18, duration: 0.8, stagger: 0.06, delay: 0.25, ease: 'power3.out' })
  }
})
onMounted(() => {
  if (!props.loop || prefersReducedMotion() || !root.value) return
  loopTl = gsap.timeline({ repeat: -1, repeatDelay: 1.4, delay: 1.2 })
  build(loopTl, false)
})
onMounted(() => {
  if (!props.loop || !root.value || !('IntersectionObserver' in window)) return
  // Performance: only animate the banner while it is on screen.
  io = new IntersectionObserver(([e]) => ((visible = !!e?.isIntersecting), sync()), { threshold: 0.1 })
  io.observe(root.value)
})
onBeforeUnmount(() => {
  loopTl?.kill()
  io?.disconnect()
})
</script>

<template>
  <section
    v-if="!hidden"
    ref="root"
    data-sec="cover"
    class="inv-cover relative isolate flex items-center justify-center overflow-hidden text-center"
    :class="mode === 'overlay' ? 'fixed inset-0 z-50 h-dvh overflow-y-auto py-10' : 'min-h-[34rem]'"
    :style="{ color: '#fff', perspective: '1400px' }"
  >
    <img :src="image" alt="" class="cover-img absolute inset-0 -z-20 size-full object-cover" decoding="async" :fetchpriority="eager ? 'high' : 'auto'" :loading="eager ? 'eager' : 'lazy'" />
    <div class="absolute inset-0 -z-10" :style="{ background: 'var(--inv-cover-overlay)' }" />
    <DecorLayer :kind="decor" />

    <template v-if="panels">
      <template v-if="intro === 'door' || intro === 'curtain'">
        <div class="d-l absolute inset-y-0 left-0 z-[5] w-1/2 overflow-hidden" :style="{ background: `${folds}linear-gradient(90deg, var(--inv-bg), var(--inv-surface))`, borderRight: '2px solid var(--inv-accent)', backfaceVisibility: 'hidden' }"><i v-if="intro === 'door'" class="sheen" /></div>
        <div class="d-r absolute inset-y-0 right-0 z-[5] w-1/2 overflow-hidden" :style="{ background: `${folds}linear-gradient(270deg, var(--inv-bg), var(--inv-surface))`, borderLeft: '2px solid var(--inv-accent)', backfaceVisibility: 'hidden' }"><i v-if="intro === 'door'" class="sheen" /></div>
      </template>
      <template v-else-if="intro === 'split'">
        <div class="s-t absolute inset-x-0 top-0 z-[5] h-1/2" :style="{ background: 'var(--inv-bg)' }" />
        <div class="s-b absolute inset-x-0 bottom-0 z-[5] h-1/2" :style="{ background: 'var(--inv-bg)' }" />
        <div class="s-line absolute inset-x-0 top-1/2 z-[6] h-px" :style="{ background: 'var(--inv-accent)' }" />
      </template>
      <template v-else-if="intro === 'blossom'">
        <div class="veil absolute inset-0 z-[4]" :style="{ background: 'radial-gradient(circle at 50% 50%, var(--inv-surface), var(--inv-bg))' }" />
        <div v-for="n in 5" :key="n" class="f-p absolute left-1/2 z-[5] h-[34vmin] w-[22vmin] -translate-x-1/2" :style="{ top: 'calc(50% - 34vmin)', transform: `translateX(-50%) rotate(${(n - 1) * 72}deg)`, transformOrigin: '50% 100%', background: 'linear-gradient(180deg, color-mix(in srgb, var(--inv-accent) 35%, var(--inv-surface)), var(--inv-accent))', borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%', willChange: 'transform, opacity' }" />
        <div class="f-c absolute left-1/2 top-1/2 z-[6] size-[7vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" :style="{ background: 'var(--inv-surface)', border: '2px solid var(--inv-accent)' }" />
      </template>
      <template v-else-if="intro === 'bloom'">
        <div class="veil absolute inset-0 z-[4]" :style="{ background: 'radial-gradient(circle at 50% 50%, var(--inv-surface), var(--inv-bg))' }" />
        <div v-for="n in 8" :key="n" class="b-p absolute left-1/2 top-1/2 z-[5] h-[17vmin] w-[34vmin]" :style="{ transform: `rotate(${(n - 1) * 45}deg)`, transformOrigin: '0 50%', background: n % 2 ? 'var(--inv-accent)' : 'color-mix(in srgb, var(--inv-accent) 55%, var(--inv-surface))', borderRadius: '0 100% 0 100% / 50% 100% 0 50%', willChange: 'transform, opacity' }" />
      </template>
      <template v-else-if="intro === 'gunungan'">
        <div class="veil absolute inset-0 z-[4]" :style="{ background: 'var(--inv-bg)' }" />
        <div class="g-leaf absolute left-1/2 top-1/2 z-[5] h-[78vmin] w-[54vmin] -translate-x-1/2 -translate-y-1/2" :style="{ clipPath: 'polygon(50% 0, 78% 28%, 100% 62%, 78% 100%, 22% 100%, 0 62%, 22% 28%)', background: 'linear-gradient(160deg, var(--inv-accent), color-mix(in srgb, var(--inv-accent) 40%, var(--inv-bg)))', willChange: 'transform, opacity' }" />
      </template>
      <template v-else-if="intro === 'iris'">
        <div class="veil absolute inset-0 z-[4]" :style="{ clipPath: 'circle(150% at 50% 50%)', background: 'radial-gradient(circle at 25% 25%, color-mix(in srgb, var(--inv-accent) 38%, transparent), transparent 55%), radial-gradient(circle at 75% 80%, color-mix(in srgb, var(--inv-border) 90%, transparent), transparent 55%), var(--inv-bg)', willChange: 'clip-path' }" />
      </template>
      <template v-else-if="intro === 'envelope'">
        <div class="e-top absolute inset-x-0 top-0 z-[5] h-1/2" :style="{ background: 'var(--inv-surface)', borderBottom: '1px solid var(--inv-border)' }" />
        <div class="e-bot absolute inset-x-0 bottom-0 z-[5] h-1/2" :style="{ background: 'var(--inv-surface)' }" />
        <div class="e-flap absolute inset-x-0 top-1/2 z-[6] h-1/3" :style="{ background: 'var(--inv-accent)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)', backfaceVisibility: 'hidden' }" />
      </template>
    </template>

    <div ref="content" class="relative z-10 w-full max-w-xl px-6">
      <p class="text-xs tracking-[0.35em]" style="opacity: 0.85">{{ copy.invitation.weddingOf }}</p>
      <h1 class="inv-heading mt-5 break-words text-4xl leading-tight sm:text-5xl lg:text-6xl">
        <template v-if="intro === 'split'"><span v-for="(c, i) in couple.split('')" :key="i" class="ch inline-block">{{ c === ' ' ? '\u00a0' : c }}</span></template>
        <template v-else>{{ couple }}</template>
      </h1>
      <p v-if="date" class="mt-4 text-sm tracking-widest" style="opacity: 0.9">{{ date }}</p>
      <div class="mx-auto my-8 h-px w-16 bg-white/60" />
      <p class="text-sm" style="opacity: 0.85">{{ copy.invitation.dear }}</p>
      <p class="inv-heading mt-1 break-words text-2xl">{{ guest }}</p>
      <button type="button" class="inv-btn mt-8" :disabled="mode === 'static'" @click="open">{{ copy.invitation.open }}</button>
    </div>
  </section>
</template>
