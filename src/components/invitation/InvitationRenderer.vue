<script setup lang="ts">
import { Instagram, MapPin, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { copy } from '@/config/copy'
import { useScrollReveal } from '@/composables/useAnimation'
import { getTheme, themeStyle } from '@/themes'
import type { Attendance, GiftType, GuestMessage, InvitationData, Person, SectionKey } from '@/types'
import { formatDate, formatLongDate, parseLocalDate } from '@/utils/format'
import { FONT_FAMILY, contrastOn, coupleLabel, placeholderImage, resolveOrder, resolveStyle, weddingDate } from '@/utils/invitation'
import CountdownTimer from './CountdownTimer.vue'
import DecorLayer from './DecorLayer.vue'
import OrnamentLayer from './OrnamentLayer.vue'
import GiftSection from './GiftSection.vue'
import GuestMessageForm from './GuestMessageForm.vue'
import InvitationCover from './InvitationCover.vue'
import RsvpForm from './RsvpForm.vue'

/**
 * Renders a complete invitation from data.
 * - mode "public":  cover gate + scroll reveal + live forms
 * - mode "preview": used inside the builder (no gate, no scroll animation, forms disabled)
 */
const props = withDefaults(
  defineProps<{
    invitation: InvitationData
    mode?: 'public' | 'preview'
    guest?: string
    messages?: GuestMessage[]
    /** Builder-only: when true, preview keeps native clicks (links, lightbox)
     * instead of hijacking them for click-to-edit. */
    interactive?: boolean
  }>(),
  { mode: 'public', guest: '', messages: () => [], interactive: false },
)
const emit = defineEmits<{
  open: []
  rsvp: [payload: { name: string; whatsapp: string; guest_count: number; attendance: Attendance; message: string }]
  pick: [pick: string | { sec: string; index: number | null }]
  message: [payload: { name: string; message: string }]
  gift: [payload: { name: string; gift_type: GiftType; amount: number | null; message: string }]
}>()

const root = ref<HTMLElement | null>(null)
const isPreview = computed(() => props.mode === 'preview')
const reveal = ''

const theme = computed(() => getTheme(props.invitation.theme))
const st = computed(() => resolveStyle(props.invitation.settings))
const level = computed(() => st.value.animation)
const introKind = computed(() => (level.value !== 'full' ? 'slide' : st.value.intro === 'theme' ? (theme.value.intro ?? 'slide') : st.value.intro))
const revealKind = computed(() => (level.value === 'off' ? 'none' : level.value === 'light' ? 'fade' : (theme.value.reveal ?? 'fade')))
const { replay } = useScrollReveal(root, () => revealKind.value, isPreview.value ? root : undefined)
watch(revealKind, () => nextTick(replay))
const coverRef = ref<InstanceType<typeof InvitationCover> | null>(null)
function replayAll() {
  root.value?.scrollTo?.({ top: 0 })
  replay()
  coverRef.value?.demo()
}
const orderIdx = computed(() => Object.fromEntries(resolveOrder(props.invitation.settings).map((k, i) => [k, i + 1])))
const ord = (k: SectionKey) => orderIdx.value[k] ?? 0
// Tap-vs-scroll guard: a swipe that scrolls the canvas must not open the editor.
let touchAt: { x: number; y: number } | null = null
function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touchAt = t ? { x: t.clientX, y: t.clientY } : null
}
function onPreviewClick(e: MouseEvent) {
  if (!isPreview.value || props.interactive) return
  if (touchAt) {
    const moved = Math.hypot(e.clientX - touchAt.x, e.clientY - touchAt.y)
    touchAt = null
    if (moved > 12) return
  }
  e.preventDefault()
  e.stopPropagation()
  const sec = (e.target as HTMLElement).closest<HTMLElement>('[data-sec]')
  if (sec?.dataset.sec) {
    // Forward the tapped card index so quick-edit opens the right event
    // (events/maps/date/countdown share one events array).
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-idx]')
    const raw = card?.dataset.idx
    const index = raw == null || raw === '' ? null : Number(raw)
    emit('pick', { sec: sec.dataset.sec, index: Number.isInteger(index) ? index : null })
  }
}
const cssVars = computed(() => {
  const v = themeStyle(props.invitation.theme)
  const s = resolveStyle(props.invitation.settings)
  if (s.accent) {
    v['--inv-accent'] = s.accent
    v['--inv-accent-contrast'] = contrastOn(s.accent)
  }
  if (s.text) v['--inv-text'] = s.text
  if (s.muted) v['--inv-muted'] = s.muted
  if (s.surface) v['--inv-surface'] = s.surface
  if (s.font !== 'theme') v['--inv-font-heading'] = `'${FONT_FAMILY[s.font]}', Georgia, serif`
  if (s.fontBody !== 'theme') v['--inv-font-body'] = `'${FONT_FAMILY[s.fontBody]}', Georgia, serif`
  return v
})
const label = computed(() => coupleLabel(props.invitation))
const dateValue = computed(() => weddingDate(props.invitation))
const guestName = computed(() => props.guest || copy.invitation.defaultGuest)
const coverImage = computed(
  () =>
    props.invitation.gallery.find((g) => g.is_cover)?.url ||
    props.invitation.gallery[0]?.url ||
    placeholderImage(label.value, theme.value.swatches[3], theme.value.swatches[2]),
)
const countdownTarget = computed(() => {
  const first = [...props.invitation.events].filter((e) => e.date).sort((a, b) => a.date.localeCompare(b.date))[0]
  const d = first ? parseLocalDate(first.date) : null
  if (!d) return null
  const [h, m] = (first?.start_time || '00:00').split(':').map(Number)
  d.setHours(h || 0, m || 0, 0, 0)
  return d
})

