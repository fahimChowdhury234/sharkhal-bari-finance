<script setup lang="ts">
import type { Account } from '~/types/finance'
import { confirmDelete } from '~/utils/confirmDelete'
import { countLegacyDocs, migrateLegacyAccount } from '~/utils/migrateLegacyAccount'
import { formatDisplayDate } from '~/utils/formatDate'

const {
  items: accounts,
  load: loadAccounts,
  createOne,
  updateOne,
  removeOne,
  pending,
  error
} = useAccounts()
const { activeAccountId, setActiveAccount } = useActiveAccount()
const nuxtApp = useNuxtApp()

const drawerOpen = ref(false)
const editing = ref<Account | null>(null)
const saving = ref(false)
const notice = ref('')
const initialLoad = ref(false)

const legacyDocCount = ref(0)
const migrating = ref(false)

function createDefaults() {
  return {
    label: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    isActive: false
  }
}

const form = reactive(createDefaults())

onMounted(async () => {
  await loadAccounts()
  initialLoad.value = true

  if (!activeAccountId.value) {
    const active = accounts.value.find((account) => account.isActive)
    if (active) {
      setActiveAccount(active.id)
    }
  }

  const firestore = nuxtApp.$firestore
  if (firestore) {
    legacyDocCount.value = await countLegacyDocs(firestore)
  }
})

function openAddDrawer() {
  editing.value = null
  Object.assign(form, createDefaults())
  drawerOpen.value = true
}

function openEditDrawer(account: Account) {
  editing.value = account
  Object.assign(form, {
    label: account.label,
    startDate: account.startDate,
    endDate: account.endDate,
    isActive: account.isActive
  })
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  editing.value = null
}

async function handleSubmit() {
  saving.value = true
  notice.value = ''

  try {
    const payload = {
      label: form.label,
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive
    }

    if (editing.value) {
      await updateOne(editing.value.id, payload)
      notice.value = 'Account updated.'
    } else {
      const id = await createOne(payload)
      notice.value = 'Account created.'
      if (form.isActive && id) {
        setActiveAccount(id)
      }
    }

    closeDrawer()
  } finally {
    saving.value = false
  }
}

async function handleDelete(account: Account) {
  if (!(await confirmDelete(`Delete account "${account.label}"? This does not delete its data.`))) {
    return
  }

  await removeOne(account.id)
  if (activeAccountId.value === account.id) {
    setActiveAccount(null)
  }
}

function handleSetActive(account: Account) {
  setActiveAccount(account.id)
  notice.value = `Switched to ${account.label}.`
}

async function handleMigrate() {
  const firestore = nuxtApp.$firestore
  if (!firestore || !activeAccountId.value) {
    return
  }

  migrating.value = true
  notice.value = ''

  try {
    const migrated = await migrateLegacyAccount(firestore, activeAccountId.value)
    legacyDocCount.value = await countLegacyDocs(firestore)
    notice.value = `Migrated ${migrated} record(s) into the active account.`
  } finally {
    migrating.value = false
  }
}
</script>

<template>
  <div class="grid cols-1">
    <section class="panel pad">
      <div class="toolbar">
        <div>
          <h2 class="section-title">Yearly accounts</h2>
          <p class="muted">Each account keeps its own members, income, and expense records</p>
        </div>
        <div class="button-row">
          <button class="btn primary" type="button" @click="openAddDrawer">New account</button>
        </div>
      </div>

      <p v-if="notice" class="pill" style="margin-bottom: 16px;">{{ notice }}</p>

      <LoadingState
        v-if="pending || !initialLoad"
        label="Loading accounts"
        subtitle="Fetching the latest records from Firestore"
      />
      <p v-else-if="error" class="empty">{{ error }}</p>
      <div v-else-if="accounts.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Date range</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in accounts" :key="account.id">
              <td><strong>{{ account.label }}</strong></td>
              <td>{{ formatDisplayDate(account.startDate) }} &ndash; {{ formatDisplayDate(account.endDate) }}</td>
              <td>
                <span class="pill" :class="{ orange: activeAccountId !== account.id }">
                  {{ activeAccountId === account.id ? 'Active (viewing)' : 'Not selected' }}
                </span>
              </td>
              <td>
                <div class="button-row">
                  <button
                    class="btn ghost"
                    type="button"
                    :disabled="activeAccountId === account.id"
                    @click="handleSetActive(account)"
                  >
                    Switch to this
                  </button>
                  <button class="btn ghost" type="button" @click="openEditDrawer(account)">Edit</button>
                  <button class="btn danger" type="button" @click="handleDelete(account)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">No accounts yet. Create one for the current cycle, e.g. "2025-2026".</p>
    </section>

    <section v-if="legacyDocCount > 0" class="panel pad">
      <h2 class="section-title">Migrate existing data</h2>
      <p class="muted">
        Found {{ legacyDocCount }} record(s) in the old shared members/income/expense collections.
        Migrating copies them into the currently selected account below &mdash; it does not delete
        the originals, so it's safe to re-run or verify before removing them manually later.
      </p>
      <div class="button-row" style="margin-top: 12px;">
        <button
          class="btn primary"
          type="button"
          :disabled="!activeAccountId || migrating"
          @click="handleMigrate"
        >
          {{ migrating ? 'Migrating...' : 'Migrate legacy data into active account' }}
        </button>
      </div>
      <p v-if="!activeAccountId" class="muted" style="margin-top: 8px;">
        Select or create an account above first.
      </p>
    </section>
  </div>

  <SideDrawer
    v-model="drawerOpen"
    :title="editing ? 'Edit account' : 'New account'"
    description="Define the yearly cycle for this account"
    @close="closeDrawer"
  >
    <form class="form" @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="field">
          <label for="account-label">Label</label>
          <input id="account-label" v-model="form.label" type="text" placeholder="2025-2026" required>
        </div>

        <div class="field">
          <label for="account-start">Start date</label>
          <input id="account-start" v-model="form.startDate" type="date" required>
        </div>

        <div class="field">
          <label for="account-end">End date</label>
          <input id="account-end" v-model="form.endDate" type="date" required>
        </div>

        <div class="field">
          <label for="account-active">
            <input id="account-active" v-model="form.isActive" type="checkbox">
            Mark as default active account
          </label>
        </div>
      </div>

      <div class="button-row">
        <button class="btn primary" type="submit" :disabled="saving">
          {{ saving ? 'Saving...' : (editing ? 'Update account' : 'Create account') }}
        </button>
      </div>
    </form>
  </SideDrawer>
</template>
