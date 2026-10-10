<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { copy } from '@/config/copy'
import { ADMIN_SECTION_ORDER, SECTION_ICONS } from './sections'
import type { BuilderKey } from './sections'

export type { BuilderKey } from './sections'

const props = withDefaults(
  defineProps<{ active: BuilderKey; progress: Record<string, number>; keys?: BuilderKey[] }>(),
  { keys: undefined },
)
const emit = defineEmits<{ select: [key: BuilderKey] }>()

const items = computed(() => {
  const order = props.keys ?? ADMIN_SECTION_ORDER
  return order.map((key) => ({ key, icon: SECTION_ICONS[key]! }))
})

const overall = computed(() => {
  const vals = Object.values(props.progress)
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
})

const dotOf = (key: BuilderKey) =>
  (props.progress[key] ?? 0) >= 100 ? 'bg-sage' : (props.progress[key] ?? 0) > 0 ? 'bg-warn' : 'bg-line'

// Keep the active chip visible in the horizontal scroller.
const scroller = ref<HTMLElement | null>(null)
watch(
  () => props.active,
  async () => {
    await nextTick()
    scroller.value?.querySelector('[aria-current="step"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  },
  { flush: 'post' },
)

const groupAt: Partial<Record<BuilderKey, string>> = {
  basic: copy.builder.groups.dasar,
  events: copy.builder.groups.acara,
  rsvp: copy.builder.groups.tamu,
  theme: copy.builder.groups.tampil,
  seo: copy.builder.groups.rilis,
}
</script>

<template>
  <nav :aria-label="copy.builder.sidebarNav" class="flex h-full flex-col">
    <!-- Desktop: icon rail -->
    <ul class="nav-rail hidden flex-1 space-y-1 overflow-y-auto px-2.5 py-2 lg:block">
      <li v-for="i in items" :key="i.key">
        <p v-if="groupAt[i.key]" class="px-1 pb-1 pt-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-muted/70">
          {{ groupAt[i.key] }}
        </p>
        <button
          type="button"
          class="group flex w-full flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-center transition-all duration-150"
          :class="active === i.key ? 'bg-brand-soft shadow-[0_8px_20px_-10px_rgba(123,50,80,0.7)]' : 'hover:bg-black/[0.04]'"
          :aria-current="active === i.key ? 'step' : undefined"
          :title="copy.builder.sections[i.key]"
          @click="emit('select', i.key)"
        >
          <span
            class="relative grid size-11 place-items-center rounded-2xl transition-all duration-150"
            :class="active === i.key ? 'bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/30' : 'bg-black/[0.05] text-muted group-hover:text-ink'"
            aria-hidden="true"
          >
            <component :is="i.icon" class="size-4" />
            <span class="absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-panel" :class="dotOf(i.key)" />
          </span>
          <span
            class="w-full truncate px-0.5 text-[11px] font-semibold leading-tight"
            :class="active === i.key ? 'text-brand' : 'text-muted'"
            >{{ copy.builder.sections[i.key] }}</span
          >
        </button>
      </li>
    </ul>
    <div class="hidden px-3 pb-3 lg:block" role="progressbar" :aria-valuenow="overall" aria-valuemin="0" aria-valuemax="100" :aria-label="copy.builder.completeness">
      <div class="mb-1 flex items-baseline justify-between">
        <span class="text-[9px] font-bold uppercase tracking-[0.14em] text-muted/70">{{ overall }}%</span>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-line">
        <div class="h-full rounded-full bg-gradient-to-r from-sage to-brand transition-[width]" :style="{ width: `${overall}%` }" />
      </div>
    </div>

    <!-- Mobile/tablet: horizontal chip scroller (bleed matches the shell body padding) -->
    <ul ref="scroller" class="-mx-2 flex gap-1.5 overflow-x-auto px-2 pb-1 sm:-mx-4 sm:px-4 lg:hidden">
      <li v-for="i in items" :key="i.key" class="shrink-0">
        <button
          type="button"
          class="flex min-h-11 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all"
          :class="active === i.key ? 'border-ink bg-ink text-white shadow-md' : 'border-line bg-panel text-muted'"
          :aria-current="active === i.key ? 'step' : undefined"
          @click="emit('select', i.key)"
        >
          <component :is="i.icon" class="size-3.5" aria-hidden="true" />
          {{ copy.builder.sections[i.key] }}
          <span class="size-1.5 rounded-full" :class="dotOf(i.key)" aria-hidden="true" />
        </button>
      </li>
    </ul>
    <div class="mt-1.5 lg:hidden" role="progressbar" :aria-valuenow="overall" aria-valuemin="0" aria-valuemax="100" :aria-label="copy.builder.completeness">
      <div class="h-1 overflow-hidden rounded-full bg-line">
        <div class="h-full rounded-full bg-sage transition-[width]" :style="{ width: `${overall}%` }" />
      </div>
    </div>
  </nav>
</template>
