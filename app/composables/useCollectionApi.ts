import {
  collection as fsCollection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore'
import { financeSeed } from '~/data/financeSeed'
import type { CollectionName as FinanceCollectionName } from '~/types/finance'

export type CollectionName = FinanceCollectionName

type ListenerState = {
  unsubscribe: () => void
  ready: Promise<void>
}

const listenerState = new Map<string, ListenerState>()

function cloneSeed<T>(rows: T[]) {
  return rows.map((row) => ({ ...row }))
}

function now() {
  return new Date().toISOString()
}

function sortByUpdatedAtDesc<T>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const timestamped = a as { updatedAt?: string; createdAt?: string }
    const otherTimestamped = b as { updatedAt?: string; createdAt?: string }
    const aKey = timestamped.updatedAt ?? timestamped.createdAt ?? ''
    const bKey = otherTimestamped.updatedAt ?? otherTimestamped.createdAt ?? ''
    return bKey.localeCompare(aKey)
  })
}

export function useCollectionApi<T>(collectionName: CollectionName) {
  const seedData = financeSeed[collectionName] as T[]
  const { activeAccountId } = useActiveAccount()
  const pending = ref(false)
  const error = ref<string | null>(null)
  const nuxtApp = useNuxtApp()

  function stateKey(accountId: string | null) {
    return `finance-${accountId ?? 'none'}-${collectionName}`
  }

  function listenerKey(accountId: string | null) {
    return `${accountId ?? 'none'}:${collectionName}`
  }

  function currentItems() {
    return useState<T[]>(stateKey(activeAccountId.value), () => [])
  }

  const items = computed({
    get: () => currentItems().value,
    set: (value: T[]) => {
      currentItems().value = value
    }
  })

  function getFirestore() {
    return nuxtApp.$firestore
  }

  function accountCollectionRef(firestore: NonNullable<typeof nuxtApp.$firestore>, accountId: string) {
    return fsCollection(firestore, 'accounts', accountId, collectionName)
  }

  function toRecord(id: string, data: Record<string, unknown>) {
    return {
      id,
      ...data
    } as T
  }

  function syncFromSnapshot(snapshot: { docs: Array<{ id: string; data(): Record<string, unknown> }> }) {
    const records = snapshot.docs.map((entry) => toRecord(entry.id, entry.data()))
    currentItems().value = sortByUpdatedAtDesc<T>(records)
  }

  function stopListener(accountId: string | null) {
    const key = listenerKey(accountId)
    const existing = listenerState.get(key)
    if (existing) {
      existing.unsubscribe()
      listenerState.delete(key)
    }
  }

  function startRealtimeSync(firestore: NonNullable<typeof nuxtApp.$firestore>, accountId: string) {
    const key = listenerKey(accountId)
    const existing = listenerState.get(key)
    if (existing) {
      return existing.ready
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
        accountCollectionRef(firestore, accountId),
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
          error.value = err instanceof Error ? err.message : `Failed to load ${collectionName}`
          pending.value = false

          if (!settled) {
            settled = true
            reject(err)
          }
        }
      )
    })

    state.ready = ready
    listenerState.set(key, state)
    return ready
  }

  async function load() {
    const accountId = activeAccountId.value

    if (!accountId) {
      currentItems().value = []
      return
    }

    try {
      const firestore = getFirestore()

      if (!firestore) {
        pending.value = true
        error.value = null
        if (!currentItems().value.length) {
          currentItems().value = cloneSeed(seedData)
        }
        return
      }

      await startRealtimeSync(firestore, accountId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to load ${collectionName}`
    } finally {
      pending.value = false
    }
  }

  watch(activeAccountId, (next, previous) => {
    if (previous) {
      stopListener(previous)
    }
    if (next) {
      load()
    }
  })

  async function createOne(payload: Record<string, unknown>) {
    const accountId = activeAccountId.value
    if (!accountId) {
      throw new Error('Select an account before adding records.')
    }

    const firestore = getFirestore()
    const record = {
      ...payload,
      createdAt: now(),
      updatedAt: now()
    }

    if (!firestore) {
      const localRecord = {
        id: `${collectionName}-${Math.random().toString(36).slice(2, 10)}`,
        ...record
      } as T

      currentItems().value = sortByUpdatedAtDesc([localRecord, ...currentItems().value])
      return
    }

    const ref = doc(accountCollectionRef(firestore, accountId))
    await setDoc(ref, {
      id: ref.id,
      ...record
    })
    await load()
  }

  async function updateOne(id: string, payload: Record<string, unknown>) {
    const accountId = activeAccountId.value
    if (!accountId) {
      throw new Error('Select an account before editing records.')
    }

    const firestore = getFirestore()
    const updatedFields = {
      ...payload,
      updatedAt: now()
    }

    if (!firestore) {
      currentItems().value = sortByUpdatedAtDesc(
        currentItems().value.map((item) => {
          if ((item as { id: string }).id !== id) {
            return item
          }

          return {
            ...item,
            ...updatedFields
          } as T
        })
      )
      return
    }

    await updateDoc(doc(accountCollectionRef(firestore, accountId), id), updatedFields)
    await load()
  }

  async function removeOne(id: string) {
    const accountId = activeAccountId.value
    if (!accountId) {
      throw new Error('Select an account before removing records.')
    }

    const firestore = getFirestore()

    if (!firestore) {
      currentItems().value = currentItems().value.filter((item) => (item as { id: string }).id !== id)
      return
    }

    await deleteDoc(doc(accountCollectionRef(firestore, accountId), id))
    await load()
  }

  return { items, pending, error, load, createOne, updateOne, removeOne }
}
