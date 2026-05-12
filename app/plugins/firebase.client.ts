import { getAnalytics, isSupported } from 'firebase/analytics'
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

function getFirebaseConfig() {
  const config = useRuntimeConfig().public

  return {
    apiKey: config.firebaseApiKey,
    authDomain: config.firebaseAuthDomain,
    projectId: config.firebaseProjectId,
    storageBucket: config.firebaseStorageBucket,
    messagingSenderId: config.firebaseMessagingSenderId,
    appId: config.firebaseAppId,
    measurementId: config.firebaseMeasurementId
  }
}

export default defineNuxtPlugin(async () => {
  const firebaseConfig = getFirebaseConfig()

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    return {
      provide: {
        firebaseApp: null,
        firebaseAuth: null,
        firestore: null
      }
    }
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  const firestore = getFirestore(app)
  const auth = getAuth(app)

  if (firebaseConfig.measurementId) {
    const supported = await isSupported()
    if (supported) {
      getAnalytics(app)
    }
  }

  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth,
      firestore
    }
  }
})
