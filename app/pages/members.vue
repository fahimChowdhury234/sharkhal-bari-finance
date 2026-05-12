<script setup lang="ts">
import type { MemberRecord } from '~/types/finance'

const { items, load, createOne, updateOne, removeOne, pending, error } = useCollectionApi<MemberRecord>('members')

const formKey = ref(0)
const saving = ref(false)
const editing = ref<MemberRecord | null>(null)
const notice = ref('')
const drawerOpen = ref(false)
const initialLoad = ref(false)

onMounted(async () => {
  await load()
  initialLoad.value = true
})

function formatMoney(amount: number) {
  return `৳${amount.toLocaleString('en-BD')}`
}

function getDue(member: MemberRecord) {
  const annualDue = member.annualDue ?? 0
  const paidAmount = member.paidAmount ?? 0

  if (annualDue > 0) {
    return Math.max(annualDue - paidAmount, 0)
  }

  return member.monthlyDue ?? 0
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
  editing.value = member
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
</script>

<template>
  <div class="grid cols-1">
    <section class="panel pad">
      <div class="toolbar">
        <div>
          <h2 class="section-title">Members</h2>
          <p class="muted">Track household members and their dues</p>
        </div>
        <button class="btn primary" type="button" @click="openAddDrawer">
          Add member
        </button>
      </div>

      <p v-if="notice" class="pill" style="margin-bottom: 16px;">{{ notice }}</p>

      <LoadingState
        v-if="pending || !initialLoad"
        label="Loading members"
        subtitle="Fetching the latest records from Firestore"
      />
      <p v-else-if="error" class="empty">{{ error }}</p>
      <div v-else-if="items.length" class="table-wrap">
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
            <tr v-for="member in items" :key="member.id">
              <td>
                <strong>{{ member.name }}</strong>
                <div class="muted">{{ member.address }}</div>
              </td>
              <td>
                <div>{{ member.phone }}</div>
                <div class="muted">{{ member.email }}</div>
              </td>
              <td>
                <span class="pill" :class="{ orange: member.status === 'inactive' }">
                  {{ member.status }}
                </span>
              </td>
              <td>{{ formatMoney(getDue(member)) }}</td>
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
      :initial-values="editing ?? undefined"
      :busy="saving"
      :submit-label="editing ? 'Update member' : 'Add member'"
      @submit="handleSubmit"
    />
  </SideDrawer>
</template>
