import { signInWithEmailAndPassword, signOut as fbSignOut, type User } from 'firebase/auth'

export function useAuth() {
  const nuxtApp = useNuxtApp()
  const user = useState<User | null>('auth-user', () => null)

  async function signIn(email: string, password: string) {
    const auth = nuxtApp.$firebaseAuth
    if (!auth) throw new Error('Firebase Auth not initialized')
    const credential = await signInWithEmailAndPassword(auth, email, password)
    user.value = credential.user
  }

  async function signOut() {
    const auth = nuxtApp.$firebaseAuth
    if (!auth) return
    await fbSignOut(auth)
    user.value = null
  }

  return { user: readonly(user), signIn, signOut }
}
