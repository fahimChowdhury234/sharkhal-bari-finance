import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import type { CollectionName } from '~/types/finance'

const LEGACY_COLLECTIONS: CollectionName[] = ['members', 'income', 'expense']

export async function countLegacyDocs(firestore: Firestore) {
  const counts = await Promise.all(
    LEGACY_COLLECTIONS.map(async (name) => (await getDocs(collection(firestore, name))).size)
  )

  return counts.reduce((total, count) => total + count, 0)
}

export async function migrateLegacyAccount(firestore: Firestore, targetAccountId: string) {
  let migrated = 0

  for (const name of LEGACY_COLLECTIONS) {
    const snapshot = await getDocs(collection(firestore, name))

    for (const legacyDoc of snapshot.docs) {
      await setDoc(doc(firestore, 'accounts', targetAccountId, name, legacyDoc.id), legacyDoc.data())
      migrated += 1
    }
  }

  return migrated
}
