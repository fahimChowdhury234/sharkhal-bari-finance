<script setup lang="ts">
import type { ExpenseRecord, IncomeRecord, MemberRecord } from '~/types/finance'

const money = new Intl.NumberFormat('en-BD', {
  maximumFractionDigits: 0
})

const membersState = useCollectionApi<MemberRecord>('members')
const incomeState = useCollectionApi<IncomeRecord>('income')
const expenseState = useCollectionApi<ExpenseRecord>('expense')

const members = computed(() => membersState.items.value)
const income = computed(() => incomeState.items.value)
const expense = computed(() => expenseState.items.value)

const totalIncome = computed(() => income.value.reduce((sum, row) => sum + row.amount, 0))
const totalExpense = computed(() => expense.value.reduce((sum, row) => sum + row.amount, 0))
const netBalance = computed(() => totalIncome.value - totalExpense.value)
const activeMembers = computed(() => members.value.filter((member) => member.status === 'active').length)

const recentIncome = computed(() => [...income.value].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).slice(0, 3))
const recentExpense = computed(() => [...expense.value].sort((a, b) => b.paidAt.localeCompare(a.paidAt)).slice(0, 3))
const loading = computed(() => membersState.pending.value || incomeState.pending.value || expenseState.pending.value)
const initialLoad = ref(false)

function formatMoney(amount: number) {
  return `৳${money.format(amount)}`
}

onMounted(async () => {
  await Promise.all([membersState.load(), incomeState.load(), expenseState.load()])
  initialLoad.value = true
})
</script>

<template>
  <LoadingState
    v-if="loading || !initialLoad"
    label="Loading dashboard"
    subtitle="Fetching members, income, and expense records from Firestore"
  />

  <div v-else class="grid" style="gap: 18px;">
    <section class="stats">
      <article class="stat">
        <p class="label">Members</p>
        <p class="value">{{ members.length }}</p>
        <p class="hint">{{ activeMembers }} active residents</p>
      </article>

      <article class="stat">
        <p class="label">Income</p>
        <p class="value">{{ formatMoney(totalIncome) }}</p>
        <p class="hint">All recorded collections</p>
      </article>

      <article class="stat">
        <p class="label">Expense</p>
        <p class="value">{{ formatMoney(totalExpense) }}</p>
        <p class="hint">All recorded spend</p>
      </article>

      <article class="stat">
        <p class="label">Balance</p>
        <p class="value">{{ formatMoney(netBalance) }}</p>
        <p class="hint">Income minus expense</p>
      </article>
    </section>

    <section class="grid cols-1">
      <article class="panel pad">
        <div class="toolbar">
          <div>
            <h2 class="section-title">Recent income</h2>
            <p class="muted">Latest collection entries</p>
          </div>
          <NuxtLink to="/income" class="pill">Manage income</NuxtLink>
        </div>

        <div v-if="recentIncome.length" class="list">
          <div v-for="entry in recentIncome" :key="entry.id" class="list-item">
            <div>
              <strong>{{ entry.source }}</strong>
              <div class="muted">{{ entry.category }} · {{ entry.receivedAt }}</div>
            </div>
            <strong>{{ formatMoney(entry.amount) }}</strong>
          </div>
        </div>
        <p v-else class="empty">No income recorded yet.</p>
      </article>

      <article class="panel pad">
        <div class="toolbar">
          <div>
            <h2 class="section-title">Recent expense</h2>
            <p class="muted">Latest payment entries</p>
          </div>
          <NuxtLink to="/expense" class="pill orange">Manage expense</NuxtLink>
        </div>

        <div v-if="recentExpense.length" class="list">
          <div v-for="entry in recentExpense" :key="entry.id" class="list-item">
            <div>
              <strong>{{ entry.category }}</strong>
              <div class="muted">{{ entry.paidTo }} · {{ entry.paidAt }}</div>
            </div>
            <strong>{{ formatMoney(entry.amount) }}</strong>
          </div>
        </div>
        <p v-else class="empty">No expense recorded yet.</p>
      </article>
    </section>

    <section class="panel pad">
      <div class="toolbar">
        <div>
          <h2 class="section-title">Quick actions</h2>
          <p class="muted">Jump straight into the forms</p>
        </div>
        <div class="button-row">
          <NuxtLink to="/members" class="btn ghost">Add member</NuxtLink>
          <NuxtLink to="/income" class="btn primary">Add income</NuxtLink>
          <NuxtLink to="/expense" class="btn ghost">Add expense</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
