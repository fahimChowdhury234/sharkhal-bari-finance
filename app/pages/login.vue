<script setup lang="ts">
definePageMeta({ layout: false })

const { user, signIn } = useAuth()
const router = useRouter()

if (user.value) {
  await router.replace('/')
}

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await signIn(email.value.trim(), password.value)
    await router.replace('/')
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      error.value = 'Incorrect email or password.'
    } else {
      error.value = 'Sign in failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-shell">
    <div class="login-card panel pad">
      <div class="brand-row" style="margin-bottom: 24px;">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path d="M5 18.5C5 11.5 8.2 8 15.4 5.2c1.5-.6 2.9-1.1 3.6-1.1-3 1.5-4.9 4.5-6.2 8-1.6 4.3-3.3 6.7-7.8 7.5z" />
            <path d="M4.5 19.5C8.9 18.6 11 16.3 12.9 11c1.4-3.8 3.8-6.5 7-7.8" />
          </svg>
        </span>
        <p class="brand-wordmark">Sharkhal Bari Finance</p>
      </div>

      <h1 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 4px;">Sign in</h1>
      <p class="muted" style="margin-bottom: 24px;">Enter your credentials to continue</p>

      <p v-if="error" class="pill orange" style="margin-bottom: 16px;">{{ error }}</p>

      <form class="form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="login-email">Email</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          >
        </div>

        <div class="field">
          <label for="login-password">Password</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          >
        </div>

        <button class="btn primary" type="submit" :disabled="loading" style="width: 100%; margin-top: 8px;">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-shell {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 400px;
}
</style>