function on(key: SectionKey): boolean {
  return props.invitation.settings.sections[key] !== false
}
const people = computed<{ role: string; p: Person }[]>(() => [
  { role: 'Mempelai Pria', p: props.invitation.groom },
  { role: 'Mempelai Wanita', p: props.invitation.bride },
])
const sortedStories = computed(() => [...props.invitation.stories].sort((a, b) => a.date.localeCompare(b.date)))
const lightbox = ref<string | null>(null)

function timeRange(s: string, e: string) {
  if (!s) return ''
  return e ? `${s} – ${e} WIB` : `${s} WIB – selesai`
}

function scrollToSection(key: string) {
  const el = root.value?.querySelector<HTMLElement>(`[data-sec="${key}"]`)
  // Scroll the preview container itself — never the whole builder page.
  const box = root.value
  if (!el || !box) return
  const top = el.offsetTop
  if (typeof box.scrollTo === 'function') box.scrollTo({ top: Math.max(0, top - 12), behavior: 'smooth' })
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
defineExpose({ scrollToSection, replay: replayAll })
</script>

<template>
  <div
    ref="root"
    class="inv"
    @click.capture="onPreviewClick"
    @touchstart.capture="onTouchStart"
    :class="[isPreview ? 'inv-preview h-full overflow-y-auto overflow-x-hidden' : 'min-h-dvh overflow-x-hidden', `inv-h-${st.headingScale}`, `inv-t-${theme.id}`]"
    :style="cssVars"
  >
    <div data-sec="cover">
      <InvitationCover
        ref="coverRef"
        eager
        :couple="label"
        :date="formatDate(dateValue)"
        :guest="guestName"
        :image="coverImage"
        :decor="theme.decor"
        :intro="introKind"
        :mode="isPreview ? 'static' : 'overlay'"
        @open="emit('open')"
      />
    </div>

    <div class="relative flex flex-col">
      <OrnamentLayer v-if="theme.ornament && level === 'full'" :kind="theme.ornament" :class="isPreview ? '' : '!fixed'" />
      <DecorLayer v-if="!isPreview && level !== 'off'" :kind="theme.decor" class="!fixed" />

      <!-- Couple -->
      <section v-if="on('couple')" data-sec="couple" :style="{ order: ord('couple') }" class="inv-section">
        <div :data-reveal="reveal">
          <p v-if="invitation.greeting" class="inv-muted text-sm">{{ invitation.greeting }}</p>
          <p v-if="invitation.opening_text" class="mt-4 text-sm leading-relaxed">{{ invitation.opening_text }}</p>
          <div class="inv-divider" />
          <h2 class="inv-heading text-4xl">{{ label }}</h2>
        </div>
      </section>

      <!-- Date -->
      <section v-if="on('date') && dateValue" data-sec="date" :style="{ order: ord('date') }" class="inv-section !py-10">
        <div :data-reveal="reveal">
          <p class="inv-muted text-xs tracking-[0.3em]">SAVE THE DATE</p>
          <p class="inv-heading inv-accent mt-3 text-3xl">{{ formatLongDate(dateValue) }}</p>
        </div>
      </section>

      <!-- Countdown -->
      <section v-if="on('countdown') && countdownTarget" data-sec="countdown" :style="{ order: ord('countdown') }" class="inv-section !py-10">
        <div :data-reveal="reveal"><CountdownTimer :target="countdownTarget" /></div>
      </section>

      <!-- Profile -->
      <section v-if="on('profile')" data-sec="profile" :style="{ order: ord('profile') }" class="inv-section">
        <div :data-reveal="reveal" class="space-y-12">
          <div v-for="(item, i) in people" :key="item.role">
            <p class="inv-muted text-xs tracking-[0.25em]">{{ item.role.toUpperCase() }}</p>
            <div class="mx-auto mt-4 w-56">
              <img :src="item.p.photo || placeholderImage(item.p.nickname || item.p.name || item.role, theme.swatches[3], theme.swatches[2])" :alt="item.p.name || item.role" class="inv-photo" width="448" height="560" loading="lazy" decoding="async" />
            </div>
            <h3 class="inv-heading mt-5 text-3xl">{{ item.p.name || '—' }}</h3>
            <p v-if="item.p.father || item.p.mother" class="inv-muted mt-2 text-sm">
              Putra{{ i === 1 ? 'i' : '' }} dari {{ [item.p.father, item.p.mother].filter(Boolean).join(' & ') }}
            </p>
            <a v-if="item.p.instagram" :href="`https://instagram.com/${item.p.instagram.replace('@', '')}`" target="_blank" rel="noopener" class="inv-accent mt-2 inline-flex items-center gap-1 text-sm">
              <Instagram class="size-4" /> @{{ item.p.instagram.replace('@', '') }}
            </a>
            <p v-if="i === 0" class="inv-heading inv-accent mt-10 text-4xl">&amp;</p>
          </div>
        </div>
      </section>

      <!-- Story -->
      <section v-if="on('story') && (sortedStories.length || isPreview)" data-sec="story" :style="{ order: ord('story') }" class="inv-section">
        <h2 class="inv-heading text-3xl">Kisah Cinta</h2>
        <div class="inv-divider" />
        <p v-if="!sortedStories.length" class="inv-muted rounded border border-dashed p-4 text-sm" style="border-color: var(--inv-border)">{{ copy.empty.stories }}</p>
        <ol v-else class="mt-8 space-y-8 text-left">
          <li v-for="s in sortedStories" :key="s.id" :data-reveal="reveal" class="border-l pl-5" style="border-color: var(--inv-accent)">
            <p class="inv-accent text-xs">{{ formatDate(s.date) }}</p>
            <h3 class="inv-heading mt-1 text-2xl">{{ s.title }}</h3>
            <img v-if="s.image" :src="s.image" :alt="s.title" class="mt-3 w-full rounded object-cover" style="max-height: 14rem" width="800" height="600" loading="lazy" decoding="async" />
            <p class="mt-2 text-sm leading-relaxed">{{ s.description }}</p>
          </li>
        </ol>
      </section>

      <!-- Events -->
      <section v-if="on('events') && (invitation.events.length || isPreview)" data-sec="events" :style="{ order: ord('events') }" class="inv-section">
        <h2 class="inv-heading text-3xl">Rangkaian Acara</h2>
        <div class="inv-divider" />
        <p v-if="!invitation.events.length" class="inv-muted rounded border border-dashed p-4 text-sm" style="border-color: var(--inv-border)">{{ copy.empty.events }}</p>
        <div v-else class="mt-8 space-y-4">
          <article v-for="(e, i) in invitation.events" :key="e.id" :data-idx="i" :data-reveal="reveal" class="inv-card p-6">
            <h3 class="inv-heading inv-accent text-2xl">{{ e.name }}</h3>
            <p class="mt-3 text-sm">{{ formatLongDate(e.date) }}</p>
            <p class="inv-muted text-sm">{{ timeRange(e.start_time, e.end_time) }}</p>
            <p class="mt-3 font-medium">{{ e.venue }}</p>
            <p class="inv-muted text-sm">{{ e.address }}</p>
          </article>
        </div>
      </section>

      <!-- Maps -->
      <section v-if="on('maps') && invitation.events.some((e) => e.maps_url)" data-sec="maps" :style="{ order: ord('maps') }" class="inv-section !py-10">
        <div :data-reveal="reveal" class="space-y-3">
          <a v-for="e in invitation.events.filter((x) => x.maps_url)" :key="e.id" :data-idx="invitation.events.indexOf(e)" :href="e.maps_url" target="_blank" rel="noopener noreferrer" class="inv-btn inv-btn-outline w-full">
            <MapPin class="size-4" /> {{ copy.invitation.openMaps }} — {{ e.name }}
          </a>
        </div>
      </section>

      <!-- Gallery -->
      <section v-if="on('gallery') && (invitation.gallery.length || isPreview)" data-sec="gallery" :style="{ order: ord('gallery') }" class="inv-section">
        <h2 class="inv-heading text-3xl">Galeri</h2>
        <div class="inv-divider" />
        <p v-if="!invitation.gallery.length" class="inv-muted rounded border border-dashed p-4 text-sm" style="border-color: var(--inv-border)">{{ copy.empty.gallery }}</p>
        <div v-else class="mt-6 grid grid-cols-2 gap-2" style="max-width: 36rem">
          <button v-for="g in invitation.gallery" :key="g.id" type="button" :data-reveal="reveal" class="overflow-hidden" style="border-radius: var(--inv-radius)" @click="lightbox = g.url">
            <img :src="g.url" :alt="g.caption || 'Foto galeri'" class="aspect-[4/5] w-full object-cover transition-transform duration-500 hover:scale-105" width="600" height="750" loading="lazy" decoding="async" />
          </button>
        </div>
      </section>

      <!-- RSVP -->
      <section v-if="on('rsvp')" data-sec="rsvp" :style="{ order: ord('rsvp') }" class="inv-section">
        <div :data-reveal="reveal">
          <h2 class="inv-heading text-3xl">Konfirmasi Kehadiran</h2>
          <div class="inv-divider" />
          <p v-if="invitation.settings.rsvp_deadline" class="inv-muted mb-5 text-sm">Mohon konfirmasi sebelum {{ formatDate(invitation.settings.rsvp_deadline) }}.</p>
          <RsvpForm :disabled="isPreview && !props.interactive" @submit="emit('rsvp', $event)" />
        </div>
      </section>

      <!-- Guest messages -->
      <section v-if="on('messages')" data-sec="messages" :style="{ order: ord('messages') }" class="inv-section">
        <div :data-reveal="reveal">
          <h2 class="inv-heading text-3xl">Ucapan &amp; Doa</h2>
          <div class="inv-divider" />
          <GuestMessageForm :disabled="isPreview && !props.interactive" @submit="emit('message', $event)" />
          <ul v-if="messages.length" class="mt-8 max-h-96 space-y-3 overflow-y-auto text-left">
            <li v-for="m in messages" :key="m.id" class="inv-card p-4">
              <p class="text-sm font-medium">{{ m.name }}</p>
              <p class="inv-muted mt-1 text-sm whitespace-pre-line">{{ m.message }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- Digital gift -->
      <section v-if="on('gift') && (invitation.gifts.length || isPreview)" data-sec="gift" :style="{ order: ord('gift') }" class="inv-section">
        <div :data-reveal="reveal">
          <h2 class="inv-heading text-3xl">Amplop Digital</h2>
          <div class="inv-divider" />
          <p v-if="!invitation.gifts.length" class="inv-muted rounded border border-dashed p-4 text-sm" style="border-color: var(--inv-border)">{{ copy.empty.gifts }}</p>
          <GiftSection v-else :accounts="invitation.gifts" :disabled="isPreview && !props.interactive" @confirm="emit('gift', $event)" />
        </div>
      </section>

      <!-- Closing -->
      <section data-sec="closing" style="order: 999" class="inv-section">
        <div :data-reveal="reveal">
          <p v-if="invitation.closing_text" class="text-sm leading-relaxed">{{ invitation.closing_text }}</p>
          <div class="inv-divider" />
          <p class="inv-muted text-sm">Kami yang berbahagia,</p>
          <p class="inv-heading mt-2 text-4xl">{{ label }}</p>
        </div>
      </section>
    </div>

    <!-- Lightbox -->
    <Teleport to="body" :disabled="isPreview && !props.interactive">
      <div v-if="lightbox" class="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Foto galeri" @click="lightbox = null">
        <button type="button" class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Tutup" @click="lightbox = null"><X class="size-5" /></button>
        <img :src="lightbox" alt="" class="max-h-full max-w-full rounded object-contain" />
      </div>
    </Teleport>
  </div>
</template>
