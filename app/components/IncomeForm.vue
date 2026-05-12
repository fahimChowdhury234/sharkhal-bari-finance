<script setup lang="ts">
interface IncomeFormValue {
  source: string
  category: string
  amount: number
  annualDue: number
  receivedAt: string
  receivedBy: string
  notes: string
}

const props = withDefaults(defineProps<{
  initialValues?: Partial<IncomeFormValue>
  submitLabel?: string
  busy?: boolean
}>(), {
  submitLabel: 'Save income',
  busy: false
})

const emit = defineEmits<{
  (event: 'submit', value: IncomeFormValue): void
}>()

function createDefaults(): IncomeFormValue {
  return {
    source: '',
    category: '',
    amount: 0,
    annualDue: 0,
    receivedAt: new Date().toISOString().slice(0, 10),
    receivedBy: '',
    notes: ''
  }
}

const form = reactive<IncomeFormValue>(createDefaults())

function syncForm(values?: Partial<IncomeFormValue>) {
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
    amount: Number(form.amount) || 0,
    annualDue: Number(form.annualDue) || 0
  })
}
</script>

<template>
  <form class="form" @submit.prevent="handleSubmit">
    <div class="form-grid">
      <div class="field">
        <label for="income-source">Source</label>
        <input id="income-source" v-model="form.source" type="text" placeholder="Monthly contribution" required>
      </div>

      <div class="field">
        <label for="income-category">Category</label>
        <input id="income-category" v-model="form.category" type="text" placeholder="Member dues" required>
      </div>

      <div class="field">
        <label for="income-amount">Amount</label>
        <input id="income-amount" v-model="form.amount" type="number" min="0" step="1" required>
      </div>

      <div class="field">
        <label for="income-annual-due">Annual subscription amount</label>
        <input id="income-annual-due" v-model="form.annualDue" type="number" min="0" step="1" placeholder="1200">
      </div>

      <div class="field">
        <label for="income-date">Received at</label>
        <input id="income-date" v-model="form.receivedAt" type="date" required>
      </div>

      <div class="field">
        <label for="income-by">Received by</label>
        <input id="income-by" v-model="form.receivedBy" type="text" placeholder="Treasurer" required>
      </div>
    </div>

    <div class="field">
      <label for="income-notes">Notes</label>
      <textarea id="income-notes" v-model="form.notes" placeholder="What this income was for"></textarea>
    </div>

    <div class="button-row">
      <button class="btn primary" type="submit" :disabled="busy">
        {{ busy ? 'Saving...' : submitLabel }}
      </button>
    </div>
  </form>
</template>
