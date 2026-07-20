import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import { migrateLegacyAccount } from './migrateLegacyAccount'

const DEFAULT_LABEL = '2025-2026'
const DEFAULT_START = '2025-09-01'
const DEFAULT_END = '2026-08-31'

/**
 * One-time bootstrap: if no accounts exist yet, create the "2025-2026" account
 * and copy the legacy flat members/income/expense collections into it. Once any
 * account exists, this is a no-op forever (existing accounts are never touched).
 */
export async function bootstrapDefaultAccount(firestore: Firestore) {
  const existingAccounts = await getDocs(collection(firestore, 'accounts'))
  if (!existingAccounts.empty) {
    return null
  }

  const timestamp = new Date().toISOString()
  const ref = doc(collection(firestore, 'accounts'))

  await setDoc(ref, {
    id: ref.id,
    label: DEFAULT_LABEL,
    startDate: DEFAULT_START,
    endDate: DEFAULT_END,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp
  })

  await migrateLegacyAccount(firestore, ref.id)

  return ref.id
}
