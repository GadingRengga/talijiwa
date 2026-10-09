<script setup lang="ts">
import { Check, Lock } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import ThemeBanner from '@/components/invitation/ThemeBanner.vue'
import { copy } from '@/config/copy'
import { themeList } from '@/themes'
import type { ThemeId } from '@/types'

const model = defineModel<ThemeId>({ required: true })
/** When set, only these themes are selectable; the rest render locked. Null = all. */
const props = defineProps<{ allowed?: ThemeId[] | null }>()
// Cards animate only on hover/focus or when selected, so the page stays calm and light.
const hot = ref<string | null>(null)
const isAllowed = (id: ThemeId) => !props.allowed || props.allowed.includes(id)
const lockedNote = computed(() => copy.themes.locked)
</script>

<template>
  <div role="radiogroup" :aria-label="copy.builder.theme.themeSelector" class="grid gap-3 sm:grid-cols-2">
    <button
      v-for="t in themeList"
      :key="t.id"
      type="button"
      role="radio"
      :aria-checked="model === t.id"
      :disabled="!isAllowed(t.id)"
      class="relative rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      :class="model === t.id ? 'border-brand bg-brand-soft/60 ring-2 ring-brand/25' : 'border-line bg-panel hover:border-[#c4ccc5]'"
      @click="model = t.id"
      @mouseenter="hot = t.id"
      @mouseleave="hot = null"
      @focus="hot = t.id"
      @blur="hot = null"
    >
      <div class="pointer-events-none h-24 overflow-hidden rounded-lg border border-black/5 sm:h-32 [&_h1]:!text-xl [&_p]:!hidden [&_.inv-btn]:!hidden [&_div.mx-auto]:!hidden">
        <ThemeBanner :theme="t.id" :active="hot === t.id || model === t.id" />
      </div>
      <p class="mt-2.5 flex items-center gap-1.5 text-sm font-semibold">
        {{ t.name }}
        <Lock v-if="!isAllowed(t.id)" class="size-3.5 text-muted" aria-hidden="true" />
      </p>
      <p class="mt-0.5 text-xs text-muted">{{ isAllowed(t.id) ? t.description : `${lockedNote}. ${copy.themes.upgradeHint}` }}</p>
      <span v-if="model === t.id" class="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-brand text-white"><Check class="size-3" /></span>
    </button>
  </div>
</template>
