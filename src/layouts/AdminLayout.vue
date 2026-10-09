<script setup lang="ts">
import { BarChart3, FileHeart, LayoutDashboard, Palette, Settings, ShoppingBag, Users } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
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
watch(collapsed, (v) => {
  try {
    localStorage.setItem(COLLAPSE_KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
})

const items = [
  { to: '/admin', label: copy.nav.dashboard, icon: LayoutDashboard, exact: true },
  { to: '/admin/customers', label: copy.nav.customers, icon: Users },
  { to: '/admin/orders', label: copy.nav.orders, icon: ShoppingBag },
  { to: '/admin/invitations', label: copy.nav.invitations, icon: FileHeart },
  { to: '/admin/themes', label: copy.nav.themes, icon: Palette },
  { to: '/admin/analytics', label: copy.nav.analytics, icon: BarChart3 },
  { to: '/admin/settings', label: copy.nav.settings, icon: Settings },
]

// The builder needs the full viewport, so it renders without the page padding wrapper.
const fullBleed = () => route.name === 'admin-invitation-edit'

watch(() => route.fullPath, () => (drawer.value = false))

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div
    class="min-h-dvh bg-paper transition-[grid-template-columns] duration-200 lg:grid"
    :class="collapsed ? 'lg:grid-cols-[5rem_1fr]' : 'lg:grid-cols-[17.5rem_1fr]'"
  >
    <AppSidebar
      v-model:drawer="drawer"
      v-model:collapsed="collapsed"
      :items="items"
      :brand-title="company.company_name"
      :subtitle="copy.admin.panelSubtitle"
      :menu-label="copy.nav.menuAdmin"
      :email="auth.email"
      :role-label="copy.admin.panelSubtitle"
      :close-label="copy.admin.closeMenu"
      :expand-label="copy.admin.expandMenu"
      :collapse-label="copy.admin.collapseMenu"
    />

    <div class="flex min-w-0 flex-col bg-[radial-gradient(60rem_18rem_at_50%_-6rem,rgba(123,50,80,0.07),transparent)]">
      <AppTopbar
        :parent-label="copy.nav.dashboard"
        parent-to="/admin"
        :email="auth.email"
        :role-label="copy.admin.panelSubtitle"
        :menu-label="copy.admin.openMenu"
        :logout-label="copy.auth.logout"
        @menu="drawer = true"
        @logout="logout"
      />
      <main class="min-w-0 flex-1">
        <div v-if="fullBleed()"><RouterView /></div>
        <div v-else class="mx-auto w-full max-w-7xl px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          <div class="card p-4 sm:p-5 lg:p-6"><RouterView /></div>
        </div>
      </main>
    </div>
  </div>
</template>
