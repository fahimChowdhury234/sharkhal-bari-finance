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

const listenerState = new Map<CollectionName, ListenerState>()

function cloneSeed<T>(rows: T[]) {
  return rows.map((row) => ({ ...row }))
}

function now() {
  return new Date().toISOString()
}

function sortByUpdatedAtDesc<T extends { updatedAt?: string; createdAt?: string }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const aKey = a.updatedAt ?? a.createdAt ?? ''
    const bKey = b.updatedAt ?? b.createdAt ?? ''
    return bKey.localeCompare(aKey)
  })
}

export function useCollectionApi<T>(collectionName: CollectionName) {
  const seedData = financeSeed[collectionName] as T[]
  const items = useState<T[]>(`finance-${collectionName}`, () => cloneSeed(seedData))
  const pending = ref(false)
  const error = ref<string | null>(null)
  const nuxtApp = useNuxtApp()

  function getFirestore() {
    return nuxtApp.$firestore
  }

  function toRecord(id: string, data: Record<string, unknown>) {
    return {
      id,
      ...data
    } as T
  }

  function syncFromSnapshot(snapshot: { docs: Array<{ id: string; data(): Record<string, unknown> }> }) {
    const records = snapshot.docs.map((entry) => toRecord(entry.id, entry.data()))
    items.value = sortByUpdatedAtDesc(records)
  }

  function startRealtimeSync(firestore: NonNullable<typeof nuxtApp.$firestore>) {
    const existing = listenerState.get(collectionName)
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
        fsCollection(firestore, collectionName),
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
    listenerState.set(collectionName, state)
    return ready
  }

  async function load() {
    try {
      const firestore = getFirestore()

      if (!firestore) {
        pending.value = true
        error.value = null
        if (!items.value.length) {
          items.value = cloneSeed(seedData)
        }
        return
      }

      await startRealtimeSync(firestore)
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to load ${collectionName}`
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
        id: `${collectionName}-${Math.random().toString(36).slice(2, 10)}`,
        ...record
      } as T

      items.value = sortByUpdatedAtDesc([localRecord, ...items.value])
      return
    }

    const ref = doc(fsCollection(firestore, collectionName))
    await setDoc(ref, {
      id: ref.id,
      ...record
    })
    await load()
  }

  async function updateOne(id: string, payload: Record<string, unknown>) {
    const firestore = getFirestore()
    const updatedFields = {
      ...payload,
      updatedAt: now()
    }

    if (!firestore) {
      items.value = sortByUpdatedAtDesc(
        items.value.map((item) => {
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

    await updateDoc(doc(fsCollection(firestore, collectionName), id), updatedFields)
    await load()
  }

  async function removeOne(id: string) {
    const firestore = getFirestore()

    if (!firestore) {
      items.value = items.value.filter((item) => (item as { id: string }).id !== id)
      return
    }

    await deleteDoc(doc(fsCollection(firestore, collectionName), id))
    await load()
  }

  return { items, pending, error, load, createOne, updateOne, removeOne }
}
