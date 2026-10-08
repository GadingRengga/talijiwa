<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { company } from '@/config/company'
import { copy } from '@/config/copy'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push({ name: 'couple-login' })
}
</script>

<template>
  <div class="min-h-dvh bg-paper">
    <header class="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        <RouterLink :to="{ name: 'couple-dashboard' }" class="font-display text-xl font-semibold tracking-tight">{{ company.company_name }}</RouterLink>
        <button v-if="auth.isAuthenticated" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-black/5" @click="logout">
          <LogOut class="size-4" /> {{ copy.auth.logout }}
        </button>
      </div>
    </header>
    <RouterView />
  </div>
</template>
