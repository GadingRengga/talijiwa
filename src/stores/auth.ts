import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { currentRole, getSessionEmail, isCurrentUserAdmin, myCustomerId, onAuthChange, requestMagicLink, signIn, signOut } from '@/services/auth'
import type { UserRole } from '@/services/auth'
import { useMock } from '@/services/supabase/client'

export const useAuthStore = defineStore('auth', () => {
  const email = ref<string | null>(null)
  const role = ref<UserRole>(null)
  const ready = ref(false)
  const isAuthenticated = computed(() => !!email.value)
  const isAdmin = computed(() => role.value === 'admin')
  const isCustomer = computed(() => role.value === 'customer')

  let started: Promise<void> | null = null
  let stopListening: (() => void) | null = null

  async function resolve(mail: string | null) {
    if (!mail) {
      email.value = null
      role.value = null
      return
    }
    if (useMock) {
      const r = await currentRole()
      email.value = r.email
      role.value = r.role
      return
    }
    if (await isCurrentUserAdmin()) {
      email.value = mail
      role.value = 'admin'
    } else if (await myCustomerId()) {
      email.value = mail
      role.value = 'customer'
    } else {
      await signOut() // stale non-member session: clear it
      email.value = null
      role.value = null
    }
  }

  async function runInit(): Promise<void> {
    await resolve(await getSessionEmail())
    if (!stopListening) {
      stopListening = onAuthChange((next) => void resolve(next))
    }
    ready.value = true
  }

  function init(): Promise<void> {
    return (started ??= runInit())
  }

  async function login(inputEmail: string, password: string): Promise<void> {
    email.value = await signIn(inputEmail, password)
    role.value = 'admin'
  }

  async function requestLink(inputEmail: string): Promise<void> {
    await requestMagicLink(inputEmail)
    if (useMock) {
      const r = await currentRole()
      email.value = r.email
      role.value = r.role
    }
  }

  async function logout(): Promise<void> {
    await signOut()
    email.value = null
    role.value = null
  }

  return { email, role, ready, isAuthenticated, isAdmin, isCustomer, init, login, requestLink, logout }
})
