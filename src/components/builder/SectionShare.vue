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

const DEFAULT_TEMPLATE = 'Kepada Yth. {nama},\n\nDengan penuh kebahagiaan kami mengundang Anda ke pernikahan {pasangan}.\nBuka undangan digital kami di:\n{link}\n\nTerima kasih atas doa dan restunya.'
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
  if (await copyText(text)) toast.success(copy.common.copied ?? 'Tersalin')
}
async function copyAll() {
  if (await copyText(guests.value.map((g) => `${g.name}\t${g.link}`).join('\n'))) toast.success(`${guests.value.length} tautan disalin (nama ⇥ tautan, siap tempel ke spreadsheet)`)
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
  <BuilderSection :title="copy.builder.sections.share" description="Buat tautan khusus untuk setiap tamu dan kirim lewat WhatsApp. Nama tamu muncul di cover undangan.">
    <p v-if="inv.status !== 'published'" class="flex items-start gap-2 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn" role="status"><AlertTriangle class="mt-0.5 size-4 shrink-0" /> Tautan baru bisa dibuka tamu setelah undangan dipublikasikan.</p>
    <p v-if="!ready" class="rounded-lg border border-dashed border-line p-4 text-sm text-muted">Isi alamat undangan (slug) di bagian Info dasar terlebih dahulu.</p>

    <template v-else>
      <div class="card flex flex-col items-center gap-3 p-4 sm:flex-row">
        <img v-if="qr" :src="qr" alt="Kode QR tautan undangan" class="size-32 rounded-lg border border-line bg-white p-1" />
        <div class="min-w-0 flex-1 space-y-2 text-center sm:text-left">
          <p class="text-sm font-semibold">Tautan umum</p>
          <p class="break-all text-xs text-muted">{{ base }}</p>
          <div class="flex flex-wrap justify-center gap-2 sm:justify-start">
            <button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-[13px] font-medium hover:bg-paper" @click="copyOne(base)"><Copy class="size-4" /> Salin</button>
            <a v-if="qr" :href="qr" :download="`qr-${inv.slug}.png`" class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-[13px] font-medium hover:bg-paper"><Download class="size-4" /> Unduh QR</a>
          </div>
        </div>
      </div>

      <FormField label="Daftar tamu" hint="Satu nama per baris. Tambahkan nomor WhatsApp setelah tanda | agar pesan langsung terbuka ke kontak itu, mis. Budi Santoso | 0812xxxx" v-slot="{ id }">
        <textarea :id="id" :value="names" rows="6" class="field-input font-mono text-[13px]" placeholder="Budi Santoso | 081234567890&#10;Keluarga Bapak Andi" @input="inv.settings.guest_names = ($event.target as HTMLTextAreaElement).value" />
      </FormField>

      <FormField label="Pesan WhatsApp" hint="Gunakan {nama}, {pasangan}, dan {link}." v-slot="{ id }">
        <textarea :id="id" :value="template" rows="6" class="field-input text-[13px]" @input="inv.settings.share_template = ($event.target as HTMLTextAreaElement).value" />
      </FormField>
      <button v-if="inv.settings.share_template" type="button" class="-mt-3 text-xs text-muted hover:text-ink" @click="inv.settings.share_template = ''">Kembalikan pesan awal</button>

      <div v-if="guests.length">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-sm font-semibold">{{ guests.length }} tamu</h3>
          <button type="button" class="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:underline" @click="copyAll"><Copy class="size-4" /> Salin semua tautan</button>
        </div>
        <ul class="card max-h-96 divide-y divide-line overflow-y-auto">
          <li v-for="g in guests" :key="g.name" class="flex items-center gap-2 px-3 py-2">
            <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ g.name }}</span><span class="block truncate text-xs text-muted">{{ g.link }}</span></span>
            <button type="button" class="rounded-lg p-2 text-muted hover:bg-black/5 hover:text-ink" :aria-label="`Salin tautan ${g.name}`" @click="copyOne(g.link)"><Copy class="size-4" /></button>
            <a :href="waLink(g)" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-sage px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90" :aria-label="`Kirim ke ${g.name} lewat WhatsApp`"><MessageCircle class="size-4" /> Kirim</a>
          </li>
        </ul>
      </div>
      <p v-else class="flex items-center gap-1.5 text-xs text-muted"><Check class="size-3.5" /> Tambahkan nama tamu untuk membuat tautan pribadi.</p>
    </template>
  </BuilderSection>
</template>
