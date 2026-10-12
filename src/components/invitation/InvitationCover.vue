<script setup lang="ts">
import { gsap } from 'gsap'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { copy } from '@/config/copy'
import { prefersReducedMotion } from '@/composables/useAnimation'
import DecorLayer from './DecorLayer.vue'
// Lazy: keeps three.js out of the initial invitation chunk so cover text +
// photo paint first; the gate mounts only in overlay/interactive mode anyway.
let gateRetries = 0
const gateFailed = ref(false)
const Gate3D = defineAsyncComponent({
  loader: () => import('./Gate3D.vue'),
  timeout: 20000,
  onError(_err, retry, fail) {
    // Flaky network: one retry, then fall back to the title tableau (same as
    // no-WebGL) instead of stranding the guest on an unopenable gate.
    if (gateRetries < 1 && !gateFailed.value) {
      gateRetries += 1
      retry()
    } else {
      gateFailed.value = true
      pendingPlay = false
      onGateSkipped()
      fail()
    }
  },
})
import type { DecorKind, IntroKind, OrnamentKind } from '@/types'

// Theme-private gate (central-java-village only): loaded on demand so other
// themes never pay for its artwork chunk.
const GebyokGate = defineAsyncComponent(() => import('@/themes/central-java-village/GebyokGate.vue'))

const props = withDefaults(
  defineProps<{
    couple: string
    date: string
    guest: string
    image: string
    decor: DecorKind
    /** Theme signature ornament shown over the cover (frame/title phases). */
    ornament?: OrnamentKind
    /** overlay = full-screen gate (public); static = plain block (builder / banner) */
    mode: 'overlay' | 'static'
    intro?: IntroKind
    /** Banner demo: plays the opening animation in a loop (static mode only) */
    loop?: boolean
    /** Banner only: pause the loop when false (e.g. card not hovered) */
    active?: boolean
    /** True for the real invitation cover (LCP image). */
    eager?: boolean
    /** Builder Uji mode: play the full release flow inside the preview. */
    interactive?: boolean
  }>(),
  { intro: 'slide', loop: false, active: true, eager: false, interactive: false },
)
const emit = defineEmits<{ open: []; closed: [] }>()

const root = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const opening = ref(false)
const hidden = ref(false)
/** Cover acts: gate3d 'cover' → 'gate' → 'frame' → 'title' → dismissed.
 *  Flora/gunungan acts: 'gate' → 'title' → dismissed. */
