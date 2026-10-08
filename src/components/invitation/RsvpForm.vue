<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { Attendance } from '@/types'
import { normalizeWhatsapp } from '@/utils/format'

defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{
  submit: [payload: { name: string; whatsapp: string; guest_count: number; attendance: Attendance; message: string }]
}>()

const form = reactive({ name: '', whatsapp: '', guest_count: 1, attendance: 'attending' as Attendance, message: '', website: '' })
const error = ref('')
const sent = ref(false)
const busy = ref(false)

async function submit() {
  error.value = ''
  if (form.website) return // honeypot: bots fill hidden fields
  if (form.name.trim().length < 2) return void (error.value = 'Nama wajib diisi.')
  const wa = normalizeWhatsapp(form.whatsapp)
  if (wa.length < 10 || wa.length > 15) return void (error.value = 'Nomor WhatsApp tidak valid.')
  busy.value = true
  try {
    emit('submit', { name: form.name, whatsapp: wa, guest_count: form.guest_count, attendance: form.attendance, message: form.message })
    sent.value = true
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <p v-if="sent" class="inv-card p-6 text-sm">Terima kasih, konfirmasi kehadiran Anda sudah kami terima.</p>
  <form v-else class="space-y-3 text-left" novalidate @submit.prevent="submit">
    <input v-model="form.name" class="inv-input" placeholder="Nama lengkap" maxlength="80" autocomplete="name" :disabled="disabled" aria-label="Nama lengkap" />
    <input v-model="form.whatsapp" class="inv-input" placeholder="Nomor WhatsApp" inputmode="tel" autocomplete="tel" :disabled="disabled" aria-label="Nomor WhatsApp" />
    <div class="grid grid-cols-2 gap-2 sm:gap-3">
      <select v-model="form.attendance" class="inv-input min-w-0" :disabled="disabled" aria-label="Kehadiran">
        <option value="attending">Hadir</option>
        <option value="not_attending">Tidak hadir</option>
      </select>
      <input v-model.number="form.guest_count" type="number" min="1" max="20" class="inv-input min-w-0" :disabled="disabled || form.attendance === 'not_attending'" aria-label="Jumlah tamu" />
    </div>
    <textarea v-model="form.message" rows="3" maxlength="500" class="inv-input" placeholder="Pesan (opsional)" :disabled="disabled" aria-label="Pesan" />
    <input v-model="form.website" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true" />
    <p v-if="error" class="text-sm" style="color: #e0786a" role="alert">{{ error }}</p>
    <button type="submit" class="inv-btn w-full" :disabled="disabled || busy">Kirim Konfirmasi</button>
  </form>
</template>
