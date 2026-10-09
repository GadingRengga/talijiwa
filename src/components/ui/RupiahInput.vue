<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatCurrency } from '@/utils/format'
import { parseRupiah } from '@/utils/invitation'

const props = withDefaults(
  defineProps<{ modelValue: number; id?: string; min?: number; ariaLabel?: string }>(),
  { id: undefined, min: 0, ariaLabel: 'Nominal rupiah' },
)
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

/** Raw text while focused (editable digits); formatted display when blurred. */
const focused = ref(false)
const text = ref('')

watch(
  () => props.modelValue,
  (v) => {
    if (!focused.value) text.value = v > 0 ? formatCurrency(v) : ''
  },
  { immediate: true },
)

const shown = computed(() => (focused.value ? text.value : props.modelValue > 0 ? formatCurrency(props.modelValue) : ''))

function onFocus(e: FocusEvent) {
  focused.value = true
  text.value = props.modelValue > 0 ? String(props.modelValue) : ''
  ;(e.target as HTMLInputElement).select()
}
function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 13)
  text.value = digits
  emit('update:modelValue', Math.max(props.min, parseRupiah(digits)))
}
function onBlur() {
  focused.value = false
  text.value = props.modelValue > 0 ? formatCurrency(props.modelValue) : ''
}
</script>

<template>
  <input
    :id="id"
    :value="shown"
    class="field-input tabular-nums"
    inputmode="numeric"
    autocomplete="off"
    :aria-label="ariaLabel"
    placeholder="Rp0"
    @focus="onFocus"
    @input="onInput"
    @blur="onBlur"
  />
</template>
