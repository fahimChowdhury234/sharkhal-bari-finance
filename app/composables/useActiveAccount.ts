const STORAGE_KEY = 'sharkhal-bari:active-account'

export function useActiveAccount() {
  const activeAccountId = useState<string | null>('active-account-id', () => null)
  const hydrated = useState('active-account-hydrated', () => false)

  function hydrateFromStorage() {
    if (hydrated.value || import.meta.server) {
      return
    }

    hydrated.value = true
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      activeAccountId.value = stored
    }
  }

  function setActiveAccount(id: string | null) {
    activeAccountId.value = id
    hydrated.value = true

    if (import.meta.client) {
      if (id) {
        window.localStorage.setItem(STORAGE_KEY, id)
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  hydrateFromStorage()

  return { activeAccountId, setActiveAccount }
}
