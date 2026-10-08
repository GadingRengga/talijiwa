import { reactive } from 'vue'

export interface ToastItem {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

const toasts = reactive<ToastItem[]>([])
let seq = 0

function push(type: ToastItem['type'], message: string, ms = 3500) {
  const id = ++seq
  toasts.push({ id, type, message })
  setTimeout(() => dismiss(id), ms)
}
function dismiss(id: number) {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m, 5000),
    info: (m: string) => push('info', m),
  }
}
