<script setup lang="ts">
import { AlertTriangle, ChevronDown, ChevronUp, GripVertical, RotateCcw } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import BuilderSection from './BuilderSection.vue'
import StyleColorInput from './StyleColorInput.vue'
import ThemeSelector from '@/components/admin/ThemeSelector.vue'
import { copy, sectionLabels } from '@/config/copy'
import { getTheme } from '@/themes'
import { FONT_FAMILY, contrastOn, contrastRatio, resolveOrder, resolveStyle } from '@/utils/invitation'
import type { AnimationLevel, BodyFontChoice, FontChoice, HeadingScale, InvitationData, InvitationStyle, SectionKey } from '@/types'

const inv = defineModel<InvitationData>({ required: true })
const st = computed(() => resolveStyle(inv.value.settings))
const theme = computed(() => getTheme(inv.value.theme))
function patch(p: Partial<InvitationStyle>) {
  inv.value.settings.style = { ...st.value, ...p }
}

// Live values (custom override or theme token) for the preview card and contrast checks.
const bgVal = computed(() => theme.value.tokens.bg)
const textVal = computed(() => st.value.text || theme.value.tokens.text)
const mutedVal = computed(() => st.value.muted || theme.value.tokens.muted)
const surfaceVal = computed(() => st.value.surface || theme.value.tokens.surface)
const accentVal = computed(() => st.value.accent || theme.value.tokens.accent)
const headingFam = computed(() =>
  st.value.font === 'theme' ? theme.value.tokens.fontHeading : `'${FONT_FAMILY[st.value.font]}', Georgia, serif`,
)
const bodyFam = computed(() =>
  st.value.fontBody === 'theme' ? theme.value.tokens.fontBody : `'${FONT_FAMILY[st.value.fontBody]}', Georgia, serif`,
)
const sampleSize = computed(() => ({ s: 'text-2xl', m: 'text-3xl', l: 'text-4xl' })[st.value.headingScale])

const textRatio = computed(() => contrastRatio(textVal.value, bgVal.value))
const mutedRatio = computed(() => contrastRatio(mutedVal.value, bgVal.value))
const accentRatio = computed(() => contrastRatio(accentVal.value, bgVal.value))
const surfaceRatio = computed(() => contrastRatio(textVal.value, surfaceVal.value))

const textPresets = computed(() => [theme.value.tokens.text, '#2b2620', '#4a3426', '#1f2937', '#3f4a3c', '#6b5a44'])
const mutedPresets = computed(() => [theme.value.tokens.muted, '#8a7566', '#6b7280', '#97897a', '#7d8a7a'])
const accentPresets = ['#b99a5b', '#c9747f', '#5f8564', '#4f86d9', '#9b7bea', '#9a5b24', '#c0392b', '#2d6a6a']
const surfacePresets = computed(() => [theme.value.tokens.surface, '#ffffff', '#faf6ee', '#f4f6f3', '#242019'])

const headingFonts: { v: FontChoice; label: string; family: string }[] = [
  { v: 'theme', label: 'Ikuti tema', family: theme.value.tokens.fontHeading },
  ...(Object.entries(FONT_FAMILY) as [Exclude<FontChoice, 'theme'>, string][]).map(([v, f]) => ({
    v,
    label: { serif: 'Serif elegan', classic: 'Klasik', script: 'Tulisan tangan', modern: 'Modern' }[v],
    family: `'${f}', Georgia, serif`,
  })),
]
const bodyFonts: { v: BodyFontChoice; label: string; family: string }[] = [
  { v: 'theme', label: 'Ikuti tema', family: theme.value.tokens.fontBody },
  ...(['serif', 'classic', 'modern'] as const).map((v) => ({
    v,
    label: { serif: 'Serif elegan', classic: 'Klasik', modern: 'Modern' }[v],
    family: `'${FONT_FAMILY[v]}', Georgia, serif`,
  })),
]
const scales: { v: HeadingScale; label: string }[] = [
  { v: 's', label: copy.builder.styleSizeS },
  { v: 'm', label: copy.builder.styleSizeM },
  { v: 'l', label: copy.builder.styleSizeL },
]
const intros = [['theme', 'Ikuti tema'], ['door', 'Pintu'], ['curtain', 'Tirai'], ['envelope', 'Amplop'], ['zoom', 'Zoom'], ['bloom', 'Bunga mekar'], ['blossom', 'Bunga berputar'], ['gunungan', 'Gunungan'], ['iris', 'Iris'], ['split', 'Belah layar'], ['slide', 'Geser']] as const
const levels: { v: AnimationLevel; label: string; hint: string }[] = [
  { v: 'full', label: 'Penuh', hint: 'Semua animasi' },
  { v: 'light', label: 'Ringan', hint: 'Tanpa ornamen' },
  { v: 'off', label: 'Mati', hint: 'Tanpa animasi' },
]

