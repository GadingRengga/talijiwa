<script setup lang="ts">
import { Check, X, ZoomIn, ZoomOut } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = withDefaults(defineProps<{ src: string; aspect?: number; outWidth?: number; title?: string }>(), { aspect: 0.8, outWidth: 900, title: 'Potong foto' })
const emit = defineEmits<{ done: [dataUrl: string]; cancel: [] }>()

const VW = 300
const VH = computed(() => Math.round(VW / props.aspect))
const img = ref<HTMLImageElement | null>(null)
const nat = ref({ w: 0, h: 0 })
const zoom = ref(1)
const pos = ref({ x: 0, y: 0 })
const base = computed(() => (nat.value.w ? Math.max(VW / nat.value.w, VH.value / nat.value.h) : 1))
const scale = computed(() => base.value * zoom.value)
const size = computed(() => ({ w: nat.value.w * scale.value, h: nat.value.h * scale.value }))
const clamp = () => {
  pos.value = { x: Math.min(0, Math.max(VW - size.value.w, pos.value.x)), y: Math.min(0, Math.max(VH.value - size.value.h, pos.value.y)) }
}
function onLoad() {
  const el = img.value!
  nat.value = { w: el.naturalWidth, h: el.naturalHeight }
  pos.value = { x: (VW - size.value.w) / 2, y: (VH.value - size.value.h) / 2 }
}
function setZoom(z: number) {
  const next = Math.min(3, Math.max(1, z))
  // keep the viewport centre fixed while zooming
  const cx = (VW / 2 - pos.value.x) / scale.value
  const cy = (VH.value / 2 - pos.value.y) / scale.value
  zoom.value = next
  pos.value = { x: VW / 2 - cx * scale.value, y: VH.value / 2 - cy * scale.value }
  clamp()
}
let drag: { x: number; y: number; px: number; py: number } | null = null
function down(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  drag = { x: e.clientX, y: e.clientY, px: pos.value.x, py: pos.value.y }
}
function move(e: PointerEvent) {
  if (!drag) return
  pos.value = { x: drag.px + e.clientX - drag.x, y: drag.py + e.clientY - drag.y }
  clamp()
}
const up = () => (drag = null)
function step(dx: number, dy: number) {
  pos.value = { x: pos.value.x + dx, y: pos.value.y + dy }
  clamp()
}
function confirm() {
  const outH = Math.round(props.outWidth / props.aspect)
  const c = document.createElement('canvas')
  c.width = props.outWidth
  c.height = outH
  c.getContext('2d')!.drawImage(img.value!, -pos.value.x / scale.value, -pos.value.y / scale.value, VW / scale.value, VH.value / scale.value, 0, 0, props.outWidth, outH)
  emit('done', c.toDataURL('image/jpeg', 0.84))
}
const onKey = (e: KeyboardEvent) => e.key === 'Escape' && emit('cancel')
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" :aria-label="title" @click.self="emit('cancel')">
      <div class="w-full max-w-sm space-y-4 rounded-2xl bg-panel p-5 shadow-2xl">
        <h2 class="font-display text-lg font-semibold">{{ title }}</h2>
        <div
          class="relative mx-auto touch-none select-none overflow-hidden rounded-lg bg-black outline-none ring-brand focus-visible:ring-2"
          :style="{ width: VW + 'px', height: VH + 'px', cursor: 'grab' }"
          tabindex="0"
          role="img"
          aria-label="Area potong. Seret atau gunakan tombol panah untuk menggeser, + dan - untuk zoom."
          @pointerdown="down"
          @pointermove="move"
          @pointerup="up"
          @pointercancel="up"
          @wheel.prevent="setZoom(zoom - $event.deltaY / 600)"
          @keydown.left.prevent="step(12, 0)"
          @keydown.right.prevent="step(-12, 0)"
          @keydown.up.prevent="step(0, 12)"
          @keydown.down.prevent="step(0, -12)"
          @keydown.187.prevent="setZoom(zoom + 0.1)"
          @keydown.189.prevent="setZoom(zoom - 0.1)"
        >
          <img ref="img" :src="src" alt="" draggable="false" class="pointer-events-none absolute left-0 top-0 max-w-none" :style="{ width: size.w + 'px', height: size.h + 'px', transform: `translate(${pos.x}px, ${pos.y}px)` }" @load="onLoad" />
          <div class="pointer-events-none absolute inset-0 border border-white/50" style="background-image: linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px); background-size: 33.33% 33.33%" />
        </div>
        <div class="flex items-center gap-3">
          <ZoomOut class="size-4 text-muted" aria-hidden="true" />
          <input type="range" min="1" max="3" step="0.01" :value="zoom" class="flex-1 accent-[var(--color-brand,#3b6b4f)]" aria-label="Zoom" @input="setZoom(Number(($event.target as HTMLInputElement).value))" />
          <ZoomIn class="size-4 text-muted" aria-hidden="true" />
        </div>
        <p class="text-xs text-muted">Seret foto untuk menggeser posisi. Hasil dipotong sesuai bingkai di atas.</p>
        <div class="flex justify-end gap-2">
          <AppButton variant="ghost" size="sm" @click="emit('cancel')"><X class="size-4" /> Batal</AppButton>
          <AppButton size="sm" @click="confirm"><Check class="size-4" /> Terapkan</AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
