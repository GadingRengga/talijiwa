<script setup lang="ts">
import { AlertTriangle, Check, Copy, Download, MessageCircle } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import BuilderSection from './BuilderSection.vue'
import FormField from '@/components/ui/FormField.vue'
import { useClipboard } from '@/composables/useClipboard'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'
import { coupleLabel } from '@/utils/invitation'

const inv = defineModel<InvitationData>({ required: true })
const toast = useToast()
const { copy: copyText } = useClipboard()

const DEFAULT_TEMPLATE = copy.builder.share.defaultTemplate
const base = computed(() => `${window.location.origin}/invite/${inv.value.slug}`)
const ready = computed(() => inv.value.slug.length >= 3)
const names = computed(() => inv.value.settings.guest_names ?? '')
const template = computed(() => inv.value.settings.share_template || DEFAULT_TEMPLATE)

interface Guest { name: string; phone: string; link: string }
const guests = computed<Guest[]>(() => {
  const seen = new Set<string>()
  const out: Guest[] = []
  for (const line of names.value.split('\n')) {
    const [rawName, rawPhone = ''] = line.split('|').map((s) => s.trim())
    const name = (rawName ?? '').slice(0, 60)
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    let phone = rawPhone.replace(/[^\d]/g, '')
    if (phone.startsWith('0')) phone = '62' + phone.slice(1)
    out.push({ name, phone, link: `${base.value}?to=${encodeURIComponent(name)}` })
    if (out.length >= 500) break
  }
  return out
})
const message = (g: { name: string; link: string }) => template.value.replaceAll('{nama}', g.name).replaceAll('{pasangan}', coupleLabel(inv.value)).replaceAll('{link}', g.link)
const waLink = (g: Guest) => `https://wa.me/${g.phone}?text=${encodeURIComponent(message(g))}`

async function copyOne(text: string) {
  if (await copyText(text)) toast.success(copy.common.copied)
}
async function copyAll() {
  if (await copyText(guests.value.map((g) => `${g.name}\t${g.link}`).join('\n'))) toast.success(`${guests.value.length} ${copy.builder.share.copyAllDone}`)
}

// QR code of the main link (loaded on demand to keep the builder bundle small).
const qr = ref('')
let qrTimer: ReturnType<typeof setTimeout> | undefined
watch(
  [base, ready],
  () => {
    clearTimeout(qrTimer)
    if (!ready.value) return void (qr.value = '')
    qrTimer = setTimeout(async () => {
      const { default: QRCode } = await import('qrcode')
      qr.value = await QRCode.toDataURL(base.value, { margin: 2, width: 640, errorCorrectionLevel: 'M' })
    }, 300)
  },
  { immediate: true },
)
</script>

<template>
  <BuilderSection :title="copy.builder.sections.share" :description="copy.builder.share.desc">
    <p v-if="inv.status !== 'published'" class="flex items-start gap-2 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn" role="status"><AlertTriangle class="mt-0.5 size-4 shrink-0" /> {{ copy.builder.share.notPublished }}</p>
    <p v-if="!ready" class="rounded-lg border border-dashed border-line p-4 text-sm text-muted">{{ copy.builder.share.needSlug }}</p>

    <template v-else>
      <div class="card flex flex-col items-center gap-3 p-4 sm:flex-row">
        <img v-if="qr" :src="qr" :alt="copy.builder.share.qrAlt" class="size-32 rounded-lg border border-line bg-white p-1" />
        <div class="min-w-0 flex-1 space-y-2 text-center sm:text-left">
          <p class="text-sm font-semibold">{{ copy.builder.share.generalLink }}</p>
          <p class="break-all text-xs text-muted">{{ base }}</p>
          <div class="flex flex-wrap justify-center gap-2 sm:justify-start">
            <button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-[13px] font-medium hover:bg-paper" @click="copyOne(base)"><Copy class="size-4" /> {{ copy.builder.share.copyLink }}</button>
            <a v-if="qr" :href="qr" :download="`qr-${inv.slug}.png`" class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-[13px] font-medium hover:bg-paper"><Download class="size-4" /> {{ copy.builder.share.downloadQr }}</a>
          </div>
        </div>
      </div>

      <FormField :label="copy.builder.share.guestList" :hint="copy.builder.share.guestHint" v-slot="{ id }">
        <textarea :id="id" :value="names" rows="6" class="field-input font-mono text-[13px]" :placeholder="copy.builder.share.guestPh" @input="inv.settings.guest_names = ($event.target as HTMLTextAreaElement).value" />
      </FormField>

      <FormField :label="copy.builder.share.waMessage" :hint="copy.builder.share.waHint" v-slot="{ id }">
        <textarea :id="id" :value="template" rows="6" class="field-input text-[13px]" @input="inv.settings.share_template = ($event.target as HTMLTextAreaElement).value" />
      </FormField>
      <button v-if="inv.settings.share_template" type="button" class="-mt-3 text-xs text-muted hover:text-ink" @click="inv.settings.share_template = ''">{{ copy.builder.share.resetTemplate }}</button>

      <div v-if="guests.length">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-sm font-semibold">{{ guests.length }} {{ copy.builder.share.guestUnit }}</h3>
          <button type="button" class="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:underline" @click="copyAll"><Copy class="size-4" /> {{ copy.builder.share.copyAll }}</button>
        </div>
        <ul class="card max-h-96 divide-y divide-line overflow-y-auto">
          <li v-for="g in guests" :key="g.name" class="flex items-center gap-2 px-3 py-2">
            <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ g.name }}</span><span class="block truncate text-xs text-muted">{{ g.link }}</span></span>
            <button type="button" class="rounded-lg p-2 text-muted hover:bg-black/5 hover:text-ink" :aria-label="`${copy.builder.share.copyLinkOf} ${g.name}`" @click="copyOne(g.link)"><Copy class="size-4" /></button>
            <a :href="waLink(g)" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-sage px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90" :aria-label="`${copy.builder.share.sendTo} ${g.name} ${copy.builder.share.sendViaWa}`"><MessageCircle class="size-4" /> {{ copy.builder.share.send }}</a>
          </li>
        </ul>
      </div>
      <p v-else class="flex items-center gap-1.5 text-xs text-muted"><Check class="size-3.5" /> {{ copy.builder.share.emptyGuests }}</p>
    </template>
  </BuilderSection>
</template>
