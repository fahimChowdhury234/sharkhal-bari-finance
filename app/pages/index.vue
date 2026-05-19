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

const statCards = computed(() => [
  {
    label: 'Members',
    value: String(members.value.length),
    hint: `${activeMembers.value} active residents`,
    tone: 'mint',
    icon: 'users'
  },
  {
    label: 'Income',
    value: formatMoney(totalIncome.value),
    hint: 'All recorded collections',
    tone: 'teal',
    icon: 'income'
  },
  {
    label: 'Expense',
    value: formatMoney(totalExpense.value),
    hint: 'All recorded spend',
    tone: 'warm',
    icon: 'expense'
  },
  {
    label: 'Balance',
    value: formatMoney(netBalance.value),
    hint: 'Income minus expense',
    tone: 'blue',
    icon: 'wallet'
  }
])

const quickActions = [
  {
    to: '/members',
    title: 'Add member',
    subtitle: 'Manage residents',
    icon: 'users',
    tone: 'mint'
  },
  {
    to: '/income',
    title: 'Add income',
    subtitle: 'Record collection',
    icon: 'income',
    tone: 'teal'
  },
  {
    to: '/expense',
    title: 'Add expense',
    subtitle: 'Record payment',
    icon: 'expense',
    tone: 'warm'
  }
] as const

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

  <div v-else class="dashboard-grid">
    <section class="stats">
      <article
        v-for="card in statCards"
        :key="card.label"
        class="stat"
        :class="card.tone"
      >
        <div class="stat-icon" aria-hidden="true">
          <svg v-if="card.icon === 'users'" viewBox="0 0 24 24">
            <path d="M16 19c0-2.2-2-4-4.5-4S7 16.8 7 19" />
            <circle cx="11.5" cy="8.5" r="3.5" />
            <path d="M19 18.2c0-1.8-1.2-3.3-2.9-3.9" />
          </svg>
          <svg v-else-if="card.icon === 'income'" viewBox="0 0 24 24">
            <path d="M5 16l6-6 4 4 4-7" />
            <path d="M14 7h5v5" />
          </svg>
          <svg v-else-if="card.icon === 'expense'" viewBox="0 0 24 24">
            <path d="m5 7 6-2 2 2 6-2v13l-6 2-2-2-6 2z" />
            <path d="M9 8h6" />
            <path d="M9 12h6" />
            <path d="M9 16h4" />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <path d="M4.5 8.5h15v11h-15z" />
            <path d="M6.5 8.5V6.8A5.5 5.5 0 0 1 12 1.5a5.5 5.5 0 0 1 5.5 5.3v1.7" />
            <path d="M9 14.5h6" />
          </svg>
        </div>
        <div class="copy">
          <p class="label">{{ card.label }}</p>
          <p class="value">{{ card.value }}</p>
          <p class="hint">{{ card.hint }}</p>
        </div>
      </article>
    </section>

    <section class="panel pad section-card recent-card">
      <div class="section-head">
        <div>
          <h2 class="section-title">Recent income</h2>
          <p class="muted">Latest collection entries</p>
        </div>
        <NuxtLink to="/income" class="section-link">
          View all income
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </NuxtLink>
      </div>

      <div v-if="recentIncome.length" class="recent-list">
        <div v-for="entry in recentIncome" :key="entry.id" class="recent-item">
          <span class="recent-icon mint" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M7 4.5h8l3 3v12H7z" />
              <path d="M15 4.5v3h3" />
              <path d="M9.5 13.5h5" />
            </svg>
          </span>
          <div class="recent-copy">
            <strong>{{ entry.source }}</strong>
            <div class="recent-meta">{{ entry.category }} · {{ entry.receivedAt }}</div>
          </div>
          <strong class="recent-amount">{{ formatMoney(entry.amount) }}</strong>
        </div>
      </div>
      <p v-else class="empty">No income recorded yet.</p>
    </section>

    <section class="panel pad section-card recent-card">
      <div class="section-head">
        <div>
          <h2 class="section-title">Recent expense</h2>
          <p class="muted">Latest payment entries</p>
        </div>
        <NuxtLink to="/expense" class="section-link orange">
          View all expense
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </NuxtLink>
      </div>

      <div v-if="recentExpense.length" class="recent-list">
        <div v-for="entry in recentExpense" :key="entry.id" class="recent-item">
          <span class="recent-icon warm" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M6.5 4.5h10l2 2V20h-12z" />
              <path d="M8.5 10h7" />
              <path d="M8.5 13.5h7" />
              <path d="M8.5 17h4.5" />
            </svg>
          </span>
          <div class="recent-copy">
            <strong>{{ entry.category }}</strong>
            <div class="recent-meta">{{ entry.paidTo }} · {{ entry.paidAt }}</div>
          </div>
          <strong class="recent-amount" style="color: #d64e1f;">{{ formatMoney(entry.amount) }}</strong>
        </div>
      </div>
      <p v-else class="empty">No expense recorded yet.</p>
    </section>

    <section class="panel pad section-card">
      <div class="section-head">
        <div>
          <h2 class="section-title">Quick actions</h2>
          <p class="muted">Jump straight into the forms</p>
        </div>
      </div>

      <div class="quick-actions">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          class="action-card"
        >
          <span class="action-icon" :class="action.tone" aria-hidden="true">
            <svg v-if="action.icon === 'users'" viewBox="0 0 24 24">
              <path d="M16 19c0-2.2-2-4-4.5-4S7 16.8 7 19" />
              <circle cx="11.5" cy="8.5" r="3.5" />
              <path d="M19 18.2c0-1.8-1.2-3.3-2.9-3.9" />
            </svg>
            <svg v-else-if="action.icon === 'income'" viewBox="0 0 24 24">
              <path d="M5 16l6-6 4 4 4-7" />
              <path d="M14 7h5v5" />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <path d="m5 7 6-2 2 2 6-2v13l-6 2-2-2-6 2z" />
              <path d="M9 8h6" />
              <path d="M9 12h6" />
              <path d="M9 16h4" />
            </svg>
          </span>
          <span class="action-copy">
            <span class="action-title">{{ action.title }}</span>
            <span class="muted">{{ action.subtitle }}</span>
          </span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
