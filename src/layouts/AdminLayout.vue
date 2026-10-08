<script setup lang="ts">
import { BarChart3, FileHeart, LayoutDashboard, LogOut, Menu, Palette, PanelLeftClose, PanelLeftOpen, Settings, ShoppingBag, Users, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { company } from '@/config/company'
import { copy } from '@/config/copy'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const drawer = ref(false)

const COLLAPSE_KEY = 'talijiwa:sidebar-collapsed'
const collapsed = ref(false)
try {
  collapsed.value = localStorage.getItem(COLLAPSE_KEY) === '1'
} catch {
  /* ignore */
}
function toggleCollapse() {
  collapsed.value = !collapsed.value
  try {
    localStorage.setItem(COLLAPSE_KEY, collapsed.value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

const items = [
  { to: '/admin', label: copy.nav.dashboard, icon: LayoutDashboard, exact: true },
  { to: '/admin/customers', label: copy.nav.customers, icon: Users },
  { to: '/admin/orders', label: copy.nav.orders, icon: ShoppingBag },
  { to: '/admin/invitations', label: copy.nav.invitations, icon: FileHeart },
  { to: '/admin/themes', label: copy.nav.themes, icon: Palette },
  { to: '/admin/analytics', label: copy.nav.analytics, icon: BarChart3 },
  { to: '/admin/settings', label: copy.nav.settings, icon: Settings },
]

const isActive = (to: string, exact?: boolean) => (exact ? route.path === to : route.path.startsWith(to))
// The builder needs the full viewport, so it renders without the page padding wrapper.
const fullBleed = () => route.name === 'admin-invitation-edit'

watch(() => route.fullPath, () => (drawer.value = false))

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-dvh lg:grid" :class="collapsed ? 'lg:grid-cols-[4.25rem_1fr]' : 'lg:grid-cols-[15rem_1fr]'">
    <!-- Mobile top bar -->
    <header class="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-panel px-4 py-3 lg:hidden">
      <button class="rounded-lg p-1.5 hover:bg-black/5" :aria-label="copy.admin.openMenu" @click="drawer = true">
        <Menu class="size-5" />
      </button>
      <span class="font-display text-lg font-semibold">{{ company.company_name }}</span>
      <span class="size-8" />
    </header>

    <div v-if="drawer" class="fixed inset-0 z-40 bg-black/40 lg:hidden" @click="drawer = false" />

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-panel transition-all lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0"
      :class="[drawer ? 'translate-x-0' : '-translate-x-full', collapsed ? 'lg:w-[4.25rem]' : 'lg:w-60']"
    >
      <div class="flex items-center justify-between px-5 py-5" :class="collapsed ? 'lg:justify-center lg:px-0' : ''">
        <span class="font-display text-xl font-semibold tracking-tight" :class="collapsed ? 'lg:hidden' : ''">{{ company.company_name }}</span>
        <span v-if="collapsed" class="hidden font-display text-xl font-semibold lg:block" aria-hidden="true">{{ company.company_name.charAt(0) }}</span>
        <button class="rounded-lg p-1 hover:bg-black/5 lg:hidden" :aria-label="copy.admin.closeMenu" @click="drawer = false">
          <X class="size-5" />
        </button>
        <button class="hidden rounded-lg p-1.5 text-muted hover:bg-black/5 lg:block" :aria-label="collapsed ? copy.admin.expandMenu : copy.admin.collapseMenu" :title="collapsed ? copy.admin.expandMenu : copy.admin.collapseMenu" @click="toggleCollapse">
          <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" class="size-5" />
        </button>
      </div>
      <nav class="flex-1 space-y-1 px-3" :class="collapsed ? 'lg:px-2' : ''" :aria-label="copy.nav.menuAdmin">
        <RouterLink
          v-for="i in items"
          :key="i.to"
          :to="i.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="[isActive(i.to, i.exact) ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-black/5 hover:text-ink', collapsed ? 'lg:justify-center lg:px-0' : '']"
          :aria-current="isActive(i.to, i.exact) ? 'page' : undefined"
          :title="collapsed ? i.label : undefined"
        >
          <component :is="i.icon" class="size-4 shrink-0" aria-hidden="true" />
          <span :class="collapsed ? 'lg:hidden' : ''">{{ i.label }}</span>
        </RouterLink>
      </nav>
      <div class="border-t border-line p-3" :class="collapsed ? 'lg:px-2' : ''">
        <p class="truncate px-3 pb-2 text-xs text-muted" :class="collapsed ? 'lg:hidden' : ''">{{ auth.email }}</p>
        <button
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink"
          :class="collapsed ? 'lg:justify-center lg:px-0' : ''"
          :title="collapsed ? copy.auth.logout : undefined"
          @click="logout"
        >
          <LogOut class="size-4 shrink-0" aria-hidden="true" />
          <span :class="collapsed ? 'lg:hidden' : ''">{{ copy.auth.logout }}</span>
        </button>
      </div>
    </aside>

    <main class="min-w-0">
      <div v-if="fullBleed()"><RouterView /></div>
      <div v-else class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><RouterView /></div>
    </main>
  </div>
</template>
