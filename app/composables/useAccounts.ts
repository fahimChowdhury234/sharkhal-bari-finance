import {
  collection as fsCollection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore'
import type { Account } from '~/types/finance'

const ACCOUNTS_COLLECTION = 'accounts'

type ListenerState = {
  unsubscribe: () => void
  ready: Promise<void>
}

let listenerState: ListenerState | null = null

function now() {
  return new Date().toISOString()
}

function sortByStartDateDesc(rows: Account[]) {
  return [...rows].sort((a, b) => b.startDate.localeCompare(a.startDate))
}

export function useAccounts() {
  const items = useState<Account[]>('finance-accounts', () => [])
  const pending = ref(false)
  const error = ref<string | null>(null)
  const nuxtApp = useNuxtApp()

  function getFirestore() {
    return nuxtApp.$firestore
  }

  function toRecord(id: string, data: Record<string, unknown>) {
    return { id, ...data } as Account
  }

  function syncFromSnapshot(snapshot: { docs: Array<{ id: string; data(): Record<string, unknown> }> }) {
    const records = snapshot.docs.map((entry) => toRecord(entry.id, entry.data()))
    items.value = sortByStartDateDesc(records)
  }

  function startRealtimeSync(firestore: NonNullable<typeof nuxtApp.$firestore>) {
    if (listenerState) {
      return listenerState.ready
    }

    pending.value = true
    error.value = null

    const state: ListenerState = {
      unsubscribe: () => {},
      ready: Promise.resolve()
    }
    let settled = false

    const ready = new Promise<void>((resolve, reject) => {
      state.unsubscribe = onSnapshot(
        fsCollection(firestore, ACCOUNTS_COLLECTION),
        (snapshot) => {
          syncFromSnapshot(snapshot)
          error.value = null

          if (!settled) {
            settled = true
            pending.value = false
            resolve()
          }
        },
        (err) => {
          error.value = err instanceof Error ? err.message : 'Failed to load accounts'
          pending.value = false

          if (!settled) {
            settled = true
            reject(err)
          }
        }
      )
    })

    state.ready = ready
    listenerState = state
    return ready
  }

  async function load() {
    try {
      const firestore = getFirestore()

      if (!firestore) {
        pending.value = true
        error.value = null
        return
      }

      await startRealtimeSync(firestore)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load accounts'
    } finally {
      pending.value = false
    }
  }

  async function createOne(payload: Record<string, unknown>) {
    const firestore = getFirestore()
    const record = {
      ...payload,
      createdAt: now(),
      updatedAt: now()
    }

    if (!firestore) {
      const localRecord = {
        id: `account-${Math.random().toString(36).slice(2, 10)}`,
        ...record
      } as Account

      items.value = sortByStartDateDesc([localRecord, ...items.value])
      return localRecord.id
    }

    const ref = doc(fsCollection(firestore, ACCOUNTS_COLLECTION))
    await setDoc(ref, {
      id: ref.id,
      ...record
    })
    await load()
    return ref.id
  }

  async function updateOne(id: string, payload: Record<string, unknown>) {
    const firestore = getFirestore()
    const updatedFields = {
      ...payload,
      updatedAt: now()
    }

    if (!firestore) {
      items.value = sortByStartDateDesc(
        items.value.map((item) => (item.id === id ? { ...item, ...updatedFields } as Account : item))
      )
      return
    }

    await updateDoc(doc(fsCollection(firestore, ACCOUNTS_COLLECTION), id), updatedFields)
    await load()
  }

  async function removeOne(id: string) {
    const firestore = getFirestore()

    if (!firestore) {
      items.value = items.value.filter((item) => item.id !== id)
      return
    }

    await deleteDoc(doc(fsCollection(firestore, ACCOUNTS_COLLECTION), id))
    await load()
  }

  return { items, pending, error, load, createOne, updateOne, removeOne }
}