// Section order: drag & drop (mouse/touch) plus up/down buttons (keyboard).
const order = computed(() => resolveOrder(inv.value.settings))
const dragFrom = ref<number | null>(null)
const dragOver = ref<number | null>(null)
const announce = ref('')
function move(from: number, to: number) {
  if (to < 0 || to >= order.value.length || from === to) return
  const o = [...order.value]
  const [k] = o.splice(from, 1)
  o.splice(to, 0, k as SectionKey)
  inv.value.settings.section_order = o
  announce.value = `${sectionLabels[k as SectionKey].label} dipindah ke urutan ${to + 1} dari ${o.length}`
}
// Pointer-based drag (works with mouse, touch and pen) from the grip handle.
function gripDown(e: PointerEvent, i: number) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragFrom.value = dragOver.value = i
}
function gripMove(e: PointerEvent) {
  if (dragFrom.value === null) return
  const row = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-idx]')
  if (row) dragOver.value = Number(row.dataset.idx)
}
function gripUp() {
  if (dragFrom.value !== null && dragOver.value !== null) move(dragFrom.value, dragOver.value)
  dragFrom.value = dragOver.value = null
}
function resetOrder() {
  inv.value.settings.section_order = undefined
}
const customOrder = computed(() => !!inv.value.settings.section_order?.length)
const chip = 'rounded-full border px-3 py-2 text-[13px] font-medium transition-colors min-h-11'
</script>

