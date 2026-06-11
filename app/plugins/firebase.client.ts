import { getAnalytics, isSupported } from 'firebase/analytics'
import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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

export default defineNuxtPlugin(async (nuxtApp) => {
  const firebaseConfig = getFirebaseConfig()
  const authUser = useState<User | null>('auth-user', () => null)

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    nuxtApp.provide('firebaseApp', null)
    nuxtApp.provide('firebaseAuth', null)
    nuxtApp.provide('firestore', null)
    return
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

  // Await initial auth state so middleware can check it synchronously
  await new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      authUser.value = user
      unsubscribe()
      resolve()
    })
  })

  // Keep state in sync with subsequent auth changes
  onAuthStateChanged(auth, (user) => {
    authUser.value = user
  })

  nuxtApp.provide('firebaseApp', app)
  nuxtApp.provide('firebaseAuth', auth)
  nuxtApp.provide('firestore', firestore)
})
