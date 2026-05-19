<script setup lang="ts">
const { confirmState, accept, decline } = useConfirmDialog()

function onKeydown(event: KeyboardEvent) {
  if (!confirmState.value.open) {
    return
  }

  if (event.key === 'Escape') {
    decline()
  }

  if (event.key === 'Enter') {
    accept()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="confirmState.open" class="confirm-overlay" @click.self="decline">
        <div class="confirm-modal panel" :class="`tone-${confirmState.tone}`" role="dialog" aria-modal="true" aria-labelledby="confirm-title" tabindex="-1">
          <button class="confirm-close" type="button" @click="decline" aria-label="Close dialog">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>

          <div class="confirm-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path v-if="confirmState.tone === 'danger'" d="M12 9v4" />
              <path v-if="confirmState.tone === 'danger'" d="M12 17.5h.01" />
              <path v-if="confirmState.tone === 'danger'" d="M10.3 4.5h3.4L21 18h-18z" />
              <path v-else-if="confirmState.tone === 'warning'" d="M12 8v4" />
              <path v-else-if="confirmState.tone === 'warning'" d="M12 15.5h.01" />
              <path v-else d="M12 7a5 5 0 0 1 5 5" />
              <path v-if="confirmState.tone === 'neutral'" d="M12 12a5 5 0 1 0 5 5" />
            </svg>
          </div>

          <div class="confirm-copy">
            <h2 id="confirm-title">{{ confirmState.title }}</h2>
            <p>{{ confirmState.message }}</p>
            <div class="confirm-note">This action cannot be undone. Please confirm if you want to proceed.</div>
          </div>

          <div class="button-row confirm-actions">
            <button class="btn ghost" type="button" @click="decline">
              {{ confirmState.cancelLabel }}
            </button>
            <button class="btn danger" type="button" @click="accept">
              {{ confirmState.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