<template>
  <BuilderSection :title="copy.builder.sections.theme" description="Pilih tema, atur teks dan warna, lalu atur urutan bagian undangan.">
    <ThemeSelector v-model="inv.theme" />

    <!-- Live style preview -->
    <section class="card overflow-hidden" :aria-label="copy.builder.stylePreview">
      <p class="px-4 pt-3 text-sm font-semibold">{{ copy.builder.stylePreview }}</p>
      <div class="mt-2 p-4" :style="{ background: bgVal, fontFamily: bodyFam }">
        <p class="inv-heading break-words" :class="sampleSize" :style="{ fontFamily: headingFam, color: textVal }">Raka &amp; Sinta</p>
        <p class="mt-1 text-sm" :style="{ color: mutedVal }">Dengan memohon rahmat dan ridho Allah SWT…</p>
        <div class="mt-3 rounded-lg border p-3" :style="{ background: surfaceVal, borderColor: theme.tokens.border }">
          <p class="text-sm font-semibold" :style="{ color: accentVal, fontFamily: headingFam }">Akad Nikah</p>
          <p class="text-sm" :style="{ color: textVal }">Gedung Graha Bakti</p>
        </div>
        <span class="inv-btn mt-3 w-full" :style="{ background: accentVal, borderColor: accentVal, color: contrastOn(accentVal) }">Buka Undangan</span>
      </div>
    </section>

    <!-- Text -->
    <section class="card space-y-5 p-4">
      <h3 class="text-sm font-semibold">{{ copy.builder.styleText }}</h3>
      <StyleColorInput :model-value="st.text" :label="copy.builder.styleTextColor" :presets="textPresets" :follow-label="copy.builder.followTheme" :custom-label="copy.builder.customColor" @update:model-value="patch({ text: $event })">
        <p v-if="textRatio < 3" class="mt-2 flex items-start gap-1.5 text-xs text-warn"><AlertTriangle class="mt-0.5 size-3.5 shrink-0" /> {{ copy.builder.lowContrast }}</p>
      </StyleColorInput>
      <StyleColorInput :model-value="st.muted" :label="copy.builder.styleMutedColor" :presets="mutedPresets" :follow-label="copy.builder.followTheme" :custom-label="copy.builder.customColor" @update:model-value="patch({ muted: $event })">
        <p v-if="mutedRatio < 2.2" class="mt-2 flex items-start gap-1.5 text-xs text-warn"><AlertTriangle class="mt-0.5 size-3.5 shrink-0" /> {{ copy.builder.lowContrast }}</p>
      </StyleColorInput>
      <div>
        <p class="mb-2 text-[13px] font-medium">{{ copy.builder.styleHeadingFont }}</p>
        <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Font judul">
          <button v-for="f in headingFonts" :key="f.v" type="button" role="radio" :aria-checked="st.font === f.v" class="min-h-11 rounded-lg border px-3 py-2 text-left" :class="st.font === f.v ? 'border-brand bg-brand-soft/60 ring-2 ring-brand/25' : 'border-line bg-panel hover:border-[#c4ccc5]'" @click="patch({ font: f.v })">
            <span class="block truncate text-xl leading-tight" :style="{ fontFamily: f.family }">Raka &amp; Sinta</span>
            <span class="text-xs text-muted">{{ f.label }}</span>
          </button>
        </div>
      </div>
      <div>
        <p class="mb-2 text-[13px] font-medium">{{ copy.builder.styleBodyFont }}</p>
        <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Font isi">
          <button v-for="f in bodyFonts" :key="f.v" type="button" role="radio" :aria-checked="st.fontBody === f.v" class="min-h-11 rounded-lg border px-3 py-2 text-left" :class="st.fontBody === f.v ? 'border-brand bg-brand-soft/60 ring-2 ring-brand/25' : 'border-line bg-panel hover:border-[#c4ccc5]'" @click="patch({ fontBody: f.v })">
            <span class="block truncate text-sm" :style="{ fontFamily: f.family }">Dengan memohon rahmat…</span>
            <span class="text-xs text-muted">{{ f.label }}</span>
          </button>
        </div>
      </div>
      <div>
        <p class="mb-2 text-[13px] font-medium">{{ copy.builder.styleHeadingSize }}</p>
        <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Ukuran judul">
          <button v-for="s in scales" :key="s.v" type="button" role="radio" :aria-checked="st.headingScale === s.v" class="min-h-11 rounded-lg border px-3 py-2" :class="st.headingScale === s.v ? 'border-brand bg-brand-soft/60 ring-2 ring-brand/25' : 'border-line bg-panel hover:border-[#c4ccc5]'" @click="patch({ headingScale: s.v })">
            <span class="block font-semibold" :class="s.v === 's' ? 'text-sm' : s.v === 'm' ? 'text-base' : 'text-lg'">Ag</span>
            <span class="text-xs text-muted">{{ s.label }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Accent -->
    <section class="card space-y-5 p-4">
      <h3 class="text-sm font-semibold">{{ copy.builder.styleAccent }}</h3>
      <StyleColorInput :model-value="st.accent" :label="copy.builder.styleAccent" :presets="accentPresets" :follow-label="copy.builder.followTheme" :custom-label="copy.builder.customColor" @update:model-value="patch({ accent: $event })">
        <p v-if="accentRatio < 2.2" class="mt-2 flex items-start gap-1.5 text-xs text-warn"><AlertTriangle class="mt-0.5 size-3.5 shrink-0" /> {{ copy.builder.lowContrast }}</p>
      </StyleColorInput>
    </section>

    <!-- Card background -->
    <section class="card space-y-5 p-4">
      <h3 class="text-sm font-semibold">{{ copy.builder.styleSurface }}</h3>
      <StyleColorInput :model-value="st.surface" :label="copy.builder.styleSurfaceColor" :presets="surfacePresets" :follow-label="copy.builder.followTheme" :custom-label="copy.builder.customColor" @update:model-value="patch({ surface: $event })">
        <p v-if="surfaceRatio < 3" class="mt-2 flex items-start gap-1.5 text-xs text-warn"><AlertTriangle class="mt-0.5 size-3.5 shrink-0" /> {{ copy.builder.lowContrast }}</p>
      </StyleColorInput>
    </section>

    <!-- Animation -->
    <section class="card space-y-5 p-4">
      <h3 class="text-sm font-semibold">{{ copy.builder.styleAnimation }}</h3>
      <div>
        <p class="mb-2 text-[13px] font-medium">Animasi pembuka</p>
        <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Animasi pembuka">
          <button v-for="[v, label] in intros" :key="v" type="button" role="radio" :aria-checked="st.intro === v" :class="[chip, st.intro === v ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted hover:text-ink']" @click="patch({ intro: v })">{{ label }}</button>
        </div>
        <p v-if="st.animation !== 'full'" class="mt-1.5 text-xs text-muted">Pembuka khusus hanya aktif pada tingkat animasi “Penuh”.</p>
      </div>
      <div>
        <p class="mb-2 text-[13px] font-medium">Tingkat animasi</p>
        <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tingkat animasi">
          <button v-for="l in levels" :key="l.v" type="button" role="radio" :aria-checked="st.animation === l.v" class="min-h-11 rounded-lg border px-3 py-2 text-left" :class="st.animation === l.v ? 'border-brand bg-brand-soft/60 ring-2 ring-brand/25' : 'border-line bg-panel hover:border-[#c4ccc5]'" @click="patch({ animation: l.v })">
            <span class="block text-sm font-semibold">{{ l.label }}</span><span class="text-xs text-muted">{{ l.hint }}</span>
          </button>
        </div>
        <p class="mt-1.5 text-xs text-muted">“Ringan” cocok untuk HP dengan spesifikasi rendah. Pengunjung yang mematikan animasi di perangkatnya otomatis tidak melihat gerakan.</p>
      </div>
    </section>

    <!-- Order -->
    <section>
      <div class="mb-1 flex items-center justify-between">
        <h3 class="text-sm font-semibold">{{ copy.builder.styleOrder }}</h3>
        <button v-if="customOrder" type="button" class="inline-flex min-h-11 items-center gap-1 px-2 text-xs text-muted hover:text-ink" @click="resetOrder"><RotateCcw class="size-3" /> Urutan awal</button>
      </div>
      <p class="mb-2 text-xs text-muted">Seret ikon pegangan (juga di layar sentuh), atau pakai tombol panah. Matikan saklar untuk menyembunyikan bagian.</p>
      <ul class="card divide-y divide-line">
        <li
          v-for="(k, i) in order"
          :key="k"
          :data-idx="i"
          class="flex items-center gap-2 px-2 py-2 transition-colors"
          :class="[dragOver === i && dragFrom !== i ? 'bg-brand-soft/60' : '', dragFrom === i ? 'opacity-60' : '']"
        >
          <span class="touch-none cursor-grab rounded p-2 text-muted hover:bg-black/5 active:cursor-grabbing" aria-hidden="true" @pointerdown.prevent="gripDown($event, i)" @pointermove="gripMove" @pointerup="gripUp" @pointercancel="dragFrom = dragOver = null"><GripVertical class="size-4" /></span>
          <label class="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 py-1">
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium" :class="inv.settings.sections[k] === false ? 'text-muted line-through' : ''">{{ sectionLabels[k].label }}</span>
              <span class="block truncate text-xs text-muted">{{ sectionLabels[k].hint }}</span>
            </span>
            <input v-model="inv.settings.sections[k]" type="checkbox" class="size-5 shrink-0 accent-[var(--color-brand,#3b6b4f)]" :aria-label="`Tampilkan ${sectionLabels[k].label}`" />
          </label>
          <span class="flex shrink-0">
            <button type="button" class="rounded p-2 text-muted hover:bg-black/5 hover:text-ink disabled:opacity-30" :disabled="i === 0" :aria-label="`Naikkan ${sectionLabels[k].label}`" @click="move(i, i - 1)"><ChevronUp class="size-4" /></button>
            <button type="button" class="rounded p-2 text-muted hover:bg-black/5 hover:text-ink disabled:opacity-30" :disabled="i === order.length - 1" :aria-label="`Turunkan ${sectionLabels[k].label}`" @click="move(i, i + 1)"><ChevronDown class="size-4" /></button>
          </span>
        </li>
      </ul>
    </section>
    <p class="sr-only" role="status" aria-live="polite">{{ announce }}</p>
  </BuilderSection>
</template>
