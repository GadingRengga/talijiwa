import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { accessCodeService, clearCodeSession, readCodeSession } from '@/services/access-codes'
import { currentRole, getSessionEmail, isCurrentUserAdmin, myCustomerId, onAuthChange, requestMagicLink, signIn, signOut } from '@/services/auth'
import type { UserRole } from '@/services/auth'
import { useMock } from '@/services/supabase/client'
import { useCoupleStore } from './couple'

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
      // A code session still counts as a customer session (code-first logins).
      const code = readCodeSession()
      if (code) {
        email.value = code.email
        role.value = 'customer'
        return
      }
      email.value = null
      role.value = null
      return
    }
    const code = readCodeSession()
    if (code && code.email.toLowerCase() === mail.toLowerCase()) {
      email.value = code.email
      role.value = 'customer'
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

  async function loginWithCode(code: string, inputEmail: string): Promise<void> {
    // A couple login clears any admin session so /pasangan never lands on /admin.
    await signOut()
    clearCodeSession()
    useCoupleStore().reset()
    const res = await accessCodeService.loginWithCode(code, inputEmail)
    email.value = inputEmail.trim().toLowerCase()
    role.value = 'customer'
    void res
  }

  async function logout(): Promise<void> {
    await signOut()
    clearCodeSession()
    useCoupleStore().reset()
    email.value = null
    role.value = null
  }

  return { email, role, ready, isAuthenticated, isAdmin, isCustomer, init, login, loginWithCode, requestLink, logout }
})
