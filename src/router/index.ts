import type { RouteLocationGeneric, Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresCouple?: boolean
    title?: string
  }
}

export const routes = [
    // Company profile
    {
      path: '/',
      component: () => import('@/layouts/PublicLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/pages/company/Home.vue'), meta: { title: 'Undangan Pernikahan Digital' } },
        { path: 'about', name: 'about', component: () => import('@/pages/company/About.vue'), meta: { title: 'Tentang Kami' } },
        { path: 'templates', name: 'templates', component: () => import('@/pages/company/Templates.vue'), meta: { title: 'Template' } },
        { path: 'portfolio', name: 'portfolio', component: () => import('@/pages/company/Portfolio.vue'), meta: { title: 'Portofolio' } },
        { path: 'services', name: 'services', component: () => import('@/pages/company/Services.vue'), meta: { title: 'Layanan' } },
        { path: 'contact', name: 'contact', component: () => import('@/pages/company/Contact.vue'), meta: { title: 'Kontak' } },
      ],
    },

    // Public invitation (no layout chrome)
    { path: '/invite/:slug', name: 'invitation', component: () => import('@/pages/invitation/PublicInvitation.vue') },

    // Embeddable theme banner (cover only) for the company profile
    { path: '/embed/banner/:theme', name: 'embed-banner', component: () => import('@/pages/company/EmbedBanner.vue') },

    // Auth
    { path: '/login', name: 'login', component: () => import('@/pages/auth/Login.vue'), meta: { title: 'Masuk' } },

    // Couple portal (customers manage their own invitations; never admin pages)
    {
      path: '/pasangan',
      component: () => import('@/layouts/CoupleLayout.vue'),
      children: [
        { path: '', name: 'couple-dashboard', component: () => import('@/pages/couple/Dashboard.vue'), meta: { title: 'Pantauan Undangan', requiresCouple: true } },
        { path: 'masuk', name: 'couple-login', component: () => import('@/pages/couple/Login.vue'), meta: { title: 'Masuk Pasangan' } },
        { path: 'undangan/:id', name: 'couple-invitation', component: () => import('@/pages/couple/InvitationDetail.vue'), meta: { title: 'Detail Undangan', requiresCouple: true } },
        { path: 'undangan/:id/kelola', name: 'couple-manage', component: () => import('@/pages/couple/InvitationManage.vue'), meta: { title: 'Kelola Undangan', requiresCouple: true } },
      ],
    },

    // Admin
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'admin-dashboard', component: () => import('@/pages/admin/Dashboard.vue'), meta: { title: 'Dashboard' } },
        { path: 'customers', name: 'admin-customers', component: () => import('@/pages/admin/Customers.vue'), meta: { title: 'Pelanggan' } },
        { path: 'customers/:id', name: 'admin-customer', component: () => import('@/pages/admin/CustomerDetail.vue'), meta: { title: 'Detail pelanggan' } },
        { path: 'orders', name: 'admin-orders', component: () => import('@/pages/admin/Orders.vue'), meta: { title: 'Pesanan' } },
        { path: 'orders/:id', name: 'admin-order', component: () => import('@/pages/admin/OrderDetail.vue'), meta: { title: 'Detail pesanan' } },
        { path: 'themes', name: 'admin-themes', component: () => import('@/pages/admin/Themes.vue'), meta: { title: 'Tema' } },
        { path: 'invitations', name: 'admin-invitations', component: () => import('@/pages/admin/Invitations.vue'), meta: { title: 'Undangan' } },
        { path: 'invitations/:id', redirect: (to: RouteLocationGeneric) => `/admin/invitations/${to.params.id}/edit` },
        { path: 'invitations/:id/edit', name: 'admin-invitation-edit', component: () => import('@/pages/admin/InvitationEdit.vue'), meta: { title: 'Builder undangan' } },
        { path: 'invitations/:id/preview', name: 'admin-invitation-preview', component: () => import('@/pages/admin/InvitationPreview.vue'), meta: { title: 'Pratinjau' } },
        { path: 'invitations/:id/rsvp', name: 'admin-rsvp', component: () => import('@/pages/admin/InvitationRsvp.vue'), meta: { title: 'RSVP' } },
        { path: 'invitations/:id/messages', name: 'admin-messages', component: () => import('@/pages/admin/InvitationMessages.vue'), meta: { title: 'Ucapan' } },
        { path: 'invitations/:id/gifts', name: 'admin-gifts', component: () => import('@/pages/admin/InvitationGifts.vue'), meta: { title: 'Hadiah' } },
        { path: 'invitations/:id/analytics', name: 'admin-invitation-analytics', component: () => import('@/pages/admin/InvitationAnalytics.vue'), meta: { title: 'Analitik undangan' } },
        { path: 'analytics', name: 'admin-analytics', component: () => import('@/pages/admin/Analytics.vue'), meta: { title: 'Analitik' } },
        { path: 'settings', name: 'admin-settings', component: () => import('@/pages/admin/Settings.vue'), meta: { title: 'Pengaturan' } },
      ],
    },

    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/company/NotFound.vue'), meta: { title: 'Halaman tidak ditemukan' } },
]

export function registerGuards(router: Router) {
  router.beforeEach(async (to) => {
  const auth = useAuthStore()
  // Never hang navigation forever: a stuck session check must not blank the page.
  await Promise.race([
    auth.init(),
    new Promise((r) => setTimeout(() => r(null), 8000)),
  ])
  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
    if (!auth.isAdmin) return auth.isCustomer ? { name: 'couple-dashboard' } : { name: 'login' }
  }
  if (to.meta.requiresCouple) {
    if (!auth.isAuthenticated) return { name: 'couple-login', query: { redirect: to.fullPath } }
    if (!auth.isCustomer) return auth.isAdmin ? { name: 'admin-dashboard' } : { name: 'couple-login' }
  }
  if (to.name === 'login') {
    if (auth.isAdmin) return { name: 'admin-dashboard' }
    if (auth.isCustomer) return { name: 'couple-dashboard' }
  }
  if (to.name === 'couple-login') {
    if (auth.isCustomer) return { name: 'couple-dashboard' }
    if (auth.isAdmin) return { name: 'admin-dashboard' }
  }
})

  router.afterEach((to) => {
    if (to.meta.title && typeof document !== 'undefined') document.title = `${to.meta.title} — Talijiwa`
  })
}
