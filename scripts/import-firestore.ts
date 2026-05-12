import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { financeSeed } from '../app/data/financeSeed'
import type { CollectionName } from '../app/types/finance'

type SeedRow = { id: string; [key: string]: unknown }

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

if (!serviceAccountJson) {
  throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable.')
}

const serviceAccount = JSON.parse(serviceAccountJson)

initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Record<string, unknown>
}

async function writeCollection(name: CollectionName, rows: SeedRow[]) {
  const batchSize = 450

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = db.batch()
    const slice = rows.slice(index, index + batchSize)

    for (const row of slice) {
      const ref = db.collection(name).doc(row.id)
      batch.set(ref, stripUndefined({
        ...row,
        legacyId: row.id
      }))
    }

    await batch.commit()
  }
}

async function main() {
  await writeCollection('members', financeSeed.members as SeedRow[])
  await writeCollection('income', financeSeed.income as SeedRow[])
  await writeCollection('expense', financeSeed.expense as SeedRow[])
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
