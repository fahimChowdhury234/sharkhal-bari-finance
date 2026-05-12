import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

declare module '#app' {
  interface NuxtApp {
    $firebaseApp: FirebaseApp | null
    $firebaseAuth: Auth | null
    $firestore: Firestore | null
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $firebaseApp: FirebaseApp | null
    $firebaseAuth: Auth | null
    $firestore: Firestore | null
  }
}

export {}