const phase = ref<'cover' | 'gate' | 'frame' | 'title'>('title')
const gate3dRef = ref<{ play: () => void } | null>(null)
const gebyokRef = ref<{ play: () => void; reset: () => void } | null>(null)
const gebyokDone = ref(false)
let touchY: number | null = null
let emitted = false
let plunging = false
/** Tap arrived before the lazy 3D chunk loaded: play as soon as it mounts. */
let pendingPlay = false
/** True once the garden canvas covers the photo poster (first paint guard). */
const gateReady = ref(false)
watch(gate3dRef, (g) => {
  if (!g) return
  gateReady.value = true
  // Hide the poster photo only now that scenery covers it.
  if (phase.value === 'gate' && root.value) gsap.set(root.value.querySelector('.cover-img'), { opacity: 0, scale: 1.15 })
  if (pendingPlay) {
    pendingPlay = false
    g.play()
  }
})
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
  if (props.intro !== 'flora' && props.intro !== 'gate3d') {
    tl.to(content.value, { opacity: 0, y: -24, scale: 0.97, duration: 0.6, ease: 'power2.in' })
    tl.to(q('.inv-decor > i'), { y: '-=60', opacity: 0, duration: 0.6, stagger: 0.02 }, '<')
  }
  if (props.intro === 'door') {
    tl.to(q('.d-l'), { rotateY: -105, transformOrigin: 'left center', duration: 1.5, ease: 'power3.inOut' }, 0.3)
    tl.to(q('.d-r'), { rotateY: 105, transformOrigin: 'right center', duration: 1.5, ease: 'power3.inOut' }, 0.3)
    tl.to(q('.cover-img'), { scale: 1.12, duration: 1.8, ease: 'power2.out' }, 0.3)
  } else if (props.intro === 'curtain') {
    tl.to(q('.d-l'), { xPercent: -100, duration: 1.4, ease: 'power3.inOut' }, 0.3)
    tl.to(q('.d-r'), { xPercent: 100, duration: 1.4, ease: 'power3.inOut' }, 0.3)
  } else if (props.intro === 'envelope') {
    tl.to(q('.e-flap'), { rotateX: 180, transformOrigin: 'top center', duration: 0.9, ease: 'power2.inOut' }, 0.4)
    tl.to(q('.e-top'), { yPercent: -100, rotateX: 8, transformOrigin: 'bottom center', duration: 1.1, ease: 'power3.inOut' }, 1.3)
    tl.to(q('.e-bot'), { yPercent: 100, rotateX: -8, transformOrigin: 'top center', duration: 1.1, ease: 'power3.inOut' }, 1.3)
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
  } else if (props.intro === 'iris') {
    tl.to(q('.veil'), { clipPath: 'circle(0% at 50% 50%)', duration: 1.6, ease: 'power3.inOut' }, 0.3)
  } else if (props.intro === 'zoom') {
    tl.to(q('.cover-img'), { scale: 1.6, duration: 1.6, ease: 'power2.in' }, 0.2)
  } else if (props.intro === 'flip') {
    tl.to(q('.flip-veil'), { rotateY: 180, duration: 1.5, ease: 'power3.inOut' }, 0.3)
    tl.to(q('.cover-img'), { scale: 1.08, duration: 1.8, ease: 'power2.out' }, 0.3)
  } else if (props.intro === 'cube') {
    tl.to(q('.cube-veil'), { rotateY: -90, transformOrigin: 'left center', duration: 1.6, ease: 'power3.inOut' }, 0.3)
    tl.to(q('.cover-img'), { scale: 1.12, x: 40, duration: 1.8, ease: 'power2.out' }, 0.3)
  } else if (props.intro === 'flora' || props.intro === 'gunungan') {
    // Three beats: art gate (flower frame / gunungan) → uploaded photo
    // fullscreen → staggered title.
    const p = props.intro === 'gunungan' ? 'gn' : 'fl'
    tl.to(q(`.${p}-gate`), { scale: 1.45, rotate: 1.5, opacity: 0, duration: 1.6, ease: 'power2.in' }, 0.2)
    tl.to(q(`.${p}-flash`), { opacity: 0.9, duration: 0.5, ease: 'power1.in' }, 0.5)
    tl.to(q(`.${p}-flash`), { opacity: 0, duration: 0.7, ease: 'power1.out' }, 1.0)
    tl.to(q(`.${p}-veil`), { opacity: 0, duration: 0.9, ease: 'power1.inOut' }, 0.6)
    tl.to(q('.cover-img'), { opacity: 1, scale: 1.06, duration: 1.6, ease: 'power2.out' }, 0.5)
    tl.to(q('.cover-img'), { scale: 1.12, duration: 2.4, ease: 'none' }, 2.1)
    if (content.value) tl.fromTo(Array.from(content.value.children), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09 }, 2.0)
  }
  if (exit) {
    if (props.intro === 'slide') tl.to(r, { yPercent: -100, duration: 0.9, ease: 'power3.inOut' }, '-=0.2')
    else tl.to(r, { opacity: 0, duration: 0.6, ease: 'power1.out' }, '-=0.1')
  }
}

