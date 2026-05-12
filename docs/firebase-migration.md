# Firebase migration guide

This project is currently using local, in-memory data seeded from [`app/data/financeSeed.ts`](/Users/fahim/Documents/personal/sharkhal-bari-finance/app/data/financeSeed.ts) through [`app/composables/useCollectionApi.ts`](/Users/fahim/Documents/personal/sharkhal-bari-finance/app/composables/useCollectionApi.ts). That means the UI is already split into three clear collections:

- `members`
- `income`
- `expense`

The best Firebase migration is to keep that shape, replace the local state layer with Firestore reads/writes, and import the existing seed data once.

## Recommended approach

Use:

- Firebase Authentication for access control
- Firestore for records
- Firebase Security Rules for server-side protection
- A one-time Admin SDK import script for the current data

For this app, Firestore is the right choice because the records are small, structured, and need filtering, sorting, and easy updates.

## What the current app is doing

Right now the app does not talk to any backend:

- `useCollectionApi()` loads from `financeSeed`
- `createOne()`, `updateOne()`, and `removeOne()` only mutate local Nuxt state
- the forms already emit clean payloads for Firebase-ready writes

That is good news. The front end already exposes a clean domain model, so the migration is mostly data-layer work.

## Firestore data model

Keep one top-level collection per record type:

```text
members/{memberId}
income/{incomeId}
expense/{expenseId}
```

### Members

Use the fields from `MemberRecord`:

```ts
{
  name: string
  phone: string
  email: string
  address: string
  joinDate: string | Timestamp
  monthlyDue: number
  status: 'active' | 'inactive'
  notes: string
  annualDue?: number
  paidAmount?: number
  collector?: string
  monthlyPayments?: string[]
  createdAt: string | Timestamp
  updatedAt: string | Timestamp
}
```

### Income

Use the fields from `IncomeRecord`:

```ts
{
  source: string
  category: string
  amount: number
  receivedAt: string | Timestamp
  receivedBy: string
  notes: string
  memberName?: string
  annualDue?: number
  collector?: string
  monthlyPayments?: string[]
  createdAt: string | Timestamp
  updatedAt: string | Timestamp
}
```

### Expense

Use the fields from `ExpenseRecord`:

```ts
{
  category: string
  amount: number
  paidAt: string | Timestamp
  paidTo: string
  method: string
  notes: string
  sourceFile?: string
  createdAt: string | Timestamp
  updatedAt: string | Timestamp
}
```

## Better way to store dates

The app currently uses ISO strings like `YYYY-MM-DD`. That is fine for the UI, but Firestore works better if you store:

- `createdAt` and `updatedAt` as Firestore `Timestamp`
- transaction dates like `receivedAt`, `paidAt`, and `joinDate` as `Timestamp` when you want reliable sorting and querying

If you prefer easier form handling, you can still keep `YYYY-MM-DD` strings in Firestore. That is simpler, but querying by date range is less flexible.

### Recommendation

Use `Timestamp` in Firestore, then format to `YYYY-MM-DD` in the UI.

## Security rules

For a finance app, do not leave Firestore open.

Minimum recommended setup:

- only authenticated users can read
- only admin users can write
- regular users can read if that matches your use case

Example rule pattern:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() && request.auth.token.admin == true;
    }

    match /members/{docId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /income/{docId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /expense/{docId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```

If only one person will manage the app, you can still use auth and admin-only writes. That gives you a safe default and makes future collaboration easier.

## Frontend integration plan

Replace `useCollectionApi()` with a Firestore-backed composable.

Suggested behavior:

- `load()` fetches documents from Firestore
- `createOne()` adds a new document
- `updateOne()` updates an existing document
- `removeOne()` deletes a document
- local state still drives the UI so the pages do not need a rewrite

### Good implementation shape

1. Create `app/plugins/firebase.client.ts`
2. Initialize Firebase app with environment variables
3. Create `app/composables/useFirestoreCollection.ts`
4. Keep the current collection names: `members`, `income`, `expense`
5. Swap pages over one at a time

That lets you keep the current UI and forms almost unchanged.

## Suggested Firebase setup

### 1. Create the Firebase project

In Firebase Console:

1. Create a new project
2. Enable Firestore
3. Enable Authentication
4. Add your web app
5. Copy the config values into `.env`

Typical env names:

```bash
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
```

### 2. Install SDKs

You will usually need:

- `firebase`
- optionally `firebase-admin` for import scripts

### 3. Initialize the client SDK

Create a Firebase plugin that runs only in the browser.

### 4. Swap the data layer

Keep the page components, forms, and tables. Replace only the storage layer.

## Importing the current data

Your current source of truth is already in the repo:

- members are generated from `financeSeed.members`
- income is generated from `financeSeed.income`
- expense is generated from `financeSeed.expense`

That makes the import straightforward.

### Best import strategy

Use a one-time Node script with the Firebase Admin SDK:

- read the seed data from `app/data/financeSeed.ts`
- normalize the records
- write them into Firestore in batches
- preserve the current `id` values if you want stable references

### Important import rules

- run the import against the Firebase emulator first if possible
- back up Firestore before importing into production
- use batches of up to 500 writes
- add an `importSource` or `legacyId` field if you want traceability
- do not run the import more than once unless you intentionally want duplicates

### Recommended import flow

1. Build the Firebase project and rules
2. Add the Firestore collections manually or let the import create them
3. Run the import script against the emulator
4. Verify counts and sample records
5. Run the import script against production

### What to import from the seed file

For this project, import exactly what is already present:

- all current members
- all current income entries
- all current expense entries

Do not try to retype or manually massage the records. The seed file already contains the cleaned version of the current data.

## One-time import script shape

If you create a script later, the shape should look like this:

```ts
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { financeSeed } from '../app/data/financeSeed'

initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!))
})

const db = getFirestore()

async function writeCollection(name: 'members' | 'income' | 'expense', rows: Array<{ id: string }>) {
  const batchSize = 450

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = db.batch()
    const slice = rows.slice(i, i + batchSize)

    for (const row of slice) {
      const ref = db.collection(name).doc(row.id)
      batch.set(ref, row)
    }

    await batch.commit()
  }
}

await writeCollection('members', financeSeed.members)
await writeCollection('income', financeSeed.income)
await writeCollection('expense', financeSeed.expense)
```

That is the simplest safe version. In a real script, you would also:

- remove any unsupported fields
- convert date strings to `Timestamp`
- set `createdAt` and `updatedAt` explicitly

## Why this is the better way

This approach is better than manually pasting records into Firebase because:

- it keeps your current data model intact
- it avoids rewriting the UI
- it gives you real persistence
- it supports multi-user access later
- it makes backup and migration easier
- it keeps a clear path for auditability

## Migration order I recommend

1. Add Firebase project and environment variables
2. Add Firestore security rules
3. Add Firebase client initialization
4. Replace `useCollectionApi()` with Firestore reads/writes
5. Import current seed data once
6. Test add/edit/delete flows
7. Remove the local seed fallback after you confirm the live data works

## Practical note for this repo

Because the app already has a full local seed dataset, you can keep that as a fallback during development and only switch to Firestore in production. That reduces risk while you migrate.

If you want, the next best step is to actually implement the Firebase layer in this repo:

1. Firestore client plugin
2. Firestore composable
3. one-time import script
4. updated env example and README

