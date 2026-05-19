type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'sharkhal-bari-theme'

export function useThemeMode() {
  const theme = useState<ThemeMode>('theme-mode', () => 'light')
  const isClient = process.client

  function applyTheme(value: ThemeMode) {
    if (!isClient) {
      return
    }

    document.documentElement.dataset.theme = value
    document.documentElement.style.colorScheme = value
  }

  function setTheme(value: ThemeMode) {
    theme.value = value
    applyTheme(value)

    if (isClient) {
      window.localStorage.setItem(THEME_STORAGE_KEY, value)
    }
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  if (isClient) {
    const domTheme = document.documentElement.dataset.theme as ThemeMode | undefined
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = domTheme ?? stored ?? (prefersDark ? 'dark' : 'light')

    if (theme.value !== initialTheme) {
      theme.value = initialTheme
    }

    applyTheme(theme.value)
  }

  return {
    theme,
    isDark: computed(() => theme.value === 'dark'),
    toggleTheme,
    setTheme
  }
}
