export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (to.path === '/login') return

  const user = useState('auth-user')
  if (!user.value) {
    return navigateTo('/login')
  }
})
