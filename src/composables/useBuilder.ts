import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { copy } from '@/config/copy'
import { invitationService } from '@/services/invitations'
import { useInvitationStore } from '@/stores/invitation'
import type { InvitationData, ThemeId } from '@/types'
import { isValidSlug, slugify } from '@/utils/format'
import { useClipboard } from './useClipboard'
import { useToast } from './useToast'

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error'
export type SlugState = 'idle' | 'checking' | 'ok' | 'taken' | 'invalid'
export interface PublishIssue {
  level: 'error' | 'warning'
  message: string
  section: string
}

const AUTOSAVE_MS = 1500

/**
 * State machine behind the invitation builder:
 * load -> edit (dirty) -> debounced autosave / manual save -> publish.
 * Components only bind to `draft`; everything else lives here.
 */
export function useBuilder(idRef: Ref<string>) {
  const store = useInvitationStore()
  const toast = useToast()
  const { copy: copyText } = useClipboard()

  const draft = ref<InvitationData | null>(null)
  const loading = ref(true)
  const loadError = ref('')
  const saveState = ref<SaveState>('saved')
  const lastError = ref('')
  const slugState = ref<SlugState>('idle')
  const slugTouched = ref(false)
  const publishing = ref(false)
  /** Theme entitlement for this draft. Null = unrestricted (admin). Pages for customers set this. */
  const allowedThemes = ref<ThemeId[] | null>(null)

  let ready = false // ignore watcher fires caused by loading/saving
  let autosaveTimer: ReturnType<typeof setTimeout> | undefined
  let slugTimer: ReturnType<typeof setTimeout> | undefined
  let slugRun = 0

  async function load() {
    loading.value = true
    loadError.value = ''
    ready = false
    try {
      const inv = await invitationService.get(idRef.value)
      if (!inv) {
        loadError.value = copy.invitation.notFound
        return
      }
      draft.value = inv
      // If the saved slug already matches the title, keep auto-syncing it.
      slugTouched.value = !!inv.slug && inv.slug !== slugify(inv.title)
      saveState.value = 'saved'
      slugState.value = 'idle'
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : copy.common.genericError
    } finally {
      loading.value = false
      requestAnimationFrame(() => (ready = true))
    }
  }

  // ---- dirty tracking + autosave ----
  watch(
    draft,
    () => {
      if (!ready || !draft.value) return
      saveState.value = 'dirty'
      clearTimeout(autosaveTimer)
      autosaveTimer = setTimeout(() => void save({ silent: true }), AUTOSAVE_MS)
    },
    { deep: true },
  )

  // ---- title -> slug sync ----
  watch(
    () => draft.value?.title,
    (title) => {
      if (!ready || !draft.value || slugTouched.value || title === undefined) return
      draft.value.slug = slugify(title)
    },
  )
  function onSlugInput() {
    slugTouched.value = true
    if (draft.value) draft.value.slug = slugify(draft.value.slug)
  }
  function resetSlugFromTitle() {
    if (!draft.value) return
    slugTouched.value = false
    draft.value.slug = slugify(draft.value.title)
  }

  // ---- slug availability (debounced) ----
  watch(
    () => draft.value?.slug,
    (slug) => {
      clearTimeout(slugTimer)
      if (!ready || !draft.value || slug === undefined) return
      if (!isValidSlug(slug)) {
        slugState.value = slug ? 'invalid' : 'idle'
        return
      }
      slugState.value = 'checking'
      const run = ++slugRun
      slugTimer = setTimeout(async () => {
        const free = await invitationService.isSlugAvailable(slug, draft.value?.id)
        if (run === slugRun) slugState.value = free ? 'ok' : 'taken'
      }, 400)
    },
  )

  // ---- saving ----
  async function save(opts: { silent?: boolean } = {}): Promise<boolean> {
    const inv = draft.value
    if (!inv || saveState.value === 'saving') return false
    clearTimeout(autosaveTimer)

    if (allowedThemes.value && !allowedThemes.value.includes(inv.theme)) {
      saveState.value = 'error'
      lastError.value = copy.couple.themeOutside
      if (!opts.silent) toast.error(lastError.value)
      return false
    }
    if (!isValidSlug(inv.slug) || slugState.value === 'taken') {
      saveState.value = 'error'
      lastError.value = slugState.value === 'taken' ? copy.builder.saveSlugTaken : copy.builder.saveSlugInvalid
      if (!opts.silent) toast.error(lastError.value)
      return false
    }
    saveState.value = 'saving'
    try {
      const saved = await invitationService.save(JSON.parse(JSON.stringify(inv)) as InvitationData, { allowedThemes: allowedThemes.value ?? undefined })
      ready = false
      inv.updated_at = saved.updated_at
      store.replace(saved)
      saveState.value = 'saved'
      lastError.value = ''
      requestAnimationFrame(() => (ready = true))
      if (!opts.silent) toast.success(copy.builder.savedToast)
      return true
    } catch (e) {
      saveState.value = 'error'
      lastError.value = e instanceof Error ? e.message : copy.common.genericError
      if (!opts.silent) toast.error(lastError.value)
      return false
    }
  }

  // ---- publish ----
  const issues = computed<PublishIssue[]>(() => {
    const inv = draft.value
    if (!inv) return []
    const list: PublishIssue[] = []
    if (!inv.title.trim()) list.push({ level: 'error', message: copy.builder.issues.title, section: 'basic' })
    if (!isValidSlug(inv.slug) || slugState.value === 'taken')
      list.push({ level: 'error', message: copy.builder.issues.slug, section: 'basic' })
    if (!inv.bride.name.trim() || !inv.groom.name.trim())
      list.push({ level: 'error', message: copy.builder.issues.couple, section: 'couple' })
    if (!inv.events.some((e) => e.date && e.venue.trim()))
      list.push({ level: 'error', message: copy.builder.issues.events, section: 'events' })
    if (!inv.bride.photo || !inv.groom.photo)
      list.push({ level: 'warning', message: copy.builder.issues.photos, section: 'couple' })
    if (!inv.gallery.length) list.push({ level: 'warning', message: copy.builder.issues.gallery, section: 'gallery' })
    if (inv.settings.music_enabled && !inv.settings.music_url)
      list.push({ level: 'error', message: copy.builder.issues.music, section: 'music' })
    return list
  })
  const blockers = computed(() => issues.value.filter((i) => i.level === 'error'))
  const canPublish = computed(() => blockers.value.length === 0)
  const isPublished = computed(() => draft.value?.status === 'published')

  async function publish() {
    const inv = draft.value
    if (!inv || !canPublish.value) return
    publishing.value = true
    try {
      if (!(await save({ silent: true }))) {
        toast.error(lastError.value || copy.common.genericError)
        return
      }
      const updated = await store.setStatus(inv.id, 'published')
      inv.status = updated.status
      inv.published_at = updated.published_at
      toast.success(copy.builder.publishedToast)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : copy.common.genericError)
    } finally {
      publishing.value = false
    }
  }
  async function unpublish() {
    const inv = draft.value
    if (!inv) return
    publishing.value = true
    try {
      const updated = await store.setStatus(inv.id, 'draft')
      inv.status = updated.status
      toast.success(copy.builder.unpublishedToast)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : copy.common.genericError)
    } finally {
      publishing.value = false
    }
  }

  async function copyPublicLink() {
    if (!draft.value) return
    const url = `${window.location.origin}/invite/${draft.value.slug}`
    if (await copyText(url)) toast.success(copy.builder.linkCopied)
  }

  // ---- lifecycle guards ----
  const hasUnsaved = () => saveState.value === 'dirty' || saveState.value === 'saving' || saveState.value === 'error'
  function beforeUnload(e: BeforeUnloadEvent) {
    if (hasUnsaved()) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
  function onKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      void save()
    }
  }
  onMounted(() => {
    window.addEventListener('beforeunload', beforeUnload)
    window.addEventListener('keydown', onKey)
    void load()
  })
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', beforeUnload)
    window.removeEventListener('keydown', onKey)
    clearTimeout(autosaveTimer)
    clearTimeout(slugTimer)
  })
  onBeforeRouteLeave(async () => {
    if (saveState.value === 'dirty') await save({ silent: true }) // try to flush first
    if (hasUnsaved()) return window.confirm(copy.builder.unsavedWarning)
  })
  watch(idRef, () => void load())

  return {
    draft, loading, loadError, saveState, lastError, slugState, slugTouched, publishing, allowedThemes,
    issues, blockers, canPublish, isPublished,
    save, publish, unpublish, copyPublicLink, onSlugInput, resetSlugFromTitle, reload: load,
  }
}

import type { InjectionKey } from 'vue'
export type BuilderContext = ReturnType<typeof useBuilder>
export const BUILDER_KEY: InjectionKey<BuilderContext> = Symbol('invitation-builder')
