<script setup lang="ts">
import { FileHeart, LayoutDashboard, LogOut, Menu, Pencil, X } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { company } from '@/config/company'
import { copy } from '@/config/copy'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const couple = useCoupleStore()
const drawer = ref(false)

onMounted(() => void couple.load())

/** Couple menu mirrors the admin shell, adapted: no customers/orders/themes. */
const items = computed(() => {
  const list: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
    { to: '/pasangan', label: copy.couple.navDashboard, icon: LayoutDashboard, exact: true },
  ]
  if (couple.primary) {
    list.push(
      { to: `/pasangan/undangan/${couple.primary.id}`, label: copy.couple.navDetail, icon: FileHeart },
      { to: `/pasangan/undangan/${couple.primary.id}/kelola`, label: copy.couple.navManage, icon: Pencil },
    )
  }
  return list
})

const isActive = (to: string, exact?: boolean) => (exact ? route.path === to : route.path.startsWith(to))
// The builder needs the full viewport (same rule as the admin builder).
const fullBleed = () => route.name === 'couple-manage'

watch(() => route.fullPath, () => (drawer.value = false))

function logout() {
  auth.logout()
  router.push({ name: 'couple-login' })
}
</script>

<template>
  <div class="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
    <!-- Mobile top bar -->
    <header class="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-panel px-4 py-3 lg:hidden">
      <button class="rounded-lg p-1.5 hover:bg-black/5" :aria-label="copy.admin.openMenu" @click="drawer = true">
        <Menu class="size-5" />
      </button>
      <span class="flex min-w-0 items-center gap-2">
        <span class="font-display text-lg font-semibold">{{ company.company_name }}</span>
        <span class="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">{{ copy.couple.portalBadge }}</span>
      </span>
      <span class="size-8" />
    </header>

    <div v-if="drawer" class="fixed inset-0 z-40 bg-black/40 lg:hidden" @click="drawer = false" />

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-panel transition-all lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0"
      :class="drawer ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between px-5 py-5">
        <span class="flex min-w-0 items-center gap-2">
          <span class="font-display text-xl font-semibold tracking-tight">{{ company.company_name }}</span>
        </span>
        <button class="rounded-lg p-1 hover:bg-black/5 lg:hidden" :aria-label="copy.admin.closeMenu" @click="drawer = false">
          <X class="size-5" />
        </button>
      </div>
      <p class="-mt-3 px-5 pb-3">
        <span class="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">{{ copy.couple.portalBadge }}</span>
      </p>
      <nav class="flex-1 space-y-1 px-3" :aria-label="copy.couple.menuAria">
        <RouterLink
          v-for="i in items"
          :key="i.to"
          :to="i.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="isActive(i.to, i.exact) ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-black/5 hover:text-ink'"
          :aria-current="isActive(i.to, i.exact) ? 'page' : undefined"
        >
          <component :is="i.icon" class="size-4 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ i.label }}</span>
        </RouterLink>
      </nav>
      <div class="border-t border-line p-3">
        <p class="truncate px-3 pb-2 text-xs text-muted">{{ auth.email }}</p>
        <button
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink"
          :title="copy.auth.logout"
          @click="logout"
        >
          <LogOut class="size-4 shrink-0" aria-hidden="true" />
          <span>{{ copy.auth.logout }}</span>
        </button>
      </div>
    </aside>

    <main class="min-w-0">
      <div v-if="fullBleed()"><RouterView /></div>
      <div v-else class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><RouterView /></div>
    </main>
  </div>
</template>
