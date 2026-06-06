<script setup lang="ts">
type MemberStatus = 'active' | 'inactive'

interface MemberFormValue {
  name: string
  phone: string
  email: string
  address: string
  joinDate: string
  monthlyDue: number
  annualDue: number
  paidAmount: number
  status: MemberStatus
  notes: string
}

const props = withDefaults(defineProps<{
  initialValues?: Partial<MemberFormValue>
  submitLabel?: string
  busy?: boolean
}>(), {
  submitLabel: 'Save member',
  busy: false
})

const emit = defineEmits<{
  (event: 'submit', value: MemberFormValue): void
}>()

function createDefaults(): MemberFormValue {
  return {
    name: '',
    phone: '',
    email: '',
    address: '',
    joinDate: new Date().toISOString().slice(0, 10),
    monthlyDue: 0,
    annualDue: 0,
    paidAmount: 0,
    status: 'active',
    notes: ''
  }
}

const form = reactive<MemberFormValue>(createDefaults())

function syncForm(values?: Partial<MemberFormValue>) {
  Object.assign(form, createDefaults(), values ?? {})
}

watch(
  () => props.initialValues,
  (values) => syncForm(values),
  { immediate: true, deep: true }
)

function handleSubmit() {
  emit('submit', {
    name: form.name,
    phone: form.phone,
    email: form.email,
    address: form.address,
    joinDate: form.joinDate,
    status: form.status,
    notes: form.notes,
    monthlyDue: Number(form.monthlyDue) || 0,
    annualDue: Number(form.annualDue) || 0,
    paidAmount: Number(form.paidAmount) || 0
  })
}
</script>

<template>
  <form class="form" @submit.prevent="handleSubmit">
    <div class="form-grid">
      <div class="field">
        <label for="member-name">Full name</label>
        <input id="member-name" v-model="form.name" type="text" placeholder="Abdul Karim" required>
      </div>

      <div class="field">
        <label for="member-phone">Phone</label>
        <input id="member-phone" v-model="form.phone" type="tel" placeholder="+8801..." required>
      </div>

      <div class="field">
        <label for="member-email">Email</label>
        <input id="member-email" v-model="form.email" type="email" placeholder="name@example.com">
      </div>

      <div class="field">
        <label for="member-join-date">Join date</label>
        <input id="member-join-date" v-model="form.joinDate" type="date">
      </div>

      <div class="field">
        <label for="member-due">Monthly due</label>
        <input id="member-due" v-model="form.monthlyDue" type="number" min="0" step="1" >
      </div>

      <div class="field">
        <label for="member-annual-due">Annual subscription amount</label>
        <input id="member-annual-due" v-model="form.annualDue" type="number" min="0" step="1" placeholder="1200">
      </div>

      <div class="field">
        <label for="member-paid-amount">Paid amount</label>
        <input id="member-paid-amount" v-model="form.paidAmount" type="number" min="0" step="1" placeholder="1200">
      </div>

      <div class="field">
        <label for="member-status">Status</label>
        <select id="member-status" v-model="form.status">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label for="member-address">Address</label>
      <textarea id="member-address" v-model="form.address" placeholder="House, road, area"></textarea>
    </div>

    <div class="field">
      <label for="member-notes">Notes</label>
      <textarea id="member-notes" v-model="form.notes" placeholder="Any helpful context for this member"></textarea>
    </div>

    <div class="button-row">
      <button class="btn primary" type="submit" :disabled="busy">
        {{ busy ? 'Saving...' : submitLabel }}
      </button>
    </div>
  </form>
</template>
