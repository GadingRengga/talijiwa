import { defineStore } from 'pinia'
import { ref } from 'vue'
import { analyticsService } from '@/services/analytics'
import type { DashboardStats } from '@/services/analytics'

export const useAnalyticsStore = defineStore('analytics', () => {
  const stats = ref<DashboardStats | null>(null)
  const loading = ref(false)
  async function loadDashboard() {
    loading.value = true
    try {
      stats.value = await analyticsService.dashboard()
    } finally {
      loading.value = false
    }
  }
  return { stats, loading, loadDashboard }
})
