import { nextTick, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { InvitationData } from '@/types'

const VOLATILE = /"(updated_at|published_at|status)":("[^"]*"|null)/g
const key = (s: string) => s.replace(VOLATILE, '')

/** Undo/redo for the builder draft. Edits are grouped (500 ms) so typing is one step. */
export function useHistory(source: Ref<InvitationData | null>, limit = 80) {
  const stack: string[] = []
  let idx = -1
  let applying = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const canUndo = ref(false)
  const canRedo = ref(false)
  const sync = () => {
    canUndo.value = idx > 0
    canRedo.value = idx < stack.length - 1
  }

  function push() {
    clearTimeout(timer)
    timer = undefined
    if (!source.value) return
    const s = JSON.stringify(source.value)
    if (idx >= 0 && key(stack[idx]!) === key(s)) return
    stack.splice(idx + 1)
    stack.push(s)
    if (stack.length > limit) stack.shift()
    idx = stack.length - 1
    sync()
  }
  watch(
    source,
    () => {
      if (applying || !source.value) return
      if (!stack.length) return push()
      clearTimeout(timer)
      timer = setTimeout(push, 500)
    },
    { deep: true },
  )

  function restore(i: number) {
    const cur = source.value
    if (!cur) return
    applying = true
    const next = JSON.parse(stack[i]!) as InvitationData
    // Keep server-owned fields: undo must never un-publish or rewind timestamps.
    next.status = cur.status
    next.published_at = cur.published_at
    next.updated_at = cur.updated_at
    idx = i
    source.value = next
    sync()
    void nextTick(() => (applying = false))
  }
  function undo() {
    if (timer) push()
    if (idx > 0) restore(idx - 1)
  }
  function redo() {
    if (idx < stack.length - 1) restore(idx + 1)
  }
  return { canUndo, canRedo, undo, redo, isRestoring: () => applying }
}
