<script setup lang="ts">
import { AlertCircle, ArrowLeft, ArrowRight, Check, ExternalLink, LayoutGrid, Lightbulb, Link2, Loader2, MoreHorizontal, MousePointerClick, PanelTopClose, PanelTopOpen, Redo2, RotateCcw, Rocket, Smartphone, Tablet, Undo2 } from 'lucide-vue-next'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, provide, ref, watch } from 'vue'
import type { Component } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BuilderSidebar from '@/components/builder/BuilderSidebar.vue'
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
import { ADMIN_SECTION_ORDER, PICK_MAP, PREVIEW_TARGET, SECTION_ICONS } from '@/components/builder/sections'
import type { BuilderKey } from '@/components/builder/sections'
import QuickEditSheet from '@/components/builder/QuickEditSheet.vue'
import { QUICK_EDITS } from '@/components/builder/quickFields'
import type { QuickEdit } from '@/components/builder/quickFields'
import InvitationRenderer from '@/components/invitation/InvitationRenderer.vue'
import { BUILDER_KEY } from '@/composables/useBuilder'
import type { BuilderContext } from '@/composables/useBuilder'
import { useHistory } from '@/composables/useHistory'
import { useToast } from '@/composables/useToast'
import { useRouter } from 'vue-router'
import { copy } from '@/config/copy'
import { coupleLabel, sectionProgress } from '@/utils/invitation'

const props = defineProps<{
  builder: BuilderContext
  history: ReturnType<typeof useHistory>
  backTo: string
  backLabel: string
  badge?: string
  sectionKeys?: BuilderKey[]
  initialKey: BuilderKey
  /** Sections excluded from the "next step" nudge (admin skips publish+share, couple skips publish). */
  todoSkip: BuilderKey[]
  previewMode: 'admin' | 'public'
}>()

// Sections read the builder through injection (same contract as before).
provide(BUILDER_KEY, props.builder)

const builder = props.builder
const history = props.history
const { draft, loading, loadError, saveState, lastError, publishing, isPublished, canPublish } = builder

const toast = useToast()
const active = ref<BuilderKey>(props.initialKey)
// Mobile opens on the full-height canvas; desktop opens on the form.
const tab = ref<'edit' | 'preview'>(
  typeof window !== 'undefined' && window.matchMedia('(max-width: 1279.98px)').matches ? 'preview' : 'edit',
)
const quickSec = ref<string | null>(null)
const quickIdx = ref<number | null>(null)
const menuOpen = ref(false)
/** PC: let users test real links/lightbox/music before going back to click-to-edit. */
const previewInteractive = ref(false)
// Toolbar collapses to a single button below xl; on xl+ it starts open so the
// title, save status, history and publish controls stay visible.
const barOpen = ref(typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches)
function onBarFocusOut(e: FocusEvent) {
  const el = e.currentTarget as HTMLElement | null
  if (el && !el.contains(e.relatedTarget as Node | null)) barOpen.value = false
}
const device = ref<'phone' | 'tablet'>('phone')
const previewRef = ref<InstanceType<typeof InvitationRenderer> | null>(null)
const formPane = ref<HTMLElement | null>(null)

const views: Record<BuilderKey, Component> = {
  basic: SectionBasic,
  couple: SectionCouple,
  story: SectionStory,
  events: SectionEvents,
  gallery: SectionGallery,
  rsvp: SectionRsvp,
  messages: SectionMessages,
  gift: SectionGift,
  music: SectionMusic,
  theme: SectionTheme,
  seo: SectionSeo,
  publish: SectionPublish,
  share: SectionShare,
}

const order = computed<BuilderKey[]>(() => [...(props.sectionKeys ?? ADMIN_SECTION_ORDER)])
const idx = computed(() => order.value.indexOf(active.value))
const prev = computed(() => order.value[idx.value - 1])
const next = computed(() => order.value[idx.value + 1])
const progress = computed(() => (draft.value ? sectionProgress(draft.value) : {}))
const activeProgress = computed(() => progress.value[active.value] ?? 0)
const title = computed(() => (draft.value ? coupleLabel(draft.value) : ''))
const previewHref = computed(() =>
  draft.value ? (props.previewMode === 'admin' ? `/admin/invitations/${draft.value.id}/preview` : `/invite/${draft.value.slug}`) : '#',
)

