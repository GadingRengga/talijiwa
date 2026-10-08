<script setup lang="ts">
import { AlertCircle, ArrowLeft, ArrowRight, Check, ExternalLink, Lightbulb, Link2, Loader2, MoreHorizontal, Redo2, RotateCcw, Rocket, Smartphone, Tablet, Undo2 } from 'lucide-vue-next'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, provide, ref, watch } from 'vue'
import type { Component } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BuilderSidebar from '@/components/builder/BuilderSidebar.vue'
import type { BuilderKey } from '@/components/builder/BuilderSidebar.vue'
import SectionBasic from '@/components/builder/SectionBasic.vue'
import SectionCouple from '@/components/builder/SectionCouple.vue'
import SectionEvents from '@/components/builder/SectionEvents.vue'
import SectionGallery from '@/components/builder/SectionGallery.vue'
import SectionGift from '@/components/builder/SectionGift.vue'
import SectionMessages from '@/components/builder/SectionMessages.vue'
import SectionMusic from '@/components/builder/SectionMusic.vue'
import SectionPublish from '@/components/builder/SectionPublish.vue'
import SectionRsvp from '@/components/builder/SectionRsvp.vue'
import SectionSeo from '@/components/builder/SectionSeo.vue'
import SectionShare from '@/components/builder/SectionShare.vue'
import SectionStory from '@/components/builder/SectionStory.vue'
import SectionTheme from '@/components/builder/SectionTheme.vue'
import InvitationRenderer from '@/components/invitation/InvitationRenderer.vue'
import { BUILDER_KEY, useBuilder } from '@/composables/useBuilder'
import { useHistory } from '@/composables/useHistory'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import { coupleLabel, sectionProgress } from '@/utils/invitation'

const route = useRoute()
const builder = useBuilder(computed(() => String(route.params.id)))
provide(BUILDER_KEY, builder)
const { draft, loading, loadError, saveState, lastError, publishing, isPublished, canPublish } = builder

const toast = useToast()
const history = useHistory(draft)
const active = ref<BuilderKey>('basic')
const tab = ref<'edit' | 'preview'>('edit')
const previewRef = ref<InstanceType<typeof InvitationRenderer> | null>(null)
const formPane = ref<HTMLElement | null>(null)

const views: Record<BuilderKey, Component> = {
  basic: SectionBasic, couple: SectionCouple, story: SectionStory, events: SectionEvents,
  gallery: SectionGallery, rsvp: SectionRsvp, messages: SectionMessages, gift: SectionGift,
  music: SectionMusic, theme: SectionTheme, seo: SectionSeo, publish: SectionPublish, share: SectionShare,
}
// Which preview block to scroll to when a builder section is opened.
const previewTarget: Partial<Record<BuilderKey, string>> = {
  basic: 'cover', couple: 'profile', story: 'story', events: 'events', gallery: 'gallery',
  rsvp: 'rsvp', messages: 'messages', gift: 'gift', music: 'cover', theme: 'cover',
}

const order: BuilderKey[] = ['basic', 'couple', 'story', 'events', 'gallery', 'music', 'rsvp', 'messages', 'gift', 'theme', 'seo', 'publish', 'share']
const idx = computed(() => order.indexOf(active.value))
const prev = computed(() => order[idx.value - 1])
const next = computed(() => order[idx.value + 1])
function replay() {
  tab.value = 'preview'
  previewRef.value?.replay()
}

const progress = computed(() => (draft.value ? sectionProgress(draft.value) : {}))
const title = computed(() => (draft.value ? coupleLabel(draft.value) : ''))

function select(key: BuilderKey) {
  active.value = key
  tab.value = 'edit'
  formPane.value?.scrollTo({ top: 0 })
  void nextTick(() => formPane.value?.focus({ preventScroll: true })) // keyboard/screen-reader users land on the new section
}

// Next incomplete step (guides first-time users).
const nextTodo = computed(() => order.find((k) => k !== 'publish' && k !== 'share' && (progress.value[k] ?? 100) < 100))