let demoTl: gsap.core.Timeline | undefined
/** Back to the art-gate opening tableau (flora / gunungan; replay + Uji). */
function resetArtGate() {
  if (!root.value || !content.value) return
  hidden.value = false
  phase.value = 'gate'
  const p = props.intro === 'gunungan' ? 'gn' : 'fl'
  // Rewind the gate to its opening tableau before replaying the plunge.
  gsap.set(root.value.querySelector('.cover-img'), { opacity: 0, scale: 1.15 })
  gsap.set(content.value, { opacity: 1, y: 0 })
  gsap.set(content.value.children, { opacity: 0, y: 26 })
  gsap.set(root.value.querySelector(`.${p}-gate`), { opacity: 1, scale: 1, rotate: 0 })
  gsap.set(root.value.querySelector(`.${p}-flash`), { opacity: 0 })
  gsap.set(root.value.querySelector(`.${p}-veil`), { opacity: 1 })
}
/** Builder preview: play the opening animation, then rewind it. */
function demo() {
  hidden.value = false
  if (prefersReducedMotion() || !root.value || !content.value) return
  demoTl?.progress(0).kill()
  if (props.intro === 'gebyok') {
    gebyokRef.value?.reset()
    return
  }
  if (props.intro === 'gate3d') {
    // Full reset: replay always restarts from the cover tableau.
    resetToGate()
    if (props.mode === 'static' && !props.interactive) {
      phase.value = 'title'
      if (root.value) gsap.set(root.value.querySelector('.cover-img'), { opacity: 1, scale: 1 })
      if (content.value) gsap.set([content.value, ...Array.from(content.value.children)], { opacity: 1, y: 0 })
    }
    return
  }
  if (props.intro === 'flora' || props.intro === 'gunungan') resetArtGate()
  if (props.intro === 'split') gsap.fromTo(root.value.querySelectorAll('.ch'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 })
  // Static preview (builder) ends on the visible title tableau; only the
  // looping banner rewinds. Without this the replay leaves a blank cover:
  // photo+content end at opacity 0 while the gate stays display:none.
  const rewind = (props.intro !== 'flora' && props.intro !== 'gunungan') || props.loop
  const t = gsap.timeline({ onComplete: () => rewind && void gsap.delayedCall(0.9, () => void t.timeScale(1.8).reverse()) })
  demoTl = t
  build(t, false)
}
/** External trigger (e.g. the opener card in the content column). */
function playGate() {
  open()
}
defineExpose({ demo, playGate })

