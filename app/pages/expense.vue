<script setup lang="ts">
import type { ExpenseRecord } from '~/types/finance'
import { downloadCsv } from '~/utils/exportCsv'

const { items, load, createOne, updateOne, removeOne, pending, error } = useCollectionApi<ExpenseRecord>('expense')

const formKey = ref(0)
const saving = ref(false)
const editing = ref<ExpenseRecord | null>(null)
const notice = ref('')
const drawerOpen = ref(false)
const paidToFilter = ref('')
const initialLoad = ref(false)

const money = new Intl.NumberFormat('en-BD', {
  maximumFractionDigits: 0
})

onMounted(async () => {
  await load()
  initialLoad.value = true
})

const filteredItems = computed(() => {
  const query = paidToFilter.value.trim().toLowerCase()
  if (!query) {
    return items.value
  }

  return items.value.filter((entry) => entry.paidTo.toLowerCase().includes(query))
})

const totalAmount = computed(() => filteredItems.value.reduce((sum, entry) => sum + entry.amount, 0))

function formatMoney(amount: number) {
  return `৳${money.format(amount)}`
}

function clearPaidToFilter() {
  paidToFilter.value = ''
}

function exportExpenseCsv() {
  const rows = filteredItems.value.map((entry) => [
    entry.category,
    entry.paidTo,
    entry.paidAt,
    entry.amount,
    entry.method,
  ])
  rows.push([
    'Total',
    '',
    '',
    totalAmount.value,
    '',
  ])

  downloadCsv(
    `expense-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Category', 'Paid to', 'Date', 'Amount', 'Method'],
    rows
  )
}

function resetForm() {
  editing.value = null
  formKey.value += 1
}

function openAddDrawer() {
  editing.value = null
  formKey.value += 1
  drawerOpen.value = true
}

function openEditDrawer(entry: ExpenseRecord) {
  editing.value = entry
  formKey.value += 1
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  resetForm()
}

async function handleSubmit(payload: Record<string, unknown>) {
  saving.value = true
  notice.value = ''

  try {
    if (editing.value) {
      await updateOne(editing.value.id, payload)
      notice.value = 'Expense updated.'
    } else {
      await createOne(payload)
      notice.value = 'Expense added.'
    }

    closeDrawer()
  } finally {
    saving.value = false
  }
}

async function handleDelete(entry: ExpenseRecord) {
  if (!confirm(`Delete expense in ${entry.category}?`)) {
    return
  }

  await removeOne(entry.id)
  if (editing.value?.id === entry.id) {
    closeDrawer()
  }
}
</script>

<template>
  <div class="grid cols-1">
    <section class="panel pad">
      <div class="toolbar">
        <div>
          <h2 class="section-title">Expense entries</h2>
          <p class="muted">Track payments, bills, and maintenance cost</p>
        </div>
        <div class="button-row">
          <button class="btn ghost" type="button" @click="exportExpenseCsv">Download CSV</button>
          <button class="btn primary" type="button" @click="openAddDrawer">Add expense</button>
        </div>
      </div>

      <div class="toolbar" style="margin-top: 10px; align-items: end;">
        <div class="field" style="max-width: 360px; width: 100%;">
          <label for="expense-paid-to-filter">Filter by paidTo</label>
          <input
            id="expense-paid-to-filter"
            v-model="paidToFilter"
            type="text"
            placeholder="Type a person or vendor..."
          >
        </div>
        <button v-if="paidToFilter" class="btn ghost" type="button" @click="clearPaidToFilter">
          Clear filter
        </button>
      </div>

      <p v-if="notice" class="pill orange" style="margin-bottom: 16px;">{{ notice }}</p>

      <LoadingState
        v-if="pending || !initialLoad"
        label="Loading expense"
        subtitle="Fetching the latest records from Firestore"
      />
      <p v-else-if="error" class="empty">{{ error }}</p>
      <div v-else-if="filteredItems.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Date</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in filteredItems" :key="entry.id">
              <td>
                <strong>{{ entry.category }}</strong>
                <div class="muted">{{ entry.paidTo }}</div>
              </td>
              <td>{{ entry.paidAt }}</td>
              <td>{{ formatMoney(entry.amount) }}</td>
              <td>
                <div class="button-row">
                  <button class="btn ghost" type="button" @click="openEditDrawer(entry)">Edit</button>
                  <button class="btn danger" type="button" @click="handleDelete(entry)">Delete</button>
                </div>
              </td>
            </tr>
            <tr class="table-total">
              <td colspan="2"><strong>Total</strong></td>
              <td><strong>{{ formatMoney(totalAmount) }}</strong></td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">
        {{ paidToFilter ? 'No expense matches this filter.' : 'No expense yet. Add the first payment on the left.' }}
      </p>
    </section>
  </div>

  <SideDrawer
    v-model="drawerOpen"
    :title="editing ? 'Edit expense' : 'Add expense'"
    description="Track payments, bills, and maintenance cost"
    @close="resetForm"
  >
    <ExpenseForm
      :key="formKey"
      :initial-values="editing ?? undefined"
      :busy="saving"
      :submit-label="editing ? 'Update expense' : 'Add expense'"
      @submit="handleSubmit"
    />
  </SideDrawer>
</template>
