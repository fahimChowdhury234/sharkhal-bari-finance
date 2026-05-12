# Firebase integration checklist

Use this as the execution order for moving the app from local seed data to Firebase.

## Goal

Replace the current in-memory collection layer with Firestore while keeping the existing UI, forms, and finance data shape.

## Phase 1: Firebase setup

1. Create a Firebase project.
2. Enable Firestore.
3. Enable Authentication.
4. Add a Web App in the Firebase console.
5. Copy the Firebase config values into your Nuxt environment variables.

Suggested env keys:

```bash
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
```

## Phase 2: Install dependencies

Install the Firebase SDKs:

```bash
npm install firebase
npm install -D firebase-admin
```

Use:

- `firebase` for the Nuxt app
- `firebase-admin` for the import script

## Phase 3: Add Firebase initialization

Create a client-only plugin:

- [`app/plugins/firebase.client.ts`](/Users/fahim/Documents/personal/sharkhal-bari-finance/app/plugins/firebase.client.ts)

This file should:

- initialize the Firebase app
- create the Firestore instance
- optionally expose Auth if you need login later

Keep it browser-only so Nuxt does not try to initialize Firebase on the server.

## Phase 4: Create the Firestore composable

Add a new composable:

- [`app/composables/useFirestoreCollection.ts`](/Users/fahim/Documents/personal/sharkhal-bari-finance/app/composables/useFirestoreCollection.ts)

This composable should match the current API as closely as possible:

- `load()`
- `createOne()`
- `updateOne()`
- `removeOne()`
- `items`
- `pending`
- `error`

That lets the pages stay almost unchanged.

## Phase 5: Swap the app over

Update these pages one by one:

- [`app/pages/members.vue`](/Users/fahim/Documents/personal/sharkhal-bari-finance/app/pages/members.vue)
- [`app/pages/income.vue`](/Users/fahim/Documents/personal/sharkhal-bari-finance/app/pages/income.vue)
- [`app/pages/expense.vue`](/Users/fahim/Documents/personal/sharkhal-bari-finance/app/pages/expense.vue)
- [`app/pages/index.vue`](/Users/fahim/Documents/personal/sharkhal-bari-finance/app/pages/index.vue)

Recommended approach:

- keep the forms
- keep the tables
- replace only the data source

## Phase 6: Add the one-time import script

Create a script that reads the current seed data from:

- [`app/data/financeSeed.ts`](/Users/fahim/Documents/personal/sharkhal-bari-finance/app/data/financeSeed.ts)

Import these collections:

- `members`
- `income`
- `expense`

Recommended script behavior:

- use Firebase Admin SDK
- write in batches
- preserve existing IDs if you want stable references
- run against emulator first if possible
- add `legacyId` or `importSource` if you want traceability

## Phase 7: Add security rules

Add Firestore rules before production use.

Recommended baseline:

- authenticated users can read
- only admins can write

Example pattern:

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

## Phase 8: Verify the data flow

Test these flows end to end:

1. Page loads from Firestore.
2. Add a new member.
3. Edit an income entry.
4. Delete an expense entry.
5. Reload the page and confirm the data persists.

Also verify:

- totals still calculate correctly
- filters still work
- CSV export still works

## Phase 9: Import existing data

Import the current seed data only after the Firestore layer is working.

Safe order:

1. Test locally or in emulator.
2. Run import once into production.
3. Confirm counts and sample documents.
4. Remove or disable any seed fallback if you no longer need it.

## Recommended file order

If you want the cleanest implementation sequence, edit files in this order:

1. `app/plugins/firebase.client.ts`
2. `app/composables/useFirestoreCollection.ts`
3. `app/pages/income.vue`
4. `app/pages/members.vue`
5. `app/pages/expense.vue`
6. `app/pages/index.vue`
7. import script for `financeSeed.ts`
8. Firestore rules

## Best practice

Do not rewrite the UI first.

The cleanest migration is:

- backend/data layer first
- import second
- security third
- UI polish last

