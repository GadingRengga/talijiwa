<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { company } from '@/config/company'
import { copy } from '@/config/copy'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

/** Couple portal nav: customers only see their own invitations, never admin pages. */
const nav = computed(() => [
  { to: '/pasangan', label: copy.couple.navDashboard, active: route.name === 'couple-dashboard' },
])

function logout() {
  auth.logout()
  router.push({ name: 'couple-login' })
}
</script>

<template>
  <div class="min-h-dvh bg-paper">
    <header class="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <RouterLink :to="{ name: 'couple-dashboard' }" class="font-display text-xl font-semibold tracking-tight">{{ company.company_name }}</RouterLink>
          <span class="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">{{ copy.couple.portalBadge }}</span>
          <nav v-if="auth.isAuthenticated" class="hidden items-center gap-1 sm:flex" aria-label="Menu pasangan">
            <RouterLink
              v-for="n in nav"
              :key="n.to"
              :to="n.to"
              class="rounded-lg px-3 py-1.5 text-sm"
              :class="n.active ? 'bg-brand-soft font-medium text-brand' : 'text-muted hover:bg-black/5'"
              :aria-current="n.active ? 'page' : undefined"
            >
              {{ n.label }}
            </RouterLink>
          </nav>
        </div>
        <button v-if="auth.isAuthenticated" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-black/5" @click="logout">
          <LogOut class="size-4" /> {{ copy.auth.logout }}
        </button>
      </div>
    </header>
    <RouterView />
  </div>
</template>