// Custom colors belong to the old theme: follow the new theme's palette.
watch(
  () => draft.value?.theme,
  (_t, old) => {
    const d = draft.value
    if (!old || !d || history.isRestoring() || !d.settings.style) return
    const s = d.settings.style
    if (!s.accent && !s.text && !s.muted && !s.surface) return
    d.settings.style = { ...s, accent: '', text: '', muted: '', surface: '' }
    toast.info(copy.builder.themeResetToast)
  },
)

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null
  const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
  const mod = e.ctrlKey || e.metaKey
  const k = e.key.toLowerCase()
  if (mod && !typing && k === 'z') {
    e.preventDefault()
    e.shiftKey ? history.redo() : history.undo()
  } else if (mod && !typing && k === 'y') {
    e.preventDefault()
    history.redo()
  } else if (e.altKey && e.key === 'ArrowRight' && next.value) {
    e.preventDefault()
    select(next.value)
  } else if (e.altKey && e.key === 'ArrowLeft' && prev.value) {
    e.preventDefault()
    select(prev.value)
  }
})
const device = ref<'phone' | 'tablet'>('phone')
function closeMenu(e: Event) {
  const d = (e.target as HTMLElement).closest('details')
  if ((e.target as HTMLElement).closest('button, a') && d) d.open = false
}
// Which builder section edits a given preview block (click-to-edit).
const pickMap: Record<string, BuilderKey> = {
  cover: 'basic', couple: 'basic', closing: 'basic', date: 'events', countdown: 'events', maps: 'events', profile: 'couple',
  story: 'story', events: 'events', gallery: 'gallery', rsvp: 'rsvp', messages: 'messages', gift: 'gift',
}
let fromPreview = false
function onPick(sec: string) {
  const key = pickMap[sec]
  if (!key) return
  fromPreview = true
  select(key)
}
// Re-play the cover/animations when the look changes so the effect is visible right away.
watch(
  () => [draft.value?.theme, draft.value?.settings.style?.intro, draft.value?.settings.style?.animation],
  () => nextTick(() => previewRef.value?.replay()),
)
watch(active, (key) => {
  if (fromPreview) {
    fromPreview = false
    return
  }
  const target = previewTarget[key]
  if (target) previewRef.value?.scrollToSection(target)
})

const statusText = computed(
  () => ({ saved: copy.common.saved, dirty: copy.common.unsaved, saving: copy.common.saving, error: lastError.value || copy.builder.saveFailed })[saveState.value],
)
</script>

