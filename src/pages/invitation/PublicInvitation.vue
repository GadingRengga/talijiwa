<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import InvitationRenderer from '@/components/invitation/InvitationRenderer.vue'
import MusicPlayer from '@/components/invitation/MusicPlayer.vue'
import { useSeo } from '@/composables/useSeo'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import { analyticsService } from '@/services/analytics'
import { invitationService } from '@/services/invitations'
import { rsvpService } from '@/services/rsvp'
import type { Attendance, GiftType, GuestMessage, InvitationData } from '@/types'
import { sanitizeGuestName } from '@/utils/format'
import { coupleLabel } from '@/utils/invitation'

/** previewId set = admin preview (any status, no view tracking). Otherwise public /invite/:slug. */
const props = defineProps<{ previewId?: string }>()
const route = useRoute()
const toast = useToast()
const seo = useSeo()

interface RsvpPayload { name: string; whatsapp: string; guest_count: number; attendance: Attendance; message: string }
interface GiftPayload { name: string; gift_type: GiftType; amount: number | null; message: string }

type State = 'loading' | 'ok' | 'notfound' | 'notpublished' | 'unavailable'
const state = ref<State>('loading')
const inv = ref<InvitationData | null>(null)
const messages = ref<GuestMessage[]>([])
const opened = ref(false)
const music = ref<InstanceType<typeof MusicPlayer> | null>(null)
const guest = ref('')

async function load() {
  state.value = 'loading'
  guest.value = sanitizeGuestName(route.query.to)
  try {
    const data = props.previewId ? await invitationService.get(props.previewId) : await invitationService.getBySlug(String(route.params.slug))
    if (!data) return void (state.value = 'notfound')
    if (!props.previewId) {
      // Drafts must look identical to "not found" for guessable slugs? The spec asks for distinct messages.
      if (data.status === 'draft') return void (state.value = 'notpublished')
      if (data.status === 'archived') return void (state.value = 'unavailable')
    }
    inv.value = data
    state.value = 'ok'
    const label = coupleLabel(data)
    seo.apply({
      title: data.settings.seo_title || `${label} — Wedding Invitation`,
      description: data.settings.seo_description || `Undangan pernikahan ${label}.`,
      image: data.gallery.find((g) => g.is_cover)?.url,
      noindex: data.settings.seo_noindex || !!props.previewId,
    })
    messages.value = await rsvpService.listMessages(data.id, true)
    if (!props.previewId) void analyticsService.trackView(data.id)
  } catch {
    state.value = 'notfound'
  }
}

onMounted(load)
watch(() => route.params.slug, load)

// Keep the page locked on the cover until the guest opens the invitation.
watch(
  [state, opened],
  () => {
    document.documentElement.style.overflow = state.value === 'ok' && !opened.value ? 'hidden' : ''
  },
  { immediate: true },
)
onBeforeUnmount(() => (document.documentElement.style.overflow = ''))

function onOpen() {
  opened.value = true
  if (inv.value?.settings.music_enabled) void music.value?.play()
}

async function run(action: () => Promise<void>, ok: string) {
  try {
    await action()
    toast.success(ok)
  } catch {
    toast.error(copy.common.genericError)
  }
}
const onRsvp = (p: RsvpPayload) => run(() => rsvpService.createRsvp({ ...p, invitation_id: inv.value!.id }), 'Konfirmasi terkirim')
const onMessage = (p: { name: string; message: string }) =>
  run(async () => {
    await rsvpService.createMessage({ ...p, invitation_id: inv.value!.id })
    messages.value = await rsvpService.listMessages(inv.value!.id, true)
  }, 'Ucapan terkirim')
const onGift = (p: GiftPayload) => run(() => rsvpService.createGiftConfirmation({ ...p, invitation_id: inv.value!.id }), 'Konfirmasi terkirim')
</script>

<template>
  <div v-if="state === 'loading'" class="grid min-h-dvh place-items-center bg-[#f6efe3] text-sm text-[#8a7566]" role="status">{{ copy.common.loading }}</div>

  <main v-else-if="state !== 'ok'" class="grid min-h-dvh place-items-center bg-[#f6efe3] px-6 text-center text-[#4a3426]">
    <div>
      <h1 class="font-display break-words text-3xl sm:text-4xl">
        {{ state === 'notpublished' ? copy.invitation.notPublished : state === 'unavailable' ? copy.invitation.unavailable : copy.invitation.notFound }}
      </h1>
      <p class="mt-3 text-sm text-[#8a7566]">Periksa kembali tautan yang Anda terima, atau hubungi pengirim undangan.</p>
    </div>
  </main>

  <template v-else-if="inv">
    <div v-if="previewId" class="fixed inset-x-0 top-0 z-[70] flex items-center justify-between bg-ink px-4 py-1.5 text-xs text-white">
      <span>Pratinjau admin{{ inv.status !== 'published' ? ' — belum dipublikasikan' : '' }}</span>
      <RouterLink :to="`/admin/invitations/${inv.id}/edit`" class="underline">Kembali ke builder</RouterLink>
    </div>
    <InvitationRenderer :invitation="inv" :guest="guest" :messages="messages" @open="onOpen" @rsvp="onRsvp" @message="onMessage" @gift="onGift" />
    <MusicPlayer v-if="inv.settings.music_enabled" ref="music" :url="inv.settings.music_url" />
  </template>
</template>
