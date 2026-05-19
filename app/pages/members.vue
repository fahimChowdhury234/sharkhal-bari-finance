<script setup lang="ts">
import type { IncomeRecord, MemberRecord } from '~/types/finance'
import { downloadCsv } from '~/utils/exportCsv'

const {
  items: members,
  load: loadMembers,
  createOne,
  updateOne,
  removeOne,
  pending: membersPending,
  error: membersError
} = useCollectionApi<MemberRecord>('members')
const {
  items: incomeItems,
  load: loadIncome,
  pending: incomePending,
  error: incomeError
} = useCollectionApi<IncomeRecord>('income')

const formKey = ref(0)
const saving = ref(false)
const editing = ref<MemberRecord | null>(null)
const notice = ref('')
const drawerOpen = ref(false)
const initialLoad = ref(false)
const money = new Intl.NumberFormat('en-BD', {
  maximumFractionDigits: 0
})

onMounted(async () => {
  await Promise.all([loadMembers(), loadIncome()])
  initialLoad.value = true
})

function formatMoney(amount: number) {
  return `৳${money.format(amount)}`
}

function normalizeName(value?: string | null) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

const memberNameSet = computed(() => new Set(members.value.map((member) => normalizeName(member.name))))

function isSubscriptionIncome(entry: IncomeRecord) {
  const sourceKey = normalizeName(entry.memberName || entry.source)

  return Boolean(
    entry.memberName ||
    (entry.annualDue ?? 0) > 0 ||
    normalizeName(entry.category).includes('annual') ||
    memberNameSet.value.has(sourceKey)
  )
}

const paymentSummaryByMember = computed(() => {
  const summaries = new Map<string, { annualFee: number; paidAmount: number }>()

  for (const entry of incomeItems.value) {
    if (!isSubscriptionIncome(entry)) {
      continue
    }

    const key = normalizeName(entry.memberName || entry.source)
    if (!key) {
      continue
    }

    const current = summaries.get(key) ?? { annualFee: 0, paidAmount: 0 }
    current.paidAmount += Number(entry.amount) || 0
    current.annualFee = Math.max(current.annualFee, Number(entry.annualDue) || 0)
    summaries.set(key, current)
  }

  return summaries
})

function getMemberPaymentSummary(member: MemberRecord) {
  const key = normalizeName(member.name)
  const summary = paymentSummaryByMember.value.get(key)
  const annualFee = member.annualDue ?? summary?.annualFee ?? 0
  const paidAmount = summary?.paidAmount ?? member.paidAmount ?? 0
  const due = annualFee > 0 ? Math.max(annualFee - paidAmount, 0) : (member.monthlyDue ?? 0)
  const status = annualFee > 0 ? (due <= 0 ? 'Paid' : 'Due') : 'No fee'

  return {
    annualFee,
    paidAmount,
    due,
    status
  }
}

function formatContact(member: MemberRecord) {
  return [member.phone, member.email].filter(Boolean).join(' | ')
}

function cloneMember(member: MemberRecord): MemberRecord {
  return {
    ...member,
    monthlyPayments: member.monthlyPayments ? [...member.monthlyPayments] : undefined
  }
}

function getEditValues(member: MemberRecord) {
  const summary = getMemberPaymentSummary(member)

  return {
    ...cloneMember(member),
    annualDue: summary.annualFee || member.annualDue || 0,
    paidAmount: summary.paidAmount || member.paidAmount || 0
  }
}

const editingValues = computed(() => (editing.value ? getEditValues(editing.value) : undefined))

function exportMembersCsv() {
  const rows = members.value.map((member) => {
    const summary = getMemberPaymentSummary(member)

    return [
      member.name,
      formatContact(member),
      summary.annualFee || '',
      summary.paidAmount || '',
      summary.due
    ]
  })

  downloadCsv(
    `members-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Name', 'Contact', 'Annual Fee', 'Paid', 'Due'],
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

function openEditDrawer(member: MemberRecord) {
  editing.value = cloneMember(member)
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
      notice.value = 'Member updated.'
    } else {
      await createOne(payload)
      notice.value = 'Member added.'
    }

    closeDrawer()
  } finally {
    saving.value = false
  }
}

async function handleDelete(member: MemberRecord) {
  if (!confirm(`Delete ${member.name}?`)) {
    return
  }

  await removeOne(member.id)
  if (editing.value?.id === member.id) {
    closeDrawer()
  }
}

const hasError = computed(() => membersError.value || incomeError.value)
const loading = computed(() => membersPending.value || incomePending.value)
</script>

<template>
  <div class="grid cols-1">
    <section class="panel pad">
      <div class="toolbar">
        <div>
          <h2 class="section-title">Members</h2>
          <p class="muted">Track household members and their dues</p>
        </div>
        <div class="button-row">
          <button class="btn ghost" type="button" @click="exportMembersCsv">Download CSV</button>
          <button class="btn primary" type="button" @click="openAddDrawer">Add member</button>
        </div>
      </div>

      <p v-if="notice" class="pill" style="margin-bottom: 16px;">{{ notice }}</p>

      <LoadingState
        v-if="loading || !initialLoad"
        label="Loading members"
        subtitle="Fetching the latest records from Firestore"
      />
      <p v-else-if="hasError" class="empty">{{ hasError }}</p>
      <div v-else-if="members.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Due</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member.id">
              <td>
                <strong>{{ member.name }}</strong>
                <div class="muted">{{ member.address }}</div>
              </td>
              <td>
                <div>{{ member.phone }}</div>
                <div class="muted">{{ member.email }}</div>
              </td>
              <td>
                <span
                  class="pill"
                  :class="{ orange: getMemberPaymentSummary(member).status === 'Due' }"
                >
                  {{ getMemberPaymentSummary(member).status }}
                </span>
              </td>
              <td>{{ formatMoney(getMemberPaymentSummary(member).due) }}</td>
              <td>
                <div class="button-row">
                  <button class="btn ghost" type="button" @click="openEditDrawer(member)">Edit</button>
                  <button class="btn danger" type="button" @click="handleDelete(member)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">No members yet. Add the first household member on the left.</p>
    </section>
  </div>

  <SideDrawer
    v-model="drawerOpen"
    :title="editing ? 'Edit member' : 'Add member'"
    description="Track household members and their dues"
    @close="resetForm"
  >
    <MemberForm
      :key="formKey"
      :initial-values="editingValues"
      :busy="saving"
      :submit-label="editing ? 'Update member' : 'Add member'"
      @submit="handleSubmit"
    />
  </SideDrawer>
</template>
