import { ref } from 'vue'

/** Tiny client-side pagination for admin lists. */
export function usePagination(pageSize = 10) {
  const page = ref(1)
  const reset = () => (page.value = 1)

  function paginate<T>(rows: T[]): { rows: T[]; page: number; total: number } {
    const total = Math.max(1, Math.ceil(rows.length / pageSize))
    if (page.value > total) page.value = total
    return { rows: rows.slice((page.value - 1) * pageSize, page.value * pageSize), page: page.value, total }
  }
  const prev = () => (page.value = Math.max(1, page.value - 1))
  const next = () => (page.value += 1)

  return { page, reset, paginate, prev, next }
}
