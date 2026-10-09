<script setup lang="ts">
import { CalendarHeart, Gift, Heart, Image, Info, MessageSquareHeart, Music, Palette, Rocket, Search, Send, Share2, Users } from 'lucide-vue-next'
import type { Component } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'
import { copy } from '@/config/copy'

export type BuilderKey = 'basic' | 'couple' | 'story' | 'events' | 'gallery' | 'rsvp' | 'messages' | 'gift' | 'music' | 'theme' | 'seo' | 'publish' | 'share'

const props = withDefaults(
  defineProps<{ active: BuilderKey; progress: Record<string, number>; keys?: BuilderKey[] }>(),
  { keys: undefined },
)
const emit = defineEmits<{ select: [key: BuilderKey] }>()

const overall = computed(() => {
  const vals = Object.values(props.progress)
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
})

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

const allItems: { key: BuilderKey; icon: Component }[] = [
  { key: 'basic', icon: Info },
  { key: 'couple', icon: Users },
  { key: 'story', icon: Heart },
  { key: 'events', icon: CalendarHeart },
  { key: 'gallery', icon: Image },
  { key: 'rsvp', icon: Send },
  { key: 'messages', icon: MessageSquareHeart },
  { key: 'gift', icon: Gift },
  { key: 'music', icon: Music },
  { key: 'theme', icon: Palette },
  { key: 'seo', icon: Search },
  { key: 'publish', icon: Rocket },
  { key: 'share', icon: Share2 },
]
const items = computed(() => (props.keys ? allItems.filter((i) => (props.keys as BuilderKey[]).includes(i.key)) : allItems))
const groupAt: Partial<Record<BuilderKey, string>> = { basic: copy.builder.groups.dasar, events: copy.builder.groups.acara, rsvp: copy.builder.groups.tamu, theme: copy.builder.groups.tampil, seo: copy.builder.groups.rilis }
</script>

<template>
  <nav :aria-label="copy.builder.sidebarNav">
    <!-- Desktop: vertical list -->
    <ul class="hidden space-y-0.5 lg:block">
      <li v-for="i in items" :key="i.key">
        <p v-if="groupAt[i.key]" class="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted/80">{{ groupAt[i.key] }}</p>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
          :class="active === i.key ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-black/5 hover:text-ink'"
          :aria-current="active === i.key ? 'step' : undefined"
          @click="emit('select', i.key)"
        >
          <component :is="i.icon" class="size-4 shrink-0" aria-hidden="true" />
          <span class="flex-1 truncate">{{ copy.builder.sections[i.key] }}</span>
          <span
            class="size-1.5 shrink-0 rounded-full"
            :class="(progress[i.key] ?? 0) >= 100 ? 'bg-sage' : (progress[i.key] ?? 0) > 0 ? 'bg-warn' : 'bg-line'"
            :title="`${progress[i.key] ?? 0}% ${copy.builder.progressDone}`"
          />
        </button>
      </li>
    </ul>
    <!-- Mobile/tablet: horizontal scroller -->
    <ul ref="scroller" class="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:hidden">
      <li v-for="i in items" :key="i.key" class="shrink-0">
        <button
          type="button"
          class="flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium"
          :class="active === i.key ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-panel text-muted'"
          :aria-current="active === i.key ? 'step' : undefined"
          @click="emit('select', i.key)"
        >
          <component :is="i.icon" class="size-3.5" aria-hidden="true" />
          {{ copy.builder.sections[i.key] }}
          <span
            class="size-1.5 rounded-full"
            :class="(progress[i.key] ?? 0) >= 100 ? 'bg-sage' : (progress[i.key] ?? 0) > 0 ? 'bg-warn' : 'bg-line'"
            aria-hidden="true"
          />
        </button>
      </li>
    </ul>
    <div class="mt-2 lg:hidden" role="progressbar" :aria-valuenow="overall" aria-valuemin="0" aria-valuemax="100" :aria-label="copy.builder.completeness">
      <div class="h-1 overflow-hidden rounded-full bg-line">
        <div class="h-full rounded-full bg-sage transition-[width]" :style="{ width: `${overall}%` }" />
      </div>
    </div>
  </nav>
</template>