function open() {
  if (props.intro === 'gebyok') {
    // The gate owns its timeline; the cover just forwards music + dismissal.
    gebyokRef.value?.play()
    return
  }
  if (props.intro === 'flora' || props.intro === 'gunungan') {
    if (!emitted) {
      emitted = true
      emit('open') // first tap is the user gesture needed to start music
    }
    if (phase.value === 'gate' && !plunging) advance()
    else if (phase.value === 'title') dismiss()
    return
  }
  if (props.intro === 'gate3d') {
    if (!emitted) {
      emitted = true
      emit('open') // first tap is the user gesture needed to start music
    }
    if (phase.value === 'cover') {
      // First tap: launch Gate3D. The poster photo stays until the garden
      // canvas actually paints (gateReady watcher hides it then) — no flash.
      phase.value = 'gate'
      if (gate3dRef.value) gate3dRef.value.play()
      else pendingPlay = true
    }
    else if (phase.value === 'gate') {
      if (gate3dRef.value) gate3dRef.value.play()
      else pendingPlay = true
    }
    else if (phase.value === 'frame') toTitle()
    else dismiss()
    return
  }
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

/** Gebyok act 1: the CTA tap is the user gesture that starts music. */
function onGebyokOpen() {
  if (!emitted) {
    emitted = true
    emit('open')
  }
}

/** Gebyok act 2: the dolly finished — fade the whole cover out.
 *  Opacity-only, so it stays gentle under prefers-reduced-motion too. */
function onGebyokFinished() {
  if (gebyokDone.value) return
  gebyokDone.value = true
  if (!root.value) {
    hidden.value = true
    emit('closed')
    return
  }
  gsap.to(root.value, { opacity: 0, duration: 0.5, ease: 'power1.out', onComplete: () => ((hidden.value = true), emit('closed')) })
}

/** Flora act 2: plunge through the gate, reveal photo + title. */
function advance() {
  if (phase.value !== 'gate' || !root.value || !content.value) return
  if (prefersReducedMotion()) {
    phase.value = 'title'
    return
  }
  plunging = true
  const tl = gsap.timeline({ onComplete: () => ((phase.value = 'title'), (plunging = false)) })
  build(tl, false)
}

/** Flora act 3: swipe/button dismisses the cover. */
let dismissing = false
function dismiss() {
  if (phase.value !== 'title' || !root.value || dismissing) return
  // Builder edit (static, not interactive): loop back to gate for repeated preview.
  // Uji staging (static + interactive) or public (overlay): dismiss permanently.
  if (props.mode !== 'overlay' && !props.interactive) {
    resetToGate()
    return
  }
  if (prefersReducedMotion() || !content.value) {
    hidden.value = true
    emit('closed')
    return
  }
  dismissing = true
  titleTl?.kill()
  const tl = gsap.timeline({ onComplete: () => ((hidden.value = true), emit('closed')) })
  tl.to(content.value, { opacity: 0, y: -24, duration: 0.5, ease: 'power2.in' })
  tl.to(root.value, { yPercent: -100, duration: 0.9, ease: 'power3.inOut' }, '-=0.1')
}

/** Gate3D beat 2: dolly finished — canvas fades under a peaking flash, then
    the name frame appears. Canvas fades itself (not just unmounts) so no
    garden/path frame can linger; unmounting at the peak hides the hard cut. */
function onGateDone() {
  if (phase.value !== 'gate' || !root.value) return
  const tl = gsap.timeline()
  tl.to(root.value.querySelector('.gate3d-host'), { opacity: 0, duration: 0.4, ease: 'power1.in' }, 0)
  tl.to(root.value.querySelector('.g3-flash'), { opacity: 1, duration: 0.4, ease: 'power1.in' }, 0)
  tl.add(() => (phase.value = 'frame'))
  tl.to(root.value.querySelector('.g3-flash'), { opacity: 0, duration: 0.8, ease: 'power1.out' })
  tl.add(() => {
    const card = root.value?.querySelector('.g3-card')
    if (card) gsap.fromTo(card, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
  })
}

/** Gate3D flash point: start fading the cover photo in beneath the canvas. */
function onGateOpened() {
  const photo = root.value?.querySelector('.cover-img')
  if (photo) gsap.to(photo, { opacity: 1, scale: 1.06, duration: 1.4, ease: 'power2.out' })
}

/** Gate3D unavailable (no WebGL): fall back to the title tableau. */
function onGateSkipped() {
  phase.value = 'title'
  if (root.value) gsap.set(root.value.querySelector('.cover-img'), { opacity: 1, scale: 1 })
  if (content.value) gsap.set([content.value, ...Array.from(content.value.children)], { opacity: 1, y: 0 })
}

/** Gate3D beat 3: frame card → photo + full title. Photo is already faded in
    from the dolly, so keep it visible (fromTo would blink it out and back).
    Card fades first so the cut to the title tableau is soft. */
let titleTl: gsap.core.Timeline | undefined
function toTitle() {
  if (phase.value !== 'frame' || !root.value || !content.value || titleTl) return
  titleTl = gsap.timeline()
  const card = root.value.querySelector('.g3-card')
  if (card) titleTl.to(card, { opacity: 0, duration: 0.25, ease: 'power1.out' })
  titleTl.add(() => (phase.value = 'title'))
  const photo = root.value.querySelector('.cover-img')
  if (photo) titleTl.to(photo, { opacity: 1, scale: 1.06, duration: 1.2, ease: 'power2.out' }, '<')
  titleTl.fromTo(Array.from(content.value.children), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09 }, '<+=0.15')
}

/** Back to the opening tableau (Uji loop + replay reset). */
function resetToGate() {
  if (!root.value || !content.value) return
  hidden.value = false
  phase.value = 'cover'
  pendingPlay = false
  dismissing = false
  titleTl?.kill()
  titleTl = undefined
  gsap.set(root.value.querySelector('.cover-img'), { opacity: 1, scale: 1 })
  gsap.set(root.value.querySelector('.g3-flash'), { opacity: 0 })
  gsap.set(content.value, { opacity: 1, y: 0 })
  gsap.set(Array.from(content.value.children), { opacity: 1, y: 0 })
}

/** Uji toggle in preview: ON restarts from cover, OFF settles on the tableau. */
watch(
  () => props.interactive,
  (uji) => {
    if (props.mode !== 'static' || (props.intro !== 'gate3d' && props.intro !== 'flora' && props.intro !== 'gunungan') || !root.value || !content.value) return
    if (uji && !prefersReducedMotion()) {
      if (props.intro === 'flora' || props.intro === 'gunungan') resetArtGate()
      else resetToGate()
    }
    else {
      hidden.value = false
      phase.value = 'title'
      pendingPlay = false
      gsap.set(root.value.querySelector('.g3-flash'), { opacity: 0 })
      gsap.set(root.value.querySelector('.cover-img'), { opacity: 1, scale: 1 })
      gsap.set([content.value, ...Array.from(content.value.children)], { opacity: 1, y: 0 })
    }
  },
)

function onCoverTouchStart(e: TouchEvent) {
  touchY = e.touches[0]?.clientY ?? null
}

function onCoverTouchEnd(e: TouchEvent) {
  if (props.intro !== 'flora' && props.intro !== 'gunungan' && props.intro !== 'gate3d' && props.intro !== 'gebyok') {
    touchY = null
    return
  }
  const endY = e.changedTouches[0]?.clientY ?? touchY
  const startY = touchY
  touchY = null
  if (props.mode !== 'overlay' || startY == null || endY == null) return
  if (endY - startY < -60) {
    if (props.intro === 'gebyok') {
      if (!gebyokDone.value) open()
      return
    }
    if (phase.value === 'title') dismiss()
    else if (phase.value === 'frame' && props.intro === 'gate3d') toTitle()
    else if (phase.value === 'gate' && (props.intro === 'flora' || props.intro === 'gunungan') && !plunging) advance()
    else if (phase.value === 'cover' && props.intro === 'gate3d') open()
  }
}

onMounted(() => {
  if ((props.intro !== 'flora' && props.intro !== 'gunungan' && props.intro !== 'gate3d') || prefersReducedMotion() || !root.value || !content.value) return
  if (props.mode === 'static' && !props.interactive) {
    // Builder edit mode & banner: show the title tableau directly (editable at a glance, no GPU cost).
    phase.value = 'title'
    return
  }
  if (props.intro === 'gate3d') {
    // Start on the cover photo tableau; Gate3D mounts only after first tap.
    phase.value = 'cover'
    gsap.set(root.value.querySelector('.cover-img'), { opacity: 1, scale: 1 })
    gsap.set(content.value, { opacity: 1, y: 0 })
    gsap.set(Array.from(content.value.children), { opacity: 1, y: 0 })
    return
  }
  phase.value = 'gate'
  // Poster photo stays visible until the garden canvas mounts (cold cache);
  // the gateReady watcher hides it then. Content starts hidden regardless.
  gsap.set(content.value, { opacity: 1, y: 0 })
  gsap.set(content.value.children, { opacity: 0, y: 26 })
})
onMounted(() => {
  // Minimal intro: couple name types in letter by letter.
  if (props.intro === 'split' && !prefersReducedMotion() && root.value) {
    gsap.from(root.value.querySelectorAll('.ch'), { opacity: 0, y: 18, duration: 0.8, stagger: 0.06, delay: 0.25, ease: 'power3.out' })
  }
})
onMounted(() => {
  if (!props.loop || props.intro === 'gate3d' || props.intro === 'gebyok' || prefersReducedMotion() || !root.value) return
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
    @touchstart="onCoverTouchStart"
    @touchend="onCoverTouchEnd"
  >
    <img :src="image" alt="" class="cover-img absolute inset-0 -z-20 size-full object-cover" decoding="async" :fetchpriority="eager ? 'high' : 'auto'" :loading="eager ? 'eager' : 'lazy'" />
    <div class="absolute inset-0 -z-10" :style="{ background: 'var(--inv-cover-overlay)' }" />
    <DecorLayer :kind="decor" />
    <!-- Ornament slots are intentionally empty until the first new theme lands. -->

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
        <div class="gn-veil absolute inset-0 z-[4]" :style="{ background: 'var(--inv-bg)' }" />
        <div
          class="gn-gate absolute inset-0 z-[5]"
          :class="[{ hidden: phase === 'title' }, mode === 'overlay' ? 'cursor-pointer' : '']"
          @click="mode === 'overlay' && open()"
        >
          <div class="gn-glow absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" :style="{ background: 'radial-gradient(circle, color-mix(in srgb, var(--inv-accent) 30%, transparent), transparent 65%)' }" />
          <div class="gn-flash absolute inset-0" :style="{ background: 'radial-gradient(circle at 50% 50%, rgba(255,250,240,.95), transparent 60%)', opacity: 0 }" />
          <p class="absolute inset-x-0 bottom-30 z-[6] text-center text-xs tracking-[0.25em]" style="color: var(--inv-text)">{{ copy.invitation.tapToOpen }}</p>
        </div>
      </template>
      <template v-else-if="intro === 'iris'">
        <div class="veil absolute inset-0 z-[4]" :style="{ clipPath: 'circle(150% at 50% 50%)', background: 'radial-gradient(circle at 25% 25%, color-mix(in srgb, var(--inv-accent) 38%, transparent), transparent 55%), radial-gradient(circle at 75% 80%, color-mix(in srgb, var(--inv-border) 90%, transparent), transparent 55%), var(--inv-bg)', willChange: 'clip-path' }" />
      </template>
      <template v-else-if="intro === 'envelope'">
        <div class="e-top absolute inset-x-0 top-0 z-[5] h-1/2" :style="{ background: 'var(--inv-surface)', borderBottom: '1px solid var(--inv-border)' }" />
        <div class="e-bot absolute inset-x-0 bottom-0 z-[5] h-1/2" :style="{ background: 'var(--inv-surface)' }" />
        <div class="e-flap absolute inset-x-0 top-1/2 z-[6] h-1/3" :style="{ background: 'var(--inv-accent)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)', backfaceVisibility: 'hidden' }" />
      </template>
      <template v-else-if="intro === 'flip'">
        <div class="veil flip-veil absolute inset-0 z-[4]" :style="{ background: 'var(--inv-surface)', backfaceVisibility: 'hidden', willChange: 'transform' }" />
        <div class="absolute inset-0 z-[5] pointer-events-none" :style="{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--inv-accent) 8%, transparent), transparent 40%, color-mix(in srgb, var(--inv-accent) 5%, transparent))' }" />
      </template>
      <template v-else-if="intro === 'cube'">
        <div class="veil cube-veil absolute inset-0 z-[4]" :style="{ background: 'var(--inv-surface)', willChange: 'transform' }" />
        <div class="absolute inset-0 z-[5] pointer-events-none" :style="{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--inv-border) 40%, transparent), transparent 30%)' }" />
      </template>
      <template v-else-if="intro === 'flora'">
        <div class="fl-veil absolute inset-0 z-[4]" :style="{ background: 'var(--inv-bg)' }" />
        <div
          class="fl-gate absolute inset-0 z-[5]"
          :class="[{ hidden: phase === 'title' }, mode === 'overlay' ? 'cursor-pointer' : '']"
          @click="mode === 'overlay' && open()"
        >
          <div class="fl-glow absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" :style="{ background: 'radial-gradient(circle, color-mix(in srgb, var(--inv-accent) 30%, transparent), transparent 65%)' }" />
          <div class="fl-flash absolute inset-0" :style="{ background: 'radial-gradient(circle at 50% 50%, rgba(255,250,240,.95), transparent 60%)', opacity: 0 }" />
          <p class="absolute inset-x-0 bottom-30 z-[6] text-center text-xs tracking-[0.25em]" style="color: var(--inv-text)">{{ copy.invitation.tapToOpen }}</p>
        </div>
      </template>
      <template v-else-if="intro === 'gate3d'">
        <Gate3D
          v-if="(mode === 'overlay' || (mode === 'static' && interactive)) && phase === 'gate' && !gateFailed"
          ref="gate3dRef"
          class="absolute inset-0 z-[4]"
          @opened="onGateOpened"
          @done="onGateDone"
          @skipped="onGateSkipped"
        />
        <!-- Cover phase: full-screen tap target over the cover photo -->
        <div v-if="(mode === 'overlay' || interactive) && phase === 'cover'" class="absolute inset-0 z-[7] cursor-pointer" @click="open()">
          <p class="absolute inset-x-0 bottom-30 text-center text-xs tracking-[0.25em]" style="color: rgba(255,255,255,0.85); text-shadow: 0 0 14px rgba(0,0,0,0.5)">{{ copy.invitation.tapToOpen }}</p>
        </div>
        <!-- Gate phase: tap to start/continue the 3D sequence -->
        <div v-if="(mode === 'overlay' || interactive) && phase === 'gate'" class="absolute inset-0 z-[7] cursor-pointer" @click="open()">
          <p class="absolute inset-x-0 bottom-30 text-center text-xs tracking-[0.25em]" style="color: var(--inv-text); text-shadow: 0 0 14px var(--inv-surface), 0 0 6px var(--inv-surface)">{{ copy.invitation.tapToOpen }}</p>
        </div>
        <div v-if="phase === 'frame'" class="absolute inset-0 z-[6] grid cursor-pointer place-items-center px-6" @click="toTitle">
          <div class="inv-card g3-card w-full max-w-sm p-8 text-center" style="color: var(--inv-text)">
            <p class="text-xs tracking-[0.3em]" style="opacity: 0.85">{{ copy.invitation.weddingOf }}</p>
            <h2 class="inv-heading mt-4 break-words text-4xl" style="color: var(--inv-text)">{{ couple }}</h2>
            <p v-if="date" class="mt-3 text-sm tracking-widest" style="opacity: 0.9">{{ date }}</p>
            <div class="inv-divider" />
            <button type="button" class="inv-btn mt-2" @click="toTitle">{{ copy.invitation.viewPhoto }}</button>
          </div>
        </div>
        <div class="g3-flash pointer-events-none absolute inset-0 z-[8]" :style="{ background: 'var(--inv-surface)', opacity: 0 }" />
      </template>
      <template v-else-if="intro === 'gebyok'">
        <GebyokGate
          ref="gebyokRef"
          class="absolute inset-0 z-[4]"
          :couple="couple"
          :date="date"
          :guest="guest"
          :mode="mode"
          :interactive="interactive"
          @open="onGebyokOpen"
          @finished="onGebyokFinished"
        />
      </template>
    </template>

    <!-- Content: visible on cover + title phases; hidden during gate/frame sequence.
         The gebyok gate brings its own card, so the generic content stays off. -->
    <div v-show="(intro !== 'gate3d' || phase === 'cover' || phase === 'title') && intro !== 'gebyok'" ref="content" class="relative z-10 w-full max-w-[34rem] px-6" :style="{ background: 'radial-gradient(ellipse 110% 95% at 50% 40%, color-mix(in srgb, var(--inv-text) 60%, transparent), transparent 70%)' }">
      <p class="text-xs tracking-[0.3em]" style="opacity: 0.85">{{ copy.invitation.weddingOf }}</p>
      <h1 class="inv-heading mt-4 break-words text-4xl leading-tight @sm:text-5xl @lg:text-6xl">
        <template v-if="intro === 'split'"><span v-for="(c, i) in couple.split('')" :key="i" class="ch inline-block">{{ c === ' ' ? '\u00a0' : c }}</span></template>
        <template v-else>{{ couple }}</template>
      </h1>
      <p v-if="date" class="mt-4 text-sm tracking-widest" style="opacity: 0.9">{{ date }}</p>
      <div class="inv-divider" style="background: rgba(255,255,255,.6)" />
      <p class="text-sm" style="opacity: 0.85">{{ copy.invitation.dear }}</p>
      <p class="inv-heading mt-1 break-words text-2xl">{{ guest }}</p>
      <div v-if="intro === 'flora' || intro === 'gunungan' || intro === 'gate3d'" class="mt-6">
        <svg class="fl-chev mx-auto" width="28" height="18" viewBox="0 0 28 18" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M2 16L14 3l12 13" /></svg>
        <p class="mt-2 text-xs tracking-[0.25em]" style="opacity: 0.85">{{ copy.invitation.swipeUp }}</p>
      </div>
      <button type="button" class="inv-btn mt-6" :class="{ 'pointer-events-none': mode === 'static' && !interactive }" :disabled="mode === 'static' && !interactive" @click="open">{{ copy.invitation.open }}</button>
    </div>
  </section>
</template>
