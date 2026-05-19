<script setup lang="ts">
import type { IncomeRecord } from '~/types/finance'
import { downloadCsv } from '~/utils/exportCsv'
import { formatDisplayDate } from '~/utils/formatDate'

const { items, load, createOne, updateOne, removeOne, pending, error } = useCollectionApi<IncomeRecord>('income')

const formKey = ref(0)
const saving = ref(false)
const editing = ref<IncomeRecord | null>(null)
const notice = ref('')
const drawerOpen = ref(false)
const receivedByFilter = ref('')
const initialLoad = ref(false)

const money = new Intl.NumberFormat('en-BD', {
  maximumFractionDigits: 0
})

onMounted(async () => {
  await load()
  initialLoad.value = true
})

const filteredItems = computed(() => {
  const query = receivedByFilter.value.trim().toLowerCase()
  if (!query) {
    return items.value
  }

  return items.value.filter((entry) => entry.receivedBy.toLowerCase().includes(query))
})

const totalAmount = computed(() => filteredItems.value.reduce((sum, entry) => sum + entry.amount, 0))
const totalAnnualSubscription = computed(() => filteredItems.value.reduce((sum, entry) => sum + (entry.annualDue ?? 0), 0))

function formatMoney(amount: number) {
  return `৳${money.format(amount)}`
}

function formatOptionalMoney(amount?: number) {
  return typeof amount === 'number' ? formatMoney(amount) : '—'
}

function formatDate(value?: string) {
  return formatDisplayDate(value)
}

function clearReceivedByFilter() {
  receivedByFilter.value = ''
}

function exportIncomeCsv() {
  const rows = filteredItems.value.map((entry) => [
    entry.source,
    entry.receivedBy,
    formatDate(entry.receivedAt),
    entry.amount,
    entry.annualDue ?? '',
  ])
  rows.push([
    'Total',
    '',
    '',
    totalAmount.value,
    totalAnnualSubscription.value,
  ])

  downloadCsv(
    `income-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Source', 'Received by', 'Date', 'Amount', 'Annual subscription'],
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

function openEditDrawer(entry: IncomeRecord) {
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
      notice.value = 'Income updated.'
    } else {
      await createOne(payload)
      notice.value = 'Income added.'
    }

    closeDrawer()
  } finally {
    saving.value = false
  }
}

async function handleDelete(entry: IncomeRecord) {
  if (!confirm(`Delete income entry from ${entry.source}?`)) {
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
          <h2 class="section-title">Income entries</h2>
          <p class="muted">Record money received from members or other sources</p>
        </div>
        <div class="button-row">
          <button class="btn ghost" type="button" @click="exportIncomeCsv">Download CSV</button>
          <button class="btn primary" type="button" @click="openAddDrawer">Add income</button>
        </div>
      </div>

      <div class="toolbar" style="margin-top: 10px; align-items: end;">
        <div class="field" style="max-width: 360px; width: 100%;">
          <label for="income-received-by-filter">Filter by Received by</label>
          <input
            id="income-received-by-filter"
            v-model="receivedByFilter"
            type="text"
            placeholder="Type a name..."
          >
        </div>
        <button v-if="receivedByFilter" class="btn ghost" type="button" @click="clearReceivedByFilter">
          Clear filter
        </button>
      </div>

      <p v-if="notice" class="pill" style="margin-bottom: 16px;">{{ notice }}</p>

      <LoadingState
        v-if="pending || !initialLoad"
        label="Loading income"
        subtitle="Fetching the latest records from Firestore"
      />
      <p v-else-if="error" class="empty">{{ error }}</p>
      <div v-else-if="filteredItems.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Received by</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Annual subscription</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in filteredItems" :key="entry.id">
              <td>
                <strong>{{ entry.source }}</strong>
                <div class="muted">{{ entry.category }}</div>
              </td>
              <td>{{ entry.receivedBy }}</td>
              <td>{{ formatDate(entry.receivedAt) }}</td>
              <td>{{ formatMoney(entry.amount) }}</td>
              <td>{{ formatOptionalMoney(entry.annualDue) }}</td>
              <td>
                <div class="button-row">
                  <button class="btn ghost" type="button" @click="openEditDrawer(entry)">Edit</button>
                  <button class="btn danger" type="button" @click="handleDelete(entry)">Delete</button>
                </div>
              </td>
            </tr>
            <tr class="table-total">
              <td colspan="3"><strong>Total</strong></td>
              <td><strong>{{ formatMoney(totalAmount) }}</strong></td>
              <td><strong>{{ formatMoney(totalAnnualSubscription) }}</strong></td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">
        {{ receivedByFilter ? 'No income matches this filter.' : 'No income yet. Add the first payment on the left.' }}
      </p>
    </section>
  </div>

  <SideDrawer
    v-model="drawerOpen"
    :title="editing ? 'Edit income' : 'Add income'"
    description="Record money received from members or other sources"
    @close="resetForm"
  >
    <IncomeForm
      :key="formKey"
      :initial-values="editing ?? undefined"
      :busy="saving"
      :submit-label="editing ? 'Update income' : 'Add income'"
      @submit="handleSubmit"
    />
  </SideDrawer>
</template>
