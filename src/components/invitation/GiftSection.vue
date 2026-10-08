<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { copy } from '@/config/copy'
import { useClipboard } from '@/composables/useClipboard'
import type { GiftAccount, GiftType } from '@/types'

defineProps<{ accounts: GiftAccount[]; disabled?: boolean }>()
const emit = defineEmits<{
  confirm: [payload: { name: string; gift_type: GiftType; amount: number | null; message: string }]
}>()

const { copy: copyText } = useClipboard()
const copiedId = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

async function copyNumber(a: GiftAccount) {
  if (await copyText(a.number)) {
    copiedId.value = a.id
    clearTimeout(timer)
    timer = setTimeout(() => (copiedId.value = null), 1800)
  }
}

const form = reactive({ name: '', gift_type: 'bank_transfer' as GiftType, amount: '' as string, message: '' })
const sent = ref(false)
const error = ref('')

function confirm() {
  error.value = ''
  if (form.name.trim().length < 2) return void (error.value = 'Nama wajib diisi.')
  const amount = form.amount === '' ? null : Number(form.amount)
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) return void (error.value = 'Nominal tidak valid.')
  emit('confirm', { name: form.name, gift_type: form.gift_type, amount, message: form.message })
  sent.value = true
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="a in accounts" :key="a.id" class="inv-card p-5 text-left">
      <p class="inv-muted text-xs">{{ a.kind === 'bank' ? 'Transfer Bank' : 'E-Wallet' }}</p>
      <p class="inv-heading mt-1 text-2xl">{{ a.provider }}</p>
      <p class="mt-2 break-all text-lg tracking-wider tabular-nums">{{ a.number }}</p>
      <p class="inv-muted text-sm">a.n. {{ a.holder }}</p>
      <button type="button" class="inv-btn inv-btn-outline mt-4 w-full" @click="copyNumber(a)">
        <Check v-if="copiedId === a.id" class="size-4" />
        <Copy v-else class="size-4" />
        {{ copiedId === a.id ? copy.invitation.copied : copy.invitation.copyNumber }}
      </button>
    </div>

    <p v-if="sent" class="inv-card p-5 text-sm">Terima kasih atas kebaikan Anda.</p>
    <form v-else-if="accounts.length" class="space-y-3 pt-4 text-left" novalidate @submit.prevent="confirm">
      <p class="inv-muted text-center text-sm">Sudah mengirim hadiah? Beri tahu kami.</p>
      <input v-model="form.name" class="inv-input" placeholder="Nama" maxlength="80" :disabled="disabled" aria-label="Nama" />
      <div class="grid grid-cols-2 gap-2 sm:gap-3">
        <select v-model="form.gift_type" class="inv-input min-w-0" :disabled="disabled" aria-label="Jenis hadiah">
          <option value="bank_transfer">Transfer bank</option>
          <option value="e_wallet">E-wallet</option>
          <option value="cash">Tunai</option>
          <option value="other">Lainnya</option>
        </select>
        <input v-model="form.amount" type="number" min="0" class="inv-input min-w-0" placeholder="Nominal (Rp)" :disabled="disabled" aria-label="Nominal" />
      </div>
      <textarea v-model="form.message" rows="2" maxlength="500" class="inv-input" placeholder="Pesan (opsional)" :disabled="disabled" aria-label="Pesan" />
      <p v-if="error" class="text-sm" style="color: #e0786a" role="alert">{{ error }}</p>
      <button type="submit" class="inv-btn w-full" :disabled="disabled">Kirim Konfirmasi</button>
    </form>
  </div>
</template>
