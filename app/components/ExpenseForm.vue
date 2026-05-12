<script setup lang="ts">
interface ExpenseFormValue {
  category: string
  amount: number
  paidAt: string
  paidTo: string
  method: string
  notes: string
}

const props = withDefaults(defineProps<{
  initialValues?: Partial<ExpenseFormValue>
  submitLabel?: string
  busy?: boolean
}>(), {
  submitLabel: 'Save expense',
  busy: false
})

const emit = defineEmits<{
  (event: 'submit', value: ExpenseFormValue): void
}>()

function createDefaults(): ExpenseFormValue {
  return {
    category: '',
    amount: 0,
    paidAt: new Date().toISOString().slice(0, 10),
    paidTo: '',
    method: 'Cash',
    notes: ''
  }
}

const form = reactive<ExpenseFormValue>(createDefaults())

function syncForm(values?: Partial<ExpenseFormValue>) {
  Object.assign(form, createDefaults(), values ?? {})
}

watch(
  () => props.initialValues,
  (values) => syncForm(values),
  { immediate: true, deep: true }
)

function handleSubmit() {
  emit('submit', {
    ...form,
    amount: Number(form.amount) || 0
  })
}
</script>

<template>
  <form class="form" @submit.prevent="handleSubmit">
    <div class="form-grid">
      <div class="field">
        <label for="expense-category">Category</label>
        <input id="expense-category" v-model="form.category" type="text" placeholder="Maintenance" required>
      </div>

      <div class="field">
        <label for="expense-amount">Amount</label>
        <input id="expense-amount" v-model="form.amount" type="number" min="0" step="1" required>
      </div>

      <div class="field">
        <label for="expense-date">Paid at</label>
        <input id="expense-date" v-model="form.paidAt" type="date" required>
      </div>

      <div class="field">
        <label for="expense-paid-to">Paid to</label>
        <input id="expense-paid-to" v-model="form.paidTo" type="text" placeholder="Vendor or person" required>
      </div>

      <div class="field">
        <label for="expense-method">Method</label>
        <input id="expense-method" v-model="form.method" type="text" placeholder="Cash / Bank" required>
      </div>
    </div>

    <div class="field">
      <label for="expense-notes">Notes</label>
      <textarea id="expense-notes" v-model="form.notes" placeholder="What the expense covered"></textarea>
    </div>

    <div class="button-row">
      <button class="btn primary" type="submit" :disabled="busy">
        {{ busy ? 'Saving...' : submitLabel }}
      </button>
    </div>
  </form>
</template>
