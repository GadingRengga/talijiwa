<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import FormField from '@/components/ui/FormField.vue'
import { company } from '@/config/company'
import { copy } from '@/config/copy'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const form = reactive({ email: '' })
const redeem = reactive({ code: '', email: '' })
const error = ref('')
const redeemError = ref('')
const sent = ref(false)
const busy = ref(false)
const redeemBusy = ref(false)

function redirectTarget() {
  return typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/pasangan') ? route.query.redirect : '/pasangan'
}

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await auth.requestLink(form.email)
    sent.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : copy.common.genericError
  } finally {
    busy.value = false
  }
}

/**
 * One-time access code issued by the admin after payment.
 * Credential-style: code + email, reusable; the code stays attached to the
 * order so a forgotten code is recovered from OrderDetail.
 */
async function submitRedeem() {
  redeemError.value = ''
  redeemBusy.value = true
  try {
    await auth.loginWithCode(redeem.code, redeem.email)
    await router.replace(redirectTarget())
  } catch (e) {
    redeemError.value = e instanceof Error ? e.message : copy.common.genericError
  } finally {
    redeemBusy.value = false
  }
}
</script>

<template>
  <main class="grid min-h-dvh place-items-center px-4">
    <div class="w-full max-w-sm">
      <p class="mb-8 text-center font-display text-3xl font-semibold">{{ company.company_name }}</p>
      <div v-if="sent" class="card space-y-2 p-6 text-center">
        <h1 class="text-lg font-semibold">{{ copy.couple.linkSentTitle }}</h1>
        <p class="text-sm text-muted">{{ copy.couple.linkSentMessage }}</p>
      </div>
      <!-- Primary: one-time access code issued by the admin after payment. -->
      <form v-else class="card space-y-4 p-6" novalidate @submit.prevent="submitRedeem">
        <div>
          <h1 class="text-lg font-semibold">{{ copy.couple.loginTitle }}</h1>
          <p class="text-sm text-muted">{{ copy.couple.redeemSubtitle }}</p>
        </div>
        <FormField :label="copy.couple.codeLabel" v-slot="{ id }"><input :id="id" v-model="redeem.code" class="field-input font-mono uppercase" :placeholder="copy.couple.codePh" autocomplete="off" required /></FormField>
        <FormField :label="copy.auth.email" v-slot="{ id }"><input :id="id" v-model="redeem.email" type="email" class="field-input" autocomplete="email" required /></FormField>
        <p v-if="redeemError" class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{{ redeemError }}</p>
        <AppButton type="submit" class="w-full" :loading="redeemBusy">{{ copy.couple.redeemCta }}</AppButton>
        <p class="text-center text-xs text-muted">{{ copy.couple.noCodeHint }}</p>
      </form>

      <!-- Fallback: magic link for customers who already redeemed once. -->
      <details v-if="!sent" class="card mt-3 p-6">
        <summary class="cursor-pointer text-sm font-semibold">{{ copy.couple.magicLinkTitle }}</summary>
        <form class="mt-4 space-y-4" novalidate @submit.prevent="submit">
          <p class="text-sm text-muted">{{ copy.couple.loginSubtitle }}</p>
          <FormField :label="copy.auth.email" v-slot="{ id }"><input :id="id" v-model="form.email" type="email" class="field-input" autocomplete="email" required /></FormField>
          <p v-if="error" class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{{ error }}</p>
          <AppButton type="submit" class="w-full" :loading="busy">{{ copy.couple.sendLink }}</AppButton>
        </form>
      </details>
    </div>
  </main>
</template>