<template>
  <div class="flex h-[calc(100dvh-3.3rem)] flex-col lg:h-dvh">
    <LoadingState v-if="loading" />
    <div v-else-if="loadError" class="m-6 space-y-3">
      <p class="text-sm text-danger" role="alert">{{ loadError }}</p>
      <RouterLink to="/admin/invitations" class="text-sm font-medium text-brand hover:underline">{{ copy.builder.edit.backToList }}</RouterLink>
    </div>

    <template v-else-if="draft">
      <!-- Top bar -->
      <header class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-panel px-4 py-2.5 sm:px-5">
        <div class="flex min-w-0 items-center gap-3">
          <RouterLink to="/admin/invitations" class="rounded-lg p-1.5 text-muted hover:bg-black/5" :aria-label="copy.builder.edit.backToList"><ArrowLeft class="size-4" /></RouterLink>
          <div class="min-w-0">
            <h1 class="truncate text-sm font-semibold leading-tight">{{ title }}</h1>
            <div class="mt-0.5 flex items-center gap-2">
              <StatusBadge :status="draft.status" />
              <span class="flex items-center gap-1 text-xs" :class="saveState === 'error' ? 'text-danger' : 'text-muted'" role="status" aria-live="polite">
                <Loader2 v-if="saveState === 'saving'" class="size-3 animate-spin" />
                <AlertCircle v-else-if="saveState === 'error'" class="size-3" />
                <Check v-else-if="saveState === 'saved'" class="size-3 text-sage" />
                {{ statusText }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <div class="flex rounded-lg border border-line p-0.5 xl:hidden" role="tablist" :aria-label="copy.builder.edit.viewTabs">
            <button v-for="t in (['edit', 'preview'] as const)" :key="t" type="button" role="tab" :aria-selected="tab === t" class="rounded-md px-3 py-1 text-[13px] font-medium" :class="tab === t ? 'bg-ink text-white' : 'text-muted'" @click="tab = t">
              {{ t === 'edit' ? copy.builder.tabEdit : copy.builder.tabPreview }}
            </button>
          </div>
          <div class="hidden sm:flex">
            <AppButton variant="ghost" size="sm" :title="copy.builder.edit.undoTitle" :aria-label="copy.builder.edit.undo" :disabled="!history.canUndo.value" @click="history.undo()"><Undo2 class="size-4" /></AppButton>
            <AppButton variant="ghost" size="sm" :title="copy.builder.edit.redoTitle" :aria-label="copy.builder.edit.redo" :disabled="!history.canRedo.value" @click="history.redo()"><Redo2 class="size-4" /></AppButton>
          </div>
          <AppButton variant="ghost" size="sm" class="hidden sm:inline-flex" :title="copy.builder.edit.replayTitle" @click="replay"><RotateCcw class="size-4" /><span class="hidden sm:inline"> {{ copy.builder.edit.replay }}</span></AppButton>
          <a :href="`/admin/invitations/${draft.id}/preview`" target="_blank" rel="noopener" class="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted hover:bg-black/5 sm:inline-flex"><ExternalLink class="size-4" /> {{ copy.common.preview }}</a>
          <AppButton variant="ghost" size="sm" class="hidden sm:inline-flex" @click="builder.copyPublicLink()"><Link2 class="size-4" /> {{ copy.common.copyLink }}</AppButton>
          <details class="relative sm:hidden" @click.capture="closeMenu">
            <summary class="grid size-9 cursor-pointer list-none place-items-center rounded-lg text-muted hover:bg-black/5" :aria-label="copy.builder.edit.moreActions"><MoreHorizontal class="size-5" /></summary>
            <div class="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-line bg-panel p-1 shadow-lg">
              <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-paper disabled:opacity-40" :disabled="!history.canUndo.value" @click="history.undo()"><Undo2 class="size-4" /> {{ copy.builder.edit.undo }}</button>
              <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-paper disabled:opacity-40" :disabled="!history.canRedo.value" @click="history.redo()"><Redo2 class="size-4" /> {{ copy.builder.edit.redo }}</button>
              <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-paper" @click="replay"><RotateCcw class="size-4" /> {{ copy.builder.edit.replay }}</button>
              <a :href="`/admin/invitations/${draft.id}/preview`" target="_blank" rel="noopener" class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-paper"><ExternalLink class="size-4" /> {{ copy.common.preview }}</a>
              <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-paper" @click="builder.copyPublicLink()"><Link2 class="size-4" /> {{ copy.common.copyLink }}</button>
            </div>
          </details>
          <AppButton variant="secondary" size="sm" :loading="saveState === 'saving'" :disabled="saveState === 'saved'" @click="builder.save()">{{ copy.common.save }}</AppButton>
          <AppButton v-if="!isPublished" size="sm" :loading="publishing" :disabled="!canPublish" :title="canPublish ? '' : copy.builder.edit.completeFirst" @click="active === 'publish' ? builder.publish() : select('publish')">
            <Rocket class="size-4" /> {{ copy.common.publish }}
          </AppButton>
        </div>
      </header>

      <!-- Body -->
      <div class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_var(--pv)] xl:transition-[grid-template-columns] xl:duration-300" :style="{ '--pv': device === 'phone' ? '24rem' : '35rem' }">
        <div class="px-4 pt-3 lg:overflow-y-auto lg:border-r lg:border-line lg:bg-panel lg:p-3">
          <BuilderSidebar :active="active" :progress="progress" @select="select" />
        </div>

        <div ref="formPane" tabindex="-1" role="region" :aria-label="copy.builder.edit.formRegion" class="min-h-0 overflow-y-auto outline-none" :class="tab === 'edit' ? 'block' : 'hidden xl:block'">
          <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6">
            <button v-if="nextTodo && nextTodo !== active" type="button" class="mb-5 flex w-full items-center gap-3 rounded-xl border border-brand/30 bg-brand-soft/50 px-4 py-3 text-left text-sm hover:bg-brand-soft" @click="select(nextTodo)">
              <Lightbulb class="size-4 shrink-0 text-brand" aria-hidden="true" />
              <span class="flex-1"><span class="font-semibold">{{ copy.builder.edit.nextStep }}</span> {{ copy.builder.edit.completeAction }} {{ copy.builder.sections[nextTodo] }}</span>
              <ArrowRight class="size-4 text-brand" aria-hidden="true" />
            </button>
            <component :is="views[active]" v-model="draft" @jump="select($event as BuilderKey)" />
            <div class="sticky bottom-0 mt-8 flex items-center justify-between gap-2 border-t border-line bg-paper/95 px-1 py-3 backdrop-blur lg:static lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
              <AppButton v-if="prev" variant="ghost" size="sm" @click="select(prev)"><ArrowLeft class="size-4" /> {{ copy.builder.sections[prev] }}</AppButton>
              <span v-else />
              <AppButton v-if="next" size="sm" @click="select(next)">{{ copy.builder.sections[next] }} <ArrowRight class="size-4" /></AppButton>
            </div>
            <p class="mt-6 text-center text-[11px] text-muted">{{ copy.builder.edit.shortcuts }}</p>
          </div>
        </div>

        <aside class="min-h-0 overflow-hidden border-line bg-paper p-4 xl:border-l" :class="tab === 'preview' ? 'block' : 'hidden xl:block'" :aria-label="copy.builder.edit.previewRegion">
          <div class="mx-auto mb-3 flex w-fit rounded-lg border border-line bg-panel p-0.5" role="radiogroup" :aria-label="copy.builder.edit.previewSize">
            <button v-for="d in ([['phone', copy.builder.edit.phone, Smartphone], ['tablet', copy.builder.edit.tablet, Tablet]] as const)" :key="d[0]" type="button" role="radio" :aria-checked="device === d[0]" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[13px] font-medium" :class="device === d[0] ? 'bg-ink text-white' : 'text-muted'" @click="device = d[0]"><component :is="d[2]" class="size-4" /> {{ d[1] }}</button>
          </div>
          <div class="mx-auto h-[min(calc(100%-4.5rem),46rem)] min-h-96 max-w-full overflow-hidden border-ink bg-ink shadow-xl transition-[width,border-radius] duration-300" :class="device === 'phone' ? 'w-[min(22rem,100%)] rounded-[2rem] border-[6px]' : 'w-[min(32rem,100%)] rounded-[1.25rem] border-[8px]'">
            <InvitationRenderer ref="previewRef" :invitation="draft" mode="preview" :guest="copy.builder.edit.guestSample" @pick="onPick" />
          </div>
          <p class="mt-2 text-center text-xs text-muted">{{ copy.builder.edit.clickHint }}</p>
        </aside>
      </div>
    </template>
  </div>
</template>