function select(key: BuilderKey) {
  active.value = key
  tab.value = 'edit'
  formPane.value?.scrollTo({ top: 0 })
  void nextTick(() => formPane.value?.focus({ preventScroll: true })) // keyboard/screen-reader users land on the new section
}

function replay() {
  tab.value = 'preview'
  previewRef.value?.replay()
}

// Next incomplete step (guides first-time users).
const nextTodo = computed(() => order.value.find((k) => !props.todoSkip.includes(k) && (progress.value[k] ?? 100) < 100))

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
  } else if (e.key === 'Escape') {
    quickSec.value = null
    menuOpen.value = false
    barOpen.value = false
  }
})

function closeMenu(e: Event) {
  const d = (e.target as HTMLElement).closest('details')
  if ((e.target as HTMLElement).closest('button, a') && d) d.open = false
}

let fromPreview = false
/** Block-level index inside the preview (e.g. which event card was tapped). */
interface PickInfo { sec: string; index: number | null }
function entryFor(sec: string): QuickEdit | null {
  return QUICK_EDITS[sec] ?? null
}
function onPick(pick: string | PickInfo) {
  // Blocks with scalar fields open the floating quick-edit sheet;
  // complex blocks fall through to the full section form.
  const sec = typeof pick === 'string' ? pick : pick.sec
  const index = typeof pick === 'string' ? null : pick.index
  if (entryFor(sec)) {
    quickSec.value = sec
    quickIdx.value = index
    return
  }
  const key = PICK_MAP[sec]
  if (!key) return
  fromPreview = true
  select(key)
}
function openFull(section: BuilderKey) {
  quickSec.value = null
  quickIdx.value = null
  menuOpen.value = false
  select(section)
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
  const target = PREVIEW_TARGET[key]
  if (target) previewRef.value?.scrollToSection(target)
})

const statusText = computed<string>(
  () =>
    ({
      saved: copy.common.saved,
      dirty: copy.common.unsaved,
      saving: copy.common.saving,
      error: lastError.value || copy.builder.saveFailed,
    })[saveState.value] ?? '',
)
const dotClass = computed(() => {
  if (saveState.value === 'saved') return 'bg-sage'
  if (saveState.value === 'saving') return 'bg-brand'
  if (saveState.value === 'error') return 'bg-danger'
  return 'bg-warn'
})
const router = useRouter()
const goBack = () => {
  if (builder.hasUnsaved()) {
    void builder.save({ silent: true }).then(() => {
      if (!builder.hasUnsaved()) router.push(props.backTo)
    })
    return
  }
  router.push(props.backTo)
}
</script>

