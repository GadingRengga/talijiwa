<script setup lang="ts">
import { reactive, ref } from 'vue'

defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ submit: [payload: { name: string; message: string }] }>()
const form = reactive({ name: '', message: '', website: '' })
const error = ref('')

function submit() {
  error.value = ''
  if (form.website) return
  if (form.name.trim().length < 2) return void (error.value = 'Nama wajib diisi.')
  if (form.message.trim().length < 3) return void (error.value = 'Ucapan terlalu pendek.')
  emit('submit', { name: form.name, message: form.message })
  form.name = ''
  form.message = ''
}
</script>

<template>
  <form class="space-y-3 text-left" novalidate @submit.prevent="submit">
    <input v-model="form.name" class="inv-input" placeholder="Nama" maxlength="80" :disabled="disabled" aria-label="Nama" />
    <textarea v-model="form.message" rows="3" maxlength="500" class="inv-input" placeholder="Tulis ucapan dan doa" :disabled="disabled" aria-label="Ucapan" />
    <input v-model="form.website" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true" />
    <p v-if="error" class="text-sm" style="color: #e0786a" role="alert">{{ error }}</p>
    <button type="submit" class="inv-btn w-full" :disabled="disabled">Kirim Ucapan</button>
  </form>
</template>
