export default defineNuxtPlugin(() => {
  const stored = window.localStorage.getItem('sharkhal-bari-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = stored === 'dark' || (stored !== 'light' && prefersDark) ? 'dark' : 'light'

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
})

