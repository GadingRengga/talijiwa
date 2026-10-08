<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import FormField from '@/components/ui/FormField.vue'
import { company } from '@/config/company'
import { copy } from '@/config/copy'
import { useMock } from '@/services/supabase/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const form = reactive({ email: '', password: '' })
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await auth.login(form.email, form.password)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/admin') ? route.query.redirect : '/admin'
    await router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : copy.common.genericError
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="grid min-h-dvh place-items-center px-4">
    <div class="w-full max-w-sm">
      <p class="mb-8 text-center font-display text-3xl font-semibold">{{ company.company_name }}</p>
      <form class="card space-y-4 p-6" novalidate @submit.prevent="submit">
        <div>
          <h1 class="text-lg font-semibold">{{ copy.auth.title }}</h1>
          <p class="text-sm text-muted">{{ copy.auth.subtitle }}</p>
        </div>
        <FormField :label="copy.auth.email" v-slot="{ id }"><input :id="id" v-model="form.email" type="email" class="field-input" autocomplete="username" required /></FormField>
        <FormField :label="copy.auth.password" v-slot="{ id }"><input :id="id" v-model="form.password" type="password" class="field-input" autocomplete="current-password" required /></FormField>
        <p v-if="error" class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{{ error }}</p>
        <AppButton type="submit" class="w-full" :loading="busy">{{ copy.auth.submit }}</AppButton>
        <p v-if="useMock" class="text-center text-xs text-muted">{{ copy.auth.mockHint }}</p>
      </form>
    </div>
  </main>
</template>