<template>
  <div class="flex h-[calc(100dvh-4rem)] flex-col bg-paper">
    <div v-if="loading" class="grid flex-1 place-items-center"><LoadingState /></div>
    <div v-else-if="loadError" class="p-4 sm:p-6">
      <div class="card mx-auto max-w-md space-y-3 p-6 text-center">
        <p class="text-sm text-danger" role="alert">{{ loadError }}</p>
        <RouterLink :to="backTo" class="text-sm font-medium text-brand hover:underline">{{ backLabel }}</RouterLink>
      </div>
    </div>

    <template v-else-if="draft">
      <!-- Collapsible floating top bar: closed = compact status strip (title + save
        state stay visible), full controls expand on xl by default. -->
      <div class="px-2 pt-1.5 sm:px-4 sm:pt-3">
        <div
          v-if="!barOpen"
          class="card flex items-center gap-2 px-2 py-1.5 sm:px-3"
        >
          <button
            type="button"
            class="grid size-9 shrink-0 place-items-center rounded-2xl bg-ink text-white shadow-xl transition-transform active:scale-95 xl:hidden"
            :aria-label="copy.builder.toolbar"
            :aria-expanded="false"
            @click.stop="barOpen = true"
          >
            <PanelTopOpen class="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="grid size-9 min-h-11 min-w-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-black/5 xl:hidden"
            :aria-label="backLabel"
            @click="goBack"
          >
            <ArrowLeft class="size-4" aria-hidden="true" />
          </button>
          <p class="min-w-0 flex-1 truncate text-sm font-bold tracking-tight">{{ title }}</p>
          <span class="flex shrink-0 items-center gap-1.5 text-xs" :class="saveState === 'error' ? 'text-danger' : 'text-muted'" role="status" :aria-label="statusText">
            <span class="relative flex size-2" aria-hidden="true">
              <span v-if="saveState === 'saving'" class="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
              <span class="relative inline-flex size-2 rounded-full" :class="dotClass" />
            </span>
            <span class="max-w-24 truncate sm:max-w-none">{{ statusText }}</span>
          </span>
          <div class="flex shrink-0 rounded-xl border border-line bg-paper p-0.5 xl:hidden" role="tablist" :aria-label="copy.builder.edit.viewTabs">
            <button
              v-for="t in (['edit', 'preview'] as const)"
              :key="t"
              type="button"
              role="tab"
              :aria-selected="tab === t"
              class="min-h-9 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
              :class="tab === t ? 'bg-ink text-white shadow-sm' : 'text-muted'"
              @click="tab = t"
            >
              {{ t === 'edit' ? copy.builder.tabEdit : copy.builder.tabPreview }}
            </button>
          </div>
        </div>
        <header v-else class="card flex flex-wrap items-center gap-x-1.5 gap-y-1.5 px-2 py-1.5 sm:gap-x-3 sm:gap-y-2 sm:px-4 sm:py-2" @focusout="onBarFocusOut">
          <RouterLink :to="backTo" class="grid size-8 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-black/5 hover:text-ink sm:size-9" :aria-label="backLabel">
            <ArrowLeft class="size-4" aria-hidden="true" />
          </RouterLink>
          <div class="min-w-0 flex-1 basis-32">
            <p v-if="badge" class="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-brand sm:block">{{ badge }}</p>
            <h1 class="truncate text-sm font-bold leading-tight tracking-tight sm:text-[15px]">{{ title }}</h1>
            <div class="mt-0.5 flex items-center gap-1.5 sm:mt-1 sm:gap-2">
              <StatusBadge :status="draft.status" />
              <span class="flex items-center gap-1.5 text-xs" :class="saveState === 'error' ? 'text-danger' : 'text-muted'" role="status" aria-live="polite">
                <Loader2 v-if="saveState === 'saving'" class="size-3 animate-spin" aria-hidden="true" />
                <AlertCircle v-else-if="saveState === 'error'" class="size-3" aria-hidden="true" />
                <Check v-else-if="saveState === 'saved'" class="size-3 text-sage" aria-hidden="true" />
                <span v-else class="relative flex size-2" aria-hidden="true">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-warn opacity-60" />
                  <span class="relative inline-flex size-2 rounded-full bg-warn" />
                </span>
                <span>{{ statusText }}</span>
              </span>
            </div>
          </div>

          <div class="flex min-w-0 flex-wrap items-center justify-end gap-0.5 sm:gap-1.5">
            <div class="flex items-center gap-x-1.5 gap-y-1.5">
              <AppButton v-if="prev" variant="ghost" size="sm" aria-label="Bagian sebelumnya" @click="select(prev)">
                <ArrowLeft class="size-4" aria-hidden="true" />
                <span class="hidden max-w-28 truncate sm:inline">{{ copy.builder.sections[prev] }}</span>
              </AppButton>
              <div class="px-2 text-center">
                <p class="text-sm font-bold tabular-nums">{{ idx + 1 }}/{{ order.length }}</p>
              </div>
              <AppButton v-if="next" variant="ghost" size="sm" aria-label="Bagian berikutnya" @click="select(next)">
                <span class="hidden max-w-28 truncate sm:inline">{{ copy.builder.sections[next] }}</span>
                <ArrowRight class="size-4" aria-hidden="true" />
              </AppButton>
            </div>
            <div class="flex items-center gap-0.5">
              <AppButton variant="ghost" size="sm" class="!min-h-11 !min-w-11 !px-2 sm:!min-h-0 sm:!min-w-0 sm:!px-3" :title="copy.builder.edit.undoTitle" :aria-label="copy.builder.edit.undo" :disabled="!history.canUndo.value" @click="history.undo()">
                <Undo2 class="size-4" aria-hidden="true" />
              </AppButton>
              <AppButton variant="ghost" size="sm" class="!min-h-11 !min-w-11 !px-2 sm:!min-h-0 sm:!min-w-0 sm:!px-3" :title="copy.builder.edit.redoTitle" :aria-label="copy.builder.edit.redo" :disabled="!history.canRedo.value" @click="history.redo()">
                <Redo2 class="size-4" aria-hidden="true" />
              </AppButton>
            </div>
            <AppButton variant="ghost" size="sm" class="hidden !px-2.5 sm:inline-flex" :title="copy.builder.edit.replayTitle" :aria-label="copy.builder.edit.replay" @click="replay">
              <RotateCcw class="size-4" aria-hidden="true" />
            </AppButton>
            <a :href="previewHref" target="_blank" rel="noopener" class="hidden items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:bg-black/5 hover:text-ink sm:inline-flex" :title="copy.common.preview">
              <ExternalLink class="size-4" aria-hidden="true" />
            </a>
            <AppButton variant="ghost" size="sm" class="hidden !px-2.5 sm:inline-flex" :title="copy.common.copyLink" :aria-label="copy.common.copyLink" @click="builder.copyPublicLink()">
              <Link2 class="size-4" aria-hidden="true" />
            </AppButton>
            <details class="relative sm:hidden" @click.capture="closeMenu">
              <summary class="grid min-h-11 min-w-11 size-8 cursor-pointer list-none place-items-center rounded-xl text-muted hover:bg-black/5 sm:size-9" :aria-label="copy.builder.edit.moreActions">
                <MoreHorizontal class="size-5" aria-hidden="true" />
              </summary>
              <div class="absolute right-0 top-full z-30 mt-1 w-52 rounded-2xl border border-line bg-panel p-1.5 shadow-xl">
                <button type="button" class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-paper" @click="replay"><RotateCcw class="size-4" aria-hidden="true" /> {{ copy.builder.edit.replay }}</button>
                <a :href="previewHref" target="_blank" rel="noopener" class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-paper"><ExternalLink class="size-4" aria-hidden="true" /> {{ copy.common.preview }}</a>
                <button type="button" class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-paper" @click="builder.copyPublicLink()"><Link2 class="size-4" aria-hidden="true" /> {{ copy.common.copyLink }}</button>
              </div>
            </details>
            <AppButton variant="secondary" size="sm" :loading="saveState === 'saving'" :disabled="saveState === 'saved'" @click="builder.save()">{{ copy.common.save }}</AppButton>
            <AppButton
              v-if="!isPublished"
              size="sm"
              :loading="publishing"
              :disabled="!canPublish"
              :title="canPublish ? '' : copy.builder.edit.completeFirst"
              @click="active === 'publish' ? builder.publish() : select('publish')"
            >
              <Rocket class="size-4" aria-hidden="true" /> <span>{{ copy.common.publish }}</span>
            </AppButton>
            <button
              type="button"
              class="grid size-8 place-items-center rounded-xl text-muted transition-colors hover:bg-black/5 hover:text-ink sm:size-9"
              :aria-label="copy.builder.toolbar"
              :aria-expanded="true"
              @click="barOpen = false"
            >
              <PanelTopClose class="size-4" aria-hidden="true" />
            </button>
          </div>
        </header>
      </div>

      <!-- Body: split form + live preview from lg up (tablets included);
        single-tab layout below lg. -->
      <div class="grid min-h-0 flex-1 grid-cols-1 px-2 pb-2 pt-1.5 sm:px-4 sm:pb-3 sm:pt-3 lg:grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,22rem)] lg:gap-3 lg:pl-0 xl:grid-cols-[5.5rem_minmax(0,1fr)_var(--pv)]" :style="{ '--pv': device === 'phone' ? '24rem' : '35rem' }">
        <div class="min-h-0 lg:overflow-y-auto lg:pl-3" :class="tab === 'edit' ? 'block' : 'hidden lg:block'">
          <BuilderSidebar :active="active" :progress="progress" :keys="sectionKeys" @select="select" />
        </div>

        <div
          ref="formPane"
          tabindex="-1"
          role="region"
          :aria-label="copy.builder.edit.formRegion"
          class="min-h-0 overflow-y-auto rounded-2xl outline-none"
          :class="tab === 'edit' ? 'block' : 'hidden lg:block'"
        >
          <div class="mx-auto max-w-2xl px-2 py-1 sm:px-3">
            <button
              v-if="nextTodo && nextTodo !== active"
              type="button"
              class="mb-3 flex w-full items-center gap-2.5 rounded-2xl border border-brand/25 bg-gradient-to-r from-brand-soft to-gold-soft px-3 py-2 text-left text-sm shadow-sm transition-all hover:shadow"
              @click="select(nextTodo)"
            >
              <Lightbulb class="size-4 shrink-0 text-brand" aria-hidden="true" />
              <span class="flex-1"><span class="font-bold">{{ copy.builder.edit.nextStep }}</span> {{ copy.builder.edit.completeAction }} {{ copy.builder.sections[nextTodo] }}</span>
              <ArrowRight class="size-4 shrink-0 text-brand" aria-hidden="true" />
            </button>

            <div class="sticky top-0 z-10 -mx-2 mb-3 flex items-center gap-2 bg-paper/85 px-2 py-2 backdrop-blur-sm sm:-mx-3 sm:px-3">
              <span class="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/25" aria-hidden="true">
                <component :is="SECTION_ICONS[active]" class="size-4" />
              </span>
              <div class="min-w-0 flex-1">
                <h2 class="truncate font-display text-lg font-bold tracking-tight">{{ copy.builder.sections[active] }}</h2>
                <p class="text-xs font-semibold tabular-nums text-muted">{{ idx + 1 }} / {{ order.length }}</p>
              </div>
              <div class="w-24 shrink-0" role="progressbar" :aria-valuenow="activeProgress" aria-valuemin="0" aria-valuemax="100" :aria-label="copy.builder.completeness">
                <div class="h-1.5 overflow-hidden rounded-full bg-line">
                  <div class="h-full rounded-full bg-gradient-to-r from-brand to-gold transition-[width]" :style="{ width: `${activeProgress}%` }" />
                </div>
              </div>
            </div>

            <component :is="views[active]" v-model="draft" @jump="select($event as BuilderKey)" />

            <!-- Floating section dock -->
            <div class="sticky bottom-4 z-10 mt-6 flex justify-center pb-[env(safe-area-inset-bottom)]">
              <div class="card flex items-center gap-1 p-1.5 shadow-[var(--shadow-pop)]">
                <AppButton v-if="prev" variant="ghost" size="sm" @click="select(prev)">
                  <ArrowLeft class="size-4" aria-hidden="true" />
                  <span class="hidden max-w-28 truncate sm:inline">{{ copy.builder.sections[prev] }}</span>
                </AppButton>
                <div class="px-2 text-center">
                  <p class="text-sm font-bold tabular-nums">{{ idx + 1 }}/{{ order.length }}</p>
                </div>
                <AppButton v-if="next" size="sm" @click="select(next)">
                  <span class="hidden max-w-28 truncate sm:inline">{{ copy.builder.sections[next] }}</span>
                  <ArrowRight class="size-4" aria-hidden="true" />
                </AppButton>
              </div>
            </div>
            <p class="mt-4 hidden text-center text-[11px] text-muted sm:block">{{ copy.builder.edit.shortcuts }}</p>
          </div>
        </div>

        <aside
          class="flex min-h-0 flex-col overflow-y-auto rounded-2xl border border-line bg-panel/60 p-3 sm:p-4"
          :class="tab === 'preview' ? 'block' : 'hidden lg:block'"
          :aria-label="copy.builder.edit.previewRegion"
        >
          <div class="mx-auto mb-3 hidden w-fit shrink-0 items-center gap-1 rounded-xl border border-line bg-panel p-1 shadow-sm lg:flex" role="radiogroup" :aria-label="copy.builder.edit.previewSize">
            <button
              v-for="d in ([['phone', copy.builder.edit.phone, Smartphone], ['tablet', copy.builder.edit.tablet, Tablet]] as const)"
              :key="d[0]"
              type="button"
              role="radio"
              :aria-checked="device === d[0]"
              class="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all"
              :class="device === d[0] ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink'"
              @click="device = d[0]"
            >
              <component :is="d[2]" class="size-4" aria-hidden="true" /> {{ d[1] }}
            </button>
            <span class="mx-0.5 h-5 w-px bg-line" aria-hidden="true" />
            <button
              type="button"
              :aria-pressed="previewInteractive"
              :title="copy.builder.edit.tryHint"
              class="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all"
              :class="previewInteractive ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'"
              @click="previewInteractive = !previewInteractive"
            >
              <MousePointerClick class="size-4" aria-hidden="true" /> {{ copy.builder.edit.try }}
            </button>
          </div>
          <div
            class="relative mx-auto w-[min(26rem,100%)] overflow-hidden bg-ink shadow-2xl transition-[width,border-radius] duration-300 max-lg:min-h-0 max-lg:flex-1 max-lg:rounded-[2rem] max-lg:border-[8px] max-lg:border-ink lg:h-[min(calc(100%-4.5rem),46rem)] lg:min-h-96 lg:w-full lg:max-w-[26rem] lg:rounded-[2rem] lg:border-[8px] lg:border-ink xl:h-[min(calc(100%-4.5rem),46rem)]"
            :class="device === 'phone' ? 'xl:max-w-none xl:rounded-[2.5rem] xl:border-[10px] xl:border-ink' : 'xl:w-[min(32rem,100%)] xl:max-w-none xl:rounded-[1.5rem] xl:border-[10px] xl:border-ink'"
          >
            <div v-if="device === 'phone'" class="pointer-events-none absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" aria-hidden="true" />
            <InvitationRenderer v-if="draft" ref="previewRef" :class="device === 'phone' ? 'pt-7' : ''" :invitation="draft" mode="preview" :guest="copy.builder.edit.guestSample" :interactive="previewInteractive" @pick="onPick" />
          </div>
          <p class="mt-3 shrink-0 text-center text-xs text-muted lg:hidden">{{ copy.builder.tapHint }}</p>
          <p class="mt-3 hidden shrink-0 text-center text-xs text-muted lg:block">{{ previewInteractive ? copy.builder.edit.tryActive : copy.builder.edit.clickHint }}</p>
        </aside>
      </div>

      <!-- Floating section menu (mobile canvas only; bottom-left so it never
        covers the invitation CTA on the right) -->
      <button
        v-if="tab === 'preview'"
        type="button"
        class="fixed bottom-5 left-4 z-40 grid size-12 min-h-11 min-w-11 place-items-center rounded-2xl bg-ink text-white shadow-xl transition-transform active:scale-95 lg:hidden"
        :style="{ marginBottom: 'env(safe-area-inset-bottom)' }"
        :aria-label="copy.builder.sectionsMenu"
        @click="menuOpen = true"
      >
        <LayoutGrid class="size-5" aria-hidden="true" />
      </button>
      <div v-if="menuOpen" class="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" :aria-label="copy.builder.sectionsMenu">
        <button type="button" class="absolute inset-0 bg-ink/50 backdrop-blur-[1px]" :aria-label="copy.common.close" @click="menuOpen = false" />
        <div class="absolute inset-x-3 bottom-3 max-h-[70dvh] overflow-y-auto rounded-3xl border border-line bg-panel p-3" :style="{ marginBottom: 'env(safe-area-inset-bottom)' }">
          <span class="mx-auto mb-2 block h-1 w-10 rounded-full bg-line" aria-hidden="true" />
          <p class="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{{ copy.builder.sectionsMenu }}</p>
          <ul class="space-y-0.5">
            <li v-for="k in order" :key="k">
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors"
                :class="active === k ? 'bg-brand-soft' : 'hover:bg-paper'"
                @click="openFull(k)"
              >
                <span
                  class="grid size-9 shrink-0 place-items-center rounded-xl"
                  :class="active === k ? 'bg-gradient-to-br from-brand to-brand-dark text-white shadow-sm' : 'bg-black/[0.05] text-muted'"
                  aria-hidden="true"
                >
                  <component :is="SECTION_ICONS[k]" class="size-4" />
                </span>
                <span class="min-w-0 flex-1 truncate text-sm font-semibold" :class="active === k ? 'text-brand' : ''">{{ copy.builder.sections[k] }}</span>
                <span
                  class="size-2 shrink-0 rounded-full"
                  :class="(progress[k] ?? 0) >= 100 ? 'bg-sage' : (progress[k] ?? 0) > 0 ? 'bg-warn' : 'bg-line'"
                  aria-hidden="true"
                />
              </button>
            </li>
          </ul>
        </div>
      </div>

      <QuickEditSheet
        v-if="quickSec && draft"
        :draft="draft"
        :sec="quickSec"
        :index="quickIdx"
        :save-text="statusText"
        @close="quickSec = null; quickIdx = null"
        @open-full="openFull"
      />
    </template>
  </div>
</template>
