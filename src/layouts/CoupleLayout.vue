<script setup lang="ts">
import { FileHeart, LayoutDashboard, Pencil } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { company } from '@/config/company'
import { copy } from '@/config/copy'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const couple = useCoupleStore()
const drawer = ref(false)

const COLLAPSE_KEY = 'talijiwa:couple-collapsed'
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

onMounted(() => void couple.load())

/** Couple menu mirrors the admin shell, adapted: no customers/orders/themes. */
const items = computed(() => {
  const list: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
    { to: '/pasangan', label: copy.couple.navDashboard, icon: LayoutDashboard, exact: true },
  ]
  if (couple.primary) {
    list.push(
      { to: `/pasangan/undangan/${couple.primary.id}`, label: copy.couple.navDetail, icon: FileHeart, exact: true },
      { to: `/pasangan/undangan/${couple.primary.id}/kelola`, label: copy.couple.navManage, icon: Pencil },
    )
  }
  return list
})

// The builder needs the full viewport (same rule as the admin builder).
const fullBleed = () => route.name === 'couple-manage'

watch(() => route.fullPath, () => (drawer.value = false))

function logout() {
  auth.logout()
  router.push({ name: 'couple-login' })
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
      :subtitle="copy.couple.portalBadge"
      :menu-label="copy.couple.menuAria"
      :email="auth.email"
      :role-label="copy.couple.portalBadge"
      :close-label="copy.admin.closeMenu"
      :expand-label="copy.admin.expandMenu"
      :collapse-label="copy.admin.collapseMenu"
    />

    <div class="flex min-w-0 flex-col bg-[radial-gradient(60rem_18rem_at_50%_-6rem,rgba(123,50,80,0.07),transparent)]">
      <AppTopbar
        :parent-label="copy.couple.navDashboard"
        parent-to="/pasangan"
        :email="auth.email"
        :role-label="copy.couple.portalBadge"
        :badge="copy.couple.portalBadge"
        :menu-label="copy.admin.openMenu"
        :logout-label="copy.auth.logout"
        @menu="drawer = true"
        @logout="logout"
      />
      <main class="min-w-0 flex-1">
        <div v-if="fullBleed()"><RouterView /></div>
        <div v-else class="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          <div class="card p-4 sm:p-5 lg:p-6"><RouterView /></div>
        </div>
      </main>
    </div>
  </div>
</template>
